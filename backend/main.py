# -*- coding: utf-8 -*-
"""
靜宜大學資管系 課程推薦系統 - FastAPI 後端 v4.6
新增：/login、/register endpoint
修正：elective return bug（effective → elective）
"""
import bcrypt
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import numpy as np
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional

# ── 初始化 FastAPI ────────────────────────────────────────────
app = FastAPI(title="個人規劃課程推薦 API v4.6", version="4.6")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 初始化 Firebase ───────────────────────────────────────────
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()
print(f"🚀 已連線 Firebase 專案：{firebase_admin.get_app().project_id}")

# ── 常數與對照表 ──────────────────────────────────────────────
FEATURE_KEYS = ["ai_algo", "biz_mgt", "data_ana", "soft_dev", "erp_sys", "sys_infra"]
DAY_MAP = {1: "週一", 2: "週二", 3: "週三", 4: "週四", 5: "週五", 6: "週六", 7: "週日"}
TIME_MAP = {
    1: "08:10", 2: "09:10", 3: "10:10", 4: "11:10",
    5: "12:10", 6: "13:10", 7: "14:10", 8: "15:10",
    9: "16:10", 10: "17:10", 11: "18:10", 12: "19:10"
}

# ── 工具函式 ──────────────────────────────────────────────────
def format_schedule(schedule: list) -> str:
    if not schedule:
        return "時間未定"
    if isinstance(schedule, str):
        return schedule
    parts = []
    for s in schedule:
        day_str = DAY_MAP.get(s.get("day"), "?")
        times = s.get("time", [])
        if times:
            start = TIME_MAP.get(min(times), "?")
            parts.append(f"{day_str} {start}")
        else:
            parts.append(day_str)
    return "、".join(parts)

def deduplicate(courses: list, key="title") -> list:
    seen = set()
    result = []
    for c in courses:
        unique_key = f"{c.get('course_code', '')}_{c.get(key, '')}"
        if unique_key not in seen:
            seen.add(unique_key)
            result.append(c)
    return result

def semester_suffix(semester: str) -> str:
    return str(semester)[-1] if semester else ""

# ── 預先載入全量課程與建立 KNN 模型 ────────────────────────────
#print("📦 正在從 Firebase 載入全量課程資料...")
#docs = db.collection("courses").stream()
#ALL_COURSES = [doc.to_dict() for doc in docs]

#def build_knn_model(courses: list):
    electives = [
        c for c in courses
        if c.get("category") == "選修"
        and c.get("ai_weights")
    ]
    unique = deduplicate(electives, key="title")
    if not unique:
        return None, None, []
    X = np.array([[c["ai_weights"].get(k, 0.0) for k in FEATURE_KEYS] for c in unique])
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    knn = NearestNeighbors(n_neighbors=min(10, len(unique)), metric="cosine")
    knn.fit(X_scaled)
    return knn, scaler, unique

#KNN_MODEL, SCALER, UNIQUE_ELECTIVES = build_knn_model(ALL_COURSES)
#print(f"✅ 載入完成，共 {len(ALL_COURSES)} 筆，選修 KNN 建模群共 {len(UNIQUE_ELECTIVES)} 門")

# ── Request Schema ────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str 
class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    grade: str                              # 例："三年級"
    class_grade: str                        # 例："A"
    department: str = "資管系"
    survey_scores: Optional[dict[str, float]] = {}

class RecommendRequest(BaseModel):
    email: EmailStr
    semester: str
    survey_scores: Optional[dict[str, float]] = None
    top_n: int = 5

# ── API 路由 ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "靜宜資管課程推薦 API v4.6 穩定運作中 🎓"}





# ── /register ─────────────────────────────────────────────────
@app.post("/register")
def register(req: RegisterRequest):
    # 將密碼轉為 bytes 並進行雜湊
    hashed_pw = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt())
    
    # 將雜湊後的密碼存入資料庫 (記得存成字串)
    user_data = {
        "email": req.email,
        "password": hashed_pw.decode('utf-8'), # 存入雜湊值
        # ...其他欄位...
    }
    db.collection("users").document(req.email).set(user_data)
    return {"status": "success"}

# --- 登入時：將用戶輸入的密碼進行雜湊比對 ---
@app.post("/login")
def login(req: LoginRequest):
    doc_ref = db.collection("users").document(req.email)
    doc = doc_ref.get()
    
    if not doc.exists:
        return {"status": "error", "message": "無此帳號"}
    
    user_data = doc.to_dict()
    db_hashed_pw = user_data.get("password").encode('utf-8')
    
    # 使用 bcrypt.checkpw 比對輸入的密碼與資料庫中的雜湊值
    if bcrypt.checkpw(req.password.encode('utf-8'), db_hashed_pw):
        return {"status": "success"}
    else:
        return {"status": "error", "message": "密碼錯誤"}


# ── /recommend ────────────────────────────────────────────────
@app.post("/recommend")
def recommend(req: RecommendRequest):
    try:
        student_doc = db.collection("users").document(req.email).get()
        if not student_doc.exists:
            raise HTTPException(status_code=404, detail="找不到學生資料，請先完成問卷")

        student_data = student_doc.to_dict()
        db_grade = student_data.get("grade") or student_data.get("year_level") or "三年級"
        class_upper = str(student_data.get("class_grade", "A")).upper()

        CHINESE_TO_NUM = {"一年級": "1", "二年級": "2", "三年級": "3", "四年級": "4"}
        grade_str = CHINESE_TO_NUM.get(db_grade, "3") if isinstance(db_grade, str) else str(db_grade)

        raw_scores = req.survey_scores or student_data.get("survey_scores", {})
        final_interest_vector = [float(raw_scores.get(k, 0)) for k in FEATURE_KEYS]

        # 1. 必修課
        required_raw = [
            c for c in ALL_COURSES
            if c.get("category") == "必修"
            and (str(c.get("year")) == grade_str or db_grade in str(c.get("year")))
            and str(c.get("class_grade", "")).upper() == class_upper
            and semester_suffix(c.get("semester", "")) == req.semester
            and "pe_" not in str(c.get("course_code", "")).lower()
            and "pe_" not in str(c.get("course_id", "")).lower()
        ]
        required = [{
            "title": c.get("title") or c.get("course_name") or "核心專業必修",
            "instructor": c.get("instructor") or c.get("teacher") or "資管系教授",
            "schedule": format_schedule(c.get("schedule", [])),
            "credits": str(c.get("credits", "3")),
            "category": "必修",
            "course_code": c.get("course_code") or c.get("course_id") or "REQ"
        } for c in deduplicate(required_raw)]

        # 2. 體育 / 特殊課
        SP_KEYWORDS = ["英文", "運動", "體育", "閱讀與書寫", "國文", "羽球", "網球",
                       "桌球", "初級", "籃球", "排球", "健身", "游泳"]
        special_raw = []
        for c in ALL_COURSES:
            c_title = str(c.get("title", ""))
            c_name  = str(c.get("course_name", ""))
            c_code  = str(c.get("course_code", "")).lower()
            c_id    = str(c.get("course_id", "")).lower()
            c_sem   = str(c.get("semester", "")).lower()
            c_dept  = str(c.get("dept", ""))

            is_sem1 = ("1141" in c_sem or c_sem.endswith("1") or c_sem == "1" or "1141" in c_id)
            is_sem2 = ("1142" in c_sem or c_sem.endswith("2") or c_sem == "2" or "1142" in c_id)

            if req.semester == "1" and not is_sem1:
                continue
            if req.semester == "2" and not is_sem2:
                continue

            if ("pe_" in c_code or "pe_" in c_id or "體必" in c_dept
                    or any(kw in c_title or kw in c_name for kw in SP_KEYWORDS)):
                special_raw.append(c)

        special_choices = [{
            "title": c.get("title") or c.get("course_name") or "初級體育課程",
            "instructor": c.get("instructor") or c.get("teacher") or "體育組教授",
            "schedule": format_schedule(c.get("schedule", [])) if c.get("schedule") else "時間依公告",
            "credits": str(c.get("credits", "1")),
            "category": "體育",
            "course_code": c.get("course_id") or c.get("course_code") or f"PE_{c.get('title','')}"
        } for c in deduplicate(special_raw)]

        # 3. KNN 選修推薦
        """eligible_courses = [
            c for c in UNIQUE_ELECTIVES
            if (str(c.get("year")) == grade_str or db_grade in str(c.get("year")))
            and semester_suffix(c.get("semester", "")) == req.semester
        ]

        elective = []
        if eligible_courses and KNN_MODEL and any(v > 0 for v in final_interest_vector):
            X_e = np.array([[c["ai_weights"].get(k, 0.0) for k in FEATURE_KEYS] for c in eligible_courses])
            sc_e = StandardScaler()
            X_sc_e = sc_e.fit_transform(X_e)
            knn_e = NearestNeighbors(n_neighbors=min(req.top_n, len(eligible_courses)), metric="cosine")
            knn_e.fit(X_sc_e)
            query = sc_e.transform([final_interest_vector])
            dist, idxs = knn_e.kneighbors(query)
            for i, d in zip(idxs[0], dist[0]):
                c = eligible_courses[i]
                elective.append({
                    "title": c.get("title") or c.get("course_name"),
                    "instructor": c.get("instructor") or c.get("teacher") or "資管系教授",
                    "schedule": format_schedule(c.get("schedule", [])),
                    "credits": str(c.get("credits", "3")),
                    "similarity": round(float(1 - d), 3),
                    "category": "選修",
                    "course_code": c.get("course_code") or c.get("course_id") or "ELE"
                })"""

        elective = []

        return {
            "required": required,
            "elective": elective,          # ✅ 修正：原本錯寫成 effective
            "special_choices": special_choices
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SaveCoursesRequest(BaseModel):
    email: EmailStr
    selected_courses: list  # 用來接收前端傳來的選課陣列

# ── /save_courses ─────────────────────────────────────────────
@app.post("/save_courses")
def save_courses(req: SaveCoursesRequest):
    print(f"DEBUG: 準備寫入資料: {req.selected_courses}")
    try:
        doc_ref = db.collection("users").document(req.email)
        # 加入 print 來確認寫入動作
        print("DEBUG: 執行寫入動作...")
        doc_ref.set({"selected_courses": req.selected_courses}, merge=True)
        print("DEBUG: 寫入指令已發送")
        return {"message": "成功"}
    except Exception as e:
        print(f"❌ Firebase 寫入失敗: {e}") # ⚡️ 如果這裡有印出字，就是錯誤根源
        raise HTTPException(status_code=500, detail=str(e))
# ==========================================
# 👆👆👆 新的程式碼到這邊結束 👆👆👆
# ==========================================
class GetCoursesRequest(BaseModel):
    email: EmailStr

# ── /get_courses ─────────────────────────────────────────────
@app.post("/get_courses")
def get_courses(req: GetCoursesRequest):
    """
    接收前端的 email，從 Firestore 抓取該學生的選課紀錄並回傳
    """
    try:
        doc_ref = db.collection("users").document(req.email).get()
        if not doc_ref.exists:
            return {"selected_courses": []} # 找不到人就給空陣列
            
        data = doc_ref.to_dict()
        # 回傳資料庫裡的 selected_courses，如果沒有這個欄位就回傳空陣列
        return {"selected_courses": data.get("selected_courses", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/save_courses")
def save_courses(req: SaveCoursesRequest):
    doc_ref = db.collection("users").document(req.email)
    doc_ref.set({"selected_courses": req.selected_courses}, merge=True)
    return {"message": "儲存成功"}
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
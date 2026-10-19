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
    allow_credentials=True,
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

# ── Request Schema ────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str 

class RegisterRequest(BaseModel):
    email: EmailStr
    name: str
    password: str
    grade: str                              
    class_grade: str                        
    department: str = "資管系"
    survey_scores: Optional[dict[str, float]] = {}

class RecommendRequest(BaseModel):
    email: EmailStr
    semester: str
    survey_scores: Optional[dict[str, float]] = None
    top_n: int = 5

class SaveCoursesRequest(BaseModel):
    email: EmailStr
    selected_courses: list  

class GetCoursesRequest(BaseModel):
    email: EmailStr

# ── API 路由 ──────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "靜宜資管課程推薦 API v4.6 穩定運作中 🎓"}

# ── /register ─────────────────────────────────────────────────
@app.post("/register")
def register(req: RegisterRequest):
    hashed_pw = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt())
    user_data = {
        "email": req.email,
        "password": hashed_pw.decode('utf-8'),
        "name": req.name,
        "grade": req.grade,
        "class_grade": req.class_grade,
        "department": req.department,
        "survey_scores": req.survey_scores
    }
    db.collection("users").document(req.email).set(user_data, merge=True)
    return {"status": "success"}

# ── /login ────────────────────────────────────────────────────
@app.post("/login")
def login(req: LoginRequest):
    doc_ref = db.collection("users").document(req.email)
    doc = doc_ref.get()
    
    if not doc.exists:
        return {"status": "error", "message": "無此帳號"}
    
    user_data = doc.to_dict()
    db_hashed_pw = user_data.get("password").encode('utf-8')
    
    if bcrypt.checkpw(req.password.encode('utf-8'), db_hashed_pw):
        return {"status": "success"}
    else:
        return {"status": "error", "message": "密碼錯誤"}

# ── /save_courses ─────────────────────────────────────────────
@app.post("/save_courses")
def save_courses(req: SaveCoursesRequest):
    print(f"DEBUG: 準備寫入資料: {req.selected_courses}")
    try:
        doc_ref = db.collection("users").document(req.email)
        doc_ref.set({"selected_courses": req.selected_courses}, merge=True)
        print("DEBUG: 寫入指令已發送")
        return {"message": "成功"}
    except Exception as e:
        print(f"❌ Firebase 寫入失敗: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── /get_courses ─────────────────────────────────────────────
@app.post("/get_courses")
def get_courses(req: GetCoursesRequest):
    try:
        doc_ref = db.collection("users").document(req.email).get()
        if not doc_ref.exists:
            return {"selected_courses": []}
            
        data = doc_ref.to_dict()
        return {"selected_courses": data.get("selected_courses", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
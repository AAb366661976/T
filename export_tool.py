import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# 1. 初始化 Firebase Admin SDK (金鑰 serviceAccountKey.json 請放在同一個 backend 資料夾)
cred = credentials.Certificate("serviceAccountKey.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def clean_and_import_courses(json_filename, collection_name="courses"):
    print(f"🚀 啟動 Python 終極洗牌特工...")
    
    if not os.path.exists(json_filename):
        print(f"❌ 錯誤：在目前的 backend 資料夾下找不到 {json_filename}！")
        return

    try:
        # 2. 讀取妳給的乾淨 final_courses_fixed.json 檔案
        with open(json_filename, "r", encoding="utf-8") as f:
            courses_list = json.load(f)
            
        # 🌟 步驟 A：全自動大掃除！直接幫敏芝把舊的純數字體育課文件全數刪除，免動手！
        print("🧹 正在清除雲端資料庫中舊格式的體育課殘留資料...")
        docs = db.collection(collection_name).stream()
        delete_batch = db.batch()
        delete_count = 0
        
        for doc in docs:
            doc_id = doc.id
            doc_data = doc.to_dict()
            
            # 只要文件 ID 是純數字（例如 1815），且內部資料含有"體育"字眼
            is_pure_number = doc_id.isdigit()
            is_pe_course = "體育" in doc_data.get("dept", "") or "體育" in doc_data.get("title", "")
            
            if is_pure_number and is_pe_course:
                delete_batch.delete(doc.reference)
                delete_count += 1
                if delete_count % 400 == 0:
                    delete_batch.commit()
                    delete_batch = db.batch()
                    
        delete_batch.commit()
        print(f"🗑️ 清理完畢！已自動安全移除 {delete_count} 筆舊格式的純數字體育課文件。")

        # 🌟 步驟 B：存入妳要的全新規格，把 ID 統統強制鎖定在 PE_數字
        print(f"📥 開始灌錄全新 100% 聽話的體育課資料...")
        import_batch = db.batch()
        import_count = 0
        
        for course in courses_list:
            raw_id = course.get("session_id") or course.get("course_code")
            if not raw_id:
                continue
                
            # 拔掉可能包含的 PE 或底線，確保拿出最純的數字 (1815, 2931)
            pure_number = str(raw_id).replace("PE", "").replace("_", "").strip()
            
            # 🌟 強制組合出敏芝要的唯一終極規格：最左邊文件 ID 絕對是 PE_1815、PE_2931
            doc_id = f"PE_{pure_number}"
            doc_ref = db.collection(collection_name).document(doc_id)
            
            course_data = {
                "course_code": doc_id,         # 內部代碼同步清洗為 PE_1815
                "title": course.get("title"),   # 保留原本完整的課名
                "instructor": course.get("instructor", "未知"),
                "credits": course.get("credits", "1"),
                "schedule": course.get("schedule", []),
                "tags": course.get("tags", ["#必修", "#體育"]),
                "year": course.get("year", "1"),
                "semester": course.get("semester", "1141"),
                "dept": course.get("dept", "體育必修"),
                "class_grade": course.get("class_grade", "A"),
                "degree": course.get("degree", "大學部"),
                "session_id": pure_number,
                "id": doc_id,                   # 內部 id 同步
                "ai_weights": course.get("ai_weights", {
                    "ai_algo": 0.0,
                    "biz_mgt": 0.0,
                    "data_ana": 0.0,
                    "soft_dev": 0.0,
                    "erp_sys": 0.0,
                    "sys_infra": 0.0
                })
            }
            
            import_batch.set(doc_ref, course_data)
            import_count += 1
            
            if import_count % 400 == 0:
                import_batch.commit()
                import_batch = db.batch()

        import_batch.commit()
        print("\n" + "="*50)
        print(f"🎉 賀！{import_count} 門體育課已全部成功格式化寫入完畢！")
        print(f"📊 網頁後台最左邊的文件 ID，不論初級或基礎體育，100% 統一為 [ PE_數字 ] 格式！")
        print("="*50)
        
    except Exception as e:
        print(f"🔥 發生錯誤：{e}")

if __name__ == "__main__":
    clean_and_import_courses("final_courses_fixed.json", "courses")
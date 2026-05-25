import json
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

with open("final_courses_fixed.json", "r", encoding="utf-8") as f:
    courses = json.load(f)

print(f"共 {len(courses)} 筆課程準備匯入...")

batch = db.batch()
count = 0

for course in courses:
    doc_id = course.get("id") or course.get("course_code")
    if not doc_id:
        print(f"  ⚠️ 跳過無 ID 課程：{course.get('title')}")
        continue

    ref = db.collection("courses").document(str(doc_id))
    batch.set(ref, course)
    count += 1

    if count % 500 == 0:
        batch.commit()
        print(f"  已上傳 {count} 筆...")
        batch = db.batch()

if count % 500 != 0:
    batch.commit()

print(f"✅ 完成！共匯入 {count} 筆課程到 Firestore collection: courses")
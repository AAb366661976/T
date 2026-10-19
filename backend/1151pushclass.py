import json
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

# ==========================================
# 1. 初始化 Firebase 
# (請確保金鑰檔案 serviceAccountKey.json 放在同一層目錄)
# ==========================================
print("啟動 Firebase 連線中...")
cred = credentials.Certificate('serviceAccountKey.json')
firebase_admin.initialize_app(cred)
db = firestore.client()

# ==========================================
# 2. 讀取與合併資料
# ==========================================
json_filename = r'D:\MyProject\backend\1151RW.json' # 👈 這裡改成你要上傳的 JSON 檔名
print(f"正在讀取檔案 {json_filename}...")

with open(json_filename, 'r', encoding='utf-8') as f:
    courses_data = json.load(f)

merged_courses = {}
for course in courses_data:
    course_id = course['id']
    
    # 解決合授課程：如果 ID 已經存在，就把老師名字接在後面
    if course_id in merged_courses:
        if course['instructor'] not in merged_courses[course_id]['instructor']:
            merged_courses[course_id]['instructor'] += f", {course['instructor']}"
    else:
        merged_courses[course_id] = course.copy()

final_courses = list(merged_courses.values())
print(f"✅ 資料整理完畢！準備上傳共 {len(final_courses)} 筆獨立課程...")

# ==========================================
# 3. 分批上傳 (Batch Upload) 
# Firestore 規定一個 Batch 最多 500 筆寫入
# ==========================================
collection_name = 'courses_1151' # 👈 目標 Collection 名稱
batch = db.batch()
count = 0
total_uploaded = 0

for course in final_courses:
    # 建立文件參考，使用我們自訂的 ID (例如: RW_1151_2374)
    doc_ref = db.collection(collection_name).document(course['id'])
    batch.set(doc_ref, course)
    
    count += 1
    # 每 500 筆送出一次
    if count == 500:
        batch.commit()
        total_uploaded += count
        print(f"🚀 已上傳 {total_uploaded} 筆資料...")
        batch = db.batch() # 重新建立一個新的 batch
        count = 0

# 將剩下的資料送出
if count > 0:
    batch.commit()
    total_uploaded += count
    print(f"🚀 已上傳 {total_uploaded} 筆資料...")

print("🎉 全部課程匯入完成！可以去 Firebase 後台看成果了！")
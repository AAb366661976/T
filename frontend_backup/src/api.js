// 自動讀取環境變數，若沒設定則退回 localhost
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

/**
 * 登入
 * POST /login  { email }
 * 成功 → 回傳學生資料物件
 * 失敗 → throw Error（前端顯示 toast）
 */
export async function login(email) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "登入失敗");
  }
  return res.json();
}

/**
 * 註冊 / 更新學生資料
 * POST /register  { email, name, grade, class_grade, department, survey_scores }
 */
export async function register({ email, name, grade, class_grade, survey_scores }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      name,
      grade,
      class_grade,
      department: "資管系",
      survey_scores: survey_scores || {},
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "註冊失敗");
  }
  return res.json();
}

/**
 * 取得推薦課程
 * POST /recommend  { email, semester, top_n }
 * 回傳 { required: [], elective: [], special_choices: [] }
 */
export async function getRecommendations({ email, semester, top_n = 20 }) {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, semester, top_n }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "推薦課程取得失敗");
  }
  return res.json();
}
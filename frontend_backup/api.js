// 自動讀取環境變數，若沒設定則安全退回 localhost
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

/**
 * 登入驗證
 */
export async function login(email) {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "登入失敗");
  }
  return await response.json();
}

/**
 * 填寫問卷後的後端 KNN 註冊同步
 */
export async function register({ email, name, grade, class_grade, survey_scores }) {
  const response = await fetch(`${API_BASE}/register`, {
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
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "註冊失敗");
  }
  return await response.json();
}

/**
 * 取得權重推薦課程清單
 */
export async function getRecommendations({ email, semester, top_n = 20 }) {
  const response = await fetch(`${API_BASE}/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, semester, top_n }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "推薦失敗");
  }
  return await response.json();
}
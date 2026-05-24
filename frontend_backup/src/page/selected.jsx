import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Footer from "./Footer";

// 每個課程對應一個固定顏色
const COLORS = [
  "#1D9E75",
  "#378ADD",
  "#BA7517",
  "#D85A30",
  "#534AB7",
  "#993556",
];
function colorFor(code) {
  let h = 0;
  for (let i = 0; i < code.length; i++)
    h = (h * 31 + code.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

const Selected = () => {
  const { selectedCourses, setSelectedCourses } = useOutletContext();
  console.log("raw selectedCourses:", selectedCourses.map(c => c.course_code));

  // 本地管理刪除清單
  const [deletedCourses, setDeletedCourses] = useState([]);

  // Tab 切換：'selected' | 'deleted'
  const [activeTab, setActiveTab] = useState("selected");

  const uniqueSelected = selectedCourses.filter(
    (course, index, self) =>
      index === self.findIndex((c) => c.course_code === course.course_code),
  );

  // 刪除：從 selectedCourses 移除，加入 deletedCourses
  const handleDelete = (courseCode) => {
    const target = selectedCourses.find((c) => c.course_code === courseCode);
    if (!target) return;
    setSelectedCourses((prev) =>
      prev.filter((c) => c.course_code !== courseCode),
    );
    setDeletedCourses((prev) => [{ ...target, isNew: false }, ...prev]);
  };

  // 復原：從 deletedCourses 移除，加回 selectedCourses
  const handleRestore = (courseCode) => {
    const target = deletedCourses.find((c) => c.course_code === courseCode);
    if (!target) return;
    setDeletedCourses((prev) =>
      prev.filter((c) => c.course_code !== courseCode),
    );
    setSelectedCourses((prev) => [...prev, { ...target, isNew: true }]);
  };

  const totalCredits = uniqueSelected.reduce(
    (sum, c) => sum + (parseInt(c.credits, 10) || 0),
    0,
  );

  return (
    <div className="min-h-screen flex flex-col bg-[url('/selected.jpg')] bg-cover bg-center bg-no-repeat bg-fixed font-['Montserrat'] antialiased relative">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-md z-0 pointer-events-none"></div>
      <main className="flex-grow max-w-3xl mx-auto w-full px-6 py-8 relative z-10">
        {/* 頁首 */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-black-900">選課管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            切換「已選課程」和「已刪除課程」，可隨時刪除或復原
          </p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">已選課程</p>
            <p className="text-2xl font-semibold text-emerald-600">
              {uniqueSelected.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">總學分</p>
            <p className="text-2xl font-semibold text-gray-800">
              {totalCredits}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <p className="text-xs text-gray-400 mb-1">已刪除</p>
            <p className="text-2xl font-semibold text-orange-500">
              {deletedCourses.length}
            </p>
          </div>
        </div>

        {/* Tab 切換 */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("selected")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "selected"
                ? "border-emerald-500 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            已選課程
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
              {uniqueSelected.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("deleted")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "deleted"
                ? "border-orange-400 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            已刪除課程
            <span className="bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded-full">
              {deletedCourses.length}
            </span>
          </button>
        </div>

        {/* 已選課程清單 */}
        {activeTab === "selected" && (
          <div className="space-y-2">
            {selectedCourses.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">
                尚無選課記錄
              </p>
            ) : (
              uniqueSelected.map((course) => (
                <div
                  key={course.course_code}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-gray-200 transition-colors"
                >
                  {/* 色點 */}
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorFor(course.course_code) }}
                  />

                  {/* 課程資訊 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {course.course_code}
                      {course.time && ` · ${course.time}`}
                      {course.credits && ` · ${course.credits} 學分`}
                    </p>
                  </div>

                  {/* 新增 badge */}
                  {course.isNew && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                      新增
                    </span>
                  )}

                  {/* 刪除按鈕 */}
                  <button
                    onClick={() => handleDelete(course.course_code)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-500 transition-colors flex-shrink-0"
                    aria-label={`刪除 ${course.title}`}
                  >
                    {/* 垃圾桶 SVG icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* 已刪除課程清單 */}
        {activeTab === "deleted" && (
          <div className="space-y-2">
            {deletedCourses.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-12">
                沒有已刪除的課程
              </p>
            ) : (
              deletedCourses.map((course) => (
                <div
                  key={course.course_code}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 opacity-60"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colorFor(course.course_code) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate line-through">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {course.course_code}
                      {course.credits && ` · ${course.credits} 學分`}
                    </p>
                  </div>
                  <span className="bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                    已刪除
                  </span>

                  {/* 復原按鈕 */}
                  <button
                    onClick={() => handleRestore(course.course_code)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex-shrink-0"
                    aria-label={`復原 ${course.title}`}
                  >
                    {/* 復原箭頭 icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 14l-4-4 4-4" />
                      <path d="M5 10h11a4 4 0 0 1 0 8h-1" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Selected;

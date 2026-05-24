import { useOutletContext } from "react-router-dom";
import React, { useState, useRef, useEffect } from "react";
import Footer from "./Footer";

const Schedule = () => {
  const { selectedCourses, setSelectedCourses, allCourses } = useOutletContext();

  const days = ["一", "二", "三", "四", "五"];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const [activeCell, setActiveCell] = useState(null);

  const scheduleRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // 如果 scheduleRef 有綁定實體，且點擊的目標(event.target)不在該容器內部
      if (scheduleRef.current && !scheduleRef.current.contains(event.target)) {
        // 立即清除所有選取狀態，關閉課程資訊
        setActiveDay(null);
        setActivePeriod(null);
        setActiveCell(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); 

  // 當前節次與星期（null = 無選取）
  const [activeDay, setActiveDay] = useState(null);    // 1~5
  const [activePeriod, setActivePeriod] = useState(null); // 1~12
  // 紀錄單一格子的課程狀態

  // 處理點擊單一格子的事件
  const handleCellClick = (dayIndex, period) => {
  setActiveCell((prev) => 
    // 如果點擊的是同一個格子，則關閉展開
    prev?.day === dayIndex && prev?.period === period 
      ? null 
      : { day: dayIndex, period }
  );
  
  // 清除整行與整列的選取狀態，避免畫面資訊過載
  setActiveDay(null);
  setActivePeriod(null);
};

  // 刪除已選課程
  const handleRemoveCourse = (courseCode) => {
    setSelectedCourses(selectedCourses.filter((c) => c.course_code !== courseCode));
  };

  // 新增課程（先做衝堂檢查）
  const handleAddCourse = (course) => {
    const isAlreadySelected = selectedCourses.some(
      (c) => c.course_code === course.course_code
    );
    if (isAlreadySelected) return;

    // 衝堂檢查：與已選課程比對 schedule
    const hasConflict = selectedCourses.some((selected) =>
      selected.schedule.some((s1) =>
        course.schedule.some(
          (s2) => s1.day === s2.day && s1.time.some((t) => s2.time.includes(t))
        )
      )
    );
    if (hasConflict) {
      alert(`「${course.title}」與已選課程時間衝突！`);
      return;
    }

    setSelectedCourses([...selectedCourses, course]);
  };

  // 點擊節次標頭：toggle activePeriod，清除 activeDay
  const handlePeriodClick = (period) => {
    setActivePeriod((prev) => (prev === period ? null : period));
    setActiveDay(null);
  };

  // 點擊星期標頭：toggle activeDay，清除 activePeriod
  const handleDayClick = (dayIndex) => {
    setActiveDay((prev) => (prev === dayIndex ? null : dayIndex));
    setActivePeriod(null);
  };

  // 判斷某個格子是否需要展開
  // 判斷某個格子是否需要展開
  const getCellCourses = (dayIndex, period) => {
    
    const isCellMode = activeCell?.day === dayIndex && activeCell?.period === period;
    const isPeriodMode = activePeriod === period;
    const isDayMode = activeDay === dayIndex;

    
    if (!isCellMode && !isPeriodMode && !isDayMode) return null;

    // 3. 過濾出在該天、該節次有課的候選課程
    return allCourses.filter((course) =>
      course.schedule.some(
        (s) => s.day === dayIndex && s.time.includes(period)
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-['Montserrat'] antialiased">
      <div className="p-4 w-full max-w-6xl mx-auto flex-grow">
        {/* 提示文字 */}
        {(activePeriod || activeDay) && (
          <p className="mb-3 text-sm text-blue-600 font-medium">
            {activePeriod
              ? `第 ${activePeriod} 節 — 點擊課程卡片可加選，再點標題取消篩選`
              : `星期${"一二三四五"[activeDay - 1]} — 點擊課程卡片可加選，再點標題取消篩選`}
          </p>
        )}

        <div className="w-full pb-4" ref={scheduleRef}>
          <div 
            className="grid gap-1 text-center" 
            style={{ gridTemplateColumns: "2.5rem repeat(5, minmax(0, 1fr))" }}
          >
            {/* 左上角空格 */}
            <div className="font-bold p-2 bg-gray-200 rounded flex items-center justify-center text-gray-700 text-[10px]">
              節次
            </div>

            {/* 星期標頭 */}
            {days.map((day, index) => {
              const dayIndex = index + 1;
              const isActive = activeDay === dayIndex;
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(dayIndex)}
                  className={`font-bold p-1 rounded transition-all duration-200 cursor-pointer select-none text-[10px] leading-none flex flex-col items-center justify-center gap-1
                    ${isActive
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }`}
                >
                  星期{day}
                  {isActive && <span className="text-[8px]">▼</span>}
                </button>
              );
            })}

            {/* 主體：節次 × 星期 */}
            {periods.map((period) => (
              <React.Fragment key={period}>
                {/* 節次標頭（可點擊） */}
                <button
                  onClick={() => handlePeriodClick(period)}
                  className={`font-bold p-1 rounded flex flex-col items-center justify-center gap-0.5
                    transition-all duration-200 cursor-pointer select-none text-[10px] leading-none whitespace-nowrap
                    ${activePeriod === period
                      ? "bg-orange-500 text-white shadow-md"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                >
                  第{period}節
                  {activePeriod === period && <span className="text-[8px]">▶</span>}
                </button>

                {/* 各天格子 */}
                {days.map((day, index) => {
                  const dayIndex = index + 1;

                  // 已選課程（這格）
                  const selectedAtThisTime = selectedCourses.filter((course) =>
                    course.schedule.some(
                      (s) => s.day === dayIndex && s.time.includes(period)
                    )
                  );

                  // 可展開的候選課程
                  const candidateCourses = getCellCourses(dayIndex, period);
                  const isExpanded = candidateCourses !== null;

                  return (
                    <div
                      key={`${day}-${period}`}
                      onClick={() => handleCellClick(dayIndex, period)}
                      className={`border-2 rounded p-1.5 min-h-[3rem] transition-all duration-200 flex flex-col gap-0.5 overflow-hidden cursor-pointer
                        ${isExpanded
                          ? "border-blue-300 bg-blue-50"
                          : "border-dashed border-gray-200 bg-white hover:bg-gray-50"
                        }`}
                    >
                      {/* 已選課程 */}
                      {selectedAtThisTime.map((course) => (
                        <div
                          key={course.course_code}
                          className="relative bg-orange-500 text-white p-0.5 rounded shadow-sm flex flex-col justify-center items-center h-full"
                        >
                          {/* 加上 line-clamp-2 與 title 屬性 */}
                          <span 
                            className="block font-semibold text-[9px] leading-tight break-words pr-3 line-clamp-2 text-center w-full"
                            title={course.title}
                          >
                            {course.title}
                          </span>
                          {course.instructor && (
                            <span 
                              className="block text-orange-100 text-[10px] mt-0.5 truncate text-left"
                              title={course.instructor}
                            >
                              {course.instructor}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCourse(course.course_code)}}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full
                                       text-white text-[10px] flex items-center justify-center
                                       hover:bg-red-600 transition-colors shadow z-10"
                            title="移除課程"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      {/* 展開的候選課程 */}
                      {isExpanded && (
                        <div className="space-y-0.5 w-full">
                          {candidateCourses.length === 0 ? (
                            <p className="text-[8px] text-gray-400 text-center py-1">
                              無可選課程
                            </p>
                          ) : (
                            candidateCourses.map((course) => {
                              const isSelected = selectedCourses.some(
                                (c) => c.course_code === course.course_code
                              );
                              return (
                                <button
                                  key={course.course_code}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    isSelected
                                      ? handleRemoveCourse(course.course_code)
                                      : handleAddCourse(course);
                                  }}
                                  className={`w-full text-center p-0.5 rounded transition-all duration-150
                                    ${isSelected
                                      ? "bg-green-500 text-white shadow-sm"
                                      : "bg-white text-gray-700 border border-blue-200 hover:border-blue-400 hover:bg-blue-100"
                                    }`}
                                >
                                  {/* 加上 line-clamp-2 處理過長標題 */}
                                  <span 
                                    className="block font-semibold text-[9px] leading-tight break-all line-clamp-2"
                                    title={course.title}
                                  >
                                    {isSelected && "✓ "}{course.title}
                                  </span>
                                  {course.instructor && (
                                    <span 
                                      className={`block text-[10px] mt-0.5 truncate ${isSelected ? "text-green-100" : "text-gray-400"}`}
                                      title={course.instructor}
                                    >
                                      👤 {course.instructor}
                                    </span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Schedule;
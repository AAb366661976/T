import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// ── Firebase 初始化（只初始化一次）────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// --- 1. 輔助函數：處理時間格式 ---
const formatTime = (scheduleArray) => {
  if (!scheduleArray || scheduleArray.length === 0) return "時間未定";
  const days = ["", "ㄧ", "二", "三", "四", "五"];
  const s = scheduleArray[0];
  const startTime = s.time[0] + 7;
  const endTime = s.time[s.time.length - 1] + 8;
  return `${days[s.day]} ${startTime}:00-${endTime}:00`;
};

// 加入課程邏輯檢查
const checkConflict = (newCourse, selectedCourses) => {
  if (!newCourse.schedule || newCourse.schedule.length === 0) return null;
  for (const selected of selectedCourses) {
    if (!selected.schedule || selected.schedule.length === 0) continue;
    for (const newSlot of newCourse.schedule) {
      for (const existSlot of selected.schedule) {
        const sameDay = newSlot.day === existSlot.day;
        const newTimes = new Set(newSlot.time);
        const hasOverlap = existSlot.time.some((t) => newTimes.has(t));
        if (sameDay && hasOverlap) return selected;
      }
    }
  }
  return null;
};

// --- 2. 子組件：課程卡片 (CourseCard) ---
const CourseCard = ({ course, onAddCourse }) => {
  const courseType = (() => {
    const code = course.course_code;
    if (code.startsWith("PE_")) return "pe";
    if (code.startsWith("CHI_") || code.startsWith("1141_")) return "chinese";
    if (code.startsWith("ENGL_") || code.startsWith("GEN_")) return "english";
    const isCompulsory = (course.category ?? "").trim() === "必修";
    return isCompulsory ? "compulsory" : "elective";
  })();

  const themeMap = {
    compulsory: {
      border: "border-blue-500",
      badge: "bg-blue-100 text-blue-600",
      bar: "bg-blue-400",
      btn: "bg-blue-500 shadow-blue-100",
      text: "text-gray-400",
    },
    elective: {
      border: "border-orange-500",
      badge: "bg-orange-100 text-orange-600",
      bar: "bg-orange-400",
      btn: "bg-orange-500 shadow-orange-100",
      text: "text-gray-600",
    },
    chinese: {
      border: "border-green-500",
      badge: "bg-green-100 text-green-600",
      bar: "bg-green-400",
      btn: "bg-green-500 shadow-green-100",
      text: "text-gray-600",
    },
    english: {
      border: "border-purple-500",
      badge: "bg-purple-100 text-purple-600",
      bar: "bg-purple-400",
      btn: "bg-purple-500 shadow-purple-100",
      text: "text-gray-600",
    },
    pe: {
      border: "border-red-500",
      badge: "bg-red-100 text-red-600",
      bar: "bg-red-400",
      btn: "bg-red-500 shadow-red-100",
      text: "text-gray-600",
    },
  };

  const theme = themeMap[courseType];

  return (
    <div
      className={`flex items-center justify-between bg-white p-4 mb-4 rounded-2xl shadow-sm border-l-4 ${theme.border} hover:shadow-md transition-shadow`}
    >
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${theme.badge}`}>
            {(course.course_code.split("_")[2] || course.course_code.split("_")[1]) || "課號"}
          </span>
          <span className="text-gray-400 text-xs font-medium">
            {course.credits} 學分
          </span>
        </div>
        <h3 className="text-base font-bold text-gray-800 leading-tight line-clamp-1">{course.title}</h3>
        <div className="flex items-center text-gray-500 text-xs mt-1 gap-2">
          <span>👤</span>
          <span>{course.instructor} 教授</span>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center text-gray-400 text-[11px] gap-2">
            <span>🕒</span>
            <span>{formatTime(course.schedule)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${theme.bar}`} style={{ width: "100%" }}></div>
            </div>
            <span className={`text-xs font-bold ${theme.text}`}>剩 60</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          console.log("按鈕被點擊了");
          console.log("course:", course);
          onAddCourse(course);
        }}
        className={`${theme.btn} text-white w-10 h-10 rounded-xl shadow-lg flex-shrink-0 flex items-center justify-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300 active:scale-95`}
      >
        <span className="text-xl font-bold">+</span>
      </button>
    </div>
  );
};

// --- 3. 子組件：課程區塊 (CourseSection) ---
const CourseSection = ({
  title,
  count,
  courses,
  icon,
  defaultOpen = true,
  isCompulsory,
  visibleCount,
  totalCount,
  onLoadMore,
  isLoading,
  onAddCourse,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <section className="mb-2 px-4">
      <div
        className="flex items-center justify-between cursor-pointer py-2 group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
            <span className="text-sm">{icon}</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <span className="bg-blue-50 text-blue-500 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            {count}門
          </span>
        </div>
        <div className={`transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div
        className={`grid transition-all duration-300 overflow-hidden ${
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"
        }`}
      >
        <div className="overflow-hidden">
          {courses.map((item) => (
            <CourseCard key={item.course_code} course={item} onAddCourse={onAddCourse} />
          ))}
        </div>

        {totalCount > visibleCount && (
          <div className="flex justify-center my-4">
            <button
              onClick={(e) => { e.stopPropagation(); onLoadMore(); }}
              disabled={isLoading}
              className={`btn ${isCompulsory ? "btn-primary" : "btn-warning"} btn-wide rounded-2xl shadow-lg border-none text-white ${isLoading ? "loading" : ""}`}
            >
              {isLoading ? "讀取中..." : `載入更多 (${visibleCount}/${totalCount})`}
            </button>
          </div>
        )}

        {totalCount <= visibleCount && totalCount > 0 && (
          <div className="text-center text-gray-400 text-xs my-6 tracking-widest">
            ─── 已顯示全部{isCompulsory ? "必修" : "選修"}課程 ───
          </div>
        )}
      </div>
    </section>
  );
};

// --- 4. 主組件：CourseList ---
const CourseList = () => {
  const { selectedCourses, setSelectedCourses } = useOutletContext();

  // ── Firebase 課程資料 ──────────────────────────────────────
  const [allCourses, setAllCourses] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snapshot = await getDocs(collection(db, "courses"));
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAllCourses(data);
      } catch (err) {
        console.error("Firebase 課程載入失敗：", err);
        setFetchError("課程載入失敗，請稍後再試");
      } finally {
        setIsFetching(false);
      }
    };
    fetchCourses();
  }, []);

  // ── 依 course_code 前綴分類（對齊原本 JSON 邏輯）─────────────
  const mainCourses    = allCourses.filter((c) => !c.course_code?.startsWith("PE_") && !c.course_code?.startsWith("CHI_") && !c.course_code?.startsWith("1141_") && !c.course_code?.startsWith("ENGL_") && !c.course_code?.startsWith("GEN_"));
  const chineseCourses = allCourses.filter((c) => c.course_code?.startsWith("CHI_") || c.course_code?.startsWith("1141_"));
  const englishCourses = allCourses.filter((c) => c.course_code?.startsWith("ENGL_") || c.course_code?.startsWith("GEN_"));
  const peCourses      = allCourses.filter((c) => c.course_code?.startsWith("PE_"));

  const [filters, setFilters] = useState({
    category: "",
    credits: "",
    day: "",
    location: "",
    instructor: "",
    session_id: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const BATCH_SIZE = 5;

  const [visibleCompulsory, setVisibleCompulsory] = useState(BATCH_SIZE);
  const [visibleElective,   setVisibleElective]   = useState(BATCH_SIZE);
  const [visibleChinese,    setVisibleChinese]     = useState(BATCH_SIZE);
  const [visibleEnglish,    setVisibleEnglish]     = useState(BATCH_SIZE);
  const [visiblePe,         setVisiblePe]          = useState(BATCH_SIZE);

  const [isLoadingCompulsory, setIsLoadingCompulsory] = useState(false);
  const [isLoadingElective,   setIsLoadingElective]   = useState(false);
  const [isLoadingChinese,    setIsLoadingChinese]     = useState(false);
  const [isLoadingEnglish,    setIsLoadingEnglish]     = useState(false);
  const [isLoadingPe,         setIsLoadingPe]          = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    displayCompulsory, displayElective, compulsoryTotal, electiveTotal,
    displayChinese, chineseTotal,
    displayEnglish, englishTotal,
    displayPe, peTotal,
    totalFilteredCount,
  } = useMemo(() => {
    const checkFilterMatch = (c) => {
      const matchTitle      = (c.title ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchInstructor = (c.instructor ?? "").toLowerCase().includes((filters.instructor ?? "").toLowerCase());
      const matchCategory   = filters.category === "" || (c.category ?? "").trim() === filters.category;
      const matchCredits    = filters.credits === "" || String(c.credits ?? "") === filters.credits;
      const matchDay        = filters.day === "" || (c.schedule?.length > 0 && String(c.schedule[0].day) === filters.day);
      const matchLocation   = filters.location === "" || (c.schedule?.length > 0 && (c.schedule[0].location ?? "").includes(filters.location));
      const matchSessionId  = filters.session_id === "" || (c.session_id ?? "").includes(filters.session_id);
      return matchTitle && matchInstructor && matchCategory && matchCredits && matchDay && matchLocation && matchSessionId;
    };

    const filteredMain    = mainCourses.filter(checkFilterMatch);
    const filteredChinese = chineseCourses.filter(checkFilterMatch);
    const filteredEnglish = englishCourses.filter(checkFilterMatch);
    const filteredPe      = peCourses.filter(checkFilterMatch);

    const compulsory = filteredMain.filter((c) => (c.category ?? "").trim() === "必修");
    const elective   = filteredMain.filter((c) => (c.category ?? "").trim() === "選修");

    return {
      displayCompulsory: compulsory.slice(0, visibleCompulsory),
      displayElective:   elective.slice(0, visibleElective),
      compulsoryTotal:   compulsory.length,
      electiveTotal:     elective.length,
      displayChinese:    filteredChinese.slice(0, visibleChinese),
      chineseTotal:      filteredChinese.length,
      displayEnglish:    filteredEnglish.slice(0, visibleEnglish),
      englishTotal:      filteredEnglish.length,
      displayPe:         filteredPe.slice(0, visiblePe),
      peTotal:           filteredPe.length,
      totalFilteredCount: filteredMain.length + filteredChinese.length + filteredEnglish.length + filteredPe.length,
    };
  }, [searchTerm, visibleCompulsory, visibleElective, visibleChinese, visibleEnglish, visiblePe, filters, allCourses]);

  const handleLoadMoreCompulsory = () => { setIsLoadingCompulsory(true); setTimeout(() => { setVisibleCompulsory((p) => p + BATCH_SIZE); setIsLoadingCompulsory(false); }, 400); };
  const handleLoadMoreElective   = () => { setIsLoadingElective(true);   setTimeout(() => { setVisibleElective((p)   => p + BATCH_SIZE); setIsLoadingElective(false);   }, 400); };
  const handleLoadMoreChinese    = () => { setIsLoadingChinese(true);    setTimeout(() => { setVisibleChinese((p)    => p + BATCH_SIZE); setIsLoadingChinese(false);    }, 400); };
  const handleLoadMoreEnglish    = () => { setIsLoadingEnglish(true);    setTimeout(() => { setVisibleEnglish((p)    => p + BATCH_SIZE); setIsLoadingEnglish(false);    }, 400); };
  const handleLoadMorePe         = () => { setIsLoadingPe(true);         setTimeout(() => { setVisiblePe((p)         => p + BATCH_SIZE); setIsLoadingPe(false);         }, 400); };

  const handleAddCourse = (course) => {
    const isDuplicate = selectedCourses.some((c) => c.course_code === course.course_code);
    if (isDuplicate) { alert(`「${course.title}」已在課表中！`); return; }
    const conflictCourse = checkConflict(course, selectedCourses);
    if (conflictCourse) { alert(`⚠️ 時間衝突！\n「${course.title}」與已選的「${conflictCourse.title}」衝堂`); return; }
    setSelectedCourses((prev) => {
      const alreadyExists = prev.some((c) => c.course_code === course.course_code);
      if (alreadyExists) return prev;
      return [...prev, { ...course, isNew: true }];
    });
  };

  // ── 載入中 / 錯誤畫面 ─────────────────────────────────────
  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <span className="loading loading-spinner loading-lg text-blue-400"></span>
        <p className="text-gray-400 font-bold">正在從 Firebase 載入課程...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-60">
        <span className="text-5xl">⚠️</span>
        <p className="text-gray-500 font-bold">{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn bg-blue bg-cover bg-center bg-no-repeat bg-fixed min-h-screen relative">
      <div className="absolute inset-0 z-0 pointer-events-none"></div>
      <div className="sticky top-0 z-20 bg-gray-50/80 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="搜尋課程名稱..."
              className="input input-bordered w-50 rounded-full pl-10 focus:input-primary transition-all bg-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setVisibleCompulsory(BATCH_SIZE);
                setVisibleElective(BATCH_SIZE);
              }}
            />
          </div>

          <div className="flex relative items-center gap-1">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="btn btn-ghost btn-circle btn-sm text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>

            {isFilterOpen && (
              <div
                className="absolute right-0 mt-2 top-10 w-64 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 z-50 flex flex-col py-2 px-4 gap-3"
                style={{ height: "400px", overflowY: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-sm text-center font-bold text-gray-700 mb-1">進階篩選</p>

                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">課程類別</span></label>
                  <select className="select select-bordered select-sm w-full bg-white/50" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
                    <option value="">全部 (不限)</option>
                    <option value="必修">必修</option>
                    <option value="選修">選修</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">學分</span></label>
                  <select className="select select-bordered select-sm w-full bg-white/50" value={filters.credits} onChange={(e) => setFilters({ ...filters, credits: e.target.value })}>
                    <option value="">全部</option>
                    <option value="1">1 學分</option>
                    <option value="2">2 學分</option>
                    <option value="3">3 學分</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">星期</span></label>
                  <select className="select select-bordered select-sm w-full bg-white/50" value={filters.day} onChange={(e) => setFilters({ ...filters, day: e.target.value })}>
                    <option value="">全部</option>
                    <option value="1">星期ㄧ</option>
                    <option value="2">星期二</option>
                    <option value="3">星期三</option>
                    <option value="4">星期四</option>
                    <option value="5">星期五</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">地點</span></label>
                  <select className="select select-bordered select-sm w-full bg-white/50" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
                    <option value="">全部</option>
                    <option value="主顧">主顧</option>
                    <option value="計">計</option>
                    <option value="任垣">任垣</option>
                    <option value="伯鐸">伯鐸</option>
                  </select>
                </div>

                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">教授名稱</span></label>
                  <input type="text" placeholder="輸入教授姓名..." className="input input-bordered input-sm w-full bg-white/50" value={filters.instructor} onChange={(e) => setFilters({ ...filters, instructor: e.target.value })} />
                </div>

                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-xs font-bold text-gray-500">課程代號</span></label>
                  <input type="text" placeholder="課程代號..." className="input input-bordered input-sm w-full bg-white/50" value={filters.session_id} onChange={(e) => setFilters({ ...filters, session_id: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="py-2">
        {totalFilteredCount > 0 ? (
          <>
            <CourseSection title="必修課程" count={compulsoryTotal} courses={displayCompulsory} icon="📖" defaultOpen={false} isCompulsory={false} visibleCount={visibleCompulsory} totalCount={compulsoryTotal} onLoadMore={handleLoadMoreCompulsory} isLoading={isLoadingCompulsory} onAddCourse={handleAddCourse} />
            <CourseSection title="選修課程" count={electiveTotal}   courses={displayElective}   icon="🏛️" defaultOpen={false} isCompulsory={false} visibleCount={visibleElective}   totalCount={electiveTotal}   onLoadMore={handleLoadMoreElective}   isLoading={isLoadingElective}   onAddCourse={handleAddCourse} />
            <CourseSection title="國文課程" count={chineseTotal}    courses={displayChinese}    icon="✍️" defaultOpen={false} isCompulsory={true}  visibleCount={visibleChinese}    totalCount={chineseTotal}    onLoadMore={handleLoadMoreChinese}    isLoading={isLoadingChinese}    onAddCourse={handleAddCourse} />
            <CourseSection title="英文課程" count={englishTotal}    courses={displayEnglish}    icon="🔤" defaultOpen={false} isCompulsory={true}  visibleCount={visibleEnglish}    totalCount={englishTotal}    onLoadMore={handleLoadMoreEnglish}    isLoading={isLoadingEnglish}    onAddCourse={handleAddCourse} />
            <CourseSection title="體育課程" count={peTotal}         courses={displayPe}         icon="⚽" defaultOpen={false} isCompulsory={false} visibleCount={visiblePe}         totalCount={peTotal}         onLoadMore={handleLoadMorePe}         isLoading={isLoadingPe}         onAddCourse={handleAddCourse} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 opacity-40">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-gray-500 font-bold">找不到相關課程</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;
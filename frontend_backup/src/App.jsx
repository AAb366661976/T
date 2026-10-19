import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useState, useMemo } from "react";
import LoginRegster from "../../selected-courses-App/src/data/page/Login_Regster";
import SelctCourse from "../../selected-courses-App/src/data/page/selectCourse";
import CourseList from "../../selected-courses-App/src/data/page/CourseList";
import Schedule from "../../selected-courses-App/src/data/page/schedule";
import Selected from "../../selected-courses-App/src/data/page/selected";
import Profile from "../../selected-courses-App/src/data/page/profile";
import SoftwareDev from "../../selected-courses-App/src/data/page/SoftwareDev";
import InfoManagement from "../../selected-courses-App/src/data/page/InfoManagement";
import RD from "../../selected-courses-App/src/data/page/RD";
import Other from "../../selected-courses-App/src/data/page/Other";

import mainCourses from "./data/1151.json";
import chineseCourses from "./data/1151RW.json";
import englishCourses from "./data/1151EG.json";
import peCourses from "./data/1151PE.json";

function App() {
  const navigate = useNavigate();
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [deletedCourses, setDeletedCourses] = useState([]); //新增同步刪除課程
  const allCourses = useMemo(
    () => [...mainCourses, ...chineseCourses, ...englishCourses, ...peCourses],
    [],
  );

  const handleStart = () => {
    navigate("/login");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div
            className="min-h-screen flex flex-col items-center justify-center gap-6 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/app.jpg')" }}
          >
            <h1 className="text-3xl font-mono font-bold tracking-tight text-emerald-400 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] text-center">
              Personal Course Selection
            </h1>
            <div>
              <button
                className="btn btn-neutral text-2xl"
                onClick={handleStart}
              >
                start
              </button>
            </div>
          </div>
        }
      />

      <Route path="/login" element={<LoginRegster />} />

      {/*  把 selectedCourses 和 setSelectedCourses 傳給 SelctCourse */}
      <Route
        path="/selectcourse"
        element={
          <SelctCourse
            selectedCourses={selectedCourses}
            setSelectedCourses={setSelectedCourses}
            allCourses={allCourses}
            deletedCourses={deletedCourses}
            setDeletedCourses={setDeletedCourses}
          />
        }
      >
        <Route index element={<CourseList />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="selected" element={<Selected />} />

        <Route path="profile" element={<Profile />}>
          <Route index element={<Navigate to="software" replace />} />
          <Route path="software" element={<SoftwareDev />} />
          <Route path="management" element={<InfoManagement />} />
          <Route path="rd" element={<RD />} />
          <Route path="other" element={<Other />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;

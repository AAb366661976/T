import { Routes, Route, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import LoginRegster from "./page/Login_Regster";
import SelctCourse from "./page/selectCourse";
import CourseList from "./page/CourseList";
import Schedule from "./page/schedule";
import Selected from "./page/selected";
import Profile from "./page/profile";

import mainCourses from "./data/courses.json";
import chineseCourses from "./data/chinese.json";
import englishCourses from "./data/english.json";
import peCourses from "./data/pe.json";

function App() {
  const navigate = useNavigate();
  const [selectedCourses, setSelectedCourses] = useState([]);

  const allCourses = useMemo(() => [
    ...mainCourses,
    ...chineseCourses,
    ...englishCourses,
    ...peCourses,
  ], []);

  const handleStart = () => {
    navigate("/login");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/app.jpg')" }}>
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
          />
        }
      >
        <Route index element={<CourseList />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="selected" element={<Selected />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;

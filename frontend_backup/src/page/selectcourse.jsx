import React from "react";
import { Outlet, useOutletContext } from "react-router-dom";
import Footer from "./Footer";

//  接收從 App.jsx 傳來的 props
const selectcourse = ({ selectedCourses, setSelectedCourses, allCourses }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-['Montserrat'] antialiased">
      <main className="flex-grow pb-32">
        {/*  把同一份 state 透過 context 往下傳 */}
        <Outlet context={{ selectedCourses, setSelectedCourses, allCourses }} />
      </main>
      <Footer />
    </div>
  );
};

export default selectcourse;

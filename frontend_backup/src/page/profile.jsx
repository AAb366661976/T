import React from "react";
import { Outlet } from "react-router-dom";
import Footer from "./Footer"; 

const Profile = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-['Montserrat'] antialiased">
      <main className="flex-grow pb-32"> 
        <Outlet />
      </main>

      {/* 渲染底部導航 */}
      <Footer />
    </div>
  );
};

export default Profile;
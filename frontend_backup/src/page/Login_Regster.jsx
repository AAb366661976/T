import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Input = ({ type, placeholder, required, name, id, autoComplete }) => (
  <input
    type={type}
    name={name}
    id={id || name}
    autoComplete={autoComplete}
    placeholder={placeholder}
    required={required}
    className="bg-[#eee] border-none p-4 my-2 w-full outline-none focus:ring-2 focus:ring-[#FF4B2B]/50 transition-all rounded-lg text-base"
  />
);

const LoginRegister = () => {
  const [isSignUpActive, setIsSignUpActive] = useState(false);
  // 新增Toast狀態控管
  const [toast, setToast] = useState({ show: false, message: "" });

  const navigate = useNavigate();
  // 處理註冊提交邏輯
  const handleSignUp = (e) => {
    e.preventDefault(); //預防頁面重整
    //連接API，顯示註冊成功訊息
    setToast({ show: true, message: "註冊成功!" });

    //3秒後隱藏訊息
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3000);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();

    // 1. 進行登入驗證 
    console.log("正在驗證登入資訊...");

    // 導向剛才在 App.jsx 設定好的 path
    navigate("/selectcourse");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[url('/login.jpg')] bg-cover bg-center bg-no-repeat font-['Montserrat'] p-4 relative">
      {/* 新增Toast UI訊息框 */}
      <div
        className={`fixed top-10 left-1/2 -translate-x-1/2 z-[200] transition-all duration-500 ease-out transform
          ${
            toast.show
              ? "translate-y-0 opacity-100"
              : "-translate-y-12 opacity-0 pointer-events-none"
          }`}
      >
        <div className="bg-white border-l-4 border-green-500 shadow-2xl px-6 py-4 rounded-lg flex items-center gap-3">
          <div className="bg-green-100 p-2 rounded-full">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span className="text-gray-800 font-bold">{toast.message}</span>
        </div>
      </div>

      <div className="relative overflow-hidden bg-white rounded-2xl shadow-2xl w-full max-w-[400px] md:max-w-[768px] min-h-[600px] md:min-h-[480px]">
        {/* --- 註冊表單 --- */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-full md:w-1/2 
          ${
            isSignUpActive
              ? "translate-x-0 md:translate-x-full opacity-100 z-[5] animate-show"
              : "opacity-0 z-[1]"
          }`}
        >
          <form
            className="flex flex-col items-center justify-center h-full px-8 md:px-12 bg-white text-center"
            onSubmit={handleSignUp}
          >
            <h1 className="font-bold text-2xl m-0 text-gray-800">創建帳號</h1>
            <Input
              type="text"
              name="username"
              placeholder="帳號"
              autoComplete="username"
              required
            />
            <Input
              type="email"
              name="emailname"
              placeholder="Email"
              autoComplete="email"
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="password"
              required
            />
            <button
              type="submit"
              className="mt-4 rounded-full border border-[#FF4B2B] bg-[#FF4B2B] text-white text-sm font-bold py-3 px-11 uppercase tracking-wider transition-transform active:scale-95"
            >
              註冊
            </button>
        
            <p className="mt-6 text-sm text-gray-600 md:hidden">
              已有帳號？
              <span
                className="text-[#FF4B2B] font-bold"
                onClick={() => setIsSignUpActive(false)}
              >
                點此登入
              </span>
            </p>
          </form>
        </div>

        {/* --- 登入表單 --- */}
        <div
          className={`absolute top-0 h-full transition-all duration-700 ease-in-out left-0 w-full md:w-1/2 z-[2]
          ${
            isSignUpActive
              ? "translate-x-full opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <form
            className="flex flex-col items-center justify-center h-full px-8 md:px-12 bg-white text-center"
            onSubmit={handleLoginSubmit} //登入提交事件
          >
            <h1 className="font-bold text-2xl m-0 text-gray-800">登入</h1>
            <Input
              type="text"
              name="username"
              placeholder="帳號"
              autoComplete="username"
              required
            />
            <Input
              type="email"
              name="email"
              placeholder="Email"
              autoComplete="email"
              required
            />
            <Input
              type="password"
              name="password"
              placeholder="Password"
              autoComplete="current-password"
              required
            />
            <a href="#" className="text-sm text-gray-600 my-4 no-underline">
              忘記密碼？
            </a>
            <button
              type="submit"
              className="rounded-full border border-[#FF4B2B] bg-[#FF4B2B] text-white text-sm font-bold py-3 px-11 uppercase tracking-wider transition-transform active:scale-95"
            >
              登入
            </button>
            <p className="mt-6 text-sm text-gray-600 md:hidden">
              還沒有帳號？{" "}
              <span
                className="text-[#FF4B2B] font-bold"
                onClick={() => setIsSignUpActive(true)}
              >
                點此註冊
              </span>
            </p>
          </form>
        </div>

        
         <div
          className={`hidden md:block absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-[100]
          ${isSignUpActive ? "-translate-x-full" : ""}`}
        >
          <div
            className={`relative -left-full h-full w-[200%] text-white transform transition-transform duration-700 ease-in-out bg-gradient-to-r from-[#FF4B2B] to-[#FF416C]
            ${isSignUpActive ? "translate-x-1/2" : "translate-x-0"}`}
          >
            <div className="flex h-full w-full">
              <div
                className={`absolute flex flex-col items-center justify-center px-10 text-center top-0 h-full w-1/2 transition-transform duration-700 ease-in-out
                ${isSignUpActive ? "translate-x-0" : "-translate-x-[20%]"}`}
              >
                <h1 className="font-bold text-2xl">Welcome Back!</h1>
                <p className="text-sm font-light my-8">
                  
                </p>
                <button
                  onClick={() => setIsSignUpActive(false)}
                  className="rounded-full border border-white bg-transparent text-white text-xs font-bold py-3 px-11 uppercase tracking-wider hover:bg-white hover:text-[#FF4B2B] transition-all"
                >
                  登入
                </button>
              </div>

              <div
                className={`absolute right-0 flex flex-col items-center justify-center px-10 text-center top-0 h-full w-1/2 transition-transform duration-700 ease-in-out
                ${isSignUpActive ? "translate-x-[20%]" : "translate-x-0"}`}
              >
                <button
                  onClick={() => setIsSignUpActive(true)}
                  className="rounded-full border border-white bg-transparent text-white text-xs font-bold py-3 px-11 uppercase tracking-wider hover:bg-white hover:text-[#FF4B2B] transition-all"
                >
                  註冊
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div> 
  ); 
};

export default LoginRegister;

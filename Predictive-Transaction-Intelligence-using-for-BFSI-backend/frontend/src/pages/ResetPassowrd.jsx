import React, { useState } from "react";
import caution from "../assets/Caution.png";
import { useNavigate } from "react-router-dom";

const ForgotPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex w-full max-w-5xl  rounded-lg overflow-hidden">
        
        {/* Left Image Section */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-10 ml-10">
          <img src={caution} alt="Login" className="max-w-full h-auto" />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-1/2 p-10 border-4 rounded-lg mr-10">
          <h2 className="text-3xl font-bold text-center mb-16">Reset Password</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2a90] border-2 mb-10"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={password}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2a90] border-2 mb-10"
            />

            <button
              type="submit"
              className="w-full hover:bg-[#6043D2] text-white text-lg font-semibold py-3 rounded-md bg-[#281b5d] transition duration-300 shadow-2xl " onClick={()=>navigate('/login')}
            >
              Continue to Login
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordPage;

import React, { useState } from "react";
import login from "../assets/Login.png";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("All fields are required");
      return;
    }
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex w-full max-w-5xl  rounded-lg overflow-hidden">
        
        {/* Left Image Section */}
        <div className="hidden md:flex w-1/2 items-center justify-center p-10 ml-10">
          <img src={login} alt="Login" className="max-w-full h-auto animate-float" />
        </div>

        {/* Right Form Section */}
        <div className="w-full md:w-1/2 p-10 border-4 rounded-lg mr-10">
          <h2 className="text-3xl font-bold text-center mb-16">Login</h2>

          {error && (
            <p className="text-red-500 text-sm text-center mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2a90] border-2"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3e2a90] border-2"
            />

            <p className="font-light mb-2"> Don't have an account? <span className="font-semibold text-[#3e2a90] cursor-pointer" onClick={()=> navigate('/register')}>Register</span></p>

            <p className="font-semibold cursor-pointer" onClick={()=> navigate('/forgot')}>Forget Password?</p>
            <button
              type="submit"
              className="w-full hover:bg-[#6043D2] text-white text-lg font-semibold py-3 rounded-md bg-[#281b5d] transition duration-300 shadow-2xl " onClick={()=> navigate('/dashboard')}
            >
              Login
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

import React from "react";
import { HashLink } from 'react-router-hash-link'
import { SunIcon, MoonIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";


const Navbar = ({ darkMode, setDarkMode }) => {
  const navigate = useNavigate();

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 flex items-center px-6 py-3.5 border-b border-white/10
        ${
          darkMode? "bg-[linear-gradient(#2C0F4B,#704E95,#2C0F4B)] text-white"
            : "bg-[linear-gradient(#C792FF,#FDFBFF,#C792FF)] text-black"
             
        }`}
    >
      {/* Left */}
      <h1 className="font-bold text-2xl">ClarifAI</h1>

      {/* Center */}
      <div className="hidden md:flex flex-1 justify-center gap-8 font-bold text-lg">
        <HashLink smooth to="/#home">Home</HashLink>
        <HashLink smooth to="/#about">About</HashLink>
        <HashLink smooth to="/#features">Features</HashLink>
        <HashLink smooth to="/#services">Services</HashLink>
        <HashLink smooth to="/#contact">Contact</HashLink>
      </div>

      {/* Right */}
      <div className="hidden md:flex items-center justify-end gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-full hover:scale-105 cursor-pointer transition ${
            darkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-black"
          }`}
        >
          {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        {/* Login */}
        <button onClick={() => navigate("/login")}
          className={`px-6 py-2.5 rounded-full font-bold text-lg shadow-lg transition-all duration-300 ${
            darkMode ? "bg-white text-black hover:bg-slate-200" : "bg-white text-black hover:bg-slate-200"
          }`}
        >
          Login
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

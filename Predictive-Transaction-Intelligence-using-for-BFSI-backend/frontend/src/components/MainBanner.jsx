import { useEffect, useState } from "react";
import hero from '../assets/hero.png';

export default function MainBanner() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Load Google Font
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    document.body.style.fontFamily = "'Poppins', sans-serif";
  }, []);

  return (
    <div className="relative overflow-hidden ">
      {/* Background SVG */}
      <svg
        className="size-full absolute -z-10 inset-0"
        viewBox="0 0 1440 720"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path stroke="#1D293D" strokeOpacity=".7" d="M-15.227 702.342H1439.7" />
        <circle cx="711.819" cy="372.562" r="308.334" stroke="#1D293D" strokeOpacity=".7" />
        <circle cx="16.942" cy="20.834" r="308.334" stroke="#1D293D" strokeOpacity=".7" />
        <path
          stroke="#1D293D"
          strokeOpacity=".7"
          d="M-15.227 573.66H1439.7M-15.227 164.029H1439.7"
        />
        <circle cx="782.595" cy="411.166" r="308.334" stroke="#1D293D" strokeOpacity=".7" />
      </svg>


      {/* MOBILE MENU */}
      <div
        className={`fixed inset-0 z-100 bg-black/40 backdrop-blur flex flex-col items-center justify-center text-lg gap-8 md:hidden transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {["Home", "Products", "Stories", "Pricing"].map((item) => (
          <a key={item} href={`/${item.toLowerCase()}`}>
            {item}
          </a>
        ))}

        <button
          onClick={() => setMenuOpen(false)}
          className="size-10 flex items-center justify-center bg-white text-black rounded-md hover:bg-slate-200 transition"
        >
          ✕
        </button>
      </div>

      {/* HERO SECTION */}
      <section id="home" className="pb-20 mt-40 px-4 text-center">

        <h1 className="text-center whitespace-nowrap text-3xl md:text-4xl font-medium text-current">
          AI-Powered Transaction Intelligence for BFSI
        </h1>

        <p className="text-md text-current mt-4">
          Predict, monitor, and secure financial transactions in real time with intelligent insights and fraud detection.
        </p>
        <img
          src={hero}
          alt="hero"
          className="block mx-auto mt-8 max-w-xs sm:max-w-sm lg:max-w-md animate-float drop-shadow-[0_0_60px_rgba(180,120,255,0.35)] "
        />

        <div className="flex items-center gap-4 mt-4 text-lg justify-center">
          <button className="bg-linear-to-r from-purple-400 to-pink-500 text-current rounded-md px-10 h-14 active:scale-95 cursor-pointer font-bold mt-6 shadow-lg hover:shadow-[0_0_20px_white]
                   transition-all duration-300 border-3 border-[#2e1f6b]">
            Get started
          </button>
        </div>
      </section>
    </div>
  );
}

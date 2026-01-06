import React from 'react'
import about from '../assets/Visual-data.png'
import { ShieldCheck, Brain, Activity, Lock, Sparkles } from 'lucide-react'

const About = () => {
  return (
    <div className="relative overflow-hidden">
      <section
        id="about"
        className="flex flex-col-reverse md:flex-row gap-16 pb-20 items-center justify-between mt-20 px-4 md:px-16 lg:px-24 xl:px-32"
      >
        {/* Left Content */}
        <div className="flex flex-col items-center md:items-start max-w-xl">

          <h2 className="text-3xl md:text-2xl font-extrabold mb-4 bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            About the System
          </h2>

          <p className="text-gray-400 text-center md:text-left mb-8">
            Intelligent transaction analysis and fraud detection powered by AI
            and Large Language Models for secure BFSI operations.
          </p>

          <div className="grid gap-4 w-full">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <ShieldCheck className="text-purple-400" />
              <span className="font-semibold">AI-Driven BFSI Security</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <Brain className="text-pink-400" />
              <span className="font-semibold">Smart Transaction Intelligence</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <Activity className="text-blue-400" />
              <span className="font-semibold">LLM-Based Behavior Analysis</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <Sparkles className="text-green-400" />
              <span className="font-semibold">Real-Time Fraud Prediction</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <Lock className="text-yellow-400" />
              <span className="font-semibold">Secure & Seamless Banking</span>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <img
          src={about}
          alt="about"
          className="max-w-xs sm:max-w-sm lg:max-w-md animate-float drop-shadow-[0_0_60px_rgba(180,120,255,0.35)]"
        />
      </section>
    </div>
  )
}

export default About

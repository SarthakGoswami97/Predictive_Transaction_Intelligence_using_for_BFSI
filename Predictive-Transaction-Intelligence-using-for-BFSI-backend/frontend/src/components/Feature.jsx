import React from 'react'
import chatbot from '../assets/chatbot.png'
import {
  Activity,
  ShieldAlert,
  Scan,
  Brain,
  BellRing,
} from 'lucide-react'

const Feature = () => {
  return (
    <div className="relative overflow-hidden">
      <section
        id="features"
        className="flex flex-col max-md:gap-20 md:flex-row pb-20 items-center justify-between mt-20 px-4 md:px-16 lg:px-24 xl:px-32"
      >
        {/* Image */}
        <img
          src={chatbot}
          alt="features"
          className="max-w-xs sm:max-w-sm lg:max-w-md animate-float drop-shadow-[0_0_60px_rgba(180,120,255,0.35)]"
        />

        {/* Content */}
        <div className="flex flex-col items-center md:items-start md:ml-10 max-w-xl">

          <h2 className="text-3xl md:text-2xl font-extrabold mb-4 bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            Key Features
          </h2>

          <p className="text-gray-400 text-center md:text-left mb-8">
            Advanced AI capabilities designed to predict, monitor, and protect
            financial transactions in real time.
          </p>

          <div className="grid gap-4 w-full">

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <Activity className="text-purple-400" />
              <span className="font-semibold">Transaction Prediction</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <Scan className="text-blue-400" />
              <span className="font-semibold">Real-Time Risk Scoring</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <ShieldAlert className="text-red-400" />
              <span className="font-semibold">
                Fraud Detection & Anomaly Identification
              </span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <Brain className="text-green-400" />
              <span className="font-semibold">Behavioral Insights</span>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
              <BellRing className="text-yellow-400" />
              <span className="font-semibold">Instant Alerts</span>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}

export default Feature

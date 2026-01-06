import React from 'react'
import analytics from '../assets/analytics.png'
import { ShieldCheck, Activity, Users, AlertCircle, Lock } from 'lucide-react'

const Services = () => {
    return (
        <div className="relative overflow-hidden">
            <section
                id="services"
                className="flex flex-col-reverse md:flex-row gap-16 pb-20 items-center justify-between mt-20 px-4 md:px-16 lg:px-24 xl:px-32"
            >

                {/* Content */}
                <div className="flex flex-col items-center md:items-start max-w-xl md:ml-10">

                    <h2 className="text-3xl md:text-2xl font-extrabold mb-4 bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                        Use Cases
                    </h2>

                    <p className="text-gray-400 text-center md:text-left mb-8">
                        Real-world applications of our AI-powered transaction intelligence for BFSI institutions.
                    </p>

                    <div className="grid gap-4 w-full">

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
                            <ShieldCheck className="text-purple-400" />
                            <span className="font-semibold">Fraud Prevention in Banking</span>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
                            <Activity className="text-blue-400" />
                            <span className="font-semibold">Real-Time Transaction Monitoring</span>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
                            <Users className="text-green-400" />
                            <span className="font-semibold">Customer Behavior Risk Analysis</span>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
                            <AlertCircle className="text-red-400" />
                            <span className="font-semibold">High-Risk Transaction Identification</span>
                        </div>

                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:scale-[1.02] transition">
                            <Lock className="text-yellow-400" />
                            <span className="font-semibold">Secure Digital Payments</span>
                        </div>

                    </div>
                </div>

                {/* Image */}
                <img
                    src={analytics}
                    alt="analytics"
                    className="max-w-xs sm:max-w-sm lg:max-w-md animate-float drop-shadow-[0_0_60px_rgba(180,120,255,0.35)]"
                />

            </section>
        </div>
    )
}

export default Services

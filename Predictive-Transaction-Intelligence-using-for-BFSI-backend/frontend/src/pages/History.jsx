import React from 'react'
import SideBar from '../components/SideBar'
import dataSecurity from "../assets/Data-security.png"

const History = () => {
  return (
    <div className="flex min-h-screen">
      <SideBar />

      {/* Main Content */}
      <div className="flex-1 p-6 ml-20 mt-25 mr-15">

        {/* Header */}
        <h1 className="text-2xl font-bold mb-6">History</h1>

        {/* Content Card */}
        <div className="bg-white p-10 rounded-xl shadow flex flex-col items-center justify-center text-center">
          <img 
            src={dataSecurity} 
            alt="No history data" 
            className="w-60 mb-6"
          />

          <h2 className=" text-black text-xl font-semibold mb-2">
            No data to show
          </h2>

          <p className="text-gray-500">
            Transaction history will appear here once data is available.
          </p>
        </div>

      </div>
    </div>
  )
}

export default History

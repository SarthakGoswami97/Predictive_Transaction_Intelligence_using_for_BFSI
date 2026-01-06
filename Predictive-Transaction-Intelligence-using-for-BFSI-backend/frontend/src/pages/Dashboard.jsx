import React from 'react'
import SideBar from '../components/SideBar'

// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js'

// Register chart elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend
)

import { Bar, Line, Pie } from 'react-chartjs-2'



const Dashboard = () => {

  // Dummy data (replace later with backend response)
  // 🔹 Fraud vs Non-Fraud (Bar)
  const fraudData = {
    labels: ['Non-Fraud', 'Fraud'],
    datasets: [
      {
        label: 'Transactions',
        data: [4880, 120],
        backgroundColor: ['#22C55E', '#EF4444'],
        borderRadius: 6,
      },
    ],
  }

  // 🔹 Transactions by Hour (Line)
  const hourlyData = {
    labels: [
      '0–2', '2–4', '4–6', '6–8', '8–10', '10–12',
      '12–14', '14–16', '16–18', '18–20', '20–22', '22–24',
    ],
    datasets: [
      {
        label: 'Transactions',
        data: [50, 40, 30, 80, 200, 350, 420, 390, 360, 300, 220, 120],
        borderColor: '#6366F1',
        backgroundColor: '#6366F1',
        tension: 0.4,
        fill: false,
      },
    ],
  }

  // 🔹 Transactions by City (Pie)
  const cityData = {
    labels: ['Delhi', 'Mumbai', 'Bangalore', 'Kolkata', 'Chennai'],
    datasets: [
      {
        data: [1400, 1200, 1000, 800, 600],
        backgroundColor: [
          '#6366F1',
          '#22C55E',
          '#F59E0B',
          '#EF4444',
          '#0EA5E9',
        ],
      },
    ],
  }

  // 🔹 Transactions by Channel (Bar)
  const channelData = {
    labels: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking'],
    datasets: [
      {
        label: 'Transactions',
        data: [1800, 1200, 900, 600],
        backgroundColor: '#8B5CF6',
        borderRadius: 6,
      },
    ],
  }


  return (
    <div className="flex min-h-screen">
      <SideBar />

      <div className="flex-1 p-6 ml-20 mt-25 mr-15">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Total Transactions', value: '5000' },
            { title: 'Fraud Cases', value: '120' },
            { title: 'Fraud Rate', value: '2.4%' },
            { title: 'Top Active Customer', value: 'CUST-1021' },
          ].map((card, index) => (
            <div
              key={index}
              className="bg-linear-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl hover:shadow-[0_0_20px_white]"
            >
              <p className="text-sm text-blue-800 font-bold">{card.title}</p>
              <h3 className="text-3xl font-bold mt-2">{card.value}</h3>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

          {/* Fraud vs Non-Fraud */}
          <div className="bg-white p-6 rounded-xl shadow text-black">
            <h2 className="text-lg font-semibold mb-4">
              Fraud vs Non-Fraud Transactions
            </h2>
            <Bar data={fraudData} />
          </div>

          {/* Transactions by Hour */}
          <div className="bg-white p-6 rounded-xl shadow text-black">
            <h2 className="text-lg font-semibold mb-4">
              Transactions by Hour
            </h2>
            <Line data={hourlyData} />
          </div>

          {/* Transactions by City */}
          <div className="bg-white p-6 rounded-xl shadow text-black">
            <h2 className="text-lg font-semibold mb-4">
              Transactions by City
            </h2>
            <Pie data={cityData} />
          </div>

          {/* Transactions by Channel */}
          <div className="bg-white p-6 rounded-xl shadow text-black">
            <h2 className="text-lg font-semibold mb-4">
              Transactions by Channel
            </h2>
            <Bar data={channelData} />
          </div>

        </div>

      </div>
    </div>
  )
}

export default Dashboard

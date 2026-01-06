import React from 'react'
import SideBar from '../components/SideBar'

const Metrics = () => {
  return (
    <div className='flex min-h-screen'>
      <SideBar />
      <div className='flex-1 p-6 ml-10 mt-30 grid md:grid-cols-2'>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 ">
          <div className="bg-white p-6 rounded-xl shadow h-300px">
            {/* Chart 1 */}
            <h2 className='text-black'>Accuracy</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow h-300px">
            {/* Chart 2 */}
            <h2 className='text-black'>Prediction</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow h-300px">
            {/* Chart 1 */}
            <h2 className='text-black'>Recall</h2>
          </div>
          <div className="bg-white p-6 rounded-xl shadow h-300px">
            {/* Chart 2 */}
            <h2 className='text-black'>Auc</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Metrics
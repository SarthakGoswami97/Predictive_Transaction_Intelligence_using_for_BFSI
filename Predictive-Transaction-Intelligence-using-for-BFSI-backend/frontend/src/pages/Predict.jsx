import React, {useState} from 'react'
import SideBar from '../components/SideBar'


const Predict = () => {

  const [cid, setCid] = useState("");
  const [kycVer, setKycVer] = useState("");
  const [accAge, setAccAge] = useState("");
  const [transactionAmt, setTransactionAmt] = useState("");
  const [channel, setChannel] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!cid || !kycVer || !accAge || !transactionAmt || !channel || !date) {
      setError("All fields are required");
      return;
    }
    setError("");
  };
  return (
    <div className="flex min-h-screen">
      <SideBar />

      {/* Main Content */}
      <div className="flex-1 p-8 ml-30 mr-30">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Form Section */}
          <div className="p-8 rounded-4xl border-4 shadow mt-20">
            <h2 className="text-lg font-semibold mb-6">Fill Details</h2>

            {/* Manual Input Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Customer ID"
                value={cid}
                onChange={(e)=>setCid(e.target.value)}
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:shadow-[0_0_20px_white]"
              />

              <input
                type="text"
                placeholder="KYC Verified"
                value={kycVer}
                onChange={(e)=>setKycVer(e.target.value)}
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:shadow-[0_0_20px_white]"
              />

              <input
                type="text"
                placeholder="Account Age"
                value={accAge}
                onChange={(e)=>setAccAge(e.target.value)}
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:shadow-[0_0_20px_white]"
              />

              <input
                type="text"
                placeholder="Transaction Amount"
                value={transactionAmt}
                onChange={(e)=>setTransactionAmt(e.target.value)}
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:shadow-[0_0_20px_white]"
              />

              <input
                type="text"
                placeholder="Channel"
                value={channel}
                onChange={(e)=>setChannel(e.target.value)}
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:shadow-[0_0_20px_white]"
              />

              <input
                type="date"
                value={date}
                onChange={(e)=>setDate(e.target.value)}
                className="w-full px-4 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:shadow-[0_0_20px_white]"
              />
            </form>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="grow h-px bg-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">OR</span>
              <div className="grow h-px bg-gray-300"></div>
            </div>

            {/* CSV Upload Section */}
            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              <h3 className="font-medium mb-2">Upload CSV File</h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a CSV file to predict transactions in bulk
              </p>

              <input
                type="file"
                accept=".csv"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Result Section */}
          <div className="p-8 rounded-4xl border-4 shadow lg:mt-20">
            <h2 className="text-lg font-semibold mb-4">Result</h2>

            <div className="bg-white rounded-xl border p-4 max-h-80 overflow-auto">
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-500 wrap-break-words">Prediction will appear here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Predict Button */}
        <div className="py-4 text-xl bg-violet-800 mt-10 font-bold rounded-full w-40 text-center cursor-pointer text-white mx-auto"  >
          Predict
        </div>

      </div>
    </div>
  )
}

export default Predict

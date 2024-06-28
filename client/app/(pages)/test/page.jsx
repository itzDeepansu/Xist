import React from 'react'
import { CircleLoader } from "react-spinners";

const page = () => {
  return (
    <div className="bg-black flex justify-center items-center h-[100vh] w-[100vw]">
        <CircleLoader color="#ffffff" loading={true} size={400} />
      </div>
  )
}

export default page

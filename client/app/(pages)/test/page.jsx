import React from 'react'

const Test = () => {
  return (
    <div className='h-[100dvh] w-[100vw] bg-red-700'>
      Parent
      <div className='h-[90vh] w-[100vw] bg-green-400'></div>Child
    </div>
  )
}

export default Test

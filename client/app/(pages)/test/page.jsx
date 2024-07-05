"use client"
import React from 'react'
import { useSession } from 'next-auth/react'
const Test = () => {
  const { data: session } = useSession();
  console.log(session);
  return (
    <div className='h-[100dvh] w-[100vw] bg-red-700'>
      Parent
      <div className='h-[90vh] w-[100vw] bg-green-400'></div>Child
    </div>
  )
}

export default Test

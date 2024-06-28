import React from 'react'

const ChatCard = ({imgurl , name }) => {
  return (
    <div className='w-full  h-20 flex flex-row items-center relative gap-5'>
        <img src={imgurl} className='rounded-full h-14 w-14 object-cover bg-center'/>
        <div>{name}</div>
    </div>
  )
}

export default ChatCard

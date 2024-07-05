import React from "react";

const ChatCard = ({ imgurl, name, onlineStatus }) => {
  return (
    <div className="w-full  h-20 flex flex-row items-center relative gap-5">
      <div className="rounded-full h-14 w-14 object-cover bg-center relative">
        <div
          className={
            onlineStatus
              ? "bg-green-500 w-4 h-4 rounded-full absolute right-[1px] top-[1px]"
              : "bg-red-500 w-4 h-4 rounded-full absolute right-[1px] top-[1px]"
          }
        ></div>
        <img src={imgurl} className="rounded-full h-14 w-14"/>
      </div>
      <div className="hidden lg:block">{name}</div>
    </div>
  );
};

export default ChatCard;

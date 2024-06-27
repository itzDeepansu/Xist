"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import ChatCard from "@/components/ChatCard";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import axios from "@/features/axios";
import { io } from "socket.io-client";
import { nanoid } from "nanoid";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import MageDots from "@/components/ui/MageDots";
import Sent from "@/components/ui/Sent";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const socket = useMemo(() => io(`${process.env.BACKEND_URL}`), []);
  const [profile, setProfile] = useState(null);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [searchList, setSearchList] = useState([]);
  let oldDate = new Date();

  const { data: session } = useSession();

  useEffect(() => {
    async function getUserData() {
      console.log(session?.user);
      setProfile(session?.user);
      const getUsers = await axios.get("user/getusers");
      setChats(getUsers.data.users);
      setSearchList(getUsers.data.users);
      console.log(`${process.env.BACKEND_URL}`);
    }
    getUserData();
    socket.on("connect", () => {
      socket.emit("sendSocketID", {
        phoneNumber: localStorage.getItem("user"),
        socketID: socket.id,
      });
      console.log(socket.id);
    });

    return () => {
      socket.disconnect();
      console.log("called disconnect");
    };
  }, []);
  useEffect(() => {
    socket.on("recieveMessage", (data) => {
      if (activeChat?.id === data.senderId) {
        setMessageList((prev) => [data, ...prev]);
      }
    });
    socket.on("deleteReceiveMessage", (data) => {
      setMessageList((prev) => prev.filter((item) => item.id !== data.id));
    });
  }, [activeChat]);

  function updateDate(dateString) {
    oldDate = convertToIST(dateString).date;
  }
  function convertToIST(isoString) {
    // Parse the ISO string to a Date object
    const dateObj = new Date(isoString);

    // Convert to IST (UTC+5:30)
    const offsetIST = 5.5 * 60; // IST offset in minutes
    const istDateObj = new Date(dateObj.getTime() + offsetIST * 60 * 1000);

    // Extract date
    const date = istDateObj.toISOString().split("T")[0];

    // Extract time and convert to 12-hour format
    let hours = istDateObj.getHours();
    const minutes = istDateObj.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'

    // Format time with leading zeros
    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;

    return { date, time: formattedTime };
  }
  const handleSendMessage = async () => {
    const msg = await axios.post("message/send", {
      messageContent: message,
      senderId: profile?.id,
      recieverId: activeChat?.id,
    });
    socket.emit("sendMessage", {
      id: msg.data.message.id,
      sender: profile?.socketID,
      receiver: activeChat?.socketID,
      senderId: profile?.id,
      recieverId: activeChat?.id,
      messageContent: message,
    });
    setMessageList((prev) => [
      {
        ...msg.data.message,
        receiver: activeChat?.socketID,
      },
      ...prev,
    ]);
    setMessage(" ");
  };
  const triggerMessageDelete = (message) => {
    console.log(message);
    setMessageList((prev) => prev.filter((item) => item.id !== message.id));
    axios.post("message/delete", { id: message.id });
    socket.emit("deleteMessage", {
      id: message.id,
      receiver: activeChat?.socketID,
    });
  };
  const handleActiveChatSet = async (user) => {
    const data = await axios.post("user/getuser", {
      phoneNumber: user.phoneNumber,
    });
    setActiveChat(data.data.user);
    const oldMessages = await axios.post("message/getmessages", {
      senderId: profile?.id,
      recieverId: data.data.user.id,
    });
    setMessageList(oldMessages.data.messages.reverse());
  };
  const handleInputChange = (e) => {
    setSearchList(
      chats?.filter((user) =>
        user.name.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  return (
    <main className="flex flex-col bg-[#171717] text-[#FAFAFA]">
      <div className="h-[10vh] flex flex-row">
        <div className="w-1/5 flex flex-row items-center gap-5 border-[#27272A] border-b border-r px-3">
          <img src={profile?.image} className="rounded-full h-14 w-14 object-cover bg-center" />
          {profile?.name}
        </div>
        <div className="w-4/5 border-[#27272A] border-b px-2">
          <div className="w-full h-[10vh] flex flex-row items-center relative gap-5 transition-all">
            <img src={activeChat?.image} className="h-16 w-16 rounded-full" />
            <div>{activeChat?.name}</div>
            <div
              className={
                activeChat?.onlineStatus === true
                  ? "bg-green-400 h-3 w-3 rounded-full"
                  : "bg-red-500 h-3 w-3 rounded-full"
              }
            ></div>
            <Button
              className="absolute right-4 bg-[#27272A]"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col h-[90vh] w-1/5 px-2 border-[#27272A] border-r">
          <Input
            onChange={(e) => handleInputChange(e)}
            placeholder="Search"
            className="border-[#27272A] border h-12 rounded-[3px] my-2"
          />
          <ScrollArea className=" p-1 gap-3">
            {searchList?.map(
              (user) =>
                user.id !== profile?.id && (
                  <div
                    onClick={() => handleActiveChatSet(user)}
                    key={user.id}
                    className="hover:bg-[#27272A] px-1 rounded-[5px]"
                  >
                    <ChatCard imgurl={user.image} name={user.name} />
                  </div>
                )
            )}
          </ScrollArea>
        </div>
        <div className=" w-4/5 h-[90vh] flex flex-col relative">
          <div className="w-full h-[80vh] flex flex-col-reverse overflow-y-auto relative gap-2 px-4 pt-2">
            {messageList?.map((message) => (
              <div
                key={nanoid()}
                className={
                  message.senderId === profile?.id
                    ? "ml-auto px-4 py-2 flex gap-2 bg-[#292727] rounded-[6px]"
                    : "mr-auto px-4 py-2 flex gap-2 bg-[#292727] rounded-[6px]"
                }
              >
                {convertToIST(message.timeSent).date != oldDate && (
                  <div className="text-xs absolute left-[48%]">
                    {convertToIST(message.timeSent).date}
                    {updateDate(message.timeSent)}
                  </div>
                )}
                {message.messageContent}
                <div className="text-[0.625rem] mt-auto">
                  {convertToIST(message.timeSent).time}
                </div>
                {message.senderId == profile?.id && (
                  <Popover>
                    <PopoverTrigger>
                      <MageDots icon="mage:dots" width="20" height="20" />
                    </PopoverTrigger>
                    <PopoverContent className="flex flex-col gap-1 bg-[#27272A] rounded-[4px] text-white">
                      <Button variant="outline" className="hover:bg-black">Edit</Button>
                      <Button
                        variant="outline"
                        onClick={() => triggerMessageDelete(message)}
                        className="hover:bg-black"
                      >
                        Delete
                      </Button>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            ))}
          </div>
          <div className="flex w-full items-center space-x-2 absolute bottom-0 p-5">
            <Input
              type="text"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded-[3px] border-[#27272A] border text-[#afafb5]"
            />
            <Button
              type="submit"
              variant="outline"
              onClick={handleSendMessage}
              className="rounded-[3px] border-[#27272A] border text-black bg-[#FAFAFA]"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";
import { useEffect, useState, useMemo } from "react";
import ChatCard from "@/components/ChatCard";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import axios from "@/features/axios";
import { io } from "socket.io-client";
import { nanoid } from "nanoid";

import { useRouter } from "next/navigation";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import MageDots from "@/components/ui/MageDots";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const router = useRouter();
  const socket = useMemo(() => io(`${process.env.BACKEND_URL}`), []);
  console.log(`${process.env.BACKEND_URL}`);

  const [profile, setProfile] = useState(null);

  const [chats, setChats] = useState([]);
  const [searchList, setSearchList] = useState([]);

  const [activeChat, setActiveChat] = useState(null);

  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [messageSending , setMessageSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  let oldDate = "";

  const { data: session } = useSession();

  useEffect(() => {
    async function getUserData() {
      console.log(session?.user);
      setProfile(session?.user);
      const getUsers = await axios.get("user/getusers");
      setChats(getUsers.data.users);
      setSearchList(getUsers.data.users);
    }
    getUserData();
    if (!session?.user) {
      router.push("/login");
    }
    socket.on("connect", async () => {
      try {
        await axios.post("user/setsocketid", {
          phoneNumber: session?.user.phoneNumber,
          socketID: socket.id,
        });
      } catch (err) {
        console.log("error setting socket id");
      }
      socket.emit("sendSocketID", {
        phoneNumber: session?.user.phoneNumber,
        socketID: socket.id,
      });
      console.log(socket.id);
    });
    return async () => {
      socket.disconnect();
      console.log("called disconnect");
      // try {
      //   axios.post("user/setoffline", {
      //     phoneNumber: session?.user.phoneNumber,
      //   });
      // } catch (err) {
      //   console.log("error setting user offline");
      // }
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
    oldDate = getDate(dateString);
  }
  function getDate(dateString) {
    var date = new Date(dateString);
    var day = date.getDate().toString();
    var month = (date.getMonth() + 1).toString();
    var year = date.getFullYear().toString();
    const fullDate = day.concat("-", month).concat("-", year);
    return fullDate;
  }
  function getTime(dateString) {
    var date = new Date(dateString);
    var hours = date.getHours().toString();
    var minutes = date.getMinutes().toString();
    return hours.concat(":", minutes);
  }
  const handleSendMessage = async () => {
    setMessageSending(true);
    const msg = await axios.post("message/send", {
      messageContent: message,
      senderId: profile?.id,
      recieverId: activeChat?.id,
    });
    setMessage(" ");
    socket.emit("sendMessage", {
      id: msg.data.message.id,
      timeSent: msg.data.message.timeSent,
      sender: profile?.socketID,
      receiver: activeChat?.socketID,
      senderId: profile?.id,
      recieverId: activeChat?.id,
      messageContent: msg.data.message.messageContent,
    });
    setMessageList((prev) => [
      {
        ...msg.data.message,
        receiver: activeChat?.socketID,
      },
      ...prev,
    ]);
    setMessageSending(false);
  };
  const triggerMessageDelete = (message) => {
    setMessageList((prev) => prev.filter((item) => item.id !== message.id));
    axios.post("message/delete", { id: message.id });
    socket.emit("deleteMessage", {
      id: message.id,
      receiver: activeChat?.socketID,
    });
  };
  const handleActiveChatSet = async (user) => {
    setChatLoading(true);
    const data = await axios.post("user/getuser", {
      phoneNumber: user.phoneNumber,
    });
    setActiveChat(data.data.user);
    const oldMessages = await axios.post("message/getmessages", {
      senderId: profile?.id,
      recieverId: data.data.user.id,
    });
    setMessageList(oldMessages.data.messages.reverse());
    setTimeout(() => {
      setChatLoading(false);
    }, 1000);
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
          <img
            src={profile?.image}
            className="rounded-full h-14 w-14 object-cover bg-center"
          />
          <span className="hidden lg:block">{profile?.name}</span>
        </div>
        <div className="w-4/5 border-[#27272A] border-b px-2">
          <div className="w-full h-[10vh] flex flex-row items-center relative gap-5 transition-all">
            <img
              src={activeChat?.image}
              className={
                activeChat == null ? "hidden" : "h-16 w-16 rounded-full"
              }
            />
            <div>{activeChat?.name}</div>
            <div
              className={
                activeChat?.onlineStatus === true
                  ? "bg-green-400 h-3 w-3 rounded-full"
                  : "hidden"
              }
            ></div>
            <Button
              className="absolute right-4 bg-[#27272A]"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col h-[90dvh] w-1/5 px-2 border-[#27272A] border-r">
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
        <div className=" w-4/5 h-[90dvh] flex flex-col relative">
          <div className="w-full h-[80dvh] flex flex-col-reverse overflow-y-scroll relative gap-2 px-4 pt-2">
            {chatLoading ? (
              <div className="max-w-full animate-pulse">
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] ml-auto"></div>
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 my-4"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 my-4"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] ml-auto"></div>
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px] mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[330px] mb-2.5"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[300px] mb-2.5 ml-auto"></div>
                <div className="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              messageList?.map((message) => (
                <div
                  key={nanoid()}
                  className={
                    message.senderId === profile?.id
                      ? "ml-auto px-4 py-2 flex gap-2 bg-[#292727] rounded-[6px]"
                      : "mr-auto px-4 py-2 flex gap-2 bg-[#292727] rounded-[6px]"
                  }
                >
                  {getDate(message.timeSent) != oldDate && (
                    <div className="text-xs hidden lg:block absolute left-[48%]">
                      {getDate(message.timeSent)}
                      {updateDate(message.timeSent)}
                    </div>
                  )}
                  {message.messageContent}
                  <div className="text-[0.625rem] mt-auto">
                    {getTime(message.timeSent)}
                  </div>
                  {message.senderId == profile?.id && (
                    <Popover>
                      <PopoverTrigger>
                        <MageDots icon="mage:dots" width="20" height="20" />
                      </PopoverTrigger>
                      <PopoverContent className="flex flex-col gap-1 bg-[#27272A] rounded-[4px] text-white">
                        <Button variant="outline" disabled className="hover:bg-black">
                          Edit
                        </Button>
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
              ))
            )}
          </div>
          <div className={activeChat==null ? "hidden" : "flex w-full items-center space-x-2 absolute bottom-0 p-5" }>
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
              disabled={messageSending}
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

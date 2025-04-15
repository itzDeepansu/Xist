"use client";
import { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react";
import ChatCard from "@/components/ChatCard";
import VideoCall from "./(pages)/VideoCall/page";

// import { createClient } from "@supabase/supabase-js";
import { getSupabaseClient } from "./libs/supabaseClient";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Input as AntInput } from "antd";

import axios from "@/features/axios";
import { io } from "socket.io-client";

import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Upload } from "antd";

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
  console.log(process.env.BACKEND_URL);
  const scrollRef = useRef(null);

  const [profile, setProfile] = useState(null);

  const [chats, setChats] = useState([]);
  const [searchList, setSearchList] = useState([]);

  const [activeChat, setActiveChat] = useState(null);

  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [messageSending, setMessageSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState();
  const [finalImgUrl, setFinalImgUrl] = useState();
  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };
  const handleChange = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
    }
  };

  const handleUpload = async (options) => {
    const { onSuccess, onError, file } = options;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "non_secure_images_preset");
    try {
      let api = `https://api.cloudinary.com/v1_1/dcqjqvajd/image/upload`;
      const res = await axios.post(api, formData);
      const { secure_url } = res.data;
      setFinalImgUrl(secure_url);
      onSuccess(secure_url);
    } catch (err) {
      console.log(err);
      onError(err);
    }
  };
  const uploadButton = (
    <button style={{ border: 0, background: "none" }} className="h-10" type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div >Upload</div>
    </button>
  );

  let oldDate = "";

  let onlineMembers = new Array();

  const { data: session } = useSession();

  const [changes, setChanges] = useState({});

  const supabase = getSupabaseClient();
  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    // instant jump:
    // el.scrollTop = el.scrollHeight;
    // smooth scroll:
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };
  useLayoutEffect(() => {
    scrollToBottom();
  }, [messageList]);
  useEffect(() => {
    async function getUserData() {
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
      // try {
      //   await axios.post("user/setsocketid", {
      //     phoneNumber: session?.user.phoneNumber,
      //     socketID: socket.id,
      //   });
      // } catch (err) {
      //   console.log("error setting socket id");
      // }
      socket.emit("sendSocketID", {
        phoneNumber: session?.user.phoneNumber,
      });
    });
    const handleUserTableChanges = (payload) => {
      if (payload.errors && payload.errors.length > 0) {
        console.error("Error:", payload.errors);
      } else {
        setChanges(payload.new);
      }
    };

    supabase
      .channel("public:User")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "User" },
        handleUserTableChanges
      )
      .subscribe();
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
    console.log(changes);
    if (changes) {
      setChats(
        chats.map((chat) => {
          if (chat.id === changes.id) {
            return changes;
          } else {
            return chat;
          }
        })
      );
      setSearchList(
        searchList.map((chat) => {
          if (chat.id === changes.id) {
            return changes;
          } else {
            return chat;
          }
        })
      );
      if (activeChat) {
        if (activeChat.id === changes.id) {
          setActiveChat(changes);
          console.log(changes.socketID);
        }
      }
    }
  }, [changes]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      console.log("message recieved in as :", data);
      if (activeChat?.id === data.senderId) {
        setMessageList((prev) => [data, ...prev]);
      }
    });
    socket.on("deleteReceiveMessage", (data) => {
      setMessageList((prev) => prev.filter((item) => item.id !== data.id));
    });
    socket.on("activeUsers", (data) => {
      onlineMembers = data;
      onlineMembers.forEach((member) => {
        console.log(member);
      });
    });
  }, [activeChat?.id]);

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

  const handleSendMessage = async (e) => {
    if (e.keyCode === 13 || (e.type === "click" && message)) {
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
        sender: session?.user.phoneNumber,
        receiver: activeChat?.phoneNumber,
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
    }
    else if(e.type === "click" || e.keyCode === 13 && finalImgUrl){
      setMessageSending(true);
      const msg = await axios.post("message/send", {
        isImage : true,
        imageUrl : finalImgUrl,
        senderId: profile?.id,
        recieverId: activeChat?.id,
      });
      setMessage(" ");
      socket.emit("sendMessage", {
        id: msg.data.message.id,
        timeSent: msg.data.message.timeSent,
        sender: session?.user.phoneNumber,
        receiver: activeChat?.phoneNumber,
        senderId: profile?.id,
        recieverId: activeChat?.id,
        isImage : true,
        imageUrl: msg.data.message.imageUrl,
      });
      setMessageList((prev) => [
        {
          ...msg.data.message,
          receiver: activeChat?.socketID,
        },
        ...prev,
      ]);
      setMessageSending(false);
      setFinalImgUrl("");
      setImageUrl("");
    }
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
  //bg-27272a
  return (
    <main className="flex flex-col bg-[#171717] text-[#FAFAFA]">
      <div className="h-[10vh] flex flex-row">
        <div className="w-1/5 flex flex-row items-center gap-5 border-[#5d5d64] border-b border-r px-3">
          <img
            src={profile?.image}
            className="rounded-full h-14 w-14 object-cover bg-center"
          />
          <span className="hidden lg:block">{profile?.name}</span>
        </div>
        <div className="w-4/5 border-[#5d5d64] border-b px-2">
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
              className="absolute right-4 border-[#5d5d64] border h-8 rounded-[3px] hover:bg-white hover:text-black"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-row">
        <div className="flex flex-col h-[90dvh] w-1/5 px-2 border-[#5d5d64] border-r">
          <Input
            onChange={(e) => handleInputChange(e)}
            placeholder="Search"
            className="border-[#5d5d64] border h-12 rounded-[3px] my-2"
          />
          <ScrollArea className=" p-1 gap-3">
            {searchList?.map(
              (user) =>
                user.id !== profile?.id && (
                  <div
                    onClick={() => handleActiveChatSet(user)}
                    key={user.id}
                    className="hover:border-[#5d5d64] px-1 rounded-[5px]"
                  >
                    <ChatCard
                      imgurl={user.image}
                      name={user.name}
                      onlineStatus={user.onlineStatus}
                    />
                  </div>
                )
            )}
          </ScrollArea>
        </div>
        <div className=" w-4/5 h-[90dvh] flex flex-col relative bg-opacity-15">
          <div
            ref={scrollRef}
            className="w-full h-[80dvh] flex flex-col-reverse overflow-y-scroll relative gap-2 px-4 pt-2 overflow-hidden bg-[url(/bgspr2.jpg)] bg-blend-overlay"
          >
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
                  key={message.id}
                  className={
                    message.senderId === profile?.id
                      ? "ml-auto px-4 py-2 flex gap-2 rounded-2xl bg-primarysecond text-primary rounded-tr-none"
                      : "mr-auto px-4 py-2 flex gap-2 bg-[#292727] rounded-2xl rounded-tl-none"
                  }
                >
                  {/* {getDate(message.timeSent) != oldDate && (
                    <div className="text-xs hidden lg:block absolute left-[48%]">
                      {getDate(message.timeSent)}
                      {updateDate(message.timeSent)}
                    </div>
                  )} */}
                  {message.imageUrl ? <img height={"100px"} width={"100px"} src={message.imageUrl} /> : message.messageContent}
                  {/* <div className="text-[0.625rem] mt-auto">
                    {getTime(message.timeSent)}
                  </div> */}
                  {message.senderId == profile?.id && (
                    <Popover>
                      <PopoverTrigger>
                        <MageDots icon="mage:dots" width="20" height="20" />
                      </PopoverTrigger>
                      <PopoverContent className="flex flex-col gap-1 bg-[#27272A] rounded-[4px] text-white">
                        <Button
                          variant="outline"
                          disabled
                          className="hover:bg-black"
                        >
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
            {/* <div className="absolute w-96 h-96 bg-blue-600 rounded-full filter blur-[100px] opacity-20"></div> */}
          </div>
          <div
            className={
              activeChat == null
                ? "hidden"
                : "flex w-full items-center space-x-2 absolute bottom-0 p-5"
            }
          >
            {/* <label className="w-8 relative flex items-center justify-center rounded-full border border-[#5d5d64]">
              <div className="bg-white h-[0.06rem] w-[60%] absolute"></div>
              <div className="bg-white h-[0.06rem] w-[60%] rotate-90 absolute"></div>
              <input type="file" className="h-full w-full opacity-0"/>
              </label> */}
            <div className="flex justify-center items-center invert h-8 w-12 overflow-hidden">
              <Upload
                name="avatar"
                listType="picture-circle"
                className="avatar-uploader scale-50"
                showUploadList={false}
                customRequest={handleUpload}
                onChange={handleChange}
                accept="image/*"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="avatar"
                    className="invert rounded-full object-fill"
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
            </div>
            <Input
              type="text"
              placeholder="Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => handleSendMessage(e)}
              className="rounded-[3px] border-[#27272A] border text-[#afafb5]"
            />
            <Button
              type="submit"
              variant="outline"
              onClick={(e) => handleSendMessage(e)}
              disabled={messageSending}
              value="sendMessageButton"
              className="rounded-[3px] border-[#27272A] border text-black bg-[#FAFAFA]"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
      <VideoCall socket={socket} userPhoneNumber={session?.user.phoneNumber} toPhoneNumber={activeChat?.phoneNumber}/>
    </main>
  );
}

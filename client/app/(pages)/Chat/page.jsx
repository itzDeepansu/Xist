"use client";
import React, { useEffect, useState ,useMemo } from "react";
import { io } from "socket.io-client";

const page = () => {
  const socket = useMemo(() => io("http://localhost:3000"), []);
  useEffect(() => {
    // const skt = io("http://localhost:3000");
    // setSocket(skt);
    // console.log(skt);
    // console.log(socket);
    socket.on("connect", () => {
      console.log(socket.id,"hi");
    });
  }, []);
  return <div>hi</div>;
};

export default page;

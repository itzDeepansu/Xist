"use client";
import React, { useState } from "react";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import axios from "@/features/axios.js";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useForm } from "react-hook-form";

import { CircleLoader } from "react-spinners";

const getBase64 = (img, callback) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result));
  reader.readAsDataURL(img);
};

const Signup = () => {
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState();
  const [finalImgUrl, setFinalImgUrl] = useState();

  const { register, handleSubmit } = useForm();

  const router = useRouter();

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
    <button style={{ border: 0, background: "none" }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await axios.post("user/createuser", {
        ...data,
        image: finalImgUrl,
      });
      if (res.data.status === 200) {
        setSubmitting(false);
        router.push("/login");
      }
    } catch (err) {
      setSubmitting(false);
      console.log(err);
    }
  };

  if (submitting) {
    return (
      <div className="bg-black flex justify-center items-center h-[100vh] w-[100vw]">
        <CircleLoader color="#ffffff" loading={submitting} size={400} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] flex flex-col-reverse lg:flex-row bg-[#171717] text-white justify-center items-center">
      <div className="flex items-center justify-center py-12">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto grid w-[350px] gap-6"
        >
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">SignUp</h1>
            <p className="text-balance text-[#817e7e]">
              Enter the details below to create an Account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="flex justify-center items-center invert">
              <Upload
                name="avatar"
                listType="picture-circle"
                className="avatar-uploader"
                showUploadList={false}
                customRequest={handleUpload}
                onChange={handleChange}
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
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Deepansu"
                required
                className="rounded-[3px] placeholder:text-[#817e7e]"
                {...register("name")}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="phoneNumber">Phone Number</Label>
              </div>
              <Input
                id="phoneNumber"
                type="number"
                required
                placeholder="1234567890"
                className="rounded-[3px] placeholder:text-[#817e7e]"
                {...register("phoneNumber")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                className="rounded-[3px]"
                {...register("password")}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-white text-black hover:text-white rounded-[3px]"
            >
              Sign Up
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Log In
            </Link>
          </div>
        </form>
      </div>
      <div className="bg-muted w-1/2 h-[12vh] lg:h-[100dvh]">
        <img
          src="/next.svg"
          alt="logo"
          className="-translate-x-3 xl:translate-x-44 h-full w-full invert object-cover"
        />
      </div>
    </div>
  );
};

export default Signup;

"use client";
import Link from "next/link";
import { useState } from "react";
import { CircleLoader } from "react-spinners";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";

const Login = () => {
  const router = useRouter();
  const { register, handleSubmit } = useForm();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setSubmitting(true);
    let res = await signIn("credentials", { ...data,redirect: false });
    if (res.error) {
      setSubmitting(false);
      console.log(res.error);
    } else {
      setSubmitting(false);
      router.push("/");
    }
  };

  const guestLogin = async () => {
    setSubmitting(true);
    let res = await signIn("credentials", {
      phoneNumber: "1234567890",
      password: "1234567890",
      redirect: false,
    });
    if (res.error) {
      setSubmitting(false);
      console.log(res.error);
    } else {
      setSubmitting(false);
      router.push("/");
    }
  };
  const guestLogin2 = async () => {
    setSubmitting(true);
    let res = await signIn("credentials", {
      phoneNumber: "0987654321",
      password: "0987654321",
      redirect: false,
    });
    if (res.error) {
      setSubmitting(false);
      console.log(res.error);
    } else {
      setSubmitting(false);
      router.push("/");
    }
  };

  if (submitting) {
    return (
      <div className="bg-black flex justify-center items-center h-[100vh] w-[100vw] transition-all duration-1000">
        <CircleLoader color="#ffffff" loading={submitting} size={400} />
      </div>
    );
  }

  return (
    <div className="w-screen min-h-[100dvh] flex flex-col-reverse lg:flex-row bg-[#171717] text-white justify-center items-center">
      <div className="flex items-center justify-center py-12">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto grid w-[350px] gap-6"
        >
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="text-balance text-[#817e7e]">
              Enter your credentials below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="number"
                placeholder="1234567890"
                required
                className="rounded-[3px] placeholder:text-[#817e7e]"
                {...register("phoneNumber")}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forget-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Forgot your password?
                </Link>
              </div>
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
              Login
            </Button>
            <Button
              onClick={guestLogin}
              className="w-full bg-white text-black hover:text-white rounded-[3px]"
            >
              Deepansu Login
            </Button>
            <Button
              onClick={guestLogin2}
              className="w-full bg-white text-black hover:text-white rounded-[3px]"
            >
              Vikas Login
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline">
              Sign up
            </Link>
          </div>
        </form>
      </div>
      <div className="w-1/2 h-[12vh] lg:h-[100dvh]">
      <img src="/next.svg" alt="logo" className="-translate-x-3 xl:translate-x-44 h-full w-full invert object-cover"/>
      </div>
    </div>
  );
};

export default Login;

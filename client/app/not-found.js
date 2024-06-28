import Link from "next/link";
function NotFoundPage() {
  return (
    <div className="text-white flex flex-col justify-center items-center h-[100vh] bg-[#171717] text-xl gap-4">
      <h1 className="text-2xl">No Such Page Exists</h1>
      <div className="flex gap-4">
        <Link href="/login" className="underline">
          Log In
        </Link>
        <Link href="/signup" className="underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;

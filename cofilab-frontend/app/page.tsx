import Image from "next/image";
import WalletBalance from "@/app/_components/WalletBalance";
import ActionButtons from "@/app/_components/ActionButtons";
import RecentActivities from "@/app/_components/RecentActivities";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
    <main className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <h1 className="text-4xl font-bold text-bitcoin">CoFiLab</h1>
      <p className="text-lg mt-4 text-gray-300">
        Collaborate. Fund. Earn. — with Bitcoin Lightning
      </p>
      <div className="mt-8">
        <a
          href="auth/login"
          className="bg-bitcoin text-black px-6 py-3 rounded-xl font-semibold hover:opacity-90"
        >
          Commencer
        </a>

      </div>
    </main>
    </div>
  );
}

"use client";

import React from "react";
import RegisterForm from "@/app/_components/RegisterForm";
import { useRouter } from "next/navigation";

const RegisterPage: React.FC = () => {
  const router = useRouter();

  const handleRegistrationSuccess = (profileId: number) => {
    console.log(
      `Inscription réussie. Profil ID: ${profileId}. Redirection vers /auth/login.`
    );
    router.push("/auth/login?next=/profile/complete");
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-zinc-50 font-sans dark:bg-black selection:bg-bitcoin/30 p-4">
      {/* Fond décoratif ambiance Bitcoin */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bitcoin/5 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Wrapper logo + carte */}
      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-stretch gap-8 w-full max-w-4xl">
        {/* Logo : en haut sur mobile, à gauche sur desktop */}
        <div className="flex justify-center md:justify-start md:items-center md:w-1/3">
          <img
            src="/logo_cofilab.png"
            alt="Logo CoFiLab"
            className="h-20 w-auto md:h-28"
          />
        </div>

        {/* Carte du formulaire */}
        <div className="w-full md:w-2/3 max-w-lg md:max-w-none bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 animate-fade-in-up">
          <RegisterForm onSuccess={handleRegistrationSuccess} />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

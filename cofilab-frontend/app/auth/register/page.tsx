'use client';

import React from 'react';
import RegisterForm from '@/app/_components/RegisterForm';
import { useRouter } from 'next/navigation';

const RegisterPage: React.FC = () => {
    const router = useRouter();

    const handleRegistrationSuccess = (profileId: number) => {
        console.log(`Inscription réussie. Profil ID: ${profileId}. Redirection vers /auth/login.`);
        router.push('/auth/login?next=/profile/complete'); 
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 font-sans dark:bg-black selection:bg-bitcoin/30 p-4">
            
            {/* Fond décoratif ambiance Bitcoin */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bitcoin/5 via-transparent to-transparent blur-3xl pointer-events-none" />

            {/* Carte du formulaire */}
            <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 animate-fade-in-up">
                <RegisterForm onSuccess={handleRegistrationSuccess} />
            </div>
            
        </div>
    );
};

export default RegisterPage;
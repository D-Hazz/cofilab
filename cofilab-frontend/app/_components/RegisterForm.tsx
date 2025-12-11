'use client';

import React, { useState } from 'react';
import Link from 'next/link'; // Ajout pour le lien vers la connexion
import { auth } from '@/services/api';

interface RegisterFormProps {
    onSuccess: (profileId: number) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Vérification locale
            if (password !== password2) {
                setError("Les deux mots de passe ne correspondent pas.");
                setIsLoading(false);
                return;
            }

            const userProfile = await auth.register({ 
                username, 
                email, 
                password,
                password2 
            });
            
            onSuccess(userProfile.id); 

        } catch (err: any) {
            // Votre logique de gestion d'erreurs DRF conservée intacte
            let errorDetail = "Une erreur inconnue est survenue.";
            
            if (err) {
                errorDetail = Object.entries(err)
                    .map(([key, value]) => {
                        const fieldName = key === 'password2' ? 'Confirmation' : key;
                        let message = '';
                        if (Array.isArray(value)) {
                            message = (value as string[]).join(' / ');
                        } else if (typeof value === 'string') {
                            message = value;
                        } else {
                            message = JSON.stringify(value);
                        }
                        return `**${fieldName}**: ${message}`;
                    })
                    .join(' | ');
            }
            
            setError(errorDetail); // J'ai simplifié le message pour qu'il soit moins verbeux dans l'UI
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-techblue dark:text-white">Rejoindre CoFiLab</h2>
                <p className="text-zinc-500 text-sm mt-2">Créez votre compte professionnel</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Zone d'erreur stylisée */}
                {error && (
                     <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2 animate-fade-in-up">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="break-words">{error}</span>
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Nom d'utilisateur"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 focus:ring-2 focus:ring-bitcoin focus:border-transparent outline-none transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <input
                            type="email"
                            placeholder="Adresse Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 focus:ring-2 focus:ring-bitcoin focus:border-transparent outline-none transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                            type="password"
                            placeholder="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 focus:ring-2 focus:ring-bitcoin focus:border-transparent outline-none transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        />
                        <input
                            type="password"
                            placeholder="Confirmation"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-300 focus:ring-2 focus:ring-bitcoin focus:border-transparent outline-none transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-6 bg-bitcoin hover:bg-bitcoin/90 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-bitcoin/20 hover:shadow-lg hover:shadow-bitcoin/30 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Création en cours...
                        </span>
                    ) : 'S\'inscrire'}
                </button>

                {/* Lien vers connexion */}
                <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                    Vous avez déjà un compte ?{" "}
                    <Link 
                        href="/auth/login" 
                        className="font-semibold text-bitcoin hover:text-bitcoin/80 hover:underline transition-colors"
                    >
                        Se connecter
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterForm;
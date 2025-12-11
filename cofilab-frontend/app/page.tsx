import Image from "next/image";
import WalletBalance from "@/app/_components/WalletBalance";
import ActionButtons from "@/app/_components/ActionButtons";
import RecentActivities from "@/app/_components/RecentActivities";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 font-sans dark:bg-black selection:bg-bitcoin/30">
      
      {/* Fond ambiant subtil */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bitcoin/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <main className="relative z-10 flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
        
        {/* Titre : Techblue pour l'autorité */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-techblue dark:text-zinc-100 animate-fade-in-up">
          CoFiLab
        </h1>

        {/* Sous-titre */}
        <p 
          className="mt-4 text-base text-zinc-600 dark:text-zinc-400 animate-fade-in-up leading-relaxed"
          style={{ animationDelay: '100ms' }}
        >
          Collaborate. Fund. Earn.
          <span className="block mt-1 text-sm font-medium text-bitcoin opacity-90">
            Powered by Bitcoin Lightning
          </span>
        </p>

        {/* Bouton Optimisé : Bordure fine + Contraste Techblue sur Orange */}
        <div 
          className="mt-8 animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          <a
            href="auth/login"
            className="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-bold text-techblue transition-all duration-300 bg-bitcoin rounded-xl border border-yellow-500/30 shadow-sm hover:bg-bitcoin/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-bitcoin/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bitcoin dark:focus:ring-offset-black"
          >
            {/* Effet de reflet interne subtil */}
            <span className="absolute inset-0 rounded-xl border border-white/20 pointer-events-none" />
            
            <span>Commencer</span>
            
            <svg 
              className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>

      </main>
    </div>
  );
}
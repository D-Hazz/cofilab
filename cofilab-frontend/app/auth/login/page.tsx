"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link"; // ✅ Ajout pour la navigation optimisée

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false); // ✅ État pour la checkbox
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.access) {
        // Note: Si "Remember Me" est coché, on stocke dans localStorage (persistant),
        // sinon on pourrait utiliser sessionStorage (session unique).
        // Ici, on garde votre logique par défaut (localStorage).
        localStorage.setItem("token", data.access);
        localStorage.setItem("refresh_token", data.refresh);
        router.push("/projects");
      } else {
        setError(data.detail || "Nom d'utilisateur ou mot de passe incorrect.");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    }
  };

  const handleGoogleLogin = () => {
    // Logique OAuth Google ici
    console.log("Redirection vers Google OAuth...");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black selection:bg-bitcoin/30">
      
      {/* Fond décoratif léger */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-bitcoin/5 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 bg-white dark:bg-zinc-900 p-8 rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-techblue dark:text-white">Connexion</h2>
          <p className="text-zinc-500 text-sm mt-2">Heureux de vous revoir sur CoFiLab</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            placeholder="Nom d’utilisateur"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="bg-zinc-50 border-zinc-300 focus:border-bitcoin dark:bg-zinc-800 dark:border-zinc-700"
          />
          
          <div className="space-y-1">
            <Input
              placeholder="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-50 border-zinc-300 focus:border-bitcoin dark:bg-zinc-800 dark:border-zinc-700"
            />
            
            {/* Checkbox et Mot de passe oublié */}
            <div className="flex items-center justify-between text-sm pt-2">
              <label className="flex items-center space-x-2 cursor-pointer text-zinc-600 dark:text-zinc-400 select-none hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 text-bitcoin focus:ring-orange-500"
                />
                <span>Se souvenir de moi</span>
              </label>
              
              <Link 
                href="/auth/forgot-password" 
                className="text-bitcoin hover:underline hover:text-bitcoin/80 font-medium transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-bitcoin hover:bg-bitcoin/90 text-orange-500 border border-orange-500 font-semibold py-6 rounded-xl transition-all duration-200 shadow-md shadow-bitcoin/20 hover:shadow-lg hover:shadow-bitcoin/30"
          >
            Se connecter
          </Button>
        </form>

        {/* Séparateur */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">
              Ou continuer avec
            </span>
          </div>
        </div>

        {/* Bouton Google */}
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGoogleLogin}
          className="w-full py-6 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>

        {/* Lien Inscription */}
        <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Vous n'avez pas de compte ?{" "}
          <Link 
            href="/auth/register" 
            className="font-semibold text-bitcoin hover:text-bitcoin/80 hover:underline transition-colors"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}
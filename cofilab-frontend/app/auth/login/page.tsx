"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }), // ✅ Correction ici
      });

      const data = await res.json();

      if (res.ok && data.access) {
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="bg-white/10 backdrop-blur p-8 rounded-2xl w-96">
        <h2 className="text-2xl font-bold text-center mb-6">Connexion</h2>

        <form onSubmit={handleLogin}>
          <Input
            placeholder="Nom d’utilisateur"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4"
            required
          />
          <Input
            placeholder="Mot de passe"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
            required
          />
          {error && (
            <p className="text-red-400 bg-red-100 text-sm mb-4 p-2 rounded">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full bg-orange-500">
            Se connecter
          </Button>
        </form>
      </div>
    </main>
  );
}

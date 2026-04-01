"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [subscriptionId, setSubscriptionId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = new URLSearchParams();
      body.append("username", subscriptionId);
      body.append("password", password);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem("artemis_token", data.access_token);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white flex items-center justify-center px-4">
      
      <div className="flex items-center gap-16">
        
        {/* LOGIN CARD */}
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1f2b] p-8 shadow-2xl">
          
          <h1 className="text-3xl font-semibold tracking-tight drop-shadow-[0_0_10px_rgba(212,175,55,0.25)]">
            Artemis Login
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to Artemis Control Center with your Subscription ID and password.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            
            {/* Subscription ID */}
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Subscription ID
              </label>
              <input
                type="text"
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value.toUpperCase())}
                className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-[#D4AF37]"
                placeholder="Subscription ID"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-white placeholder-gray-400 outline-none focus:border-[#D4AF37]"
                placeholder="Enter password"
                required
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#D4AF37] px-4 py-3 font-semibold text-black hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Log In"}
            </button>
          </form>
        </div>

        {/* LOGO RIGHT SIDE */}
        <div className="hidden md:flex items-center justify-center">
          <img
            src="/artemis-transparent-logo.png"
            alt="Artemis Logo"
            className="w-200 opacity-90"
          />
        </div>

      </div>
    </div>
  );
}
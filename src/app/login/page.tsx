"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(mode: "in" | "up") {
    setLoading(true);
    setMsg("");
    const supabase = createClient();
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) return setMsg(error.message);
    if (mode === "up") setMsg("Account created. If asked, confirm your email, then sign in.");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold">GapFinder AI</h1>
        <p className="text-sm text-gray-600">Find what you don&apos;t know you don&apos;t know.</p>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            disabled={loading}
            onClick={() => submit("in")}
            className="flex-1 bg-black text-white rounded py-2 disabled:opacity-50"
          >
            Sign in
          </button>
          <button
            disabled={loading}
            onClick={() => submit("up")}
            className="flex-1 border rounded py-2 disabled:opacity-50"
          >
            Sign up
          </button>
        </div>
        {msg && <p className="text-sm text-red-600">{msg}</p>}
      </div>
    </main>
  );
}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const DEMO_EMAIL = "demo@gapfinder.app";
const DEMO_PASSWORD = "12345678";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(mode: "in" | "up", e = email, p = password) {
    setLoading(true);
    setMsg("");
    const supabase = createClient();
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email: e, password: p })
        : await supabase.auth.signUp({ email: e, password: p });
    setLoading(false);
    if (error) return setMsg(error.message);
    if (mode === "up") setMsg("Account created. If asked, confirm your email, then sign in.");
    router.push("/");
    router.refresh();
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div>
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true">G</div>
            <div>
              <p className="brand-name">GapFinder AI</p>
              <p className="brand-subtitle" style={{ color: "#c7d2fe" }}>Your personal study workspace</p>
            </div>
          </div>
          <p className="hero-eyebrow" style={{ color: "#c7d2fe", marginTop: 46 }}>Study with intention</p>
          <h1 className="login-showcase-title">Know what to learn next.</h1>
          <p className="login-showcase-copy">
            Turn your own syllabus and notes into a topic map, a clear picture of your learning gaps,
            and a revision plan that helps you spend your time where it matters.
          </p>
          <div className="login-feature-list">
            <div className="login-feature"><span className="login-feature-dot" aria-hidden="true">✓</span><span>Quizzes grounded in your study material</span></div>
            <div className="login-feature"><span className="login-feature-dot" aria-hidden="true">✓</span><span>Topic-level insights and progress tracking</span></div>
            <div className="login-feature"><span className="login-feature-dot" aria-hidden="true">✓</span><span>Personalised revision with cited explanations</span></div>
          </div>
        </div>
        <p className="small-copy" style={{ color: "#c7d2fe" }}>Find what you don't know you don't know.</p>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          <p className="section-kicker">Welcome to GapFinder AI</p>
          <h2 className="login-card-title">Let's get studying.</h2>
          <p className="login-card-copy">Sign in to continue to your learning dashboard, or create an account to get started.</p>

          <div className="demo-box">
            <p className="demo-box-title">Explore with the demo account</p>
            <p className="demo-box-copy">
              This account includes sample study material, so you can explore the learning workflow.
              Avoid uploading private or sensitive documents to the shared demo.
            </p>
            <button
              disabled={loading}
              onClick={() => submit("in", DEMO_EMAIL, DEMO_PASSWORD)}
              className="btn btn-secondary w-full"
              type="button"
            >
              {loading ? "Signing in…" : "Sign in as demo"}
            </button>
          </div>

          <div className="login-fields">
            <label className="field">
              <span className="field-label">Email address</span>
              <input
                className="form-control"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field-label">Password</span>
              <input
                className="form-control"
                placeholder="Enter your password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          </div>
          <div className="login-actions">
            <button
              disabled={loading}
              onClick={() => submit("in")}
              className="btn btn-primary"
              type="button"
            >
              Sign in
            </button>
            <button
              disabled={loading}
              onClick={() => submit("up")}
              className="btn btn-secondary"
              type="button"
            >
              Create account
            </button>
          </div>
          {msg && <p aria-live="polite" className="login-message">{msg}</p>}
        </div>
      </section>
    </main>
  );
}
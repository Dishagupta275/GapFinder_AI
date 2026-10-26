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
          <div className="login-product-preview" aria-label="How GapFinder works">
            <p className="login-preview-label">FROM NOTES TO KNOW-HOW</p>
            <div className="login-flow-line">
              <div className="login-flow-node"><span>01</span><strong>Bring your notes</strong><small>Your own syllabus and material</small></div>
              <div className="login-flow-arrow" aria-hidden="true">↓</div>
              <div className="login-flow-node"><span>02</span><strong>Find the gaps</strong><small>Check what has really clicked</small></div>
              <div className="login-flow-arrow" aria-hidden="true">↓</div>
              <div className="login-flow-node login-flow-node-highlight"><span>03</span><strong>Know your next step</strong><small>Practise, understand, and revise</small></div>
            </div>
            <p className="login-preview-foot"><span aria-hidden="true">✳</span> Built to help you decide what to learn next.</p>
          </div>
        </div>
        <p className="small-copy" style={{ color: "#c7d2fe" }}>Find what you don&apos;t know you don&apos;t know.</p>
      </section>

      <section className="login-form-side">
        <div className="login-card">
          <p className="section-kicker">Your next study session starts here</p>
          <h2 className="login-card-title">Find your next step.</h2>
          <p className="login-card-copy">Step inside your study workspace. The demo is the quickest way to explore the full learning journey without setting up an account.</p>

          <div className="demo-box">
            <p className="demo-box-title">Start with the demo workspace</p>
            <p className="demo-box-copy">
              The fastest way to explore: open the sample study workspace, try a diagnostic, check a source-backed explanation, and see how results guide revision. Please do not upload private or sensitive documents to the shared demo.
            </p>
            <button
              disabled={loading}
              onClick={() => submit("in", DEMO_EMAIL, DEMO_PASSWORD)}
              className="btn btn-primary login-demo-button w-full"
              type="button"
            >
              {loading ? "Opening your workspace…" : "Explore the demo workspace"}
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
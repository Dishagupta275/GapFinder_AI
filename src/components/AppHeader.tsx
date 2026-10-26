"use client";

import Link from "next/link";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/materials", label: "Materials" },
  { href: "/topics", label: "Topics" },
  { href: "/insights", label: "Insights" },
  { href: "/explain", label: "Explain" },
  { href: "/study-plan", label: "Study plan" },
];

export default function AppHeader({
  email,
  activePath,
}: {
  email?: string | null;
  activePath: string;
}) {
  return (
    <header className="app-header">
      <Link href="/" className="brand-lockup brand-link" aria-label="GapFinder AI overview">
        <div className="brand-mark" aria-hidden="true">G</div>
        <div>
          <p className="brand-name">GapFinder AI</p>
          <p className="brand-subtitle">Your personal study workspace</p>
        </div>
      </Link>

      <div className="header-actions app-header-right">
        <nav className="header-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activePath === item.href ? "page" : undefined}
              className={activePath === item.href ? "nav-active" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action="/auth/signout" method="post" className="header-actions account-actions">
          <span className="account-label" title={email ?? undefined}>{email}</span>
          <button className="btn btn-secondary" type="submit">Sign out</button>
        </form>
      </div>
    </header>
  );
}

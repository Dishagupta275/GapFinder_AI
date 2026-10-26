"use client";

import Link from "next/link";

const primaryNavigation = [
  { href: "/", label: "Overview" },
  { href: "/materials", label: "Library" },
  { href: "/topics", label: "Topics" },
  { href: "/insights", label: "Insights" },
];

const toolNavigation = [
  { href: "/explain", label: "Explain a topic" },
  { href: "/study-plan", label: "Study plan" },
];

export default function AppHeader({
  email,
  activePath,
}: {
  email?: string | null;
  activePath: string;
}) {
  const toolsActive = toolNavigation.some((item) => item.href === activePath);

  return (
    <header className="app-header">
      <Link href="/" className="brand-lockup brand-link" aria-label="GapFinder AI overview">
        <div className="brand-mark" aria-hidden="true">G</div>
        <div>
          <p className="brand-name">GapFinder <span>AI</span></p>
          <p className="brand-subtitle">Your personal study workspace</p>
        </div>
      </Link>

      <div className="header-actions app-header-right">
        <nav className="header-nav" aria-label="Main navigation">
          {primaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activePath === item.href ? "page" : undefined}
              className={activePath === item.href ? "nav-active" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <details className={"nav-more" + (toolsActive ? " nav-more-active" : "")}>
            <summary aria-label="More study tools">Tools <span aria-hidden="true">⌄</span></summary>
            <div className="nav-more-menu">
              {toolNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={activePath === item.href ? "page" : undefined}
                  className={activePath === item.href ? "nav-active" : undefined}
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              ))}
            </div>
          </details>
        </nav>
        <form action="/auth/signout" method="post" className="header-actions account-actions">
          <span className="account-label" title={email ?? undefined}>{email}</span>
          <button className="btn btn-secondary" type="submit">Sign out</button>
        </form>
      </div>
    </header>
  );
}

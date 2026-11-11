"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CodebaseGraph from "@/components/CodebaseGraph";
import type {
  AnalyzedFile,
  DependencyEdge,
} from "@/lib/code-analyzer";

interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

interface Repository {
  full_name: string;
  name: string;
  owner: string;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  updated_at: string;
}

interface RepositoryAnalysis {
  files: AnalyzedFile[];
  edges: DependencyEdge[];
  skippedFiles: string[];
  truncated: boolean;
}

function NetworkIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" strokeLinecap="round" />
    </svg>
  );
}

function Icon({
  name,
  size = 20,
}: {
  name: "arrow" | "clock" | "folder" | "logout" | "plus" | "settings";
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.4 1.4-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L9 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H7v-2h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L8.4 9 9.8 7.6l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6v-.2h2v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.2 9l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2h-.2a1.7 1.7 0 0 0-1 1Z" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="MapRepo home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-violet-300 shadow-[0_0_24px_rgba(139,92,246,0.2)]">
        <NetworkIcon size={21} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">
        Map<span className="text-violet-300">Repo</span>
      </span>
    </Link>
  );
}

function Sidebar({ onLogout, isLoggingOut }: { onLogout: () => void; isLoggingOut: boolean }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] bg-[#0d0d10] p-5 lg:flex lg:flex-col">
      <Logo />
      <nav className="mt-12 space-y-1">
        <a className="flex items-center gap-3 rounded-xl bg-violet-500/10 px-3 py-2.5 text-sm font-medium text-violet-200" href="#overview">
          <Icon name="folder" size={18} />
          Overview
        </a>
        <a className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200" href="#recent">
          <Icon name="clock" size={18} />
          Recent analyses
        </a>
      </nav>
      <div className="mt-auto space-y-1 border-t border-white/[0.07] pt-5">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200">
          <Icon name="settings" size={18} />
          Settings
        </button>
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-500 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-50"
        >
          <Icon name="logout" size={18} />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </aside>
  );
}

function EmptyAnalyses() {
  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
        <NetworkIcon size={25} />
      </span>
      <h3 className="text-base font-medium text-white">No analyses yet</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
        Your analyzed repositories will appear here. Start by adding a public GitHub repository above.
      </p>
    </div>
  );
}

function RepositoryCard({ repository }: { repository: Repository }) {
  return (
    <article className="rounded-2xl border border-white/[0.09] bg-white/[0.025] p-6 shadow-xl shadow-black/10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Icon name="folder" size={15} />
            {repository.owner}
          </div>
          <h3 className="mt-2 text-xl font-medium text-white">{repository.name}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {repository.description ?? "No description provided for this repository."}
          </p>
        </div>
        <a
          href={repository.html_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-violet-400/40 hover:text-white"
        >
          View on GitHub
          <span className="ml-2">↗</span>
        </a>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-5 sm:grid-cols-3">
        <div>
          <p className="text-xs text-zinc-600">Language</p>
          <p className="mt-1 text-sm font-medium text-zinc-200">
            {repository.language ?? "Not specified"}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-600">Stars</p>
          <p className="mt-1 text-sm font-medium text-zinc-200">
            {repository.stargazers_count.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-600">Default branch</p>
          <p className="mt-1 truncate text-sm font-medium text-zinc-200">
            {repository.default_branch}
          </p>
        </div>
      </div>
    </article>
  );
}

function AnalysisSummary({ analysis }: { analysis: RepositoryAnalysis }) {
  const metrics = [
    { label: "Files analyzed", value: analysis.files.length.toLocaleString() },
    { label: "Dependency edges", value: analysis.edges.length.toLocaleString() },
    { label: "Skipped files", value: analysis.skippedFiles.length.toLocaleString() },
    { label: "Analysis status", value: analysis.truncated ? "Truncated" : "Complete" },
  ];

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-4"
        >
          <p className="text-xs text-zinc-600">{metric.label}</p>
          <p className="mt-2 text-lg font-medium text-zinc-100">{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [repository, setRepository] = useState<Repository | null>(null);
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [validationError, setValidationError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load user");
        }

        const data: { user?: CurrentUser } = await response.json();

        if (active && data.user) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          router.replace("/login");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        router.replace("/login");
      }
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleRepositoryAnalysis() {
    if (isValidating) {
      return;
    }

    const repoUrl = repositoryUrl.trim();

    if (!repoUrl) {
      setValidationError("Enter a public GitHub repository URL.");
      setRepository(null);
      setAnalysis(null);
      return;
    }

    setValidationError("");
    setRepository(null);
    setAnalysis(null);
    setIsValidating(true);

    try {
      const response = await fetch("/api/github/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ repoUrl }),
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      const data: {
        message?: string;
        repository?: Repository;
        analysis?: RepositoryAnalysis;
      } = await response.json().catch(() => ({}));

      if (!response.ok || !data.repository || !data.analysis) {
        setValidationError(data.message ?? "Unable to analyze this repository.");
        return;
      }

      setRepository(data.repository);
      setAnalysis(data.analysis);
    } catch {
      setValidationError("Unable to analyze this repository. Please try again.");
    } finally {
      setIsValidating(false);
    }
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] text-zinc-400">
        <div className="flex items-center gap-3 text-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-400/30 border-t-violet-300" />
          Checking your session...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-[#09090b] text-zinc-100">
      <Sidebar onLogout={handleLogout} isLoggingOut={isLoggingOut} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4 lg:px-10">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="hidden text-sm text-zinc-500 lg:block">Workspace overview</div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-zinc-200">{user.name}</p>
              <p className="text-xs text-zinc-600">{user.email}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-semibold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <div id="overview" className="mx-auto max-w-6xl px-6 py-10 lg:px-10 lg:py-14">
          <div className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Dashboard</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Welcome to MapRepo, {user.name.split(" ")[0]}.
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Visualize the structure behind your code and explore it with confidence.
            </p>
          </div>

          <section className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-violet-500/[0.12] via-[#111116] to-blue-500/[0.08] p-6 shadow-2xl shadow-violet-950/10 sm:p-8">
            <div className="pointer-events-none absolute -right-20 -top-32 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="relative">
              <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-violet-300">
                <Icon name="plus" size={21} />
              </span>
              <h2 className="text-xl font-medium text-white">Analyze a repository</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
                Paste a public GitHub URL and MapRepo will help you understand how its files connect.
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleRepositoryAnalysis();
                }}
                className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row"
              >
                <input
                  type="url"
                  value={repositoryUrl}
                  onChange={(event) => setRepositoryUrl(event.target.value)}
                  placeholder="https://github.com/owner/repository"
                  aria-label="GitHub repository URL"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
                  disabled={isValidating}
                />
                <button
                  type="submit"
                  disabled={isValidating}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isValidating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze repository
                      <Icon name="arrow" size={17} />
                    </>
                  )}
                </button>
              </form>
              {validationError && (
                <p
                  role="alert"
                  className="mt-3 max-w-2xl rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm text-red-300"
                >
                  {validationError}
                </p>
              )}
              {!validationError && (
                <p className="mt-3 text-xs text-zinc-600">
                  Only public GitHub repositories are supported.
                </p>
              )}
            </div>
          </section>

          <section id="recent" className="mt-12 scroll-mt-6">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Your workspace</p>
                <h2 className="text-xl font-medium text-white">Recent analyses</h2>
              </div>
              <span className="text-xs text-zinc-600">
                {analysis ? "1 repository" : "0 repositories"}
              </span>
            </div>
            {repository && analysis ? (
              <>
                <RepositoryCard repository={repository} />
                <AnalysisSummary analysis={analysis} />
                <div className="mt-8">
                  <div className="mb-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
                      Dependency map
                    </p>
                    <h2 className="text-xl font-medium text-white">
                      {repository.name} source graph
                    </h2>
                  </div>
                  <CodebaseGraph
                    files={analysis.files}
                    edges={analysis.edges}
                  />
                </div>
              </>
            ) : (
              <EmptyAnalyses />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

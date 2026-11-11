type IconName =
  | "arrow"
  | "arrowUpRight"
  | "brain"
  | "check"
  | "chevron"
  | "code"
  | "github"
  | "gitBranch"
  | "layers"
  | "menu"
  | "network"
  | "scan"
  | "sparkles";

function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
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
    className,
    "aria-hidden": true,
  };

  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    arrowUpRight: <path d="m7 17 10-10M7 7h10v10" />,
    brain: (
      <>
        <path d="M9.5 4.5a3 3 0 0 0-5.3 2.4A3.5 3.5 0 0 0 5 13.5v.2a3.3 3.3 0 0 0 4.5 3.1" />
        <path d="M14.5 4.5a3 3 0 0 1 5.3 2.4A3.5 3.5 0 0 1 19 13.5v.2a3.3 3.3 0 0 1-4.5 3.1M9.5 4.5v15M14.5 4.5v15M4.5 9.5h5m5 0h5M4.5 14.5h5m5 0h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    code: (
      <>
        <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
      </>
    ),
    github: (
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3.3-.4 6.7-1.6 6.7-7A5.5 5.5 0 0 0 19.2 4 5.1 5.1 0 0 0 19 1.5S17.8 1.1 15 3a13.4 13.4 0 0 0-6 0C6.2 1.1 5 1.5 5 1.5A5.1 5.1 0 0 0 4.8 4a5.5 5.5 0 0 0-1.5 3.8c0 5.4 3.4 6.6 6.7 7A4.8 4.8 0 0 0 9 18v4" />
    ),
    gitBranch: (
      <>
        <circle cx="6" cy="5" r="2" />
        <circle cx="18" cy="19" r="2" />
        <circle cx="18" cy="5" r="2" />
        <path d="M8 5h4a6 6 0 0 1 6 6v6M6 7v4a6 6 0 0 0 6 6h4" />
      </>
    ),
    layers: (
      <>
        <path d="m12 2 9 5-9 5-9-5 9-5Z" />
        <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
      </>
    ),
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    network: (
      <>
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
      </>
    ),
    scan: (
      <>
        <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
        <path d="M7 12h10M12 7v10" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3-1.2 4.3L7 9l3.8 1.7L12 15l1.2-4.3L17 9l-3.8-1.7L12 3ZM19 14l-.6 2.4L16 17l2.4.6L19 20l.6-2.4L22 17l-2.4-.6L19 14ZM5 15l-.5 1.5L3 17l1.5.5L5 19l.5-1.5L7 17l-1.5-.5L5 15Z" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Logo() {
  return (
    <a href="#" className="flex items-center gap-2.5" aria-label="MapRepo home">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-violet-300 shadow-[0_0_24px_rgba(139,92,246,0.2)]">
        <Icon name="network" size={21} />
      </span>
      <span className="text-lg font-semibold tracking-tight text-white">
        Map<span className="text-violet-300">Repo</span>
      </span>
    </a>
  );
}

function Navbar() {
  return (
    <header className="relative z-10 border-b border-white/[0.06]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a className="transition hover:text-white" href="#features">
            Features
          </a>
          <a className="transition hover:text-white" href="#how-it-works">
            How it works
          </a>
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <a className="rounded-lg px-4 py-2 text-sm text-zinc-300 transition hover:text-white" href="#login">
            Log in
          </a>
          <a
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-violet-100"
            href="#analyze"
          >
            Get started
          </a>
        </div>
        <button className="rounded-lg border border-white/10 p-2 text-zinc-300 md:hidden" aria-label="Open menu">
          <Icon name="menu" />
        </button>
      </nav>
    </header>
  );
}

const graphNodes = [
  { label: "app/page.tsx", tone: "violet", position: "left-[6%] top-[39%]" },
  { label: "components/Navbar.tsx", tone: "blue", position: "left-[34%] top-[13%]" },
  { label: "lib/database.ts", tone: "blue", position: "right-[7%] top-[25%]" },
  { label: "lib/auth.ts", tone: "violet", position: "right-[9%] bottom-[15%]" },
  { label: "app/layout.tsx", tone: "slate", position: "left-[30%] bottom-[10%]" },
];

function GraphPreview() {
  return (
    <div className="relative mx-auto mt-20 max-w-5xl">
      <div className="absolute -inset-10 rounded-[3rem] bg-violet-500/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e12]/90 p-3 shadow-2xl shadow-violet-950/30 sm:p-5">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-2 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
            <span className="ml-3 text-xs text-zinc-500">dependency-map / repository</span>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-zinc-500 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live preview
          </span>
        </div>
        <div className="graph-grid relative h-[330px] overflow-hidden rounded-xl sm:h-[390px]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".5" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity=".2" />
              </linearGradient>
            </defs>
            <path d="M105 250 C260 220, 320 100, 430 100 S700 150, 865 150" stroke="url(#line-gradient)" strokeWidth="1.5" fill="none" />
            <path d="M105 250 C300 280, 420 385, 520 395 S700 365, 865 335" stroke="url(#line-gradient)" strokeWidth="1.5" fill="none" />
            <path d="M430 100 C470 220, 470 290, 520 395" stroke="url(#line-gradient)" strokeWidth="1.5" fill="none" />
            <path d="M865 150 C830 220, 830 290, 865 335" stroke="url(#line-gradient)" strokeWidth="1.5" fill="none" />
            <circle cx="430" cy="100" r="4" fill="#a78bfa" />
            <circle cx="865" cy="150" r="4" fill="#60a5fa" />
            <circle cx="520" cy="395" r="4" fill="#a78bfa" />
          </svg>
          {graphNodes.map((node) => (
            <div
              key={node.label}
              className={`absolute ${node.position} z-[1] flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] shadow-lg backdrop-blur-md sm:px-4 sm:py-3 sm:text-xs ${
                node.tone === "violet"
                  ? "border-violet-400/30 bg-violet-500/15 text-violet-100 shadow-violet-950/40"
                  : node.tone === "blue"
                    ? "border-blue-400/30 bg-blue-500/15 text-blue-100 shadow-blue-950/40"
                    : "border-white/10 bg-white/[0.07] text-zinc-300"
              }`}
            >
              <Icon name="code" size={14} className="opacity-70" />
              {node.label}
            </div>
          ))}
          <div className="absolute left-[49%] top-[48%] z-[2] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-white/20 bg-zinc-900/90 text-violet-300 shadow-[0_0_35px_rgba(139,92,246,0.4)] sm:h-20 sm:w-20">
            <Icon name="network" size={30} />
          </div>
          <span className="absolute bottom-3 left-3 text-[10px] text-zinc-600">142 files mapped</span>
          <span className="absolute bottom-3 right-3 text-[10px] text-zinc-600">Last analyzed just now</span>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: "gitBranch" as IconName,
    title: "Interactive Dependency Mapping",
    description: "See how every file connects with a living map that makes complex relationships instantly clear.",
  },
  {
    icon: "scan" as IconName,
    title: "Blast Radius Analysis",
    description: "Understand the impact of a change before you make it. Trace dependencies and surface hidden risks.",
  },
  {
    icon: "layers" as IconName,
    title: "Codebase Exploration",
    description: "Move through unfamiliar repositories with context, confidence, and a clear sense of the big picture.",
  },
  {
    icon: "brain" as IconName,
    title: "AI-Powered Insights",
    description: "Get intelligent summaries and architectural signals for your codebase. Coming soon.",
    soon: true,
  },
];

function FeatureCard({ feature }: { feature: (typeof features)[number] }) {
  return (
    <article className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition duration-300 hover:-translate-y-1 hover:border-violet-400/25 hover:bg-white/[0.05]">
      <div className="mb-8 flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
          <Icon name={feature.icon} />
        </span>
        {feature.soon && <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-500">Soon</span>}
      </div>
      <h3 className="text-base font-medium text-white">{feature.title}</h3>
      <p className="mt-3 text-sm leading-6 text-zinc-500">{feature.description}</p>
    </article>
  );
}

const steps = [
  ["01", "Connect a GitHub repository.", "Paste any public repository URL to get started.", "github" as IconName],
  ["02", "Analyze source files.", "MapRepo reads the structure and discovers file relationships.", "scan" as IconName],
  ["03", "Explore the dependency graph.", "Navigate your codebase with a visual map built for understanding.", "network" as IconName],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#09090b] text-zinc-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_top,_rgba(91,33,182,0.2),_transparent_62%)]" />
      <Navbar />
      <section className="relative px-6 pb-0 pt-24 lg:px-8 lg:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[0.08] px-3.5 py-1.5 text-xs font-medium text-violet-200">
            <Icon name="sparkles" size={14} />
            Codebase intelligence, visualized
          </div>
          <h1 className="text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white sm:text-7xl lg:text-[5.5rem]">
            Understand Your
            <span className="block bg-gradient-to-r from-violet-300 via-indigo-200 to-blue-300 bg-clip-text text-transparent">Codebase Visually.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            MapRepo turns any GitHub repository into an interactive dependency map, so you can see how your files connect, explore unfamiliar code, and make changes with confidence.
          </p>
          <form id="analyze" className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-left shadow-2xl shadow-black/20 focus-within:border-violet-400/50">
              <Icon name="github" size={18} className="shrink-0 text-zinc-500" />
              <input aria-label="GitHub repository URL" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600" placeholder="https://github.com/owner/repository" type="url" />
            </label>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-400">
              Analyze repository <Icon name="arrow" size={17} />
            </button>
          </form>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-600">
            <Icon name="check" size={13} className="text-emerald-500" /> Start with any public GitHub repository.
          </p>
        </div>
        <GraphPreview />
      </section>

      <section id="features" className="relative mx-auto max-w-7xl scroll-mt-20 px-6 py-28 lg:px-8">
        <div className="mb-12 max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">Built for clarity</p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">The fastest way to see the bigger picture.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => <FeatureCard key={feature.title} feature={feature} />)}
        </div>
      </section>

      <section id="how-it-works" className="relative border-y border-white/[0.06] bg-white/[0.015] px-6 py-28 scroll-mt-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Simple by design</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">From URL to understanding.</h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3 md:gap-6">
            {steps.map(([number, title, description, icon], index) => (
              <div key={number} className="relative text-center md:text-left">
                {index < steps.length - 1 && <div className="absolute left-[calc(50%+60px)] right-[-60px] top-7 hidden border-t border-dashed border-white/10 md:block" />}
                <div className="relative mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#111116] text-violet-300 md:mx-0">
                  <Icon name={icon} />
                </div>
                <span className="text-xs font-medium text-violet-400">{number}</span>
                <h3 className="mt-2 text-lg font-medium text-white">{title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-zinc-500 md:mx-0">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-zinc-600">See the structure behind the code.</p>
        </div>
        <p className="text-xs text-zinc-700">© 2024 MapRepo. Built for better code understanding.</p>
      </footer>
    </main>
  );
}

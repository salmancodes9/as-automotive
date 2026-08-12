import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
        <Link to="/" className="group flex items-center gap-2.5">
          <DriftLogo className="h-9 w-9 text-primary transition-transform group-hover:-rotate-6" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-accent">
              Maruti Suzuki · Parts
            </span>
            <span className="mt-0.5 text-base font-extrabold tracking-[0.18em] text-primary">
              AS&nbsp;AUTOMOTIVE
            </span>
          </div>
        </Link>
        <Link
          to="/admin"
          className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}

function DriftLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* drift smoke trails */}
      <path
        d="M2 46c6 2 10 2 16 0M2 52c8 3 14 3 22 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* car silhouette */}
      <path
        d="M14 40h4l3-7c.7-1.7 2.3-2.8 4.2-2.8h17.6c1.6 0 3.1.8 4 2.1l4.5 6.7H54a3 3 0 0 1 3 3v3a2 2 0 0 1-2 2h-3.2a5 5 0 0 1-9.6 0H22.8a5 5 0 0 1-9.6 0H10a2 2 0 0 1-2-2v-2a3 3 0 0 1 3-3h3z"
        fill="currentColor"
      />
      {/* windows */}
      <path
        d="M24.4 32.4 22.3 38h11.6v-5.6h-9.5zm12 0V38h11.4l-3-4.6a2 2 0 0 0-1.6-.9h-6.8z"
        fill="hsl(var(--card))"
      />
      {/* wheels */}
      <circle cx="18" cy="46.5" r="3.2" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2" />
      <circle cx="46" cy="46.5" r="3.2" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2" />
      {/* accent stripe */}
      <path d="M40 24l4-6 6 1-3 5z" fill="hsl(var(--accent))" />
    </svg>
  );
}
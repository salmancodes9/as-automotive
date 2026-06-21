import { Link } from "@tanstack/react-router";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="rounded-md bg-primary px-2 py-1 text-xs font-bold tracking-widest text-primary-foreground">
            AS
          </span>
          <span className="text-base font-semibold tracking-wide text-primary">
            AS AUTOMOBILES
          </span>
        </Link>
        <Link
          to="/admin"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}
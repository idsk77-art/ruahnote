import Link from "next/link";

const navItems = [
  { href: "/", label: "Schedule" },
  { href: "/notes", label: "Notes" },
  { href: "/assignments", label: "Assignments" },
  { href: "/integrations", label: "Integrations" },
  { href: "/login", label: "Login" },
  { href: "/admin", label: "Admin" },
];

export default function AppNav() {
  return (
    <nav className="schedule-theme-light print-hidden border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] shadow-sm sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link className="text-base font-bold text-[var(--text)]" href="/">
          RuahNote
        </Link>
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <Link
              className="rounded-md border border-[var(--button-border)] bg-[var(--button-bg)] px-3 py-2 text-sm font-bold text-[var(--button-text)] transition hover:bg-[var(--button-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

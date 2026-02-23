import { Link, NavLink } from 'react-router-dom';

type NavbarProps = {
  onLogout: () => void;
};

function navItemClassName(isActive: boolean): string {
  return [
    'relative text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900',
    "after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:rounded-full after:bg-slate-900 after:transition-transform after:duration-200",
    isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100',
  ].join(' ');
}

export default function Navbar({ onLogout }: NavbarProps) {
  return (
    <header className="w-full border-b border-slate-100 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900">
          SmartEvent
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-5">
          <NavLink to="/dashboard" className={({ isActive }) => navItemClassName(isActive)}>
            Dashboard
          </NavLink>

          <button
            type="button"
            onClick={onLogout}
            className="relative rounded-md px-1 text-sm font-medium text-slate-700 transition duration-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 after:absolute after:-bottom-1 after:left-1 after:h-0.5 after:w-[calc(100%-0.5rem)] after:origin-left after:scale-x-0 after:rounded-full after:bg-slate-900 after:transition-transform after:duration-200 hover:after:scale-x-100"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}

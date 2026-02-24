import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { getCurrentUserProfile } from '../services/userService';

type NavbarProps = {
  onLogout: () => void;
};

function navItemClassName(isActive: boolean): string {
  return [
    'relative text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100',
    "after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:rounded-full after:bg-slate-900 after:transition-transform after:duration-200 dark:after:bg-slate-100",
    isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100',
  ].join(' ');
}

export default function Navbar({ onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const { isDarkMode, toggleTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const userInitial = useMemo(() => {
    const firstCharacter = userEmail.trim().charAt(0);
    return firstCharacter ? firstCharacter.toUpperCase() : 'U';
  }, [userEmail]);

  useEffect(() => {
    let mounted = true;

    const loadUserEmail = async () => {
      try {
        const profile = await getCurrentUserProfile();

        if (!mounted) {
          return;
        }

        setUserEmail(profile.email || '');
      } catch {
        if (!mounted) {
          return;
        }

        setUserEmail('');
      }
    };

    loadUserEmail();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className="w-full border-b border-slate-100/90 bg-white/95 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900 transition-colors duration-200 dark:text-slate-100">
          SmartEvent
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-5">
          <NavLink to="/dashboard" className={({ isActive }) => navItemClassName(isActive)}>
            Dashboard
          </NavLink>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-slate-100"
            aria-label="Toggle dark mode"
            aria-pressed={isDarkMode}
          >
            <span className="text-[11px] uppercase tracking-wide">{isDarkMode ? 'Dark' : 'Light'}</span>
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-indigo-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-slate-100"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                {userInitial}
              </span>
              <span>Profile</span>
            </button>

            <div
              className={[
                'absolute right-0 top-11 z-40 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition duration-150 ease-out dark:border-slate-700 dark:bg-slate-800',
                isMenuOpen
                  ? 'pointer-events-auto scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0',
              ].join(' ')}
              role="menu"
            >
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Signed in as</p>
                <p className="mt-1 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                  {userEmail || 'Account'}
                </p>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition duration-150 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  role="menuitem"
                >
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition duration-150 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  role="menuitem"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

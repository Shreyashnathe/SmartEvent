import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import axiosInstance from '../api/axios';

type NavbarProps = {
  onLogout: () => void;
};

type ApiRecord = Record<string, unknown>;

function getEmailFromPayload(payload: unknown): string | null {
  const data = (payload ?? {}) as ApiRecord;
  const nested = ((data.data as ApiRecord | undefined) ?? data) as ApiRecord;
  const email =
    (nested.email as string) ||
    (nested.userEmail as string) ||
    (nested.username as string) ||
    '';

  return email.trim() ? email : null;
}

function navItemClassName(isActive: boolean): string {
  return [
    'relative text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-slate-900',
    "after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:rounded-full after:bg-slate-900 after:transition-transform after:duration-200",
    isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100',
  ].join(' ');
}

export default function Navbar({ onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  const userInitial = useMemo(() => {
    const firstCharacter = userEmail.trim().charAt(0);
    return firstCharacter ? firstCharacter.toUpperCase() : 'U';
  }, [userEmail]);

  useEffect(() => {
    let mounted = true;

    const loadUserEmail = async () => {
      try {
        const response = await axiosInstance.get('/api/users/me');

        if (!mounted) {
          return;
        }

        setUserEmail(getEmailFromPayload(response.data) ?? '');
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
    <header className="w-full border-b border-slate-100 bg-white shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link to="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900">
          SmartEvent
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-5">
          <NavLink to="/dashboard" className={({ isActive }) => navItemClassName(isActive)}>
            Dashboard
          </NavLink>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-700 transition duration-150 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                {userInitial}
              </span>
              <span>Profile</span>
            </button>

            <div
              className={[
                'absolute right-0 top-11 z-40 w-64 origin-top-right rounded-xl border border-slate-200 bg-white p-2 shadow-sm transition duration-150 ease-out',
                isMenuOpen
                  ? 'pointer-events-auto scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0',
              ].join(' ')}
              role="menu"
            >
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Signed in as</p>
                <p className="mt-1 truncate text-sm font-medium text-slate-800">
                  {userEmail || 'Account'}
                </p>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition duration-150 hover:bg-slate-50 hover:text-slate-900"
                  role="menuitem"
                >
                  Profile
                </Link>

                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition duration-150 hover:bg-rose-50"
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

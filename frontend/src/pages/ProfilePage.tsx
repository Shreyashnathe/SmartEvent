import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  changeUserPassword,
  getCurrentUserProfile,
  updateUserPreferences,
} from '../services/userService';
import { resolveApiErrorMessage } from '../utils/apiError';

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function formatMemberSince(value: string): string {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not available';
  }

  return parsedDate.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('Not available');
  const [codingPreference, setCodingPreference] = useState(0.5);
  const [communicationPreference, setCommunicationPreference] = useState(0.5);
  const [initialCodingPreference, setInitialCodingPreference] = useState(0.5);
  const [initialCommunicationPreference, setInitialCommunicationPreference] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');

  const hasPreferenceChanges = useMemo(
    () =>
      Math.abs(codingPreference - initialCodingPreference) > 0.0001 ||
      Math.abs(communicationPreference - initialCommunicationPreference) > 0.0001,
    [
      codingPreference,
      communicationPreference,
      initialCodingPreference,
      initialCommunicationPreference,
    ]
  );
  const canSubmit = useMemo(
    () => !isLoading && !isSaving && hasPreferenceChanges,
    [isLoading, isSaving, hasPreferenceChanges]
  );
  const trimmedNewPasswordLength = useMemo(
    () => newPassword.trim().length,
    [newPassword]
  );
  const canUpdatePassword = useMemo(
    () =>
      !isLoading &&
      !isUpdatingPassword &&
      currentPassword.trim().length > 0 &&
      trimmedNewPasswordLength >= 8,
    [isLoading, isUpdatingPassword, currentPassword, trimmedNewPasswordLength]
  );

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const profile = await getCurrentUserProfile();

        if (!mounted) {
          return;
        }

        setEmail(profile.email);
        setMemberSince(formatMemberSince(profile.createdAt ?? ''));
        setCodingPreference(profile.codingPreferenceWeight);
        setCommunicationPreference(profile.communicationPreferenceWeight);
        setInitialCodingPreference(profile.codingPreferenceWeight);
        setInitialCommunicationPreference(profile.communicationPreferenceWeight);
      } catch {
        if (!mounted) {
          return;
        }

        const message = 'Unable to load your profile right now. Please try again.';
        setErrorMessage(message);
        toast.error(message);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdate = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateUserPreferences({
        codingPreference,
        communicationPreference,
      });

      setInitialCodingPreference(codingPreference);
      setInitialCommunicationPreference(communicationPreference);
      setSuccessMessage('Profile updated successfully.');
      toast.success('Profile updated successfully.');
    } catch (error: unknown) {
      const message = resolveApiErrorMessage(
        error,
        'Unable to update profile right now. Please try again.'
      );
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPreferences = () => {
    setCodingPreference(initialCodingPreference);
    setCommunicationPreference(initialCommunicationPreference);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handlePasswordUpdate = async () => {
    setPasswordErrorMessage('');
    setPasswordSuccessMessage('');
    setIsUpdatingPassword(true);

    try {
      await changeUserPassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccessMessage('Password updated successfully.');
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: unknown) {
      const message = resolveApiErrorMessage(
        error,
        'Unable to update password. Please verify your current password and try again.'
      );
      setPasswordErrorMessage(message);
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar onLogout={logout} />

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">Profile</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-300">Manage your account details and recommendation preferences.</p>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="h-4 w-56 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="h-10 w-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {email}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Member since</p>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {memberSince}
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4 md:col-span-2 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex items-center justify-between">
                    <label htmlFor="codingPreference" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Coding preference
                    </label>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{codingPreference.toFixed(2)}</span>
                  </div>
                  <input
                    id="codingPreference"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={codingPreference}
                    onChange={(event) => setCodingPreference(clamp01(Number(event.target.value)))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                  />
                </div>

                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4 md:col-span-2 dark:border-slate-700 dark:bg-slate-800/70">
                  <div className="flex items-center justify-between">
                    <label htmlFor="communicationPreference" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      Communication preference
                    </label>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{communicationPreference.toFixed(2)}</span>
                  </div>
                  <input
                    id="communicationPreference"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={communicationPreference}
                    onChange={(event) => setCommunicationPreference(clamp01(Number(event.target.value)))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
                  />
                </div>

                {errorMessage ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2">{errorMessage}</p>
                ) : null}

                {successMessage ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">{successMessage}</p>
                ) : null}

                {hasPreferenceChanges ? (
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400 md:col-span-2">
                    You have unsaved changes.
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-3 pt-1 md:col-span-2">
                  <Button onClick={handleUpdate} disabled={!canSubmit}>
                    {isSaving ? 'Updating...' : 'Update'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleResetPreferences}
                    disabled={!hasPreferenceChanges || isSaving}
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Change Password</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Update your password to keep your account secure.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
                  />
                  <p
                    className={`text-xs ${
                      trimmedNewPasswordLength > 0 && trimmedNewPasswordLength < 8
                        ? 'text-rose-600'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Password must be at least 8 characters.
                  </p>
                </div>

                {passwordErrorMessage ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2">
                    {passwordErrorMessage}
                  </p>
                ) : null}

                {passwordSuccessMessage ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">
                    {passwordSuccessMessage}
                  </p>
                ) : null}

                <div className="pt-1 md:col-span-2">
                  <Button onClick={handlePasswordUpdate} disabled={!canUpdatePassword}>
                    {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

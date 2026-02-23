import { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';
import axiosInstance from '../api/axios';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

type ApiRecord = Record<string, unknown>;
type ProfileModel = {
  email: string;
  memberSince: string;
  codingPreference: number;
  communicationPreference: number;
};

type UpdatePreferencesRequest = {
  codingPreference: number;
  communicationPreference: number;
};

type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

type ApiErrorResponse = {
  message?: string;
};

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number') {
    return clamp01(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : clamp01(parsed);
  }

  return fallback;
}

function extractRoot(payload: unknown): ApiRecord {
  const data = (payload ?? {}) as ApiRecord;
  return ((data.data as ApiRecord | undefined) ?? data) as ApiRecord;
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

function normalizeProfile(payload: unknown): ProfileModel {
  const nested = extractRoot(payload);

  const email =
    (nested.email as string) ||
    (nested.userEmail as string) ||
    (nested.username as string) ||
    'Not available';

  const createdAt =
    (nested.createdAt as string) ||
    (nested.createdDate as string) ||
    (nested.created_on as string) ||
    '';

  return {
    email,
    memberSince: formatMemberSince(createdAt),
    codingPreference: toNumber(
      nested.codingPreferenceWeight ?? nested.codingPreference ?? nested.codingWeight,
      0.5
    ),
    communicationPreference: toNumber(
      nested.communicationPreferenceWeight ??
        nested.communicationPreference ??
        nested.communicationWeight,
      0.5
    ),
  };
}

async function fetchProfile(): Promise<ProfileModel> {
  const response = await axiosInstance.get('/api/users/me');
  return normalizeProfile(response.data);
}

async function updateProfilePreferences(payload: UpdatePreferencesRequest): Promise<void> {
  await axiosInstance.put<unknown, unknown, UpdatePreferencesRequest>(
    '/api/users/preferences',
    payload
  );
}

async function changePassword(payload: ChangePasswordRequest): Promise<void> {
  await axiosInstance.put<unknown, unknown, ChangePasswordRequest>(
    '/api/users/change-password',
    payload
  );
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [memberSince, setMemberSince] = useState('Not available');
  const [codingPreference, setCodingPreference] = useState(0.5);
  const [communicationPreference, setCommunicationPreference] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState('');

  const canSubmit = useMemo(() => !isLoading && !isSaving, [isLoading, isSaving]);
  const canUpdatePassword = useMemo(
    () =>
      !isLoading &&
      !isUpdatingPassword &&
      currentPassword.trim().length > 0 &&
      newPassword.trim().length > 0,
    [isLoading, isUpdatingPassword, currentPassword, newPassword]
  );

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const profile = await fetchProfile();

        if (!mounted) {
          return;
        }

        setEmail(profile.email);
        setMemberSince(profile.memberSince);
        setCodingPreference(profile.codingPreference);
        setCommunicationPreference(profile.communicationPreference);
      } catch {
        if (!mounted) {
          return;
        }

        setErrorMessage('Unable to load your profile right now. Please try again.');
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
      await updateProfilePreferences({
        codingPreference,
        communicationPreference,
      });

      setSuccessMessage('Profile updated successfully.');
      toast.success('Profile updated successfully.');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError?.isAxiosError) {
        const message =
          axiosError.response?.data?.message ??
          'Unable to update profile right now. Please try again.';
        setErrorMessage(message);
        toast.error(message);
      } else {
        const message = 'Unable to update profile right now. Please try again.';
        setErrorMessage(message);
        toast.error(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordErrorMessage('');
    setPasswordSuccessMessage('');
    setIsUpdatingPassword(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordSuccessMessage('Password updated successfully.');
      toast.success('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<ApiErrorResponse>;

      if (axiosError?.isAxiosError) {
        const message =
          axiosError.response?.data?.message ??
          'Unable to update password. Please verify your current password and try again.';
        setPasswordErrorMessage(message);
        toast.error(message);
      } else {
        const message =
          'Unable to update password. Please verify your current password and try again.';
        setPasswordErrorMessage(message);
        toast.error(message);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onLogout={logout} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">Manage your account details and recommendation preferences.</p>
        </header>

        {isLoading ? (
          <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-10 w-full rounded-lg bg-slate-200" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="h-10 w-full rounded-lg bg-slate-200" />
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="h-4 w-44 rounded bg-slate-200" />
                <div className="h-2 w-full rounded bg-slate-200" />
              </div>
              <div className="space-y-3 md:col-span-2">
                <div className="h-4 w-56 rounded bg-slate-200" />
                <div className="h-2 w-full rounded bg-slate-200" />
              </div>
              <div className="h-10 w-32 rounded-lg bg-slate-200" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Email</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {email}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Member since</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                    {memberSince}
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="codingPreference" className="text-sm font-medium text-slate-700">
                      Coding preference
                    </label>
                    <span className="text-sm font-medium text-slate-600">{codingPreference.toFixed(2)}</span>
                  </div>
                  <input
                    id="codingPreference"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={codingPreference}
                    onChange={(event) => setCodingPreference(clamp01(Number(event.target.value)))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                  />
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="communicationPreference" className="text-sm font-medium text-slate-700">
                      Communication preference
                    </label>
                    <span className="text-sm font-medium text-slate-600">{communicationPreference.toFixed(2)}</span>
                  </div>
                  <input
                    id="communicationPreference"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={communicationPreference}
                    onChange={(event) => setCommunicationPreference(clamp01(Number(event.target.value)))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                  />
                </div>

                {errorMessage ? (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2">{errorMessage}</p>
                ) : null}

                {successMessage ? (
                  <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">{successMessage}</p>
                ) : null}

                <div className="pt-1 md:col-span-2">
                  <Button onClick={handleUpdate} disabled={!canSubmit}>
                    {isSaving ? 'Updating...' : 'Update'}
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
                <p className="mt-1 text-sm text-slate-600">Update your password to keep your account secure.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
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

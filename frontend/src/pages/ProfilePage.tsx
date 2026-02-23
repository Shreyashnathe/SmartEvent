import { useEffect, useMemo, useState } from 'react';
import axiosInstance from '../api/axios';
import Button from '../components/Button';
import Navbar from '../components/Navbar';
import SkeletonCard from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { type UserProfile } from '../types';

type ApiProfileRecord = Record<string, unknown>;

const PROFILE_ENDPOINTS = ['/api/profile', '/api/users/me'];

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

function normalizeProfile(payload: unknown): UserProfile {
  const data = (payload ?? {}) as ApiProfileRecord;
  const nested = ((data.data as ApiProfileRecord | undefined) ?? data) as ApiProfileRecord;

  const email =
    (nested.email as string) ||
    (nested.userEmail as string) ||
    (nested.username as string) ||
    'Not available';

  return {
    email,
    codingPreferenceWeight: toNumber(
      nested.codingPreferenceWeight ?? nested.codingPreference ?? nested.codingWeight,
      0.5
    ),
    communicationPreferenceWeight: toNumber(
      nested.communicationPreferenceWeight ??
        nested.communicationPreference ??
        nested.communicationWeight,
      0.5
    ),
  };
}

async function fetchProfileWithFallback(): Promise<{ profile: UserProfile; endpoint: string }> {
  for (const endpoint of PROFILE_ENDPOINTS) {
    try {
      const response = await axiosInstance.get(endpoint);
      return { profile: normalizeProfile(response.data), endpoint };
    } catch {
      continue;
    }
  }

  throw new Error('Unable to fetch profile');
}

async function saveProfileWithFallback(
  profile: UserProfile,
  preferredEndpoint: string | null
): Promise<string> {
  const endpointOrder = preferredEndpoint
    ? [preferredEndpoint, ...PROFILE_ENDPOINTS.filter((endpoint) => endpoint !== preferredEndpoint)]
    : PROFILE_ENDPOINTS;

  for (const endpoint of endpointOrder) {
    try {
      await axiosInstance.put(endpoint, {
        codingPreferenceWeight: profile.codingPreferenceWeight,
        communicationPreferenceWeight: profile.communicationPreferenceWeight,
      });

      return endpoint;
    } catch {
      continue;
    }
  }

  throw new Error('Unable to save profile');
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const [profileEndpoint, setProfileEndpoint] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [codingPreferenceWeight, setCodingPreferenceWeight] = useState(0.5);
  const [communicationPreferenceWeight, setCommunicationPreferenceWeight] = useState(0.5);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const canSubmit = useMemo(() => !isLoading && !isSaving, [isLoading, isSaving]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const { profile, endpoint } = await fetchProfileWithFallback();

        if (!mounted) {
          return;
        }

        setProfileEndpoint(endpoint);
        setEmail(profile.email);
        setCodingPreferenceWeight(profile.codingPreferenceWeight);
        setCommunicationPreferenceWeight(profile.communicationPreferenceWeight);
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

  useEffect(() => {
    if (!showSuccessToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowSuccessToast(false);
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [showSuccessToast]);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage('');

    try {
      const endpoint = await saveProfileWithFallback(
        {
          email,
          codingPreferenceWeight,
          communicationPreferenceWeight,
        },
        profileEndpoint
      );

      setProfileEndpoint(endpoint);
      setShowSuccessToast(true);
    } catch {
      setErrorMessage('Unable to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar onLogout={logout} />

      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Profile</h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">Manage your recommendation preference weights.</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={`profile-skeleton-${index}`} />
            ))}
          </div>
        ) : (
          <section className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-7">
            <div className="space-y-6 animate-fade-in">
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">Email</p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                  {email}
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="codingPreferenceWeight" className="text-sm font-medium text-slate-700">
                    Coding preference weight
                  </label>
                  <span className="text-sm font-medium text-slate-600">{codingPreferenceWeight.toFixed(2)}</span>
                </div>
                <input
                  id="codingPreferenceWeight"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={codingPreferenceWeight}
                  onChange={(event) => setCodingPreferenceWeight(clamp01(Number(event.target.value)))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                />
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center justify-between">
                  <label htmlFor="communicationPreferenceWeight" className="text-sm font-medium text-slate-700">
                    Communication preference weight
                  </label>
                  <span className="text-sm font-medium text-slate-600">{communicationPreferenceWeight.toFixed(2)}</span>
                </div>
                <input
                  id="communicationPreferenceWeight"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={communicationPreferenceWeight}
                  onChange={(event) => setCommunicationPreferenceWeight(clamp01(Number(event.target.value)))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                />
              </div>

              {errorMessage ? (
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
              ) : null}

              <div className="pt-1">
                <Button onClick={handleSave} disabled={!canSubmit}>
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      {showSuccessToast ? (
        <div className="pointer-events-none fixed right-4 top-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm animate-fade-in">
          Preferences saved successfully.
        </div>
      ) : null}
    </div>
  );
}

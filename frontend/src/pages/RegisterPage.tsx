import { useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Button from '../components/Button';
import { type RegisterRequest } from '../types';

type RegisterValidationErrors = Record<string, string[] | string>;

type RegisterErrorResponse = {
  message?: string;
  errors?: RegisterValidationErrors;
};

function extractBackendErrorMessage(errorData?: RegisterErrorResponse): string {
  if (!errorData) {
    return 'Unable to create account. Please try again.';
  }

  if (typeof errorData.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  if (errorData.errors && typeof errorData.errors === 'object') {
    for (const value of Object.values(errorData.errors)) {
      if (Array.isArray(value) && value.length > 0) {
        return value[0];
      }

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }
  }

  return 'Unable to create account. Please try again.';
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codingPreference, setCodingPreference] = useState(0.5);
  const [communicationPreference, setCommunicationPreference] = useState(0.5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const payload: RegisterRequest = {
      email,
      password,
      codingPreference,
      communicationPreference,
    };

    try {
      await axiosInstance.post('/api/auth/register', payload);
      navigate('/login', { replace: true });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<RegisterErrorResponse>;
      console.error(axiosError.response?.data);

      setErrorMessage(extractBackendErrorMessage(axiosError.response?.data));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-8 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-600">Join SmartEvent and personalize your recommendations.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Create a password"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
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
              onChange={(event) => setCodingPreference(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
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
              onChange={(event) => setCommunicationPreference(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
            />
          </div>

          {errorMessage ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{errorMessage}</p>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            fullWidth
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 transition duration-200 hover:text-indigo-700">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}

import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';
import { registerUser } from '../services/authService';
import { type RegisterRequest } from '../types';
import { resolveApiErrorMessage } from '../utils/apiError';

export default function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
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
      await registerUser(payload);
      navigate('/login', { replace: true });
    } catch (error: unknown) {
      const message = resolveApiErrorMessage(
        error,
        'Unable to create account. Please try again.'
      );
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:py-10 dark:bg-slate-950">
      <section className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <header className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">Create account</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Join SmartEvent and personalize your recommendations.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-900"
              placeholder="Create a password"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
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
              onChange={(event) => setCodingPreference(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
            />
          </div>

          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/70">
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
              onChange={(event) => setCommunicationPreference(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600 dark:bg-slate-700"
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

        <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 transition duration-200 hover:text-indigo-700">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}

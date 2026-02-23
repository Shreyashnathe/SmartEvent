import { useState, type FormEvent } from 'react';
import type { AxiosError } from 'axios';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { AUTH_TOKEN_STORAGE_KEY } from '../context/authStorage';
import { type LoginResponse } from '../types';

type LoginErrorResponse = {
  message?: string;
};

function resolveAuthToken(response: LoginResponse): string | undefined {
  return response.token ?? response.accessToken ?? response.jwt ?? response.data?.token ?? response.data?.accessToken ?? response.data?.jwt;
}

export default function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { data: response } = await axiosInstance.post<LoginResponse>('/api/auth/login', {
        email,
        password,
      });

      const resolvedToken = resolveAuthToken(response);

      if (!resolvedToken) {
        throw new Error('Token missing in login response');
      }

      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, resolvedToken);
      login(resolvedToken);
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<LoginErrorResponse>;

      if (axiosError?.isAxiosError) {
        console.error(axiosError.response?.data);
        setErrorMessage(
          axiosError.response?.data?.message ??
            'Invalid email or password. Please try again.'
        );
      } else if (error instanceof Error && error.message.trim()) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Unable to sign in right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-8 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to continue to SmartEvent.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {errorMessage && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </p>
          )}

          <Button type="submit" disabled={isSubmitting} fullWidth>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}
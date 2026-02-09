'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import useAuth from '@/hooks/useAuth';

const AdminLoginPage = () => {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(form);
      if (user.role !== 'admin') {
        setError('Admin access required.');
        return;
      }
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[70vh] flex items-start justify-center px-4 pt-24">
      <section className="w-full max-w-sm">
        {/* HEADER */}
        <header className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-semibold">Admin Sign In</h1>
          <p className="text-sm text-gray-600 mt-1">
            Indian Observer newsroom
          </p>
        </header>

        {/* ERROR */}
        {error && (
          <div className="border border-red-200 bg-red-50 text-sm text-red-700 px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              className="w-full border px-3 py-2 text-sm focus:outline-none"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              className="w-full border px-3 py-2 text-sm focus:outline-none"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border px-4 py-2 text-sm hover:bg-gray-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* FOOTER */}
        <footer className="mt-6 text-sm">
          <Link href="/" className="text-gray-600 hover:underline">
            ← Back to Home
          </Link>
        </footer>
      </section>
    </main>
  );
};

export default AdminLoginPage;



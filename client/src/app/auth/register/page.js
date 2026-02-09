'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useAuth from '@/hooks/useAuth';
import Link from 'next/link';

const RegisterPage = () => {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register({ ...form, role });
      router.push('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[70vh] flex items-start justify-center px-4 pt-24">
      <section className="w-full max-w-sm">
        {/* HEADER */}
        <header className="mb-6 border-b pb-4">
          <h1 className="text-2xl font-semibold">Create Account</h1>
          <p className="text-sm text-gray-600 mt-1">
            Join the Indian Observer readership
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
            <label className="block text-sm mb-1">Full name</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full border px-3 py-2 text-sm focus:outline-none"
              required
              disabled={loading}
            />
          </div>

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

          <div>
            <label className="block text-sm mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border px-3 py-2 text-sm bg-white focus:outline-none"
              disabled={loading}
            >
              <option value="user">Reader</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border px-4 py-2 text-sm hover:bg-gray-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
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

export default RegisterPage;



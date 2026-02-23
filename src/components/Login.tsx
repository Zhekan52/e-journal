import React, { useState } from 'react';
import { useAuth } from '../context';
import { GraduationCap, User, Lock, LogIn, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка подключения к серверу');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Card - Minimalism 2.0: soft depth, large whitespace */}
        <div className="glass rounded-soft-2xl p-10 space-y-8">
          {/* Header - Typography as hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-soft-xl bg-gradient-to-br from-primary-700 to-primary-900 shadow-lg shadow-primary-800/20 mx-auto">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-primary-900 tracking-tight">Школьный портал</h1>
              <p className="text-primary-500 text-sm mt-2 font-light">Войдите в свой аккаунт</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-danger-50 border border-danger-100 text-danger-700 px-4 py-3 rounded-soft-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Form - increased whitespace */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary-700">Логин</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Введите логин"
                  className="w-full pl-12 pr-4 py-3.5 bg-primary-50/50 border border-primary-200 rounded-soft-lg focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 text-primary-900 placeholder-primary-400 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary-700">Пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full pl-12 pr-4 py-3.5 bg-primary-50/50 border border-primary-200 rounded-soft-lg focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 text-primary-900 placeholder-primary-400 transition-all"
                  required
                />
              </div>
            </div>

            {/* CTA Button - Coral accent */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-medium rounded-soft-lg shadow-lg shadow-accent-500/25 transition-all hover:shadow-accent-500/35 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Войти
                </>
              )}
            </button>
          </form>

          {/* Footer - minimal */}
          <div className="pt-2 text-center">
            <p className="text-xs text-primary-400 font-light">Школьный портал © {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

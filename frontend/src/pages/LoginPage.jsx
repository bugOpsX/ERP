import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both Admin ID and Password.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Login error:', err);
      const apiMsg = err.response?.data?.message || err.message || 'Invalid administrator credentials.';
      setError(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#051424] text-[#d4e4fa] flex flex-col justify-center items-center px-4 relative overflow-hidden font-sans selection:bg-[#ffb690] selection:text-[#552100]">
      {/* Background Industrial Lighting Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ffb690]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0d1c2d] border border-[#233549] rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#ffb690]/10 border border-[#ffb690]/30 text-[#ffb690] mb-4 shadow-lg shadow-[#ffb690]/5">
            <span className="material-symbols-outlined text-[32px]">factory</span>
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white uppercase mb-1">
            Kamla Enterprises
          </h1>
          <p className="text-xs font-semibold text-[#8ca3ba] uppercase tracking-widest">
            Labor Management System
          </p>
          <div className="inline-block mt-3 px-3 py-1 bg-[#16273b] border border-[#2b3e55] rounded-full text-[11px] font-bold text-[#ffb690] uppercase tracking-widest">
            Administrator Access
          </div>
        </div>

        {/* Error Alert Message */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-300 text-xs font-medium animate-fadeIn">
            <span className="material-symbols-outlined text-[20px] text-rose-400 shrink-0">
              error_outline
            </span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-bold text-[#8ca3ba] uppercase tracking-wider mb-2">
              Admin ID
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566f8a] text-[20px]">
                person
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Admin ID (e.g. admin)"
                className="w-full bg-[#122131] border border-[#233549] focus:border-[#ffb690] focus:ring-1 focus:ring-[#ffb690] text-white text-sm rounded-xl pl-11 pr-4 py-3 outline-none transition-all placeholder:text-[#455a73]"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-bold text-[#8ca3ba] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#566f8a] text-[20px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-[#122131] border border-[#233549] focus:border-[#ffb690] focus:ring-1 focus:ring-[#ffb690] text-white text-sm rounded-xl pl-11 pr-12 py-3 outline-none transition-all placeholder:text-[#455a73]"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#566f8a] hover:text-[#ffb690] transition-colors p-1 flex items-center justify-center cursor-pointer"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-[#ffb690] hover:bg-[#ffc6a8] active:scale-[0.99] text-[#552100] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#ffb690]/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#552100] border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">login</span>
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Card Footer Security Tag */}
        <div className="mt-8 pt-6 border-t border-[#1c2c3e] text-center">
          <p className="text-[11px] text-[#566f8a] flex items-center justify-center gap-1.5 font-medium">
            <span className="material-symbols-outlined text-[15px] text-emerald-400">
              verified_user
            </span>
            Authorized Personnel & Single Admin Access Only
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-xs text-[#455a73] font-medium">
        Kamla Enterprises &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
};

export default LoginPage;

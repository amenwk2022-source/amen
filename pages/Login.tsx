
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';
import { Gavel, Lock, Mail } from 'lucide-react';
import { db } from '../services/db';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const settings = db.getSettings();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authService.login(email, password)) {
      navigate('/');
    } else {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-cairo">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 text-center bg-slate-50 border-b border-gray-100">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Gavel className="text-amber-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{settings.officeName}</h1>
          <p className="text-gray-500 text-sm mt-2">تسجيل الدخول للنظام الإداري</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="admin@lawyer.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="password"
                required
                className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            دخول
          </button>

          <div className="text-center text-xs text-gray-400 mt-4">
            نسخة تجريبية: استخدم admin@lawyer.com / 123456
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

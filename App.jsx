import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, TrendingUp, AlertCircle, Upload, Users, 
  Crown, Mail, Bell, Clock, Zap, Lock, User, ArrowRight, CheckCircle, LogOut 
} from 'lucide-react';

// --- AUTHENTICATION COMPONENT ---
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('signin');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
    }

    // Simulate API delay
    setTimeout(async () => {
      const user = {
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        isPremium: true // Defaulting to premium trial for ELEKTRO users
      };
      await window.storage.set('auth_user', JSON.stringify(user));
      await window.storage.set('auth_token', 'token_' + Date.now());
      setIsLoading(false);
      onLogin(user);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">ELEKTRO CRM</h1>
            <p className="text-slate-400">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input 
                  type="text" placeholder="Full Name" required
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input 
                type="email" placeholder="Email Address" required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input 
                type="password" placeholder="Password" required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <button 
              type="submit" disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Get Started')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-blue-400 text-sm hover:underline">
              {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN APPLICATION ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    const initApp = async () => {
      const savedUser = await window.storage.get('auth_user');
      if (savedUser?.value) setUser(JSON.parse(savedUser.value));
      
      const savedContacts = await window.storage.get('crm_contacts');
      if (savedContacts?.value) setContacts(JSON.parse(savedContacts.value));
      
      setIsLoading(false);
    };
    initApp();
  }, []);

  const handleLogout = async () => {
    await window.storage.delete('auth_token');
    await window.storage.delete('auth_user');
    setUser(null);
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <AuthPage onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-bold text-blue-600">ELEKTRO CRM</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:inline">Hi, {user.name}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-red-500 text-sm font-medium hover:bg-red-50 p-2 rounded-lg">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="p-4 max-w-6xl mx-auto">
        {/* Dashboard Content Here */}
        <div className="bg-blue-600 rounded-2xl p-6 text-white mb-6">
          <h2 className="text-2xl font-bold">Your Relationship Dashboard</h2>
          <p className="opacity-90">Managing {contacts.length} active clients</p>
        </div>

        {/* This is where your micro-crm.jsx logic lives */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {/* Contacts will be mapped here as you had in micro-crm.jsx */}
           {contacts.length === 0 && (
             <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No clients yet. Start by adding your first relationship!</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

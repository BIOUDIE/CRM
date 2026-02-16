import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, TrendingUp, AlertCircle, Upload, Users, 
  Crown, Mail, Bell, Clock, Zap, Lock, User, ArrowRight, CheckCircle, LogOut, Trash2
} from 'lucide-react';

// --- AUTHENTICATION UI ---
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
        const msg = 'Passwords do not match';
        setError(msg);
        alert(msg);
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        const msg = 'Password must be at least 8 characters';
        setError(msg);
        alert(msg);
        setIsLoading(false);
        return;
      }
    }

    setTimeout(async () => {
      const user = {
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        isPremium: false 
      };
      await window.storage.set('auth_user', JSON.stringify(user));
      await window.storage.set('auth_token', 'token_' + Date.now());
      setIsLoading(false);
      onLogin(user);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden text-left">
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-700"></div>
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="hidden lg:block space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
            <Zap className="w-4 h-4" /> <span>Micro-CRM Auth</span>
          </div>
          <h1 className="text-6xl font-bold text-white leading-tight">Relationships are <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">everything.</span></h1>
        </div>
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <input type="text" placeholder="Full Name" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, name: e.target.value})} />
            )}
            <input type="email" placeholder="Email Address" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Password" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            {mode === 'signup' && (
              <input type="password" placeholder="Confirm Password" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
            )}
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3">
              {isLoading ? 'Verifying...' : (mode === 'signin' ? 'Sign In' : 'Create Account')} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="mt-8 text-slate-400 text-sm block w-full text-center hover:text-white">
            {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD UI ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', email: '', vibe: 5 });

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

  const handleAddContact = async (e) => {
    e.preventDefault();
    const updated = [{ ...newContact, id: Date.now() }, ...contacts];
    setContacts(updated);
    await window.storage.set('crm_contacts', JSON.stringify(updated));
    setShowAddModal(false);
    setNewContact({ name: '', email: '', vibe: 5 });
  };

  const deleteContact = async (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await window.storage.set('crm_contacts', JSON.stringify(updated));
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <AuthPage onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-[#F0F2F9] p-4 sm:p-6 text-left">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm flex-1 border border-gray-100 relative">
            <h1 className="text-2xl font-bold text-slate-800">Micro-CRM</h1>
            <p className="text-gray-500 text-sm">Welcome back, {user.name}</p>
            <button onClick={handleLogout} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"><LogOut className="w-5 h-5" /></button>
          </div>
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-6 shadow-md flex-[2] flex items-center justify-center cursor-pointer hover:brightness-105 transition-all">
            <div className="flex items-center gap-3 text-white">
              <Crown className="w-6 h-6" />
              <span className="text-xl font-bold tracking-tight">Upgrade to Premium - $5</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search contacts..." className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
              <Plus className="w-5 h-5" /> Add
            </button>
            <button className="flex-1 md:flex-none bg-slate-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2">
              <Upload className="w-5 h-5" /> Import
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(contact => (
            <div key={contact.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center group">
              <div>
                <h3 className="font-bold text-gray-800">{contact.name}</h3>
                <p className="text-xs text-gray-400">{contact.email}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{width: `${contact.vibe * 10}%`}} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600">{contact.vibe}/10</span>
                </div>
              </div>
              <button onClick={() => deleteContact(contact.id)} className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAddContact} className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-4">
              <h2 className="text-xl font-bold">New Contact</h2>
              <input type="text" placeholder="Name" required className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setNewContact({...newContact, name: e.target.value})} />
              <input type="email" placeholder="Email" className="w-full p-3 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setNewContact({...newContact, email: e.target.value})} />
              <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200">Save Contact</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-gray-400 font-medium">Cancel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

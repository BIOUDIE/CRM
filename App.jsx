import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, TrendingUp, AlertCircle, Upload, Users, 
  Crown, Mail, Lock, User, ArrowRight, CheckCircle, LogOut, Trash2, Bell, Zap
} from 'lucide-react';

// --- HIGH-END AUTH UI COMPONENT ---
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('signin');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 1. Check if passwords match
    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      alert(msg); // Added alert for immediate feedback
      setIsLoading(false);
      return;
    }

    // 2. Check password length (The likely culprit!)
    if (mode === 'signup' && formData.password.length < 8) {
      const msg = 'Password must be at least 8 characters long';
      setError(msg);
      alert(msg); // Added alert for immediate feedback
      setIsLoading(false);
      return;
    }

    // Simulate API delay
    setTimeout(async () => {
      const user = {
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        isPremium: true 
      };
      await window.storage.set('auth_user', JSON.stringify(user));
      await window.storage.set('auth_token', 'token_' + Date.now());
      setIsLoading(false);
      onLogin(user);
    }, 1500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    setTimeout(async () => {
      const user = {
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        isPremium: true 
      };
      await window.storage.set('auth_user', JSON.stringify(user));
      await window.storage.set('auth_token', 'token_' + Date.now());
      setIsLoading(false);
      onLogin(user);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Blobs from your Auth-Page UI */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse delay-700"></div>
      
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Branding & Social Proof */}
        <div className="hidden lg:block space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium">
            <Zap className="w-4 h-4" />
            <span>Powering ELEKTRO Relationships</span>
          </div>
          <h1 className="text-6xl font-bold text-white leading-tight">
            Manage your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Clients</span> with Vibe.
          </h1>
          <p className="text-xl text-slate-400 max-w-md">
            The CRM designed for freelancers who care about relationship health, not just data.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1,2,3,4].map(i => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800`} />
              ))}
            </div>
            <p className="text-sm text-slate-400 font-medium">Joined by 500+ active users</p>
          </div>
        </div>

        {/* Right Side: The Glassmorphic Form */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-3">
              {mode === 'signin' ? 'Welcome back' : 'Start your journey'}
            </h2>
            <p className="text-slate-400">Enter your details to access ELEKTRO CRM</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <div className="group relative">
                <User className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input type="text" placeholder="Full Name" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all" onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
            )}
            <div className="group relative">
              <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input type="email" placeholder="Email address" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="group relative">
              <Lock className="absolute left-4 top-4 w-5 h-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input type="password" placeholder="Password" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
              {isLoading ? 'Connecting...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="text-slate-400 text-sm hover:text-white transition-colors">
              {mode === 'signin' ? "New to ELEKTRO? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN CRM DASHBOARD ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', vibeScore: 5, notes: '' });

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

  const saveContacts = async (newContacts) => {
    setContacts(newContacts);
    await window.storage.set('crm_contacts', JSON.stringify(newContacts));
  };

  const handleAddContact = (e) => {
    e.preventDefault();
    const newContact = { ...formData, id: Date.now() };
    saveContacts([newContact, ...contacts]);
    setShowAddForm(false);
    setFormData({ name: '', email: '', vibeScore: 5, notes: '' });
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <AuthPage onLogin={setUser} />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row">
      {/* Sidebar - Desktop */}
      <div className="w-full sm:w-72 bg-white border-r p-8 flex flex-col shadow-sm">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">ELEKTRO</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <button className="w-full flex items-center gap-3 text-blue-600 font-bold bg-blue-50 p-4 rounded-2xl transition-all">
            <Users className="w-5 h-5" /> Contacts
          </button>
          <button className="w-full flex items-center gap-3 text-slate-500 hover:bg-slate-50 p-4 rounded-2xl transition-all">
            <Calendar className="w-5 h-5" /> Reminders
          </button>
          <div className="mt-8 pt-8 border-t border-slate-100">
             <div className="bg-slate-900 rounded-3xl p-6 text-white">
                <Crown className="w-8 h-8 text-yellow-400 mb-3" />
                <h3 className="font-bold mb-1">Premium Trial</h3>
                <p className="text-xs text-slate-400 mb-4">You have unlimited relationship tracking.</p>
                <button className="w-full py-3 bg-white text-slate-950 rounded-xl text-xs font-bold">Upgrade Now</button>
             </div>
          </div>
        </nav>

        <div className="mt-auto pt-8 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-500 hover:bg-red-50 p-4 rounded-2xl font-bold transition">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-2">My Network</h2>
              <p className="text-slate-500 font-medium">You have {contacts.length} active vibe-tracks.</p>
            </div>
            <button onClick={() => setShowAddForm(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-slate-800 shadow-xl transition-all active:scale-95">
              <Plus className="w-6 h-6" /> <span className="font-bold">Add Client</span>
            </button>
          </div>

          <div className="relative mb-10 group">
            <Search className="absolute left-6 top-5 w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" placeholder="Find a relationship..." 
              className="w-full pl-16 pr-6 py-5 bg-white rounded-[2rem] border-none shadow-xl shadow-slate-200/50 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 outline-none"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Grid of Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(contact => (
              <div key={contact.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-blue-100 transition-all group relative">
                <div className="flex gap-6 items-start">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {contact.name[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-xl mb-1">{contact.name}</h3>
                    <p className="text-slate-400 font-medium text-sm mb-4">{contact.email}</p>
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600" style={{ width: `${contact.vibeScore * 10}%` }} />
                       </div>
                       <span className="text-sm font-black text-slate-900">{contact.vibeScore}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal for Adding Contacts */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
              <h2 className="text-3xl font-black text-slate-900 mb-8">Add Relationship</h2>
              <form onSubmit={handleAddContact} className="space-y-6">
                <input type="text" placeholder="Client Name" required className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input type="email" placeholder="Email Address" className="w-full p-5 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-600" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <div>
                  <label className="text-sm font-bold text-slate-500 mb-4 block uppercase tracking-wider">Vibe Score: {formData.vibeScore}</label>
                  <input type="range" min="1" max="10" className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600" onChange={(e) => setFormData({...formData, vibeScore: e.target.value})} />
                </div>
                <div className="flex gap-6 mt-10">
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-5 font-bold text-slate-400 hover:text-slate-900 transition-colors">Dismiss</button>
                  <button type="submit" className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">Save Profile</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, TrendingUp, AlertCircle, Upload, Users, 
  Crown, Mail, Bell, Clock, Zap, Lock, User, ArrowRight, CheckCircle, LogOut, Trash2
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
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">ELEKTRO CRM</h1>
            <p className="text-slate-400">{mode === 'signin' ? 'Welcome back' : 'Create your account'}</p>
          </div>
          {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl mb-4 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input type="text" placeholder="Full Name" required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white outline-none" onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input type="email" placeholder="Email Address" required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white outline-none" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
              <input type="password" placeholder="Password" required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-11 pr-4 text-white outline-none" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2">
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', vibeScore: 5, notes: '', lastContactDate: new Date().toISOString().split('T')[0] });

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
    setFormData({ name: '', email: '', vibeScore: 5, notes: '', lastContactDate: new Date().toISOString().split('T')[0] });
  };

  const deleteContact = (id) => {
    const filtered = contacts.filter(c => c.id !== id);
    saveContacts(filtered);
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!user) return <AuthPage onLogin={setUser} />;

  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col sm:flex-row">
      {/* Sidebar */}
      <div className="w-full sm:w-64 bg-white border-r p-6 flex flex-col">
        <h1 className="text-2xl font-bold text-blue-600 mb-8">ELEKTRO</h1>
        <nav className="space-y-4 flex-1">
          <div className="flex items-center gap-3 text-blue-600 font-medium bg-blue-50 p-3 rounded-xl">
            <Users className="w-5 h-5" /> Contacts
          </div>
          <div className="flex items-center gap-3 text-gray-500 p-3">
            <Crown className="w-5 h-5" /> Premium Trial
          </div>
        </nav>
        <div className="pt-6 border-t">
          <p className="text-xs text-gray-400 mb-2">Logged in as {user.email}</p>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 text-red-500 hover:bg-red-50 p-3 rounded-xl transition">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Your Relationships</h2>
            <p className="text-gray-500">{contacts.length} total contacts</p>
          </div>
          <button onClick={() => setShowAddForm(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:shadow-lg transition">
            <Plus className="w-5 h-5" /> Add New
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
          <input 
            type="text" placeholder="Search by name..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-blue-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredContacts.map(contact => (
            <div key={contact.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-start">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                  {contact.name[0]}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{contact.name}</h3>
                  <p className="text-gray-500 text-sm">{contact.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-1 rounded-md">Vibe: {contact.vibeScore}/10</span>
                  </div>
                </div>
              </div>
              <button onClick={() => deleteContact(contact.id)} className="text-gray-300 hover:text-red-500 transition">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">New Relationship</h2>
              <form onSubmit={handleAddContact} className="space-y-4">
                <input type="text" placeholder="Name" required className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFormData({...formData, email: e.target.value})} />
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Vibe Score (1-10)</label>
                  <input type="range" min="1" max="10" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" onChange={(e) => setFormData({...formData, vibeScore: e.target.value})} />
                </div>
                <div className="flex gap-4 mt-6">
                  <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-4 font-semibold text-gray-500">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-semibold">Save Contact</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

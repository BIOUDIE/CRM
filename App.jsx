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
        isPremium: mode === 'signup' // Give new signups 14-day trial
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
          <h1 className="text-6xl font-bold text-white leading-tight">
            Relationships are <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">everything.</span>
          </h1>
        </div>
        
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] p-8 lg:p-12 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-6">
            {mode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            )}
            <input 
              type="email" 
              placeholder="Email Address" 
              required 
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              required 
              className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
            />
            {mode === 'signup' && (
              <input 
                type="password" 
                placeholder="Confirm Password" 
                required 
                className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" 
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
              />
            )}
            
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : (mode === 'signin' ? 'Sign In' : 'Create Account')} 
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          
          <button 
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} 
            className="mt-8 text-slate-400 text-sm block w-full text-center hover:text-white"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
          
          {mode === 'signup' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-200 font-medium">14-day Premium Trial</p>
                  <p className="text-xs text-gray-400 mt-1">Full access to all features</p>
                </div>
              </div>
            </div>
          )}
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [bulkContactsText, setBulkContactsText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [bulkEmailData, setBulkEmailData] = useState({
    subject: '',
    body: '',
    selectedContacts: []
  });
  const [newContact, setNewContact] = useState({ 
    name: '', 
    email: '', 
    lastContactDate: '',
    vibeScore: 5,
    notes: '',
    reminderDays: 30,
    contactFrequency: 30
  });
  
  useEffect(() => {
    const initApp = async () => {
      const savedUser = await window.storage.get('auth_user');
      if (savedUser?.value) {
        const userData = JSON.parse(savedUser.value);
        setUser(userData);
        setIsPremium(userData.isPremium || false);
      }
      
      const savedContacts = await window.storage.get('crm_contacts');
      if (savedContacts?.value) setContacts(JSON.parse(savedContacts.value));
      
      const premiumStatus = await window.storage.get('premium_status');
      if (premiumStatus?.value) setIsPremium(JSON.parse(premiumStatus.value));
      
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
    const updated = [{ 
      ...newContact, 
      id: Date.now(),
      createdAt: new Date().toISOString()
    }, ...contacts];
    setContacts(updated);
    await window.storage.set('crm_contacts', JSON.stringify(updated));
    setShowAddModal(false);
    setNewContact({ 
      name: '', 
      email: '', 
      lastContactDate: '',
      vibeScore: 5,
      notes: '',
      reminderDays: 30,
      contactFrequency: 30
    });
  };
  
  const deleteContact = async (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await window.storage.set('crm_contacts', JSON.stringify(updated));
  };

  const handleFileUpload = async (e) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus('Processing file...');
    
    try {
      const text = await file.text();
      let rows;
      
      if (file.name.endsWith('.csv')) {
        rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      } else if (file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
        rows = text.split('\n').map(row => row.split('\t').map(cell => cell.trim()));
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        rows = jsonData;
      } else {
        setImportStatus('Unsupported file type');
        return;
      }

      rows = rows.filter(row => row.some(cell => cell && cell.toString().trim()));
      if (rows.length < 2) {
        setImportStatus('File appears empty');
        return;
      }

      const newContacts = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue;
        
        const contact = {
          id: Date.now() + '_' + i,
          name: row[0].toString().trim(),
          email: row[1] || '',
          lastContactDate: row[2] || '',
          vibeScore: row[3] ? parseInt(row[3]) || 5 : 5,
          notes: row[4] || '',
          createdAt: new Date().toISOString()
        };
        newContacts.push(contact);
      }

      const updated = [...contacts, ...newContacts];
      setContacts(updated);
      await window.storage.set('crm_contacts', JSON.stringify(updated));
      setImportStatus(`Successfully imported ${newContacts.length} contacts!`);
      setTimeout(() => {
        setShowBulkImport(false);
        setImportStatus('');
      }, 2000);
    } catch (error) {
      setImportStatus(`Error: ${error.message}`);
    }
  };

  const handleBulkTextImport = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    setImportStatus('Processing...');
    try {
      const lines = bulkContactsText.split('\n').filter(line => line.trim());
      const newContacts = lines.map((line, i) => {
        const parts = line.split(',').map(p => p.trim());
        return {
          id: Date.now() + '_' + i,
          name: parts[0],
          email: parts[1] || '',
          lastContactDate: parts[2] || '',
          vibeScore: parts[3] ? parseInt(parts[3]) || 5 : 5,
          notes: parts[4] || '',
          createdAt: new Date().toISOString()
        };
      });

      const updated = [...contacts, ...newContacts];
      setContacts(updated);
      await window.storage.set('crm_contacts', JSON.stringify(updated));
      setImportStatus(`Successfully imported ${newContacts.length} contacts!`);
      setBulkContactsText('');
      setTimeout(() => {
        setShowBulkImport(false);
        setImportStatus('');
      }, 2000);
    } catch (error) {
      setImportStatus(`Error: ${error.message}`);
    }
  };

  const handleBulkEmail = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setShowBulkEmail(true);
  };

  const generateBulkEmails = () => {
    const selectedContactsList = contacts.filter(c => 
      bulkEmailData.selectedContacts.includes(c.id) && c.email
    );

    const emails = selectedContactsList.map(contact => {
      const personalizedBody = bulkEmailData.body
        .replace(/\{name\}/g, contact.name)
        .replace(/\{firstName\}/g, contact.name.split(' ')[0]);
      
      return `To: ${contact.email}\nSubject: ${bulkEmailData.subject}\n\n${personalizedBody}`;
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(emails);
    alert(`${selectedContactsList.length} emails prepared and copied to clipboard!`);
    setShowBulkEmail(false);
    setBulkEmailData({ subject: '', body: '', selectedContacts: [] });
  };

  const activatePremium = async () => {
    await window.storage.set('premium_status', JSON.stringify(true));
    setIsPremium(true);
    setShowPremiumModal(false);
    alert('Premium activated! 🎉');
  };

  const daysSinceContact = (dateString) => {
    if (!dateString) return null;
    const lastContact = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - lastContact);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getVibeColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-600';
    if (score >= 5) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
  
  if (!user) return <AuthPage onLogin={setUser} />;
  
  return (
    <div className="min-h-screen bg-[#F0F2F9] p-4 sm:p-6 text-left">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm flex-1 border border-gray-100 relative">
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              Micro-CRM
              {isPremium && (
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm">Welcome back, {user.name}</p>
            <button onClick={handleLogout} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          
          {!isPremium && (
            <div 
              onClick={() => setShowPremiumModal(true)}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-6 shadow-md flex-[2] flex items-center justify-center cursor-pointer hover:brightness-105 transition-all"
            >
              <div className="flex items-center gap-3 text-white">
                <Crown className="w-6 h-6" />
                <span className="text-xl font-bold tracking-tight">Upgrade to Premium - $5</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Search and Actions */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => setShowAddModal(true)} 
              className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" /> Add
            </button>
            <button 
              onClick={() => isPremium ? setShowBulkImport(true) : setShowPremiumModal(true)}
              className={`flex-1 md:flex-none ${isPremium ? 'bg-green-600' : 'bg-slate-400'} text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 relative`}
            >
              <Upload className="w-5 h-5" /> Import
              {!isPremium && <Crown className="w-4 h-4 absolute -top-1 -right-1" />}
            </button>
            <button 
              onClick={handleBulkEmail}
              className={`flex-1 md:flex-none ${isPremium ? 'bg-purple-600' : 'bg-slate-400'} text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 relative`}
            >
              <Mail className="w-5 h-5" /> Email
              {!isPremium && <Crown className="w-4 h-4 absolute -top-1 -right-1" />}
            </button>
          </div>
        </div>
        
        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(contact => {
              const days = daysSinceContact(contact.lastContactDate);
              return (
                <div key={contact.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{contact.name}</h3>
                      {contact.email && <p className="text-xs text-gray-400">{contact.email}</p>}
                      {contact.notes && <p className="text-xs text-gray-500 mt-1">{contact.notes}</p>}
                    </div>
                    <button 
                      onClick={() => deleteContact(contact.id)} 
                      className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {contact.lastContactDate && (
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {new Date(contact.lastContactDate).toLocaleDateString()}
                          {days && <span className="text-gray-400 ml-1">({days}d ago)</span>}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                            style={{width: `${contact.vibeScore * 10}%`}} 
                          />
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getVibeColor(contact.vibeScore)}`}>
                          {contact.vibeScore}/10
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        
        {contacts.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">No contacts yet</h3>
            <p className="text-gray-500 mb-4">Add your first contact to get started</p>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Contact
            </button>
          </div>
        )}
        
        {/* Add Contact Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAddContact} className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800">Add New Contact</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input 
                    type="text" 
                    placeholder="John Smith" 
                    required 
                    value={newContact.name}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={newContact.email}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Contact Date</label>
                  <input 
                    type="date" 
                    value={newContact.lastContactDate}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                    onChange={(e) => setNewContact({...newContact, lastContactDate: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vibe Score: {newContact.vibeScore}/10
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={newContact.vibeScore}
                    className="w-full" 
                    onChange={(e) => setNewContact({...newContact, vibeScore: parseInt(e.target.value)})} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea 
                  placeholder="Any additional context..."
                  value={newContact.notes}
                  rows="3"
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  onChange={(e) => setNewContact({...newContact, notes: e.target.value})} 
                />
              </div>
              
              {isPremium && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      Reminder (days)
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      value={newContact.reminderDays}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                      onChange={(e) => setNewContact({...newContact, reminderDays: parseInt(e.target.value)})} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      Contact Frequency
                    </label>
                    <input 
                      type="number" 
                      min="1" 
                      value={newContact.contactFrequency}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                      onChange={(e) => setNewContact({...newContact, contactFrequency: parseInt(e.target.value)})} 
                    />
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                  Save Contact
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Bulk Import Contacts</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Upload File (Excel/CSV)</label>
                <input 
                  type="file" 
                  accept=".xlsx,.xls,.csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100" 
                />
                <p className="text-xs text-gray-500 mt-2">Format: Name, Email, Date, Vibe (1-10), Notes</p>
              </div>
              
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Paste Contact List</label>
                <textarea 
                  value={bulkContactsText}
                  onChange={(e) => setBulkContactsText(e.target.value)}
                  rows="8"
                  placeholder="Name, Email, Date, Vibe, Notes&#10;John Smith, john@example.com, 2024-01-15, 8, Great client"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              
              {importStatus && (
                <div className={`mb-4 p-4 rounded-xl ${importStatus.includes('Success') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  {importStatus}
                </div>
              )}
              
              <div className="flex gap-3">
                <button 
                  onClick={handleBulkTextImport}
                  disabled={!bulkContactsText.trim()}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-green-700 transition"
                >
                  Import from Text
                </button>
                <button 
                  onClick={() => { setShowBulkImport(false); setBulkContactsText(''); setImportStatus(''); }}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Email Modal */}
        {showBulkEmail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Bulk Personalized Emails</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Recipients</label>
                <div className="border border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                  {contacts.filter(c => c.email).map(contact => (
                    <label key={contact.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={bulkEmailData.selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkEmailData({
                              ...bulkEmailData,
                              selectedContacts: [...bulkEmailData.selectedContacts, contact.id]
                            });
                          } else {
                            setBulkEmailData({
                              ...bulkEmailData,
                              selectedContacts: bulkEmailData.selectedContacts.filter(id => id !== contact.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600" 
                      />
                      <span className="text-sm">{contact.name} ({contact.email})</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input 
                  type="text"
                  value={bulkEmailData.subject}
                  onChange={(e) => setBulkEmailData({...bulkEmailData, subject: e.target.value})}
                  placeholder="Quick check-in"
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body <span className="text-xs text-gray-500">(Use {'{name}'} or {'{firstName}'})</span>
                </label>
                <textarea 
                  value={bulkEmailData.body}
                  onChange={(e) => setBulkEmailData({...bulkEmailData, body: e.target.value})}
                  rows="6"
                  placeholder="Hi {firstName},&#10;&#10;Hope you're doing well!&#10;&#10;Best,&#10;Your Name"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={generateBulkEmails}
                  disabled={bulkEmailData.selectedContacts.length === 0 || !bulkEmailData.subject || !bulkEmailData.body}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-purple-700 transition"
                >
                  Prepare {bulkEmailData.selectedContacts.length} Emails
                </button>
                <button 
                  onClick={() => { setShowBulkEmail(false); setBulkEmailData({ subject: '', body: '', selectedContacts: [] }); }}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Premium Modal */}
        {showPremiumModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Upgrade to Premium</h2>
                <p className="text-4xl font-bold text-yellow-600 mb-1">$5</p>
                <p className="text-sm text-gray-500">one-time payment</p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-700">Custom Reminders</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-700">Bulk Personalized Emails</span>
                </div>
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-700">Bulk Import (Excel/CSV)</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-gray-700">Contact Frequency Settings</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={activatePremium}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-3 rounded-xl font-bold hover:brightness-110 transition"
                >
                  Upgrade Now
                </button>
                <button 
                  onClick={() => setShowPremiumModal(false)}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

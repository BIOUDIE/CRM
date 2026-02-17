import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, TrendingUp, AlertCircle, Upload, Users, 
  Crown, Mail, Bell, Clock, Zap, Lock, User, ArrowRight, CheckCircle, LogOut, Trash2,
  X, Edit2, Save, Tag, BarChart3, PieChart, Activity, Send, Phone, MessageSquare,
  FileText, Star, ChevronLeft, Filter, Download, Settings
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
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        setIsLoading(false);
        return;
      }
    }
    setTimeout(async () => {
      const user = {
        email: formData.email,
        name: formData.name || formData.email.split('@')[0],
        isPremium: mode === 'signup'
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
              <input type="text" placeholder="Full Name" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, name: e.target.value})} />
            )}
            <input type="email" placeholder="Email Address" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Password" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            {mode === 'signup' && (
              <input type="password" placeholder="Confirm Password" required className="w-full bg-slate-800/40 border border-slate-700/50 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500" onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50">
              {isLoading ? 'Verifying...' : (mode === 'signin' ? 'Sign In' : 'Create Account')} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
          <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} className="mt-8 text-slate-400 text-sm block w-full text-center hover:text-white">
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

// --- CONTACT DETAIL VIEW ---
function ContactDetailView({ contact, onClose, onUpdate, onAddActivity, activities }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(contact);
  const [newActivity, setNewActivity] = useState({
    type: 'note',
    content: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [showActivityForm, setShowActivityForm] = useState(false);

  const contactActivities = activities.filter(a => a.contactId === contact.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleSave = () => {
    onUpdate(editedContact);
    setIsEditing(false);
  };

  const handleAddActivity = () => {
    onAddActivity({
      ...newActivity,
      contactId: contact.id,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    setNewActivity({ type: 'note', content: '', date: new Date().toISOString().split('T')[0] });
    setShowActivityForm(false);
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'note': return <FileText className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'email': return 'bg-blue-100 text-blue-600';
      case 'call': return 'bg-green-100 text-green-600';
      case 'meeting': return 'bg-purple-100 text-purple-600';
      case 'note': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editedContact.name}
                  onChange={(e) => setEditedContact({...editedContact, name: e.target.value})}
                  className="bg-white/20 border border-white/30 rounded-lg px-4 py-2 text-2xl font-bold text-white w-full"
                />
              ) : (
                <h2 className="text-3xl font-bold">{contact.name}</h2>
              )}
              {contact.email && (
                <p className="text-blue-100 mt-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> {contact.email}
                </p>
              )}
              {contact.tags && contact.tags.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {contact.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <button onClick={handleSave} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                  <Save className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
              <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">Vibe Score</span>
              </div>
              {isEditing ? (
                <div>
                  <input type="range" min="1" max="10" value={editedContact.vibeScore}
                    onChange={(e) => setEditedContact({...editedContact, vibeScore: parseInt(e.target.value)})}
                    className="w-full" />
                  <p className="text-2xl font-bold text-blue-900">{editedContact.vibeScore}/10</p>
                </div>
              ) : (
                <p className="text-3xl font-bold text-blue-900">{contact.vibeScore}/10</p>
              )}
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-green-600 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Last Contact</span>
              </div>
              {isEditing ? (
                <input type="date" value={editedContact.lastContactDate || ''}
                  onChange={(e) => setEditedContact({...editedContact, lastContactDate: e.target.value})}
                  className="w-full p-2 rounded-lg border" />
              ) : (
                <p className="text-sm font-bold text-green-900">
                  {contact.lastContactDate ? new Date(contact.lastContactDate).toLocaleDateString() : 'Never'}
                </p>
              )}
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-purple-600 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium">Activities</span>
              </div>
              <p className="text-3xl font-bold text-purple-900">{contactActivities.length}</p>
            </div>
          </div>

          {isEditing ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={editedContact.notes || ''}
                onChange={(e) => setEditedContact({...editedContact, notes: e.target.value})}
                rows="3"
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : contact.notes ? (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-600">{contact.notes}</p>
            </div>
          ) : null}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Activity Timeline</h3>
              <button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" /> Add Activity
              </button>
            </div>

            {showActivityForm && (
              <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                    className="p-2 rounded-lg border bg-white"
                  >
                    <option value="note">Note</option>
                    <option value="email">Email Sent</option>
                    <option value="call">Phone Call</option>
                    <option value="meeting">Meeting</option>
                  </select>
                  <input type="date" value={newActivity.date}
                    onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                    className="p-2 rounded-lg border" />
                </div>
                <textarea
                  value={newActivity.content}
                  onChange={(e) => setNewActivity({...newActivity, content: e.target.value})}
                  placeholder="What happened?"
                  rows="2"
                  className="w-full p-3 rounded-lg border mb-3"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddActivity} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Save Activity</button>
                  <button onClick={() => setShowActivityForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {contactActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No activities yet. Add your first activity above!</p>
                </div>
              ) : (
                contactActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                    <div className={`w-10 h-10 rounded-full ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-900 capitalize">{activity.type}</span>
                        <span className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600">{activity.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ANALYTICS DASHBOARD ---
function AnalyticsDashboard({ contacts, activities, onClose }) {
  const totalContacts = contacts.length;
  const avgVibeScore = contacts.length > 0
    ? (contacts.reduce((sum, c) => sum + c.vibeScore, 0) / contacts.length).toFixed(1)
    : 0;
  const overdueContacts = contacts.filter(c => {
    if (!c.lastContactDate) return true;
    const days = Math.ceil((new Date() - new Date(c.lastContactDate)) / (1000 * 60 * 60 * 24));
    return days > 30;
  }).length;
  const vibeDistribution = {
    high: contacts.filter(c => c.vibeScore >= 8).length,
    medium: contacts.filter(c => c.vibeScore >= 5 && c.vibeScore < 8).length,
    low: contacts.filter(c => c.vibeScore < 5).length
  };
  const recentActivity = activities.slice(0, 10);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" /> Analytics Dashboard
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <Users className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{totalContacts}</p>
            <p className="text-sm opacity-90">Total Contacts</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{avgVibeScore}</p>
            <p className="text-sm opacity-90">Avg Vibe Score</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <AlertCircle className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{overdueContacts}</p>
            <p className="text-sm opacity-90">Need Attention</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <Activity className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{activities.length}</p>
            <p className="text-sm opacity-90">Total Activities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" /> Vibe Score Distribution
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">High (8-10)</span>
                  <span className="text-sm font-bold text-green-600">{vibeDistribution.high}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{width: `${(vibeDistribution.high / (totalContacts || 1) * 100)}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Medium (5-7)</span>
                  <span className="text-sm font-bold text-yellow-600">{vibeDistribution.medium}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500" style={{width: `${(vibeDistribution.medium / (totalContacts || 1) * 100)}%`}}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Low (1-4)</span>
                  <span className="text-sm font-bold text-red-600">{vibeDistribution.low}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{width: `${(vibeDistribution.low / (totalContacts || 1) * 100)}%`}}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Recent Activity
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No activities yet</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 capitalize">{activity.type}</p>
                      <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" /> Export Data
          </h3>
          <div className="flex gap-3">
            <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Export to CSV</button>
            <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Export to PDF</button>
            <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Export to Excel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN CRM APP ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [bulkContactsText, setBulkContactsText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [bulkEmailData, setBulkEmailData] = useState({ subject: '', body: '', selectedContacts: [] });
  const [newContact, setNewContact] = useState({
    name: '', email: '', phone: '', company: '', jobTitle: '', website: '', address: '',
    lastContactDate: '', vibeScore: 5, vibeLabel: 'warm',
    notes: '', tags: [], reminderDays: 30, contactFrequency: 30
  });
  const [smartCaptureText, setSmartCaptureText] = useState('');
  const [scanMode, setScanMode] = useState('idle'); // 'idle' | 'camera' | 'preview'
  const [isScanning, setIsScanning] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanFeedback, setScanFeedback] = useState([]);
  const [upgradeReason, setUpgradeReason] = useState('');
  const cameraRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  // --- SMART EXTRACT: parse any text for all contact fields ---
  const extractFromText = (text) => {
    const detected = [];
    const updates = {};

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) { updates.email = emailMatch[0]; detected.push(`📧 ${emailMatch[0]}`); }

    const phoneMatch = text.match(/(\+?\d[\d\s\-().]{7,}\d)/);
    if (phoneMatch) { updates.phone = phoneMatch[1].trim(); detected.push(`📞 ${phoneMatch[1].trim()}`); }

    const urlMatch = text.match(/https?:\/\/[^\s]+|www\.[^\s]+/i);
    if (urlMatch) { updates.website = urlMatch[0]; detected.push(`🌐 ${urlMatch[0]}`); }

    const lines = text.split(/\n/).map(s => s.trim()).filter(Boolean);

    // Name: first line that looks like a proper name (2+ words, title case, no special chars)
    const nameMatch = lines.find(l =>
      !l.includes('@') && !l.match(/\d{3}/) && !l.match(/https?:/) &&
      l.length > 2 && l.length < 60 &&
      /^[A-Z][a-z]/.test(l)
    );
    if (nameMatch) { updates.name = nameMatch; detected.push(`👤 ${nameMatch}`); }

    // Company: line with Ltd, Inc, Co, LLC, Corp, Agency, Studio, Group etc.
    const companyMatch = lines.find(l =>
      l.match(/\b(Ltd|LLC|Inc|Corp|Co\.|Agency|Studio|Group|Solutions|Services|Consulting|Foundation|Associates)\b/i) && !l.includes('@')
    );
    if (companyMatch) { updates.company = companyMatch; detected.push(`🏢 ${companyMatch}`); }

    // Title/Role: line with common job title keywords
    const titleMatch = lines.find(l =>
      l.match(/\b(CEO|CTO|CFO|COO|Director|Manager|Engineer|Designer|Developer|Founder|President|VP|Lead|Head|Officer|Specialist|Consultant|Analyst|Coordinator|Executive)\b/i) &&
      !l.includes('@') && l.length < 60
    );
    if (titleMatch) { updates.jobTitle = titleMatch; detected.push(`💼 ${titleMatch}`); }

    // Address: line with number + street or zip code pattern
    const addressMatch = lines.find(l => l.match(/\d+\s+[A-Za-z]+\s+(St|Ave|Rd|Blvd|Dr|Ln|Way|Court|Ct|Place|Pl)\b/i) || l.match(/\b\d{5}(-\d{4})?\b/));
    if (addressMatch) { updates.address = addressMatch; detected.push(`📍 ${addressMatch}`); }

    // Notes: anything left over after stripping extracted lines
    const remaining = lines.filter(l =>
      l !== nameMatch && l !== companyMatch && l !== titleMatch && l !== addressMatch &&
      !l.includes(emailMatch?.[0]) && !l.match(/(\+?\d[\d\s\-().]{7,}\d)/) && !l.match(/https?:\/\//)
    ).join(' ').trim();
    if (remaining && remaining.length > 3) { updates.notes = remaining; detected.push(`📝 notes`); }

    return { updates, detected };
  };

  // --- LIVE TYPE-TO-FILL ---
  const handleSmartType = (text) => {
    setSmartCaptureText(text);
    if (!text.trim()) { setScanFeedback([]); return; }
    const { updates, detected } = extractFromText(text);
    setNewContact(prev => ({ ...prev, ...updates }));
    setScanFeedback(detected);
  };

  // --- AI IMAGE SCAN via Claude API ---
  const analyzeImageWithAI = async (base64Data, mimeType) => {
    setIsScanning(true);
    setScanFeedback(['🤖 AI is reading the image...']);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: base64Data }
              },
              {
                type: 'text',
                text: 'Extract all contact information from this image (business card, flier, document, email, etc). Return ONLY a plain text block with one piece of info per line, like:\nName: John Smith\nEmail: john@company.com\nPhone: +1 555 123 4567\nCompany: Acme Corp\nTitle: Sales Director\nWebsite: www.acme.com\nAddress: 123 Main St\nNotes: any other relevant info\n\nOnly include fields you can clearly see. No extra commentary.'
              }
            ]
          }]
        })
      });
      const data = await response.json();
      const rawText = data.content?.[0]?.text || '';

      // Parse the structured AI response
      const parsed = {};
      const detected = [];
      rawText.split('\n').forEach(line => {
        const [key, ...rest] = line.split(':');
        const val = rest.join(':').trim();
        if (!val) return;
        const k = key.trim().toLowerCase();
        if (k === 'name')    { parsed.name    = val; detected.push(`👤 ${val}`); }
        if (k === 'email')   { parsed.email   = val; detected.push(`📧 ${val}`); }
        if (k === 'phone')   { parsed.phone   = val; detected.push(`📞 ${val}`); }
        if (k === 'company') { parsed.company  = val; detected.push(`🏢 ${val}`); }
        if (k === 'title')   { parsed.jobTitle = val; detected.push(`💼 ${val}`); }
        if (k === 'website') { parsed.website  = val; detected.push(`🌐 ${val}`); }
        if (k === 'address') { parsed.address  = val; detected.push(`📍 ${val}`); }
        if (k === 'notes')   { parsed.notes    = val; detected.push(`📝 notes`); }
      });

      setNewContact(prev => ({ ...prev, ...parsed }));
      setScanFeedback(detected.length > 0 ? detected : ['⚠️ No contact info found — try a clearer image']);
      setSmartCaptureText(rawText);
    } catch (err) {
      setScanFeedback(['❌ Scan failed — check your connection and try again']);
    }
    setIsScanning(false);
  };

  // --- CAMERA: start stream ---
  const startCamera = async () => {
    setScanMode('camera');
    setScanFeedback([]);
    setScanPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch {
      setScanFeedback(['❌ Camera access denied — please allow camera permissions']);
      setScanMode('idle');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const base64 = dataUrl.split(',')[1];
    setScanPreview(dataUrl);
    stopCamera();
    setScanMode('preview');
    analyzeImageWithAI(base64, 'image/jpeg');
  };

  // --- FILE UPLOAD for image ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      setScanPreview(dataUrl);
      setScanMode('preview');
      analyzeImageWithAI(base64, mimeType);
    };
    reader.readAsDataURL(file);
  };

  const resetScan = () => {
    stopCamera();
    setScanMode('idle');
    setScanPreview(null);
    setScanFeedback([]);
    setSmartCaptureText('');
  };

  // --- VIBE TOGGLE: map label → numeric score ---
  const vibeLabelToScore = { hot: 9, warm: 5, cold: 2 };
  const setVibeLabel = (label) => {
    setNewContact(prev => ({ ...prev, vibeLabel: label, vibeScore: vibeLabelToScore[label] }));
  };

  // --- STALE BADGE: > 14 days since last contact ---
  const isStale = (dateString) => {
    if (!dateString) return true;
    const days = Math.ceil((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    return days > 14;
  };

  // --- FREE TIER LIMIT: max 10 contacts ---
  const FREE_CONTACT_LIMIT = 10;
  const atFreeLimit = !isPremium && contacts.length >= FREE_CONTACT_LIMIT;

  // --- TODAY'S 3: Hot contacts not reached in 7+ days ---
  const todaysThree = contacts
    .filter(c => {
      const isHot = c.vibeLabel === 'hot' || c.vibeScore >= 8;
      const days = c.lastContactDate
        ? Math.ceil((new Date() - new Date(c.lastContactDate)) / (1000 * 60 * 60 * 24))
        : 999;
      return isHot && days >= 7;
    })
    .slice(0, 3);

  // Load PapaParse from CDN once on mount so CSV parsing is available
  useEffect(() => {
    if (typeof Papa !== 'undefined') return; // already loaded
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

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
      const savedActivities = await window.storage.get('crm_activities');
      if (savedActivities?.value) setActivities(JSON.parse(savedActivities.value));
      const premiumStatus = await window.storage.get('premium_status');
      if (premiumStatus?.value) setIsPremium(JSON.parse(premiumStatus.value));
      setIsLoading(false);
    };
    initApp();
  }, []);

  const saveContacts = async (contactsList) => {
    await window.storage.set('crm_contacts', JSON.stringify(contactsList));
  };

  const saveActivities = async (activitiesList) => {
    await window.storage.set('crm_activities', JSON.stringify(activitiesList));
  };

  const handleLogout = async () => {
    await window.storage.delete('auth_token');
    await window.storage.delete('auth_user');
    setUser(null);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (atFreeLimit) {
      setUpgradeReason('You have reached the 10 contact limit on the Free plan.');
      setShowPremiumModal(true);
      return;
    }
    const updated = [{
      ...newContact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isFavorite: false
    }, ...contacts];
    setContacts(updated);
    await saveContacts(updated);
    setShowAddModal(false);
    resetScan();
    setNewContact({ name: '', email: '', phone: '', company: '', jobTitle: '', website: '', address: '', lastContactDate: '', vibeScore: 5, vibeLabel: 'warm', notes: '', tags: [], reminderDays: 30, contactFrequency: 30 });
  };

  const deleteContact = async (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await saveContacts(updated);
  };

  const updateContact = async (updatedContact) => {
    const updated = contacts.map(c => c.id === updatedContact.id ? updatedContact : c);
    setContacts(updated);
    await saveContacts(updated);
  };

  const toggleFavorite = async (id) => {
    const updated = contacts.map(c => c.id === id ? {...c, isFavorite: !c.isFavorite} : c);
    setContacts(updated);
    await saveContacts(updated);
  };

  const addActivity = async (activity) => {
    const updated = [activity, ...activities];
    setActivities(updated);
    await saveActivities(updated);
    const contact = contacts.find(c => c.id === activity.contactId);
    if (contact) {
      updateContact({...contact, lastContactDate: activity.date});
    }
  };

  // --- CSV PARSING UTILITIES ---

  // mapRowToContact: takes a PapaParse row object (header mode) or a plain array row,
  // and maps whatever columns are present to the CRM contact shape.
  // Column matching is case-insensitive and tolerates common variants.
  const mapRowToContact = (row, index, isHeaderMode = true) => {
    // Helper: find a value from a header-keyed object by trying multiple key variants
    const pick = (obj, ...keys) => {
      for (const k of keys) {
        const found = Object.keys(obj).find(ok => ok.trim().toLowerCase() === k.toLowerCase());
        if (found && obj[found] !== undefined && obj[found] !== '') return String(obj[found]).trim();
      }
      return '';
    };

    let name, email, notes, lastContactDate, vibeScore, vibeLabel, tags, phone, company, jobTitle;

    if (isHeaderMode) {
      // Header-keyed object from PapaParse — column order doesn't matter
      name          = pick(row, 'name', 'full name', 'fullname', 'contact name');
      email         = pick(row, 'email', 'email address', 'e-mail');
      phone         = pick(row, 'phone', 'phone number', 'mobile', 'cell');
      company       = pick(row, 'company', 'organization', 'org', 'business');
      jobTitle      = pick(row, 'title', 'job title', 'role', 'position');
      notes         = pick(row, 'notes', 'note', 'comments', 'description', 'memo');
      lastContactDate = pick(row, 'last contact', 'last contact date', 'lastcontactdate', 'date', 'last seen');
      const rawVibe = pick(row, 'vibe', 'vibe score', 'vibescore', 'score');
      vibeScore     = rawVibe ? parseInt(rawVibe) || 5 : 5;
      const rawLabel = pick(row, 'vibe label', 'vibelabel', 'label', 'status');
      vibeLabel     = ['hot','warm','cold'].includes(rawLabel.toLowerCase()) ? rawLabel.toLowerCase() : '';
      const rawTags = pick(row, 'tags', 'tag', 'categories', 'labels');
      tags          = rawTags ? rawTags.split(/[;|]/).map(t => t.trim()).filter(Boolean) : [];
    } else {
      // Positional array fallback (no header row): name, email, notes, date, vibe, tags
      name          = row[0] ? String(row[0]).trim() : '';
      email         = row[1] ? String(row[1]).trim() : '';
      notes         = row[2] ? String(row[2]).trim() : '';
      lastContactDate = row[3] ? String(row[3]).trim() : '';
      vibeScore     = row[4] ? parseInt(row[4]) || 5 : 5;
      tags          = row[5] ? String(row[5]).split(/[;|]/).map(t => t.trim()).filter(Boolean) : [];
    }

    if (!name) return null; // skip empty rows

    return {
      id: `${Date.now()}_${index}`,
      createdAt: new Date().toISOString(),
      isFavorite: false,
      name,
      email:          email || '',
      phone:          phone || '',
      company:        company || '',
      jobTitle:       jobTitle || '',
      notes:          notes || '',
      lastContactDate: lastContactDate || '',
      vibeScore:      isNaN(vibeScore) ? 5 : Math.min(10, Math.max(1, vibeScore)),
      vibeLabel:      vibeLabel || (vibeScore >= 8 ? 'hot' : vibeScore >= 5 ? 'warm' : 'cold'),
      tags:           tags || [],
      reminderDays:   30,
      contactFrequency: 30,
    };
  };

  // parseCSVText: uses PapaParse (loaded from CDN) to correctly handle:
  //   - quoted fields with commas inside:  "Smith, John"
  //   - escaped quotes inside fields:      "She said ""call me"""
  //   - newlines inside quoted fields
  //   - Windows (CRLF) and Unix (LF) line endings
  //   - BOM characters from Excel exports
  //   - columns in any order (via header: true)
  const parseCSVText = (text, delimiter = ',') => {
    return new Promise((resolve, reject) => {
      if (typeof Papa === 'undefined') {
        reject(new Error('PapaParse not loaded'));
        return;
      }
      Papa.parse(text, {
        header: true,           // use first row as column keys
        delimiter,              // ',' for CSV, '\t' for TSV
        skipEmptyLines: 'greedy', // skip rows that are all whitespace
        transformHeader: h => h.trim(), // strip whitespace from header names
        transform: v => v,      // keep raw values — we trim in mapRowToContact
        complete: results => resolve(results),
        error: err => reject(err),
      });
    });
  };

  const handleFileUpload = async (e) => {
    if (!isPremium) { setShowPremiumModal(true); return; }
    const file = e.target.files[0];
    if (!file) return;
    // reset input so the same file can be re-selected after a fix
    e.target.value = '';
    setImportStatus('Reading file…');

    try {
      // --- XLSX / XLS: use SheetJS, convert sheet → CSV, then PapaParse ---
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // sheet_to_csv produces a proper RFC 4180 CSV string — hand it to PapaParse
        const csvText = XLSX.utils.sheet_to_csv(firstSheet);
        const results = await parseCSVText(csvText, ',');
        const newContacts = results.data
          .map((row, i) => mapRowToContact(row, i, true))
          .filter(Boolean);
        if (newContacts.length === 0) { setImportStatus('No valid contacts found in file.'); return; }
        const updated = [...contacts, ...newContacts];
        setContacts(updated);
        await saveContacts(updated);
        setImportStatus(`✅ Imported ${newContacts.length} contact${newContacts.length !== 1 ? 's' : ''} from Excel!`);
        setTimeout(() => { setShowBulkImport(false); setImportStatus(''); }, 2500);
        return;
      }

      // --- CSV / TSV / TXT: read as text, detect delimiter, parse with PapaParse ---
      const text = await file.text();
      const delimiter = file.name.endsWith('.tsv') ? '\t' : ',';
      const results = await parseCSVText(text, delimiter);

      if (results.errors.length > 0 && results.data.length === 0) {
        setImportStatus(`Parse error: ${results.errors[0].message}`);
        return;
      }

      // Warn about any rows PapaParse flagged but still recovered
      const rowWarnings = results.errors.filter(e => e.type !== 'Delimiter');
      const warnMsg = rowWarnings.length > 0
        ? ` (${rowWarnings.length} row${rowWarnings.length !== 1 ? 's' : ''} had minor issues and were skipped)`
        : '';

      const newContacts = results.data
        .map((row, i) => mapRowToContact(row, i, true))
        .filter(Boolean);

      if (newContacts.length === 0) {
        setImportStatus('No valid contacts found. Check that your file has a header row with at least a "name" column.');
        return;
      }

      const updated = [...contacts, ...newContacts];
      setContacts(updated);
      await saveContacts(updated);
      setImportStatus(`✅ Imported ${newContacts.length} contact${newContacts.length !== 1 ? 's' : ''}!${warnMsg}`);
      setTimeout(() => { setShowBulkImport(false); setImportStatus(''); }, 2500);

    } catch (error) {
      setImportStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleBulkTextImport = async () => {
    if (!isPremium) { setShowPremiumModal(true); return; }
    setImportStatus('Parsing…');
    try {
      const text = bulkContactsText.trim();
      if (!text) { setImportStatus('Nothing to import.'); return; }

      // Try PapaParse with header mode first (user may have pasted a header row)
      const results = await parseCSVText(text, ',');
      const headers = results.meta?.fields || [];
      const hasNameHeader = headers.some(h => h.trim().toLowerCase().includes('name'));

      let newContacts;
      if (hasNameHeader) {
        // Pasted text has a proper header row — use header-keyed mapping
        newContacts = results.data
          .map((row, i) => mapRowToContact(row, i, true))
          .filter(Boolean);
      } else {
        // No header row — treat columns positionally: name, email, notes, date, vibe, tags
        newContacts = results.data
          .map((row, i) => {
            // PapaParse in header mode with no real headers assigns keys like Field1, Field2…
            // Re-read as array mode for positional access
            const vals = Object.values(row);
            return mapRowToContact(vals, i, false);
          })
          .filter(Boolean);
      }

      if (newContacts.length === 0) {
        setImportStatus('No contacts found. Format: name, email, notes  (one per line)');
        return;
      }

      const updated = [...contacts, ...newContacts];
      setContacts(updated);
      await saveContacts(updated);
      setImportStatus(`✅ Imported ${newContacts.length} contact${newContacts.length !== 1 ? 's' : ''}!`);
      setBulkContactsText('');
      setTimeout(() => { setShowBulkImport(false); setImportStatus(''); }, 2500);
    } catch (error) {
      setImportStatus(`❌ Error: ${error.message}`);
    }
  };

  const handleBulkEmail = () => {
    if (!isPremium) { setShowPremiumModal(true); return; }
    setShowBulkEmail(true);
  };

  const generateBulkEmails = () => {
    const selectedContactsList = contacts.filter(c => bulkEmailData.selectedContacts.includes(c.id) && c.email);
    const emails = selectedContactsList.map(contact => {
      const personalizedBody = bulkEmailData.body
        .replace(/\{name\}/g, contact.name)
        .replace(/\{firstName\}/g, contact.name.split(' ')[0]);
      return `To: ${contact.email}\nSubject: ${bulkEmailData.subject}\n\n${personalizedBody}`;
    }).join('\n\n---\n\n');
    navigator.clipboard.writeText(emails);
    selectedContactsList.forEach(contact => {
      addActivity({
        contactId: contact.id,
        type: 'email',
        content: `Sent: ${bulkEmailData.subject}`,
        date: new Date().toISOString().split('T')[0],
        id: Date.now() + '_' + contact.id,
        timestamp: new Date().toISOString()
      });
    });
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
    const diffTime = Math.abs(new Date() - new Date(dateString));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getVibeColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-600';
    if (score >= 5) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))];
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = filterTag === 'all' || (contact.tags && contact.tags.includes(filterTag));
    return matchesSearch && matchesTag;
  });

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
            <div onClick={() => setShowPremiumModal(true)}
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-6 shadow-md flex-[2] flex items-center justify-center cursor-pointer hover:brightness-105 transition-all">
              <div className="flex items-center gap-3 text-white">
                <Crown className="w-6 h-6" />
                <span className="text-xl font-bold tracking-tight">Upgrade to Premium - $5</span>
              </div>
            </div>
          )}
        </div>

        {/* TODAY'S 3 — Hot contacts needing a nudge */}
        {todaysThree.length > 0 && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5">
            <h2 className="text-base font-bold text-orange-700 mb-3 flex items-center gap-2">
              🔥 Today's Focus — Reach out to these 3
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {todaysThree.map(contact => {
                const days = daysSinceContact(contact.lastContactDate);
                return (
                  <div key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="bg-white border border-orange-100 rounded-xl p-4 cursor-pointer hover:shadow-md transition flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-lg flex-shrink-0">🔥</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{contact.name}</p>
                      <p className="text-xs text-orange-600">{days ? `${days}d since contact` : 'Never contacted'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search contacts..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-wrap">
              <button onClick={() => setShowAnalytics(true)}
                className="flex-1 md:flex-none bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition">
                <BarChart3 className="w-5 h-5" /> Analytics
              </button>
              <button onClick={() => setShowAddModal(true)}
                className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
                <Plus className="w-5 h-5" /> Add
                {!isPremium && <span className="text-[10px] bg-blue-800 px-1.5 py-0.5 rounded-full">{contacts.length}/10</span>}
              </button>
              <button onClick={() => isPremium ? setShowBulkImport(true) : (() => { setUpgradeReason('Bulk Import is a Premium feature.'); setShowPremiumModal(true); })()}
                className={`flex-1 md:flex-none ${isPremium ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'} text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 relative transition`}>
                {isPremium ? <Upload className="w-5 h-5" /> : <Lock className="w-5 h-5" />} Import
              </button>
              <button onClick={() => isPremium ? handleBulkEmail() : (() => { setUpgradeReason('Bulk Email is a Premium feature.'); setShowPremiumModal(true); })()}
                className={`flex-1 md:flex-none ${isPremium ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-400 hover:bg-slate-500'} text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 relative transition`}>
                {isPremium ? <Mail className="w-5 h-5" /> : <Lock className="w-5 h-5" />} Email
              </button>
            </div>
          </div>
          {allTags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFilterTag('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterTag === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All
              </button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setFilterTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map(contact => {
            const days = daysSinceContact(contact.lastContactDate);
            return (
              <div key={contact.id}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition group cursor-pointer"
                onClick={() => setSelectedContact(contact)}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-800">{contact.name}</h3>
                      {isStale(contact.lastContactDate) && (
                        <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold uppercase tracking-wide">Stale</span>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); toggleFavorite(contact.id); }}
                        className="opacity-0 group-hover:opacity-100">
                        <Star className={`w-4 h-4 ${contact.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      </button>
                    </div>
                    {contact.email && <p className="text-xs text-gray-400">{contact.email}</p>}
                    {contact.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{contact.notes}</p>}
                    {contact.tags && contact.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {contact.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium">{tag}</span>
                        ))}
                        {contact.tags.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium">+{contact.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deleteContact(contact.id); }}
                    className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 transition">
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
                        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{width: `${contact.vibeScore * 10}%`}} />
                      </div>
                      {contact.vibeLabel === 'hot' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">🔥 Hot</span>}
                      {contact.vibeLabel === 'warm' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600">☕ Warm</span>}
                      {contact.vibeLabel === 'cold' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">❄️ Cold</span>}
                      {!contact.vibeLabel && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getVibeColor(contact.vibeScore)}`}>
                          {contact.vibeScore}/10
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredContacts.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {contacts.length === 0 ? 'No contacts yet' : 'No contacts found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {contacts.length === 0 ? 'Add your first contact to get started' : 'Try a different search or filter'}
            </p>
            {contacts.length === 0 && (
              <button onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2">
                <Plus className="w-5 h-5" /> Add Contact
              </button>
            )}
          </div>
        )}

        {/* Contact Detail Modal */}
        {selectedContact && (
          <ContactDetailView
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onUpdate={(updated) => { updateContact(updated); setSelectedContact(updated); }}
            onAddActivity={addActivity}
            activities={activities}
          />
        )}

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <AnalyticsDashboard
            contacts={contacts}
            activities={activities}
            onClose={() => setShowAnalytics(false)}
          />
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAddContact} className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800">Add New Contact</h2>

              {/* Free tier warning */}
              {atFreeLimit && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2 text-orange-700 text-sm font-medium">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  You've reached the 10 contact limit. <button type="button" onClick={() => setShowPremiumModal(true)} className="underline ml-1">Upgrade to add more.</button>
                </div>
              )}

              {/* ✨ MAGIC PASTE — type or paste any text, fields auto-fill instantly */}
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                <label className="block text-sm font-bold text-violet-700 mb-2 flex items-center gap-2">
                  ✨ Magic Paste
                  <span className="text-[10px] font-normal text-violet-400">— type or paste anything below</span>
                </label>
                <textarea
                  rows="4"
                  placeholder={`Just type or paste anything — name, number, email, title — fields fill automatically:\n\nJohn Smith\njohn@acme.com\n+1 555 123 4567\nAcme Corp — Sales Director`}
                  value={smartCaptureText}
                  onChange={(e) => handleSmartType(e.target.value)}
                  className="w-full p-3 bg-white rounded-xl border border-violet-200 outline-none focus:ring-2 focus:ring-violet-400 text-sm resize-none font-mono"
                />
                {scanFeedback.length > 0 && smartCaptureText.length > 0 && !scanPreview && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-1">✅ Auto-filled {scanFeedback.length} field{scanFeedback.length !== 1 ? 's' : ''}:</p>
                    <div className="flex flex-wrap gap-1">
                      {scanFeedback.map((f, i) => (
                        <span key={i} className="bg-white border border-green-200 text-green-700 text-[10px] px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 📸 SCAN TO FILL — camera or image upload, AI extracts everything */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-indigo-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Scan to Fill
                    <span className="text-[10px] font-normal text-indigo-400 bg-indigo-100 px-2 py-0.5 rounded-full">AI-powered</span>
                  </label>
                  {(scanPreview || scanMode === 'camera') && (
                    <button type="button" onClick={() => { stopCamera(); setScanMode('idle'); setScanPreview(null); setScanFeedback([]); }}
                      className="text-xs text-indigo-400 hover:text-indigo-700 flex items-center gap-1">
                      <X className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>
                <p className="text-xs text-indigo-500 mb-3">Point your camera at a business card, flier, name tag, email, or any document — AI reads and fills every field.</p>

                {/* Scan action buttons — shown when idle */}
                {scanMode !== 'camera' && !scanPreview && (
                  <div className="flex gap-2">
                    <button type="button" onClick={startCamera}
                      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition">
                      📷 Open Camera
                    </button>
                    <label className="flex-1 cursor-pointer">
                      <div className="bg-white border-2 border-indigo-300 text-indigo-700 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition">
                        🖼️ Upload Image
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                )}

                {/* Live camera view */}
                {scanMode === 'camera' && (
                  <div className="space-y-3">
                    <div className="relative bg-black rounded-xl overflow-hidden" style={{aspectRatio:'4/3'}}>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      {/* Corner guides */}
                      <div className="absolute inset-4 pointer-events-none">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br"></div>
                      </div>
                      <p className="absolute bottom-2 left-0 right-0 text-center text-white text-[10px] opacity-70">Point at card · flier · document · email</p>
                    </div>
                    <button type="button" onClick={capturePhoto}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition">
                      📸 Capture & Extract Info
                    </button>
                  </div>
                )}

                {/* Scanned image preview */}
                {scanPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-indigo-200">
                    <img src={scanPreview} alt="Scanned document" className="w-full object-contain max-h-44" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-indigo-900/60 flex flex-col items-center justify-center gap-2">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-white text-xs font-semibold">AI reading document...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Scan feedback */}
                {scanFeedback.length > 0 && (scanPreview || scanMode === 'camera') && (
                  <div className={`mt-3 p-3 rounded-xl text-xs ${
                    isScanning ? 'bg-indigo-100' :
                    scanFeedback[0].startsWith('❌') || scanFeedback[0].startsWith('⚠️')
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    {isScanning ? (
                      <p className="text-indigo-600 font-medium animate-pulse">{scanFeedback[0]}</p>
                    ) : scanFeedback[0].startsWith('❌') || scanFeedback[0].startsWith('⚠️') ? (
                      <p className="text-red-600 font-medium">{scanFeedback[0]}</p>
                    ) : (
                      <>
                        <p className="font-semibold text-gray-700 mb-1">✅ Auto-filled {scanFeedback.length} field{scanFeedback.length !== 1 ? 's' : ''}:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {scanFeedback.map((f, i) => (
                            <span key={i} className="bg-white border border-green-200 text-green-700 px-2 py-0.5 rounded-full">{f}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input type="text" placeholder="John Smith" required value={newContact.name}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNewContact({...newContact, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input type="email" placeholder="john@example.com" value={newContact.email}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNewContact({...newContact, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input type="tel" placeholder="+1 555 123 4567" value={newContact.phone || ''}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input type="text" placeholder="Acme Corp" value={newContact.company || ''}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNewContact({...newContact, company: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                  <input type="text" placeholder="Sales Director" value={newContact.jobTitle || ''}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNewContact({...newContact, jobTitle: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Contact Date</label>
                  <input type="date" value={newContact.lastContactDate}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => setNewContact({...newContact, lastContactDate: e.target.value})} />
                </div>

                {/* 🔥 VIBE TOGGLE */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vibe</label>
                  <div className="flex gap-2">
                    {[
                      { label: 'hot',  emoji: '🔥', text: 'Hot',  active: 'bg-red-500 text-white border-red-500',  inactive: 'bg-white text-red-500 border-red-200 hover:bg-red-50' },
                      { label: 'warm', emoji: '☕', text: 'Warm', active: 'bg-yellow-500 text-white border-yellow-500', inactive: 'bg-white text-yellow-600 border-yellow-200 hover:bg-yellow-50' },
                      { label: 'cold', emoji: '❄️', text: 'Cold', active: 'bg-blue-500 text-white border-blue-500',  inactive: 'bg-white text-blue-500 border-blue-200 hover:bg-blue-50' },
                    ].map(v => (
                      <button key={v.label} type="button"
                        onClick={() => setVibeLabel(v.label)}
                        className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition flex items-center justify-center gap-1 ${newContact.vibeLabel === v.label ? v.active : v.inactive}`}>
                        {v.emoji} {v.text}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input type="text" placeholder="client, prospect, partner"
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setNewContact({...newContact, tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea placeholder="Any additional context..." value={newContact.notes} rows="3"
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setNewContact({...newContact, notes: e.target.value})} />
              </div>
              {isPremium && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" /> Reminder (days)
                    </label>
                    <input type="number" min="1" value={newContact.reminderDays}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setNewContact({...newContact, reminderDays: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" /> Contact Frequency
                    </label>
                    <input type="number" min="1" value={newContact.contactFrequency}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setNewContact({...newContact, contactFrequency: parseInt(e.target.value)})} />
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={atFreeLimit}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  Save Contact
                </button>
                <button type="button" onClick={() => { setShowAddModal(false); resetScan(); }}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Cancel</button>
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
                <input type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100" />
                <p className="text-xs text-gray-500 mt-2">Supported columns (any order): <strong>name</strong>, email, phone, company, title, notes, tags, vibe, date · Quoted fields with commas handled automatically</p>
              </div>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">OR</span></div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Paste Contact List</label>
                <textarea value={bulkContactsText} onChange={(e) => setBulkContactsText(e.target.value)} rows="8"
                  placeholder={"Paste CSV rows here — with or without a header row:\n\nname,email,notes\nJohn Smith,john@acme.com,\"Met at conference, very interested\"\nJane Doe,jane@co.com,\"Said \"\"call me\"\" next week\"\n\nOr just positional (no header):\nJohn Smith,john@acme.com,Notes go here"}
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" />
              </div>
              {importStatus && (
                <div className={`mb-4 p-4 rounded-xl ${importStatus.includes('Success') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  {importStatus}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleBulkTextImport} disabled={!bulkContactsText.trim()}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-green-700 transition">
                  Import from Text
                </button>
                <button onClick={() => { setShowBulkImport(false); setBulkContactsText(''); setImportStatus(''); }}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Cancel</button>
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
                      <input type="checkbox" checked={bulkEmailData.selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBulkEmailData({...bulkEmailData, selectedContacts: [...bulkEmailData.selectedContacts, contact.id]});
                          } else {
                            setBulkEmailData({...bulkEmailData, selectedContacts: bulkEmailData.selectedContacts.filter(id => id !== contact.id)});
                          }
                        }} className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">{contact.name} ({contact.email})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input type="text" value={bulkEmailData.subject}
                  onChange={(e) => setBulkEmailData({...bulkEmailData, subject: e.target.value})}
                  placeholder="Quick check-in"
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Body <span className="text-xs text-gray-500">(Use {'{name}'} or {'{firstName}'})</span>
                </label>
                <textarea value={bulkEmailData.body}
                  onChange={(e) => setBulkEmailData({...bulkEmailData, body: e.target.value})}
                  rows="6" placeholder="Hi {firstName}, Hope you are doing well!"
                  className="w-full p-4 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={generateBulkEmails}
                  disabled={bulkEmailData.selectedContacts.length === 0 || !bulkEmailData.subject || !bulkEmailData.body}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-purple-700 transition">
                  Prepare {bulkEmailData.selectedContacts.length} Emails
                </button>
                <button onClick={() => { setShowBulkEmail(false); setBulkEmailData({ subject: '', body: '', selectedContacts: [] }); }}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Cancel</button>
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
                {upgradeReason && (
                  <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-2">{upgradeReason}</p>
                )}
                <p className="text-4xl font-bold text-yellow-600 mb-1">$5</p>
                <p className="text-sm text-gray-500">one-time payment</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3"><Bell className="w-5 h-5 text-yellow-600" /><span className="text-sm text-gray-700">Custom Reminders</span></div>
                <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-yellow-600" /><span className="text-sm text-gray-700">Bulk Personalized Emails</span></div>
                <div className="flex items-center gap-3"><Upload className="w-5 h-5 text-yellow-600" /><span className="text-sm text-gray-700">Bulk Import (Excel/CSV)</span></div>
                <div className="flex items-center gap-3"><Activity className="w-5 h-5 text-yellow-600" /><span className="text-sm text-gray-700">Activity Timeline</span></div>
                <div className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-yellow-600" /><span className="text-sm text-gray-700">Advanced Analytics</span></div>
              </div>
              <div className="flex gap-3">
                <button onClick={activatePremium}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white py-3 rounded-xl font-bold hover:brightness-110 transition">
                  Upgrade Now
                </button>
                <button onClick={() => { setShowPremiumModal(false); setUpgradeReason(''); }}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
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

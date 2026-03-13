import React, { useState, useEffect } from 'react';

// Firebase will be loaded from CDN in index.html
// We'll access it via window object

// ===== SUPPRESS METAMASK/WALLET ERRORS =====
// These errors are caused by browser extensions and don't affect the app
if (typeof window !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    const errorString = args.join(' ');
    // Suppress MetaMask and wallet extension errors
    if (
      errorString.includes('MetaMask') ||
      errorString.includes('ethereum') ||
      errorString.includes('evmAsk') ||
      errorString.includes('inpage.js') ||
      errorString.includes('wallet extension')
    ) {
      return; // Silently ignore these errors
    }
    originalError.apply(console, args);
  };
}
// ===== END ERROR SUPPRESSION =====

// ===== CRITICAL FIX: localStorage wrapper =====
// window.storage API only exists in Claude artifacts, not in browsers
// This wrapper makes the app work in regular web browsers
const storage = {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? { key, value, shared: false } : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return { key, value, shared: false };
    } catch (e) {
      console.error('Storage set error:', e);
      return null;
    }
  },
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return { key, deleted: true, shared: false };
    } catch (e) {
      console.error('Storage delete error:', e);
      return null;
    }
  }
};

const IMGBB_API_KEY = '45e4867978578c60e64cd227d710e1db';

// Make it available globally for compatibility
if (typeof window !== 'undefined') {
  window.storage = storage;
}
// ===== END CRITICAL FIX =====

// NO AUTH PAGE COMPONENT - We redirect to landing page instead!

// --- CONTACT DETAIL VIEW ---
function ContactDetailView({ contact, onClose, onUpdate, onAddActivity, activities, categories = [], allContacts = [], onIcebreaker, onOpenContact }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState({ meetingLink: '', referredBy: '', ...contact });
  const [bookingLogged, setBookingLogged] = useState(false);
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

  const handleBookCall = () => {
    const link = contact.meetingLink || editedContact.meetingLink;
    if (!link) return;
    window.open(link.startsWith('http') ? link : `https://${link}`, '_blank');
    // Auto-log a "Meeting Scheduled" activity
    if (!bookingLogged) {
      onAddActivity({
        contactId: contact.id,
        id: Date.now().toString(),
        type: 'meeting',
        content: 'Meeting scheduled via booking link.',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      });
      setBookingLogged(true);
    }
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'email': return <span className="material-symbols-outlined text-[16px]">mail</span>;
      case 'call': return <span className="material-symbols-outlined text-[16px]">phone</span>;
      case 'meeting': return <span className="material-symbols-outlined text-[16px]">group</span>;
      case 'note': return <span className="material-symbols-outlined text-[16px]">description</span>;
      default: return <span className="material-symbols-outlined text-[16px]">timeline</span>;
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
                  <span className="material-symbols-outlined text-[16px]">mail</span> {contact.email}
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
              {/* Icebreaker AI */}
              <button onClick={() => onIcebreaker(contact)}
                title="Draft Icebreaker"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-1.5 text-xs font-bold">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Icebreaker
              </button>
              {isEditing ? (
                <button onClick={handleSave} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                  <span className="material-symbols-outlined text-[20px]">save</span>
                </button>
              ) : (
                <button onClick={() => setIsEditing(true)} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              )}
              <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {(() => {
            const referralsSentCount = allContacts.filter(c => c.referredBy === contact.id).length;
            return (
              <div className={`grid gap-4 mb-6 ${referralsSentCount > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
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
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
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
                    <span className="material-symbols-outlined text-[16px]">timeline</span>
                    <span className="text-xs font-medium">Activities</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{contactActivities.length}</p>
                </div>
                {referralsSentCount > 0 && (
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-pink-600 mb-2">
                      <span className="material-symbols-outlined text-[16px]">group</span>
                      <span className="text-xs font-medium">Referrals Sent</span>
                    </div>
                    <p className="text-3xl font-bold text-pink-900">{referralsSentCount}</p>
                  </div>
                )}
              </div>
            );
          })()}

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

          {/* Category editor */}
          {categories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-indigo-500">label</span> Category
              </h3>
              {isEditing ? (
                <div className="flex gap-2 flex-wrap">
                  <button type="button"
                    onClick={() => setEditedContact({...editedContact, category: ''})}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${!editedContact.category ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    None
                  </button>
                  {categories.map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setEditedContact({...editedContact, category: editedContact.category === cat.id ? '' : cat.id})}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                        editedContact.category === cat.id ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                      style={editedContact.category === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: editedContact.category === cat.id ? 'rgba(255,255,255,0.6)' : cat.color }}></span>
                      {cat.name}
                    </button>
                  ))}
                </div>
              ) : contact.category ? (() => {
                const cat = categories.find(c => c.id === contact.category);
                return cat ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: cat.color }}>
                    {cat.name}
                  </span>
                ) : null;
              })() : (
                <p className="text-sm text-gray-400 italic">No category assigned — click Edit to add one.</p>
              )}
            </div>
          )}

          {/* FEATURE 3: MEETING LINK / BOOK CALL */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-green-500">calendar_today</span> Meeting Link
            </h3>
            {isEditing ? (
              <input
                type="url"
                placeholder="https://calendly.com/your-link"
                value={editedContact.meetingLink || ''}
                onChange={(e) => setEditedContact({...editedContact, meetingLink: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (contact.meetingLink || editedContact.meetingLink) ? (
              <button onClick={handleBookCall}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold transition">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                Book a Call
                {bookingLogged && <span className="material-symbols-outlined text-[16px] opacity-70">check_circle</span>}
              </button>
            ) : (
              <p className="text-sm text-gray-400 italic">No booking link — click Edit to add your Calendly or SavvyCal link.</p>
            )}
          </div>

          {/* FEATURE 5: REFERRED BY — with clickable referrer link */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-purple-500">group</span> Referred By
            </h3>
            {isEditing ? (
              <select
                value={editedContact.referredBy || ''}
                onChange={(e) => setEditedContact({...editedContact, referredBy: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">— No referrer —</option>
                {allContacts.filter(c => c.id !== contact.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                ))}
              </select>
            ) : contact.referredBy ? (() => {
              const referrer = allContacts.find(c => c.id === contact.referredBy);
              return referrer ? (
                <button
                  onClick={() => { onClose(); setTimeout(() => onOpenContact(referrer), 50); }}
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition group">
                  <span className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-sm font-bold text-purple-700 flex-shrink-0">
                    {referrer.name[0].toUpperCase()}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-purple-800 group-hover:underline">{referrer.name}</p>
                    {referrer.company && <p className="text-xs text-purple-400">{referrer.company}</p>}
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-purple-300">arrow_forward</span>
                </button>
              ) : null;
            })() : (
              <p className="text-sm text-gray-400 italic">No referrer — click Edit to link one.</p>
            )}
          </div>

          {/* Referrals Sent by this contact */}
          {(() => {
            const referralsSent = allContacts.filter(c => c.referredBy === contact.id);
            if (referralsSent.length === 0) return null;
            return (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl">
                <h3 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">group</span> Referrals Sent
                  <span className="ml-auto bg-purple-200 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{referralsSent.length}</span>
                </h3>
                <div className="space-y-2">
                  {referralsSent.map(r => (
                    <button key={r.id}
                      onClick={() => { onClose(); setTimeout(() => onOpenContact(r), 50); }}
                      className="w-full flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition group text-left">
                      <span className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-600 flex-shrink-0">
                        {r.name[0].toUpperCase()}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-purple-700">{r.name}</p>
                        {r.company && <p className="text-xs text-gray-400 truncate">{r.company}</p>}
                      </div>
                      <span className="material-symbols-outlined text-[14px] text-gray-300">arrow_forward</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Activity Timeline</h3>
              <button
                onClick={() => setShowActivityForm(!showActivityForm)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700"
              >
                <span className="material-symbols-outlined text-[16px]">add</span> Add Activity
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
                  <span className="material-symbols-outlined text-[48px] opacity-50">timeline</span>
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
            <span className="material-symbols-outlined text-[32px] text-blue-600">analytics</span> Analytics Dashboard
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
            <span className="material-symbols-outlined text-[32px] opacity-80">group</span>
            <p className="text-3xl font-bold">{totalContacts}</p>
            <p className="text-sm opacity-90">Total Contacts</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <span className="material-symbols-outlined text-[32px] opacity-80">trending_up</span>
            <p className="text-3xl font-bold">{avgVibeScore}</p>
            <p className="text-sm opacity-90">Avg Vibe Score</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <span className="material-symbols-outlined text-[32px] opacity-80">error</span>
            <p className="text-3xl font-bold">{overdueContacts}</p>
            <p className="text-sm opacity-90">Need Attention</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <span className="material-symbols-outlined text-[32px] opacity-80">timeline</span>
            <p className="text-3xl font-bold">{activities.length}</p>
            <p className="text-sm opacity-90">Total Activities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">pie_chart</span> Vibe Score Distribution
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
              <span className="material-symbols-outlined text-[20px]">timeline</span> Recent Activity
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

        {/* FEATURE 5: REFERRAL LEADERBOARD */}
        {(() => {
          const referralCounts = {};
          contacts.forEach(c => {
            if (c.referredBy) {
              referralCounts[c.referredBy] = (referralCounts[c.referredBy] || 0) + 1;
            }
          });
          const leaderboard = Object.entries(referralCounts)
            .map(([id, count]) => ({ contact: contacts.find(c => c.id === id), count }))
            .filter(r => r.contact)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          if (leaderboard.length === 0) return null;
          return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-purple-500">group</span> Top Referrers
              </h3>
              <div className="space-y-2">
                {leaderboard.map((r, i) => (
                  <div key={r.contact.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                    <span className="w-7 h-7 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800 text-sm">{r.contact.name}</p>
                      {r.contact.company && <p className="text-xs text-gray-400">{r.contact.company}</p>}
                    </div>
                    <span className="text-sm font-bold text-purple-700">{r.count} referral{r.count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">download</span> Export Data
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

// Admin Change Requests Component - Defined before App component
function AdminChangeRequests() {
  const [allRequests, setAllRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllRequests();
  }, []);

  const loadAllRequests = async () => {
    try {
      const usersRef = window.collection(window.firebaseDb, 'users');
      const snapshot = await window.getDocs(usersRef);
      
      const requests = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.emailConfig?.changeRequests) {
          userData.emailConfig.changeRequests.forEach((request) => {
            requests.push({
              ...request,
              userId: doc.id,
              userName: userData.name
            });
          });
        }
      });
      
      // Sort by date (newest first)
      requests.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
      
      setAllRequests(requests);
      setLoading(false);
    } catch (err) {
      console.error('Error loading requests:', err);
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    if (!confirm(`Approve email change for ${request.userName}?\n\nFrom: ${request.currentEmail}\nTo: ${request.requestedEmail}`)) {
      return;
    }

    try {
      const userRef = window.doc(window.firebaseDb, 'users', request.userId);
      const userDoc = await window.getDoc(userRef);
      const userData = userDoc.data();
      
      // Update email config
      const updatedEmailConfig = {
        ...userData.emailConfig,
        defaultEmail: request.requestedEmail,
        customEmailPrefix: request.requestedPrefix,
        changeRequests: userData.emailConfig.changeRequests.map(r =>
          r.id === request.id
            ? { ...r, status: 'approved', approvedAt: new Date().toISOString() }
            : r
        )
      };
      
      await window.setDoc(userRef, { emailConfig: updatedEmailConfig }, { merge: true });
      
      alert('✅ Email change approved!');
      loadAllRequests();
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Error approving request. Please try again.');
    }
  };

  const handleReject = async (request) => {
    const reason = prompt(`Reject email change for ${request.userName}?\n\nProvide a reason (optional):`);
    
    if (reason === null) return; // Cancelled

    try {
      const userRef = window.doc(window.firebaseDb, 'users', request.userId);
      const userDoc = await window.getDoc(userRef);
      const userData = userDoc.data();
      
      // Update request status
      const updatedEmailConfig = {
        ...userData.emailConfig,
        changeRequests: userData.emailConfig.changeRequests.map(r =>
          r.id === request.id
            ? { ...r, status: 'rejected', rejectedAt: new Date().toISOString(), rejectionReason: reason || 'No reason provided' }
            : r
        )
      };
      
      await window.setDoc(userRef, { emailConfig: updatedEmailConfig }, { merge: true });
      
      alert('❌ Email change rejected');
      loadAllRequests();
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Error rejecting request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingRequests = allRequests.filter(r => r.status === 'pending');
  const processedRequests = allRequests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-yellow-600">pending</span>
          Pending Requests ({pendingRequests.length})
        </h3>
        
        {pendingRequests.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-slate-400 text-[48px] mb-2">done_all</span>
            <p className="text-slate-500">No pending requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900">{request.userName}</p>
                      <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-bold rounded">PENDING</span>
                    </div>
                    <p className="text-xs text-slate-500">Requested: {new Date(request.requestedAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Current Email:</p>
                      <p className="font-mono font-bold text-red-700">{request.currentEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Requested Email:</p>
                      <p className="font-mono font-bold text-green-700">{request.requestedEmail}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-100 rounded-lg p-3 mb-3">
                  <p className="text-xs text-slate-600 font-semibold mb-1">Reason:</p>
                  <p className="text-sm text-slate-800">{request.reason}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(request)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(request)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-600">history</span>
            Recent History ({processedRequests.slice(0, 10).length})
          </h3>
          
          <div className="space-y-2">
            {processedRequests.slice(0, 10).map((request) => (
              <div key={request.id} className={`border rounded-lg p-3 ${
                request.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-slate-900">{request.userName}</p>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                        request.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                      }`}>
                        {request.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-600">
                      {request.currentEmail} → {request.requestedEmail}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(request.approvedAt || request.rejectedAt).toLocaleDateString()}
                  </p>
                </div>
                {request.status === 'rejected' && request.rejectionReason && (
                  <p className="text-xs text-red-700 mt-2">Reason: {request.rejectionReason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function IcebreakerMessageCard({ channel, contact, subject, body, onSubjectChange, onBodyChange, darkMode, isCopied, onCopy, onOpen, icebreakerChannels, user }) {
  const isEmail = channel === 'email';
  const fullMsg = isEmail && subject ? `${subject} | ${body}` : body;
  const ch = icebreakerChannels.find(c => c.id === channel);

  const sendEmail = async () => {
    try {
      const r = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.email,
          subject: subject || 'Quick hello',
          body: body,
          fromName: user?.emailConfig?.fromName || user?.name,
          fromEmail: user?.emailConfig?.customEmail || user?.emailConfig?.defaultEmail || null,
          replyToEmail: user?.emailConfig?.replyToEmail || user?.email || null,
          images: [], links: []
        })
      });
      const t = document.createElement('div');
      t.className = `fixed top-4 left-1/2 -translate-x-1/2 ${r.ok ? 'bg-green-600' : 'bg-red-500'} text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2`;
      t.innerHTML = r.ok ? '<span class="material-symbols-outlined text-[18px]">check_circle</span> Email sent!' : 'Failed to send email';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2500);
    } catch(e) { alert('Failed to send.'); }
  };

  return (
    <div className={`rounded-xl border-2 transition ${
      isCopied
        ? darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-400 bg-green-50'
        : darkMode ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-100 bg-indigo-50'
    }`}>
      <div className="p-5 space-y-3">
        {isEmail && (
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Subject</p>
            <input
              type="text"
              value={subject}
              onChange={e => onSubjectChange(e.target.value)}
              className={`w-full text-sm font-semibold border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-white border-indigo-200 text-gray-800'}`}
            />
          </div>
        )}
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Message</p>
          <textarea
            value={body}
            rows={5}
            onChange={e => onBodyChange(e.target.value)}
            className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 leading-relaxed resize-none ${darkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-indigo-200 text-gray-700'}`}
          />
        </div>
      </div>
      <div className={`border-t px-4 py-3 flex gap-2 flex-wrap ${darkMode ? 'border-indigo-700' : 'border-indigo-100'}`}>
        <button onClick={() => onCopy(fullMsg, 0)}
          className={`flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition ${
            isCopied ? 'bg-green-500 text-white' : darkMode ? 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
          }`}>
          {isCopied ? '\u2713 Copied!' : '\ud83d\udccb Copy Message'}
        </button>
        {isEmail && contact?.email && (
          <button onClick={sendEmail}
            className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition">
            \u2709\ufe0f Send Email
          </button>
        )}
        {channel === 'whatsapp' && (
          <button onClick={() => onOpen('whatsapp', fullMsg)}
            className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition">
            \ud83d\udcac Open WhatsApp
          </button>
        )}
        {['linkedin','instagram','twitter','facebook'].includes(channel) && (
          <button onClick={() => onOpen(channel, fullMsg)}
            className={`flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white transition ${ch?.color || 'bg-slate-700 hover:bg-slate-800'}`}>
            {ch?.icon} Open {ch?.label}
          </button>
        )}
      </div>
    </div>
  );
}

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
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [bulkUpdate, setBulkUpdate] = useState({ selectedIds: [], date: new Date().toISOString().split('T')[0], note: '', addActivity: true });
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [filterTag, setFilterTag] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // 'name' | 'lastContact' | 'vibe' | 'dateAdded'
  const [sortDir, setSortDir] = useState('asc');
  const [filterVibe, setFilterVibe] = useState('all'); // 'all' | 'hot' | 'warm' | 'cold'
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterStale, setFilterStale] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [categories, setCategories] = useState([]); // [{ id, name, color }]
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#6366f1');
  const [bulkImportCategory, setBulkImportCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'board'
  const [showIcebreaker, setShowIcebreaker] = useState(false);
  const [icebreakerContact, setIcebreakerContact] = useState(null);
  const [icebreakerLines, setIcebreakerLines] = useState([]);
  const [icebreakerLoading, setIcebreakerLoading] = useState(false);
  const [icebreakerChannel, setIcebreakerChannel] = useState('whatsapp');
  const [icebreakerCopied, setIcebreakerCopied] = useState(null);
  const [icebreakerEditSubject, setIcebreakerEditSubject] = useState('');
  const [icebreakerEditBody, setIcebreakerEditBody] = useState('');
  const [nudgeEnabled, setNudgeEnabled] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState(null); // 'cold' | 'warm' | 'hot'
  const [draggingId, setDraggingId] = useState(null);
  const [bulkContactsText, setBulkContactsText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [bulkEmailData, setBulkEmailData] = useState({ subject: '', body: '', selectedContacts: [], purpose: '', customPrompt: '', scheduleDate: '', scheduleTime: '', lastUsedPrompt: '', lastUsedPurpose: '', images: [], links: [] });
  const [emailSendMethod, setEmailSendMethod] = useState('mailto'); // 'copy' | 'mailto'
  const [emailSendStatus, setEmailSendStatus] = useState(''); // 'sending' | 'done' | ''
  const [showBulkIcebreaker, setShowBulkIcebreaker] = useState(false);
  const [bulkIcebreakerData, setBulkIcebreakerData] = useState({ selectedContacts: [], channel: 'email', social: 'whatsapp', customPrompt: '', generatedMessage: '', emailResults: {}, showSocialDropdown: false, sending: false });
  const [bulkIcebreakerLoading, setBulkIcebreakerLoading] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '', email: '', phone: '', company: '', jobTitle: '', website: '', address: '',
    lastContactDate: '', vibeScore: 5, vibeLabel: 'warm',
    notes: '', tags: [], category: '', meetingLink: '', referredBy: '', reminderDays: 30, contactFrequency: 30
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

  // --- TODAY'S FOCUS MODAL STATES ---
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [showFocusSettings, setShowFocusSettings] = useState(false);
  const [focusSettings, setFocusSettings] = useState(() => {
    const saved = localStorage.getItem('focus_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      dayThreshold: 7,
      vibeScoreMin: 8
    };
  });

  // --- NAVIGATION & VIEW STATES ---
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'contacts' | 'deals' | 'tasks' | 'analytics'
  const [showBusinessProfile, setShowBusinessProfile] = useState(false);
  const [businessProfile, setBusinessProfile] = useState(() => {
    const saved = localStorage.getItem('business_profile');
    return saved ? JSON.parse(saved) : {
      businessName: '',
      industry: '',
      description: '',
      targetAudience: '',
      valueProposition: ''
    };
  });

  // --- IN-APP EMAIL SENDER STATES ---
  const [showEmailComposer, setShowEmailComposer] = useState(false);
 const [emailComposerData, setEmailComposerData] = useState({
  to: [],
  subject: '',
  body: '',
  useAI: false,
  selectedContacts: [],
  purpose: '',        // NEW - Feature 3
  scheduleDate: '',   // NEW - Feature 2
  scheduleTime: ''    // NEW - Feature 2
});

// NEW - Feature 1: Collapsible Sidebar
const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
  const saved = localStorage.getItem('sidebar_collapsed');
  return saved ? JSON.parse(saved) : false;
});

// NEW - Feature 4: Dark Mode
const [darkMode, setDarkMode] = useState(() => {
  const saved = localStorage.getItem('dark_mode');
  return saved ? JSON.parse(saved) : false;
});

// NEW - Feature 6: Compact Smart Capture
const [showMagicPaste, setShowMagicPaste] = useState(false);
const [showScanCapture, setShowScanCapture] = useState(false);
const [showSortOptions, setShowSortOptions] = useState(false);
const [showCustomPrompt, setShowCustomPrompt] = useState(false);
const [showEmailSettings, setShowEmailSettings] = useState(false);
const [showDomainWizard, setShowDomainWizard] = useState(false);
const [domainWizardStep, setDomainWizardStep] = useState(1); // 1: Enter domain, 2: Add DNS, 3: Verify
const [customDomain, setCustomDomain] = useState('');
const [domainVerifying, setDomainVerifying] = useState(false);
const [showEmailSetup, setShowEmailSetup] = useState(false);  // First-time email setup
const [customEmailPrefix, setCustomEmailPrefix] = useState('');
const [checkingAvailability, setCheckingAvailability] = useState(false);
const [emailAvailable, setEmailAvailable] = useState(null);
const [showAdminPanel, setShowAdminPanel] = useState(false);  // Admin change request panel

  // ===== EMERGENCY MODAL ESCAPE SYSTEM =====
  // Close all modals with ESC key
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // Close all modals
        setSelectedContact(null);
        setShowAddModal(false);
        setShowBulkImport(false);
        setShowBulkEmail(false);
        setShowBulkUpdate(false);
        setShowPremiumModal(false);
        setShowAnalytics(false);
        setShowCategoryManager(false);
        setShowIcebreaker(false);
        setShowBulkIcebreaker(false);
        setShowFocusModal(false);
        setShowBusinessProfile(false);
        setShowEmailComposer(false);
        console.log('✅ All modals closed via ESC key');
      }
    };
    
    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, []);

  // Persist sidebar collapsed state
useEffect(() => {
  localStorage.setItem('sidebar_collapsed', JSON.stringify(sidebarCollapsed));
}, [sidebarCollapsed]);

// Persist dark mode
useEffect(() => {
  localStorage.setItem('dark_mode', JSON.stringify(darkMode));
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [darkMode]);

  // Auto-close loading screen after 3 seconds as failsafe
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.log('⚠️ Loading timeout - forcing app to load');
        setIsLoading(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  // ===== END EMERGENCY SYSTEM =====

  // ===== FIREBASE AUTH CHECK =====
  useEffect(() => {
    let unsubscribe;
    
    const checkAuth = () => {
      // Wait for Firebase to be ready
      if (!window.firebaseReady || !window.firebaseAuth || !window.onAuthStateChanged) {
        console.log('⏳ Waiting for Firebase to load...');
        setTimeout(checkAuth, 100);
        return;
      }
      
      console.log('✅ Firebase ready, checking auth state...');
      
      try {
        unsubscribe = window.onAuthStateChanged(window.firebaseAuth, (firebaseUser) => {
          console.log('🔍 Auth state:', firebaseUser ? firebaseUser.email : 'No user');
          
          if (firebaseUser) {
            // User is logged in - get their data from Firestore
            const loadUserData = async () => {
              try {
                const userDocRef = window.doc(window.firebaseDb, 'users', firebaseUser.uid);
                const userDoc = await window.getDoc(userDocRef);
                
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  console.log('✅ User data loaded:', userData.name);
                  
                  // Check email config - don't auto-generate anymore
                  let emailConfig = userData.emailConfig;
                  if (!emailConfig) {
                    // User hasn't set their email yet - set to pending
                    emailConfig = {
                      defaultEmail: null,              // Not set yet
                      customEmailPrefix: null,         // User will choose this
                      fromName: userData.name || firebaseUser.email.split('@')[0],
                      customDomain: null,
                      customEmail: null,
                      domainVerified: false,
                      emailPending: true,              // Needs to set email
                      changeRequests: [],              // Array of change requests
                      createdAt: new Date().toISOString()
                    };
                    
                    // Save to Firestore
                    try {
                      await window.setDoc(userDocRef, { emailConfig }, { merge: true });
                      console.log('✅ Email config initialized (pending)');
                    } catch (err) {
                      console.error('❌ Error saving email config:', err);
                    }
                  }
                  
                  setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: userData.name || firebaseUser.email.split('@')[0],
                    isPremium: userData.isPremium || false,
                    isAdmin: userData.isAdmin || false,  // Admin flag
                    emailConfig: emailConfig
                  });
                  setIsPremium(userData.isPremium || false);
                } else {
                  // User exists in auth but not in Firestore - create doc
                  console.log('📝 Creating new user document');
                  
                  const userName = firebaseUser.email.split('@')[0];
                  
                  const emailConfig = {
                    defaultEmail: null,              // Not set yet
                    customEmailPrefix: null,         // User will choose this
                    fromName: userName,
                    customDomain: null,
                    customEmail: null,
                    domainVerified: false,
                    emailPending: true,              // Needs to set email
                    changeRequests: [],              // Array of change requests
                    createdAt: new Date().toISOString()
                  };
                  
                  await window.setDoc(window.doc(window.firebaseDb, 'users', firebaseUser.uid), {
                    email: firebaseUser.email,
                    name: firebaseUser.email.split('@')[0],
                    isPremium: false,
                    isAdmin: false,                  // Not admin by default
                    emailConfig: emailConfig,
                    createdAt: new Date().toISOString()
                  });
                  
                  console.log('✅ User created (email pending)');
                  
                  setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.email.split('@')[0],
                    isPremium: false,
                    isAdmin: false,
                    emailConfig: emailConfig
                  });
                }
                setIsLoading(false);
              } catch (error) {
                console.error('❌ Error loading user data:', error);
                setIsLoading(false);
              }
            };
            
            loadUserData();
          } else {
            // No Firebase user - redirect to landing page
            console.log('❌ No Firebase user - redirecting to landing');
            setIsLoading(false);
            window.location.href = '/';
          }
        });
      } catch (error) {
        console.error('❌ Firebase auth check error:', error);
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  // ===== END FIREBASE AUTH CHECK =====

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
      // Call our serverless function instead of Claude API directly
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data, mimeType })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze image');
      }

      const parsed = await response.json();
      
      // Build feedback messages
      const detected = [];
      if (parsed.name)     detected.push(`👤 ${parsed.name}`);
      if (parsed.email)    detected.push(`📧 ${parsed.email}`);
      if (parsed.phone)    detected.push(`📞 ${parsed.phone}`);
      if (parsed.company)  detected.push(`🏢 ${parsed.company}`);
      if (parsed.jobTitle) detected.push(`💼 ${parsed.jobTitle}`);
      if (parsed.website)  detected.push(`🌐 ${parsed.website}`);
      if (parsed.address)  detected.push(`📍 ${parsed.address}`);

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

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    
    // Limit size to prevent 413 errors
    let width = video.videoWidth;
    let height = video.videoHeight;
    const maxWidth = 1200;
    
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(video, 0, 0, width, height);
    
    // Compress to JPEG with 0.8 quality
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];
    
    setScanPreview(dataUrl);
    stopCamera();
    setScanMode('preview');
    analyzeImageWithAI(base64, 'image/jpeg');
  };

  // --- FILE UPLOAD for image ---
  // Compress image to prevent 413 Payload Too Large errors
  const compressImage = (dataUrl, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = dataUrl;
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      
      // Compress image before sending to API
      const compressedDataUrl = await compressImage(dataUrl);
      const base64 = compressedDataUrl.split(',')[1];
      const mimeType = 'image/jpeg'; // Always JPEG after compression
      
      setScanPreview(compressedDataUrl);
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

  // --- Persist focus settings to localStorage ---
  useEffect(() => {
    localStorage.setItem('focus_settings', JSON.stringify(focusSettings));
  }, [focusSettings]);

  // --- Persist business profile to localStorage ---
  useEffect(() => {
    localStorage.setItem('business_profile', JSON.stringify(businessProfile));
  }, [businessProfile]);

  // --- TODAY'S FOCUS: Hot contacts not reached in X days (user configurable) ---
  const focusContacts = React.useMemo(() => {
    if (!focusSettings.enabled) return [];
    
    return contacts
      .filter(c => {
        const isHot = c.vibeLabel === 'hot' || c.vibeScore >= focusSettings.vibeScoreMin;
        const days = c.lastContactDate
          ? Math.ceil((new Date() - new Date(c.lastContactDate)) / (1000 * 60 * 60 * 24))
          : 999;
        return isHot && days >= focusSettings.dayThreshold;
      })
      .sort((a, b) => {
        // Sort by days since contact (oldest first)
        const daysA = a.lastContactDate ? Math.ceil((new Date() - new Date(a.lastContactDate)) / (1000 * 60 * 60 * 24)) : 999;
        const daysB = b.lastContactDate ? Math.ceil((new Date() - new Date(b.lastContactDate)) / (1000 * 60 * 60 * 24)) : 999;
        return daysB - daysA;
      });
  }, [contacts, focusSettings]);

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
      const savedCategories = await window.storage.get('crm_categories');
      if (savedCategories?.value) setCategories(JSON.parse(savedCategories.value));
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

  const saveCategories = async (cats) => {
    await window.storage.set('crm_categories', JSON.stringify(cats));
  };

  const addCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.find(c => c.name.toLowerCase() === name.toLowerCase())) return;
    const cat = { id: Date.now().toString(), name, color: newCategoryColor };
    const updated = [...categories, cat];
    setCategories(updated);
    await saveCategories(updated);
    setNewCategoryName('');
    setNewCategoryColor('#6366f1');
  };

  const deleteCategory = async (id) => {
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    await saveCategories(updated);
    // Remove category from any contacts that had it
    const updatedContacts = contacts.map(c =>
      c.category === id ? { ...c, category: '' } : c
    );
    setContacts(updatedContacts);
    await saveContacts(updatedContacts);
  };

  const updateContactCategory = async (contactId, categoryId) => {
    const updated = contacts.map(c =>
      c.id === contactId ? { ...c, category: categoryId } : c
    );
    setContacts(updated);
    await saveContacts(updated);
  };

  // --- FEATURE 1: ICEBREAKER AI ---
  const generateIcebreaker = async (contact, channel = icebreakerChannel) => {
    setIcebreakerContact(contact);
    setIcebreakerLines([]);
    setIcebreakerEditSubject('');
    setIcebreakerEditBody('');
    setIcebreakerLoading(true);
    setIcebreakerCopied(null);
    setShowIcebreaker(true);
    
    try {
      // Call our serverless function with business profile context
      const response = await fetch('/api/generate-icebreaker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contact, 
          channel,
          businessProfile // Include business context for better AI generation
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate icebreaker');
      }

      const data = await response.json();
      const lines = data.lines || [];
      setIcebreakerLines(lines);
      // Populate editable fields from first line — use local `channel` param not state
      const first = lines[0] || '';
      const hasSub = channel === 'email' && first.includes(' | ');
      setIcebreakerEditSubject(hasSub ? first.split(' | ')[0] : '');
      setIcebreakerEditBody(hasSub ? first.split(' | ').slice(1).join(' | ') : first);
    } catch (err) {
      const errMsg = 'Could not generate — check your connection and try again.';
      setIcebreakerLines([errMsg]);
      setIcebreakerEditBody(errMsg);
      setIcebreakerEditSubject('');
    }
    setIcebreakerLoading(false);
  };

  const copyIcebreakerLine = (line, index) => {
    navigator.clipboard.writeText(line);
    setIcebreakerCopied(index);
    setTimeout(() => setIcebreakerCopied(null), 2000);
  };

  // Channel definitions — used in both single + bulk modals
  const icebreakerChannels = [
    { id: 'whatsapp',  icon: '💬', label: 'WhatsApp',   color: 'bg-green-500 hover:bg-green-600' },
    { id: 'email',     icon: '✉️', label: 'Email',      color: 'bg-indigo-500 hover:bg-indigo-600' },
    { id: 'linkedin',  icon: '💼', label: 'LinkedIn',   color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'instagram', icon: '📸', label: 'Instagram',  color: 'bg-pink-500 hover:bg-pink-600' },
    { id: 'twitter',   icon: '𝕏',  label: 'X/Twitter',  color: 'bg-slate-800 hover:bg-slate-900' },
    { id: 'facebook',  icon: '👥', label: 'Facebook',   color: 'bg-blue-500 hover:bg-blue-600' },
  ];

  // Returns the deep-link URL for a channel + message
  const getChannelUrl = (channel, message) => {
    const enc = encodeURIComponent(message);
    switch (channel) {
      case 'whatsapp':  return `https://wa.me/?text=${enc}`;
      case 'linkedin':  return `https://www.linkedin.com/messaging/compose/?body=${enc}`;
      case 'twitter':   return `https://twitter.com/messages/compose?text=${enc}`;
      case 'facebook':  return `https://www.facebook.com/messages/new`;
      case 'instagram': return `https://ig.me/m/`;
      default:          return null;
    }
  };

  // Open channel app with message pre-filled (copies first, then redirects)
  const openChannelWithMessage = (channel, message) => {
    navigator.clipboard.writeText(message);
    const url = getChannelUrl(channel, message);
    if (url) setTimeout(() => window.open(url, '_blank'), 200);
  };

  // --- BULK ICEBREAKER ---
  const generateBulkIcebreakers = async () => {
    const selectedContactsList = contacts.filter(c => bulkIcebreakerData.selectedContacts.includes(c.id));
    const isEmail = bulkIcebreakerData.channel === 'email';
    const ch = isEmail ? 'email' : bulkIcebreakerData.social;

    setBulkIcebreakerLoading(true);
    setBulkIcebreakerData(prev => ({ ...prev, generatedMessage: '', emailResults: {} }));

    if (isEmail) {
      // ── EMAIL MODE: one personalised message per contact ──────────────────
      // Requires at least one contact selected
      if (!selectedContactsList.length) {
        setBulkIcebreakerLoading(false);
        return;
      }
      const results = {};
      for (const contact of selectedContactsList) {
        try {
          const response = await fetch('/api/generate-icebreaker', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contact,
              channel: 'email',
              businessProfile,
              customPrompt: bulkIcebreakerData.customPrompt || '',
            })
          });
          if (!response.ok) throw new Error('Failed');
          const data = await response.json();
          const msg = Array.isArray(data.lines) ? data.lines[0] : (data.message || '');
          results[contact.id] = msg;
        } catch(e) {
          results[contact.id] = 'Error generating — try again.';
        }
      }
      setBulkIcebreakerData(prev => ({ ...prev, emailResults: results }));
    } else {
      // ── SOCIAL MODE: one generic broadcast message, no names ──────────────
      try {
        const response = await fetch('/api/generate-bulk-icebreakers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contacts: [],           // no contact data — message must be name-free
            channel: ch,
            businessProfile,
            customPrompt: bulkIcebreakerData.customPrompt || '',
            singleMessage: true,
            broadcastMode: true,    // signal: generic, no names
          })
        });
        if (!response.ok) throw new Error((await response.json()).error || 'Failed');
        const data = await response.json();
        let msg = '';
        if (typeof data.message === 'string') msg = data.message;
        else if (data.results) msg = Object.values(data.results)[0] || '';
        else if (Array.isArray(data.lines)) msg = data.lines[0] || '';
        setBulkIcebreakerData(prev => ({ ...prev, generatedMessage: msg }));
      } catch(err) {
        setBulkIcebreakerData(prev => ({ ...prev, generatedMessage: 'Error generating — please try again.' }));
      }
    }
    setBulkIcebreakerLoading(false);
  };

  const copyAllBulkIcebreakers = () => {
    const msg = bulkIcebreakerData.generatedMessage;
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    const t = document.createElement('div');
    t.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
    t.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span> Message copied!';
    document.body.appendChild(t); setTimeout(() => t.remove(), 2000);
  };

  const sendAllBulkIcebreakers = async () => {
    const ch = bulkIcebreakerData.channel;
    const isEmail = ch === 'email';

    if (isEmail) {
      const list = contacts.filter(c => bulkIcebreakerData.selectedContacts.includes(c.id) && c.email);
      if (!list.length) { alert('No contacts with email addresses selected.'); return; }
      setBulkIcebreakerData(prev => ({ ...prev, sending: true }));
      let sent = 0, failed = 0;
      for (let i = 0; i < list.length; i++) {
        const contact = list[i];
        const msg = bulkIcebreakerData.emailResults[contact.id] || '';
        const parts = msg.includes(' | ') ? msg.split(' | ') : [null, msg];
        try {
          const r = await fetch('/api/send-email', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: contact.email,
              subject: parts[0] || 'Quick hello',
              body: parts[1] || msg,
              fromName: user?.emailConfig?.fromName || user?.name,
              fromEmail: user?.emailConfig?.customEmail || user?.emailConfig?.defaultEmail || null,
              replyToEmail: user?.emailConfig?.replyToEmail || user?.email || null,
              images: [], links: []
            })
          });
          r.ok ? sent++ : failed++;
        } catch(e) { failed++; }
        if (i < list.length - 1) await new Promise(r => setTimeout(r, 400));
      }
      setBulkIcebreakerData(prev => ({ ...prev, sending: false }));
      const t = document.createElement('div');
      t.className = `fixed top-4 left-1/2 -translate-x-1/2 ${failed ? 'bg-yellow-600' : 'bg-green-600'} text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2`;
      t.innerHTML = `<span class="material-symbols-outlined text-[18px]">check_circle</span> ${sent} sent${failed ? `, ${failed} failed` : ''}`;
      document.body.appendChild(t); setTimeout(() => t.remove(), 4000);
      return;
    }

    // Social broadcast: copy then open platform
    const msg = bulkIcebreakerData.generatedMessage;
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    const url = getChannelUrl(bulkIcebreakerData.social, msg);
    if (url) setTimeout(() => window.open(url, '_blank'), 200);
    const chLabel = icebreakerChannels.find(c => c.id === bulkIcebreakerData.social)?.label || '';
    const t = document.createElement('div');
    t.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-semibold shadow-lg z-[60] text-sm text-center max-w-xs';
    t.innerHTML = `Message copied! Opening ${chLabel} — select your BC list or recipients there.`;
    document.body.appendChild(t); setTimeout(() => t.remove(), 5000);
  };
  // --- FEATURE 4: BROWSER NUDGE NOTIFICATIONS ---
  const requestNudgePermission = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNudgeEnabled(perm === 'granted');
    if (perm === 'granted') checkAndSendNudges(contacts);
  };

  const checkAndSendNudges = (contactList) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const staleHot = contactList.filter(c => {
      const isHot = c.vibeLabel === 'hot' || c.vibeScore >= 8;
      const days = c.lastContactDate
        ? Math.ceil((new Date() - new Date(c.lastContactDate)) / 86400000) : 999;
      return isHot && days >= 14;
    });
    staleHot.slice(0, 3).forEach(c => {
      new Notification(`🔥 ${c.name} is going cold!`, {
        body: `You haven't reached out in a while — send a quick message now.`,
        icon: '/favicon.ico'
      });
    });
  };

  // --- FEATURE 2: BOARD VIEW — move contact vibe by drag column drop ---
  const moveContactVibe = async (contactId, newVibeLabel) => {
    const scoreMap = { hot: 9, warm: 5, cold: 2 };
    const updated = contacts.map(c =>
      c.id === contactId
        ? { ...c, vibeLabel: newVibeLabel, vibeScore: scoreMap[newVibeLabel] }
        : c
    );
    setContacts(updated);
    await saveContacts(updated);
  };

  const handleLogout = async () => {
    try {
      // Firebase Sign Out
      if (window.firebaseAuth && window.signOut) {
        await window.signOut(window.firebaseAuth);
      }
      
      // Clear local state
      setUser(null);
      setContacts([]);
      setActivities([]);
      setIsPremium(false);
      
      // Redirect to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if error
      window.location.href = '/';
    }
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
    setNewContact({ name: '', email: '', phone: '', company: '', jobTitle: '', website: '', address: '', lastContactDate: '', vibeScore: 5, vibeLabel: 'warm', notes: '', tags: [], category: '', meetingLink: '', referredBy: '', reminderDays: 30, contactFrequency: 30 });
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
  const mapRowToContact = (row, index, isHeaderMode = true, overrideCategory = '') => {
    // Helper: find a value from a header-keyed object by trying multiple key variants.
    // Strips surrounding quotes that some CSV exporters leave on values.
    const pick = (obj, ...keys) => {
      for (const k of keys) {
        const found = Object.keys(obj).find(ok => ok.trim().toLowerCase() === k.toLowerCase());
        if (found) {
          const raw = obj[found];
          if (raw === undefined || raw === null) continue;
          const val = String(raw).trim().replace(/^["']|["']$/g, ''); // strip surrounding quotes
          if (val !== '') return val;
        }
      }
      return '';
    };

    let name, email, notes, lastContactDate, vibeScore, vibeLabel, tags, phone, company, jobTitle, category;

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
      const rawTags = pick(row, 'tags', 'tag', 'labels');
      tags          = rawTags ? rawTags.split(/[;|]/).map(t => t.trim()).filter(Boolean) : [];
      // category: match by name against existing categories list
      const rawCat  = pick(row, 'category', 'group', 'segment', 'type');
      const matchedCat = rawCat ? categories.find(c => c.name.toLowerCase() === rawCat.toLowerCase()) : null;
      category      = overrideCategory || matchedCat?.id || '';
    } else {
      name          = row[0] ? String(row[0]).trim() : '';
      email         = row[1] ? String(row[1]).trim() : '';
      notes         = row[2] ? String(row[2]).trim() : '';
      lastContactDate = row[3] ? String(row[3]).trim() : '';
      vibeScore     = row[4] ? parseInt(row[4]) || 5 : 5;
      tags          = row[5] ? String(row[5]).split(/[;|]/).map(t => t.trim()).filter(Boolean) : [];
      category      = overrideCategory || '';
    }

    if (!name) return null;

    return {
      id: `${Date.now()}_${index}`,
      createdAt: new Date().toISOString(),
      isFavorite: false,
      name,
      email:           email || '',
      phone:           phone || '',
      company:         company || '',
      jobTitle:        jobTitle || '',
      notes:           notes || '',
      lastContactDate: lastContactDate || '',
      vibeScore:       isNaN(vibeScore) ? 5 : Math.min(10, Math.max(1, vibeScore)),
      vibeLabel:       vibeLabel || (vibeScore >= 8 ? 'hot' : vibeScore >= 5 ? 'warm' : 'cold'),
      tags:            tags || [],
      category:        category || '',
      reminderDays:    30,
      contactFrequency: 30,
    };
  };

  // parseCSVText: uses PapaParse to correctly handle quoted fields, commas in notes,
  // escaped quotes, CRLF line endings, and BOM characters from Excel exports.
  const parseCSVText = (text, delimiter = ',') => {
    return new Promise((resolve, reject) => {
      if (typeof Papa === 'undefined') {
        // PapaParse not loaded yet — retry once after a short delay
        setTimeout(() => {
          if (typeof Papa === 'undefined') {
            reject(new Error('PapaParse library not loaded. Please try again in a moment.'));
          } else {
            Papa.parse(text.trimStart(), {  // trimStart strips BOM characters
              header: true,
              delimiter,
              quoteChar: '"',
              escapeChar: '"',
              skipEmptyLines: 'greedy',
              transformHeader: h => h.trim().replace(/^"|"$/g, ''),
              complete: resolve,
              error: reject,
            });
          }
        }, 600);
        return;
      }
      Papa.parse(text.trimStart(), {
        header: true,
        delimiter,
        quoteChar: '"',
        escapeChar: '"',
        skipEmptyLines: 'greedy',
        transformHeader: h => h.trim().replace(/^"|"$/g, ''),
        complete: resolve,
        error: reject,
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
      // --- VCF / vCard: phone contacts exported from iOS, Android, or WhatsApp ---
      if (file.name.endsWith('.vcf')) {
        const text = await file.text();
        let newContacts = parseVCard(text);
        if (newContacts.length === 0) { setImportStatus('No contacts found in vCard file.'); return; }
        
        // FREE TIER LIMIT: Cap at 10 contacts per import
        if (!isPremium && newContacts.length > 10) {
          setImportStatus(`⚠️ Free plan: Importing first 10 of ${newContacts.length} contacts. Upgrade for unlimited imports.`);
          newContacts = newContacts.slice(0, 10);
        }
        
        const updated = [...contacts, ...newContacts];
        setContacts(updated);
        await saveContacts(updated);
        setImportStatus(`✅ Imported ${newContacts.length} contact${newContacts.length !== 1 ? 's' : ''} from phone/WhatsApp!`);
        setTimeout(() => { setShowBulkImport(false); setImportStatus(''); }, 2500);
        return;
      }

      // --- XLSX / XLS: use SheetJS, convert sheet → CSV, then PapaParse ---
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        // sheet_to_csv produces a proper RFC 4180 CSV string — hand it to PapaParse
        const csvText = XLSX.utils.sheet_to_csv(firstSheet);
        const results = await parseCSVText(csvText, ',');
        let newContacts = results.data
          .map((row, i) => mapRowToContact(row, i, true, bulkImportCategory))
          .filter(Boolean);
        
        // FREE TIER LIMIT: Cap at 10 contacts per import
        if (!isPremium && newContacts.length > 10) {
          setImportStatus(`⚠️ Free plan: Importing first 10 of ${newContacts.length} contacts. Upgrade for unlimited imports.`);
          newContacts = newContacts.slice(0, 10);
        }
        
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

      let newContacts = results.data
        .map((row, i) => mapRowToContact(row, i, true, bulkImportCategory))
        .filter(Boolean);

      if (newContacts.length === 0) {
        setImportStatus('No valid contacts found. Check that your file has a header row with at least a "name" column.');
        return;
      }

      // FREE TIER LIMIT: Cap at 10 contacts per import
      if (!isPremium && newContacts.length > 10) {
        setImportStatus(`⚠️ Free plan: Importing first 10 of ${newContacts.length} contacts. Upgrade for unlimited imports.`);
        newContacts = newContacts.slice(0, 10);
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
          .map((row, i) => mapRowToContact(row, i, true, bulkImportCategory))
          .filter(Boolean);
      } else {
        // No header row — re-parse in array mode for reliable positional access
        const arrayResults = await new Promise((resolve, reject) => {
          Papa.parse(text.trimStart(), {
            header: false,
            delimiter: ',',
            quoteChar: '"',
            escapeChar: '"',
            skipEmptyLines: 'greedy',
            complete: resolve,
            error: reject,
          });
        });
        newContacts = arrayResults.data
          .map((row, i) => mapRowToContact(row, i, false, bulkImportCategory))
          .filter(Boolean);
      }

      if (newContacts.length === 0) {
        setImportStatus('No contacts found. Format: name, email, notes  (one per line)');
        return;
      }

      // FREE TIER LIMIT: Cap at 10 contacts per import for free users
      if (!isPremium && newContacts.length > 10) {
        setImportStatus(`⚠️ Free plan: Importing first 10 of ${newContacts.length} contacts. Upgrade for unlimited imports.`);
        newContacts = newContacts.slice(0, 10);
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

  // --- BULK UPDATE LAST CONTACT DATE ---
  const handleBulkUpdate = async () => {
    if (!bulkUpdate.selectedIds.length || !bulkUpdate.date) return;
    const updated = contacts.map(c => {
      if (!bulkUpdate.selectedIds.includes(c.id)) return c;
      return { ...c, lastContactDate: bulkUpdate.date };
    });
    setContacts(updated);
    await saveContacts(updated);
    // optionally log an activity for each selected contact
    if (bulkUpdate.addActivity) {
      const newActivities = bulkUpdate.selectedIds.map(id => ({
        id: `${Date.now()}_${id}`,
        contactId: id,
        type: 'note',
        content: bulkUpdate.note || 'Offline contact — date updated in bulk.',
        date: bulkUpdate.date,
        timestamp: new Date().toISOString(),
      }));
      const allActivities = [...newActivities, ...activities];
      setActivities(allActivities);
      await saveActivities(allActivities);
    }
    setShowBulkUpdate(false);
    setBulkUpdate({ selectedIds: [], date: new Date().toISOString().split('T')[0], note: '', addActivity: true });
  };

  // --- vCARD / PHONE & WHATSAPP CONTACT PARSER ---
  // Parses .vcf files exported from iOS Contacts, Android Contacts, or WhatsApp.
  // Each vCard block starts with BEGIN:VCARD and ends with END:VCARD.
  const parseVCard = (vcfText) => {
    const cards = vcfText.split(/BEGIN:VCARD/i).filter(b => b.trim());
    return cards.map((card, i) => {
      const get = (key) => {
        // Match lines like: TEL;TYPE=CELL:+1555... or EMAIL;TYPE=WORK:a@b.com or FN:John
        const regex = new RegExp(`^${key}[;:][^\r\n]*:?([^\r\n]+)`, 'im');
        const m = card.match(regex);
        if (!m) return '';
        // Value is after the last colon on that line
        return m[0].split(':').slice(1).join(':').trim();
      };

      const fullName = get('FN') || get('N').split(';').filter(Boolean).reverse().join(' ').trim();
      const email    = get('EMAIL');
      const phone    = get('TEL');
      const org      = get('ORG').replace(/;/g, ' ').trim();
      const title    = get('TITLE');
      const note     = get('NOTE');
      const addr     = get('ADR').replace(/;+/g, ' ').trim();

      if (!fullName && !phone && !email) return null;
      return {
        id: `${Date.now()}_vcf_${i}`,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        name:            fullName || phone || 'Unknown',
        email:           email || '',
        phone:           phone || '',
        company:         org || '',
        jobTitle:        title || '',
        notes:           [note, addr].filter(Boolean).join(' | ') || '',
        lastContactDate: '',
        vibeScore:       5,
        vibeLabel:       'warm',
        tags:            [],
        reminderDays:    30,
        contactFrequency: 30,
      };
    }).filter(Boolean);
  };

  const handleBulkEmail = () => {
    if (!isPremium) { setShowPremiumModal(true); return; }
    setShowBulkEmail(true);
  };

  const generateBulkEmails = async () => {
    const selectedContactsList = contacts.filter(c => bulkEmailData.selectedContacts.includes(c.id) && c.email);
    
    setEmailSendStatus('sending');
    
    try {
      // Send emails via in-platform API endpoint (you'll create this)
      for (let i = 0; i < selectedContactsList.length; i++) {
        const contact = selectedContactsList[i];
        
        // Auto-replace ALL variables with actual contact data
        const personalizedSubject = bulkEmailData.subject
          .replace(/\{name\}/g, contact.name)
          .replace(/\{firstName\}/g, contact.name.split(' ')[0])
          .replace(/\{lastName\}/g, contact.name.split(' ').slice(1).join(' ') || contact.name)
          .replace(/\{companyName\}/g, contact.company || '')
          .replace(/\{email\}/g, contact.email)
          .replace(/\{phone\}/g, contact.phone || '');
        
        const personalizedBody = bulkEmailData.body
          .replace(/\{name\}/g, contact.name)
          .replace(/\{firstName\}/g, contact.name.split(' ')[0])
          .replace(/\{lastName\}/g, contact.name.split(' ').slice(1).join(' ') || contact.name)
          .replace(/\{companyName\}/g, contact.company || '')
          .replace(/\{email\}/g, contact.email)
          .replace(/\{phone\}/g, contact.phone || '');
        
        // Call your email API endpoint (you'll need to create this)
        const emailData = {
          to: contact.email,
          subject: personalizedSubject,
          body: personalizedBody,
          fromName: user?.emailConfig?.fromName || user.name || businessProfile.businessName || 'Your CRM',
          fromEmail: user?.emailConfig?.customEmail || user?.emailConfig?.defaultEmail || null,
          replyToEmail: user?.emailConfig?.replyToEmail || user?.email || null,
          images: bulkEmailData.images || [],
          links: bulkEmailData.links || [],
          scheduleDate: bulkEmailData.scheduleDate,
          scheduleTime: bulkEmailData.scheduleTime
        };
        
        // Send via API (implement this endpoint later)
        try {
          const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
          });
          
          if (!response.ok) {
            console.error(`Failed to send email to ${contact.email}`);
            // Fallback to mailto if API fails
            const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`;
            window.open(mailtoLink, '_blank');
          }
        } catch (apiError) {
          console.error('Email API error:', apiError);
          // Fallback to mailto
          const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`;
          window.open(mailtoLink, '_blank');
        }
        
        // Log activity for each contact
        addActivity({
          contactId: contact.id,
          type: 'email',
          content: `Sent: ${personalizedSubject}`,
          date: new Date().toISOString().split('T')[0],
          id: Date.now() + '_' + contact.id,
          timestamp: new Date().toISOString()
        });
        
        // Small delay between sends to prevent rate limiting
        if (i < selectedContactsList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      setEmailSendStatus('done');
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
      toast.innerHTML = `<span class="material-symbols-outlined text-[18px]">check_circle</span> Successfully sent ${selectedContactsList.length} personalized email${selectedContactsList.length !== 1 ? 's' : ''}!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      
      setTimeout(() => {
        setShowBulkEmail(false);
        setBulkEmailData({ subject: '', body: '', selectedContacts: [], purpose: '', scheduleDate: '', scheduleTime: '' });
        setEmailSendStatus('');
      }, 2000);
    } catch (error) {
      console.error('Bulk email error:', error);
      setEmailSendStatus('');
      alert('Failed to send emails. Please try again.');
    }
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

  // --- FOCUS MODAL HELPERS ---
  const getDaysSinceContact = (contact) => {
    if (!contact.lastContactDate) return 999;
    const lastDate = new Date(contact.lastContactDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleQuickContact = async (contact) => {
    const updatedContact = {
      ...contact,
      lastContactDate: new Date().toISOString().split('T')[0]
    };
    
    // Save individual contact
    await window.storage.set(`contact:${contact.id}`, JSON.stringify(updatedContact));
    
    // Update contacts array
    const updatedContacts = contacts.map(c => 
      c.id === contact.id ? updatedContact : c
    );
    setContacts(updatedContacts);
    
    // Save entire contacts list
    await saveContacts(updatedContacts);
    
    alert(`✅ ${contact.name} marked as contacted today!`);
  };

  const handleBulkFocusContact = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Update all focus contacts
    const updates = focusContacts.map(async contact => {
      const updatedContact = {
        ...contact,
        lastContactDate: today
      };
      await window.storage.set(`contact:${contact.id}`, JSON.stringify(updatedContact));
      return updatedContact;
    });
    
    const updatedFocusContacts = await Promise.all(updates);
    
    // Update contacts array
    const updatedContacts = contacts.map(c => {
      const focusContact = updatedFocusContacts.find(fc => fc.id === c.id);
      return focusContact ? focusContact : c;
    });
    
    setContacts(updatedContacts);
    
    // Save entire contacts list
    await saveContacts(updatedContacts);
    
    setShowFocusModal(false);
    alert(`✅ ${focusContacts.length} contacts marked as contacted!`);
  };

  const getVibeColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-600';
    if (score >= 5) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  const allTags = [...new Set(contacts.flatMap(c => c.tags || []))];

  const filteredContacts = contacts
    .filter(contact => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        contact.name.toLowerCase().includes(q) ||
        (contact.email && contact.email.toLowerCase().includes(q)) ||
        (contact.company && contact.company.toLowerCase().includes(q)) ||
        (contact.phone && contact.phone.includes(q)) ||
        (contact.notes && contact.notes.toLowerCase().includes(q));
      const matchesTag      = filterTag === 'all' || (contact.tags && contact.tags.includes(filterTag));
      const matchesVibe     = filterVibe === 'all' || contact.vibeLabel === filterVibe;
      const matchesCategory = filterCategory === 'all' || contact.category === filterCategory;
      const matchesFav      = !filterFavorites || contact.isFavorite;
      const matchesStale    = !filterStale || isStale(contact.lastContactDate);
      return matchesSearch && matchesTag && matchesVibe && matchesCategory && matchesFav && matchesStale;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name') {
        valA = a.name.toLowerCase(); valB = b.name.toLowerCase();
      } else if (sortBy === 'lastContact') {
        valA = a.lastContactDate ? new Date(a.lastContactDate) : new Date(0);
        valB = b.lastContactDate ? new Date(b.lastContactDate) : new Date(0);
      } else if (sortBy === 'vibe') {
        valA = a.vibeScore; valB = b.vibeScore;
      } else if (sortBy === 'dateAdded') {
        valA = new Date(a.createdAt || 0); valB = new Date(b.createdAt || 0);
      } else if (sortBy === 'company') {
        valA = (a.company || '').toLowerCase(); valB = (b.company || '').toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const activeFilterCount = [
    filterTag !== 'all', filterVibe !== 'all', filterCategory !== 'all',
    filterFavorites, filterStale
  ].filter(Boolean).length;

 // Sidebar Component - NOW COLLAPSIBLE WITH DARK MODE
const Sidebar = () => (
  <aside className={`fixed top-0 left-0 h-full border-r z-40 hidden lg:flex flex-col transition-all duration-300 ${
    sidebarCollapsed ? 'w-20' : 'w-64'
  } ${
    darkMode 
      ? 'bg-slate-900 border-slate-700' 
      : 'bg-white border-slate-200'
  }`}>
    {/* Logo & Collapse Button */}
    <div className="p-8 relative">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
          <span className="material-symbols-outlined text-white">bolt</span>
        </div>
        {!sidebarCollapsed && (
          <span className={`text-xl font-extrabold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Micro CRM
          </span>
        )}
      </div>
      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute -right-3 top-10 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all"
        title={sidebarCollapsed ? 'Expand' : 'Collapse'}
      >
        <span className="material-symbols-outlined text-[14px]">
          {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </div>
    
    {/* Navigation */}
    <nav className="flex-1 px-4 space-y-1.5 mt-2">
      {['dashboard', 'contacts', 'deals', 'tasks', 'analytics'].map((view) => (
        <button
          key={view}
          onClick={() => setCurrentView(view)}
          className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-2xl font-bold transition-all ${
            currentView === view
              ? darkMode 
                ? 'bg-indigo-900/30 text-indigo-400'
                : 'bg-indigo-50 text-indigo-700'
              : darkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
          }`}
          title={view.charAt(0).toUpperCase() + view.slice(1)}
        >
          <span className="material-symbols-outlined">
            {view === 'dashboard' ? 'dashboard' : 
             view === 'contacts' ? 'group' :
             view === 'deals' ? 'monetization_on' :
             view === 'tasks' ? 'checklist' : 'analytics'}
          </span>
          {!sidebarCollapsed && <span className="capitalize">{view}</span>}
        </button>
      ))}
      
      {/* Admin Panel Button - Only visible to admin */}
      {user?.isAdmin && (
        <button
          onClick={() => setShowAdminPanel(true)}
          className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-2xl font-bold transition-all mt-2 ${
            darkMode
              ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300 border border-red-800'
              : 'text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200'
          }`}
          title="Admin Panel"
        >
          <span className="material-symbols-outlined">admin_panel_settings</span>
          {!sidebarCollapsed && <span>Admin Panel</span>}
        </button>
      )}
    </nav>
    
    
    {/* Email Settings Button */}
    {!sidebarCollapsed && (
      <div className="px-6 pb-4">
        <button
          onClick={() => setShowEmailSettings(true)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition ${
            darkMode
              ? 'text-slate-400 hover:bg-slate-800 hover:text-indigo-400 border border-slate-700'
              : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">mail</span>
          <span className="text-sm">Email Settings</span>
          {!user?.emailConfig?.defaultEmail && (
            <span className="ml-auto px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded">
              Setup
            </span>
          )}
        </button>
      </div>
    )}
    
    {/* User Profile */}
    <div className="p-6 mt-auto">
      {sidebarCollapsed ? (
        <button
          onClick={() => setShowBusinessProfile(true)}
          className={`w-full flex justify-center p-3 rounded-2xl border transition-all ${
            darkMode 
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
          }`}
          title={user?.name || 'User'}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
            darkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
          }`}>
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
        </button>
      ) : (
        <div 
          className={`rounded-2xl p-4 border cursor-pointer transition-all ${
            darkMode
              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
          }`}
          onClick={() => setShowBusinessProfile(true)}
        >
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              darkMode ? 'bg-indigo-900 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
            }`}>
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : ''}`}>
                {user.name || 'User'}
              </p>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {isPremium ? 'Premium' : 'Free'}
              </p>
            </div>
            <span className={`material-symbols-outlined text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              settings
            </span>
          </div>
        </div>
      )}
    </div>
  </aside>
);

  // Header Section Component
  const HeaderSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Welcome Card */}
      <div className={`lg:col-span-5 px-4 py-3 lg:p-6 rounded-2xl lg:rounded-3xl border shadow-sm flex flex-col justify-between ${
        darkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-200'
      }`}>
        <div>
          <div className="flex justify-between items-start mb-4">
            <h2 className={`text-xl font-bold flex items-center gap-2 ${
              darkMode ? 'text-white' : 'text-slate-800'
            }`}>
              Micro-CRM
              {isPremium && (
                <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">workspace_premium</span> Premium
                </span>
              )}
            </h2>
            <button onClick={handleLogout} className={`transition ${
              darkMode 
                ? 'text-slate-400 hover:text-red-400' 
                : 'text-slate-400 hover:text-red-500'
            }`}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Welcome back, <span className={`font-semibold uppercase ${
              darkMode ? 'text-white' : 'text-slate-800'
            }`}>{user.name || 'User'}</span>
          </p>
        </div>
      </div>
      {/* Premium Banner */}
      {!isPremium && (
        <div className="lg:col-span-7 bg-gradient-to-r from-amber-400 to-yellow-500 px-4 py-3 lg:p-6 rounded-2xl lg:rounded-3xl shadow-lg shadow-amber-100 flex items-center justify-between group cursor-pointer transition-transform hover:scale-[1.01]"
             onClick={() => setShowPremiumModal(true)}>
          <div className="flex items-center gap-3 lg:gap-5">
            <div className="hidden lg:flex w-14 h-14 bg-white/20 rounded-2xl items-center justify-center backdrop-blur-md border border-white/30 flex-shrink-0">
              <span className="material-symbols-outlined text-white text-3xl">workspace_premium</span>
            </div>
            <span className="material-symbols-outlined text-white text-xl lg:hidden">workspace_premium</span>
            <div>
              <h3 className="text-white text-sm lg:text-xl font-extrabold leading-tight">Upgrade to Premium</h3>
              <p className="text-amber-50/80 text-xs font-medium hidden lg:block">Unlock unlimited contacts and AI icebreakers</p>
            </div>
          </div>
          <div className="bg-white text-amber-600 px-3 py-1.5 lg:px-6 lg:py-3 rounded-xl lg:rounded-2xl font-bold text-xs lg:text-sm shadow-lg group-hover:bg-amber-50 transition-colors flex-shrink-0 ml-3">
            Get Pro — $5
          </div>
        </div>
      )}
    </div>
  );

  // Empty State Component
  const EmptyState = () => (
    <section className={`rounded-3xl border shadow-sm min-h-[450px] flex flex-col items-center justify-center p-8 text-center ${
      darkMode 
        ? 'bg-slate-800 border-slate-700' 
        : 'bg-white border-slate-200'
    }`}>
      <div className="w-64 h-64 mb-8 relative">
        <div className={`absolute inset-0 rounded-full scale-90 blur-3xl opacity-60 ${
          darkMode ? 'bg-indigo-900' : 'bg-indigo-50'
        }`}></div>
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            <span className={`material-symbols-outlined text-[120px] ${
              darkMode ? 'text-indigo-700' : 'text-indigo-200'
            }`}>group</span>
            <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-2xl shadow-xl flex items-center justify-center border ${
              darkMode 
                ? 'bg-slate-700 border-slate-600' 
                : 'bg-white border-slate-50'
            }`}>
              <span className={`material-symbols-outlined text-3xl ${
                darkMode ? 'text-indigo-400' : 'text-indigo-500'
              }`}>add_circle</span>
            </div>
          </div>
        </div>
      </div>
      <h2 className={`text-2xl font-extrabold mb-2 ${
        darkMode ? 'text-white' : 'text-slate-800'
      }`}>No contacts yet</h2>
      <p className={`max-w-sm mb-10 text-lg leading-relaxed ${
        darkMode ? 'text-slate-400' : 'text-slate-500'
      }`}>
        Start building your network by adding your first contact or importing your existing database.
      </p>
      <button onClick={() => setShowAddModal(true)}
              className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-200 transition-all hover:-translate-y-1">
        <span className="material-symbols-outlined">add</span>
        Add Your First Contact
      </button>
      <p className={`mt-6 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        Or <button onClick={() => setShowBulkImport(true)} className="text-indigo-500 font-bold hover:underline">upload a CSV file</button> to get started instantly
      </p>
    </section>
  );

  // Mobile FAB Component
  const MobileFAB = () => (
    <button onClick={() => setShowAddModal(true)}
            className="lg:hidden fixed bottom-20 right-6 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-50 hover:bg-indigo-700 transition-all active:scale-95">
      <span className="material-symbols-outlined text-3xl">add</span>
    </button>
  );

  // NO AUTH CHECK NEEDED - Firebase redirects to landing page if not logged in

  // Show loading while checking auth - removed email check, users can login without email
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your CRM...</p>
        </div>
      </div>
    );
  }

  return (
  <div className={`min-h-screen transition-colors duration-200 ${
    darkMode ? 'dark bg-slate-900' : 'bg-slate-50'
  }`}>
    
    {/* Dark Mode Toggle - Desktop */}
    <button
       onClick={() => setDarkMode(!darkMode)}
        className={`hidden lg:block fixed top-4 right-4 z-50 p-2 rounded-lg shadow-lg hover:shadow-xl transition-all ${
         darkMode 
          ? 'bg-slate-800 border border-slate-700' 
          : 'bg-white border border-slate-200'
      }`}
      title={darkMode ? 'Light mode' : 'Dark mode'}
    >
      <span className={`material-symbols-outlined text-[20px] ${darkMode ? 'text-yellow-400' : 'text-slate-700'}`}>
        {darkMode ? 'light_mode' : 'dark_mode'}
      </span>
    </button>

      {/* SIDEBAR - Desktop Only */}
      <Sidebar />

      {/* MOBILE TOP NAV */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base">bolt</span>
          </div>
          <span className="text-base font-extrabold tracking-tight text-slate-800">Micro CRM</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAnalytics(true)} className="p-2 text-slate-500 hover:text-indigo-600 transition">
            <span className="material-symbols-outlined">analytics</span>
          </button>
          <button onClick={() => setShowAddModal(true)} className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-base">add</span>
          </button>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition">
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </nav>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-2 safe-area-pb">
        <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-indigo-600">
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[10px] font-semibold">Dashboard</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-400" onClick={() => setShowAddModal(true)}>
          <span className="material-symbols-outlined text-xl">group</span>
          <span className="text-[10px] font-semibold">Contacts</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-400" onClick={() => setShowAnalytics(true)}>
          <span className="material-symbols-outlined text-xl">analytics</span>
          <span className="text-[10px] font-semibold">Analytics</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-400" onClick={() => isPremium ? setShowBulkImport(true) : setShowPremiumModal(true)}>
          <span className="material-symbols-outlined text-xl">upload</span>
          <span className="text-[10px] font-semibold">Import</span>
        </button>
      </nav>

      {/* MAIN CONTENT */}
      <main className={`p-4 pt-20 pb-24 lg:pb-10 lg:pt-10 lg:p-10 space-y-8 transition-all duration-300 ${
  sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
}`}>

        {/* Header Row: Welcome + Premium */}
        <HeaderSection />

        {/* Search, Actions and Sort/Filter */}
        <div className={`p-4 rounded-xl shadow-sm border space-y-3 ${
          darkMode 
            ? 'bg-slate-800 border-slate-700' 
            : 'bg-white border-gray-100'
        }`}>

          {/* Row 1: Search + action buttons */}
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <span className={`material-symbols-outlined text-[20px] absolute left-4 top-1/2 -translate-y-1/2 ${
                darkMode ? 'text-slate-500' : 'text-gray-400'
              }`}>search</span>
              <input type="text" placeholder="Search name, email, company, notes..."
                className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none focus:ring-2 ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-500/20'
                    : 'bg-gray-50 border-gray-200 focus:ring-blue-500/20'
                }`}
                onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-wrap">
              <button onClick={() => setShowAnalytics(true)}
                className="flex-1 md:flex-none bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition">
                <span className="material-symbols-outlined text-[20px]">analytics</span> Analytics
              </button>
              
              {/* TODAY'S FOCUS BUTTON - Only shows when contacts exist */}
              {focusContacts.length > 0 && (
                <button
                  onClick={() => setShowFocusModal(true)}
                  className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 transition"
                >
                  <span className="material-symbols-outlined text-[20px]">priority_high</span>
                  <span className="hidden sm:inline">Focus</span>
                  <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {focusContacts.length}
                  </span>
                </button>
              )}
              
              <button onClick={() => setShowAddModal(true)}
                className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition">
                <span className="material-symbols-outlined text-[20px]">add</span> Add
                {!isPremium && <span className="text-[10px] bg-blue-800 px-1.5 py-0.5 rounded-full">{contacts.length}/10</span>}
              </button>
              <button onClick={() => isPremium ? setShowBulkImport(true) : (() => { setUpgradeReason('Bulk Import is a Premium feature.'); setShowPremiumModal(true); })()}
                className={`flex-1 md:flex-none ${isPremium ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400 hover:bg-slate-500'} text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 relative transition`}>
                {isPremium ? <span className="material-symbols-outlined text-[20px]">upload</span> : <span className="material-symbols-outlined text-[20px]">lock</span>} Import
              </button>
              <button onClick={() => isPremium ? setShowBulkUpdate(true) : (() => { setUpgradeReason('Bulk Update is a Premium feature.'); setShowPremiumModal(true); })()}
                className={`flex-1 md:flex-none ${isPremium ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-400 hover:bg-slate-500'} text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 relative transition`}>
                {isPremium ? <span className="material-symbols-outlined text-[20px]">calendar_today</span> : <span className="material-symbols-outlined text-[20px]">lock</span>} Update
              </button>
              <button onClick={() => isPremium ? handleBulkEmail() : (() => { setUpgradeReason('Bulk Email is a Premium feature.'); setShowPremiumModal(true); })()}
                className={`flex-1 md:flex-none ${isPremium ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-400 hover:bg-slate-500'} text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 relative transition`}>
                {isPremium ? <span className="material-symbols-outlined text-[20px]">mail</span> : <span className="material-symbols-outlined text-[20px]">lock</span>} Email
              </button>
              <button onClick={() => isPremium ? setShowBulkIcebreaker(true) : (() => { setUpgradeReason('Bulk Icebreaker is a Premium feature.'); setShowPremiumModal(true); })()}
                className={`flex-1 md:flex-none ${isPremium ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-400 hover:bg-slate-500'} text-white px-4 py-3 rounded-xl font-bold flex items-center gap-2 relative transition`}>
                {isPremium ? <span className="material-symbols-outlined text-[20px]">auto_awesome</span> : <span className="material-symbols-outlined text-[20px]">lock</span>} Icebreaker
              </button>
            </div>
          </div>

          {/* Row 2: Sort bar + Filter toggle + Category manager */}
          <div className="flex items-center gap-2 flex-wrap">
  <button
    onClick={() => setShowSortOptions(!showSortOptions)}
    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
      showSortOptions
        ? darkMode 
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-slate-800 text-white border-slate-800'
        : darkMode
          ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
    }`}
  >
    <span className="material-symbols-outlined text-[14px]">sort</span>
    Sort: {sortBy === 'name' ? 'Name' : sortBy === 'lastContact' ? 'Last Contact' : sortBy === 'vibe' ? 'Vibe' : sortBy === 'company' ? 'Company' : 'Date Added'}
    {sortDir === 'asc' ? ' ↑' : ' ↓'}
    <span className="material-symbols-outlined text-[14px]">
      {showSortOptions ? 'expand_less' : 'expand_more'}
    </span>
  </button>
  
  {showSortOptions && (
    <div className="flex items-center gap-2 flex-wrap">
      {[
        { id: 'name',        label: 'Name' },
        { id: 'lastContact', label: 'Last Contact' },
        { id: 'vibe',        label: 'Vibe' },
        { id: 'company',     label: 'Company' },
        { id: 'dateAdded',   label: 'Date Added' },
      ].map(s => (
        <button key={s.id} onClick={() => { toggleSort(s.id); setShowSortOptions(false); }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
            sortBy === s.id 
              ? darkMode 
                ? 'bg-indigo-600 text-white' 
                : 'bg-slate-800 text-white'
              : darkMode
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          {s.label}
          {sortBy === s.id && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
        </button>
      ))}
    </div>
  )}
            <div className="flex-1" />
            <button onClick={() => setShowFilters(f => !f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
                showFilters || activeFilterCount > 0
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              <span className="material-symbols-outlined text-[14px]">filter_list</span>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
              )}
            </button>
            <button onClick={() => setShowCategoryManager(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition">
              <span className="material-symbols-outlined text-[14px]">label</span> Categories
              {categories.length > 0 && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{categories.length}</span>}
            </button>
            {/* View mode toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[14px]">group</span> Grid
              </button>
              <button onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition border-l border-gray-200 ${viewMode === 'board' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[14px]">analytics</span> Board
              </button>
            </div>
            {/* Nudge notification toggle */}
            <button onClick={requestNudgePermission}
              title="Get browser notifications when hot contacts go stale"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${nudgeEnabled ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'}`}>
              <span className="material-symbols-outlined text-[14px]">notifications</span> Nudge {nudgeEnabled ? 'On' : 'Off'}
            </button>
          </div>

          {/* Row 3: Filter panel — shown when toggled */}
          {showFilters && (
           <div className={`border rounded-xl p-4 space-y-3 ${
             darkMode 
               ? 'bg-slate-800 border-slate-700' 
                 : 'bg-gray-50 border-gray-100'
           }`}>

              {/* Category filter */}
              {categories.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${
  darkMode ? 'text-slate-400' : 'text-gray-400'
}`}>Category</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFilterCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
  filterCategory === 'all' 
    ? darkMode 
      ? 'bg-indigo-600 text-white border-indigo-600'
      : 'bg-gray-800 text-white border-gray-800'
    : darkMode
      ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
}`}>
                      All
                    </button>
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                          filterCategory === cat.id ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                        style={filterCategory === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: filterCategory === cat.id ? 'rgba(255,255,255,0.7)' : cat.color }}></span>
                        {cat.name}
                        <span className="opacity-60 text-[10px]">({contacts.filter(c => c.category === cat.id).length})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vibe filter */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${
  darkMode ? 'text-slate-400' : 'text-gray-400'
}`}>Vibe</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'all',  label: 'All Vibes' },
                    { id: 'hot',  label: '🔥 Hot' },
                    { id: 'warm', label: '☕ Warm' },
                    { id: 'cold', label: '❄️ Cold' },
                  ].map(v => (
                    <button key={v.id} onClick={() => setFilterVibe(v.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                        filterVibe === v.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}>{v.label}</button>
                  ))}
                </div>
              </div>

              {/* Tag filter */}
              {allTags.length > 0 && (
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${
  darkMode ? 'text-slate-400' : 'text-gray-400'
}`}>Tag</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFilterTag('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${filterTag === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                      All Tags
                    </button>
                    {allTags.map(tag => (
                      <button key={tag} onClick={() => setFilterTag(filterTag === tag ? 'all' : tag)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${filterTag === tag ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick toggles */}
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wide mb-2 ${
  darkMode ? 'text-slate-400' : 'text-gray-400'
}`}>Quick Filters</p>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setFilterFavorites(f => !f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1 ${filterFavorites ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                    <span className="material-symbols-outlined text-[12px]">star</span> Favorites
                  </button>
                  <button onClick={() => setFilterStale(f => !f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1 ${filterStale ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
                    <span className="material-symbols-outlined text-[12px]">schedule</span> Stale only
                  </button>
                  {activeFilterCount > 0 && (
                    <button onClick={() => { setFilterTag('all'); setFilterVibe('all'); setFilterCategory('all'); setFilterFavorites(false); setFilterStale(false); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 bg-white hover:bg-red-50 transition flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">close</span> Clear all filters
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Summary line */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Showing <strong className="text-gray-600">{filteredContacts.length}</strong> of <strong className="text-gray-600">{contacts.length}</strong> contacts</span>
            {activeFilterCount > 0 && <span className="text-blue-500">{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>}
          </div>

        </div>

        {/* Contacts Grid or Board View */}
        {viewMode === 'grid' ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
  sidebarCollapsed ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
}`}>
            {filteredContacts.map(contact => {
              const days = daysSinceContact(contact.lastContactDate);
              return (
                <div key={contact.id}
  className={`p-5 rounded-xl shadow-sm border hover:shadow-md transition group cursor-pointer ${
    darkMode 
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-100'
  }`}
                  onClick={() => setSelectedContact(contact)}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                       <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{contact.name}</h3>
                        {isStale(contact.lastContactDate) && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded text-[9px] font-bold uppercase tracking-wide">Stale</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(contact.id); }}
                          className="opacity-0 group-hover:opacity-100">
                          <span className={`material-symbols-outlined text-[16px] ${contact.isFavorite ? 'text-yellow-400' : 'text-gray-300'}`}>star</span>
                        </button>
                      </div>
                      {contact.email && <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-400'}`}>{contact.email}</p>}
                      {contact.company && <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-gray-500'}`}>{contact.company}</p>}
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
                      {contact.category && (() => {
                        const cat = categories.find(c => c.id === contact.category);
                        return cat ? (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: cat.color }}>
                            {cat.name}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <button onClick={(e) => { e.stopPropagation(); deleteContact(contact.id); }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 transition">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); generateIcebreaker(contact); }}
                        title="Draft Icebreaker"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-400 hover:text-indigo-600 transition">
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {contact.lastContactDate && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">calendar_today</span>
                        <span className="text-gray-600">
                          {new Date(contact.lastContactDate).toLocaleDateString()}
                          {days && <span className="text-gray-400 ml-1">({days}d ago)</span>}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-gray-400">trending_up</span>
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
        ) : (
          /* FEATURE 2: BOARD / KANBAN VIEW — with drag state visuals */
          <div className="grid grid-cols-3 gap-4">
            {[
              { key: 'cold', label: '❄️ Cold', bg: 'bg-blue-50',   border: 'border-blue-200',   over: 'border-blue-400 bg-blue-100',   header: 'bg-blue-100 text-blue-700' },
              { key: 'warm', label: '☕ Warm', bg: 'bg-yellow-50', border: 'border-yellow-200', over: 'border-yellow-400 bg-yellow-100', header: 'bg-yellow-100 text-yellow-700' },
              { key: 'hot',  label: '🔥 Hot',  bg: 'bg-red-50',   border: 'border-red-200',    over: 'border-red-400 bg-red-100',     header: 'bg-red-100 text-red-700' },
            ].map(col => {
              const colContacts = filteredContacts.filter(c =>
                (c.vibeLabel === col.key) || (!c.vibeLabel && col.key === 'warm')
              );
              const isOver = dragOverColumn === col.key;
              return (
                <div key={col.key}
                  className={`rounded-xl border-2 transition-all duration-150 min-h-64 ${isOver ? col.over : col.border + ' ' + col.bg}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOverColumn(col.key); }}
                  onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverColumn(null); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverColumn(null);
                    setDraggingId(null);
                    const id = e.dataTransfer.getData('contactId');
                    if (id) moveContactVibe(id, col.key);
                  }}>
                  <div className={`${col.header} rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                    <span className="font-bold text-sm">{col.label}</span>
                    <span className="text-xs font-semibold bg-white/60 px-2 py-0.5 rounded-full">{colContacts.length}</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {colContacts.map(contact => {
                      const isDragging = draggingId === contact.id;
                      return (
                        <div key={contact.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('contactId', contact.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingId(contact.id);
                          }}
                          onDragEnd={() => { setDraggingId(null); setDragOverColumn(null); }}
                          onClick={() => !isDragging && setSelectedContact(contact)}
                          className={`bg-white rounded-xl p-3 border transition-all duration-150 group select-none ${
                            isDragging
                              ? 'shadow-2xl opacity-50 cursor-grabbing scale-95 border-indigo-300'
                              : 'shadow-sm border-gray-100 cursor-grab hover:shadow-lg hover:-translate-y-0.5'
                          }`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 text-sm truncate">{contact.name}</p>
                              {contact.company && <p className="text-xs text-gray-400 truncate">{contact.company}</p>}
                              {contact.jobTitle && <p className="text-xs text-gray-300 truncate">{contact.jobTitle}</p>}
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {isStale(contact.lastContactDate) && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">Stale</span>
                                )}
                                {contact.isFavorite && <span className="text-[9px]">⭐</span>}
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); generateIcebreaker(contact); }}
                              title="Draft Icebreaker"
                              className="opacity-0 group-hover:opacity-100 p-1 text-indigo-400 hover:text-indigo-600 flex-shrink-0 transition">
                              <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                            </button>
                          </div>
                          {contact.category && (() => {
                            const cat = categories.find(c => c.id === contact.category);
                            return cat ? (
                              <span className="inline-flex mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white"
                                style={{ backgroundColor: cat.color }}>{cat.name}</span>
                            ) : null;
                          })()}
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-gray-400">
                              {contact.lastContactDate
                                ? `${daysSinceContact(contact.lastContactDate)}d ago`
                                : 'Never contacted'}
                            </p>
                            <span className="text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition">⠿ drag</span>
                          </div>
                        </div>
                      );
                    })}
                    {colContacts.length === 0 && (
                      <div className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed transition ${isOver ? 'border-gray-400 text-gray-500' : 'border-gray-200 text-gray-300'}`}>
                        <p className="text-xs font-medium">{isOver ? 'Drop here →' : 'No contacts'}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredContacts.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <span className="material-symbols-outlined text-[64px] text-gray-300">group</span>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {contacts.length === 0 ? 'No contacts yet' : 'No contacts found'}
            </h3>
            <p className="text-gray-500 mb-4">
              {contacts.length === 0 ? 'Add your first contact to get started' : 'Try a different search or filter'}
            </p>
            {contacts.length === 0 && (
              <button onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">add</span> Add Contact
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
            categories={categories}
            allContacts={contacts}
            onIcebreaker={generateIcebreaker}
            onOpenContact={(c) => setSelectedContact(c)}
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
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  You've reached the 10 contact limit. <button type="button" onClick={() => setShowPremiumModal(true)} className="underline ml-1">Upgrade to add more.</button>
                </div>
              )}

              {/* COMPACT SMART CAPTURE BUTTONS */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMagicPaste(!showMagicPaste);
                    if (showScanCapture) setShowScanCapture(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    showMagicPaste
                      ? darkMode ? 'bg-violet-600 text-white shadow-lg' : 'bg-violet-600 text-white shadow-lg'
                      : darkMode
                        ? 'bg-violet-900/30 text-violet-400 hover:bg-violet-900/50'
                        : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">auto_fix_high</span>
                  <span>Magic Paste</span>
                  <span className="material-symbols-outlined text-sm">
                    {showMagicPaste ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowScanCapture(!showScanCapture);
                    if (showMagicPaste) setShowMagicPaste(false);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    showScanCapture
                      ? darkMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-600 text-white shadow-lg'
                      : darkMode
                        ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">photo_camera</span>
                  <span>Scan Card</span>
                  <span className="material-symbols-outlined text-sm">
                    {showScanCapture ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              </div>

              {/* EXPANDABLE MAGIC PASTE SECTION */}
              {showMagicPaste && (
                <div className={`mb-4 p-4 rounded-xl border ${
                  darkMode 
                    ? 'bg-violet-900/20 border-violet-800'
                    : 'bg-violet-50 border-violet-200'
                }`}>
                  <label className={`block text-sm font-bold mb-2 flex items-center gap-2 ${
                    darkMode ? 'text-violet-400' : 'text-violet-700'
                  }`}>
                    ✨ Magic Paste
                    <span className={`text-[10px] font-normal ${
                      darkMode ? 'text-violet-500' : 'text-violet-400'
                    }`}>— type or paste anything below</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder={`Just type or paste anything — name, number, email, title — fields fill automatically:\n\nJohn Smith\njohn@acme.com\n+1 555 123 4567\nAcme Corp — Sales Director`}
                    value={smartCaptureText}
                    onChange={(e) => handleSmartType(e.target.value)}
                    className={`w-full p-3 rounded-xl border outline-none focus:ring-2 text-sm resize-none font-mono ${
                      darkMode
                        ? 'bg-slate-800 border-slate-600 text-white focus:ring-violet-500'
                        : 'bg-white border-violet-200 focus:ring-violet-400'
                    }`}
                  />
                  {scanFeedback.length > 0 && smartCaptureText.length > 0 && !scanPreview && (
                    <div className={`mt-2 p-2 rounded-lg border ${
                      darkMode 
                        ? 'bg-green-900/20 border-green-800'
                        : 'bg-green-50 border-green-200'
                    }`}>
                      <p className={`text-xs font-semibold mb-1 ${
                        darkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}>✅ Auto-filled {scanFeedback.length} field{scanFeedback.length !== 1 ? 's' : ''}:</p>
                      <div className="flex flex-wrap gap-1">
                        {scanFeedback.map((f, i) => (
                          <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            darkMode
                              ? 'bg-green-900/30 border-green-700 text-green-400'
                              : 'bg-white border-green-200 text-green-700'
                          }`}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EXPANDABLE SCAN TO FILL SECTION */}
              {showScanCapture && (
                <div className={`mb-4 p-4 rounded-xl border ${
                  darkMode 
                    ? 'bg-indigo-900/20 border-indigo-800'
                    : 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <label className={`text-sm font-bold flex items-center gap-2 ${
                      darkMode ? 'text-indigo-400' : 'text-indigo-700'
                    }`}>
                      <span className="material-symbols-outlined text-[16px]">description</span> Scan to Fill
                      <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${
                        darkMode 
                          ? 'text-indigo-400 bg-indigo-900/30'
                          : 'text-indigo-400 bg-indigo-100'
                      }`}>AI-powered</span>
                    </label>
                    {(scanPreview || scanMode === 'camera') && (
                      <button type="button" onClick={() => { stopCamera(); setScanMode('idle'); setScanPreview(null); setScanFeedback([]); }}
                        className={`text-xs flex items-center gap-1 ${
                          darkMode 
                            ? 'text-indigo-400 hover:text-indigo-300'
                            : 'text-indigo-400 hover:text-indigo-700'
                        }`}>
                        <span className="material-symbols-outlined text-[12px]">close</span> Reset
                      </button>
                    )}
                  </div>
                  <p className={`text-xs mb-3 ${
                    darkMode ? 'text-indigo-400' : 'text-indigo-500'
                  }`}>Point your camera at a business card, flier, name tag, email, or any document — AI reads and fills every field.</p>

                  {/* Scan action buttons — shown when idle */}
                  {scanMode !== 'camera' && !scanPreview && (
                    <div className="flex gap-2">
                      <button type="button" onClick={startCamera}
                        className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition">
                        📷 Open Camera
                      </button>
                      <label className="flex-1 cursor-pointer">
                        <div className={`py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition border-2 ${
                          darkMode
                            ? 'bg-slate-800 border-indigo-700 text-indigo-400 hover:bg-indigo-900/20'
                            : 'bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50'
                        }`}>
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
                    <div className={`relative rounded-xl overflow-hidden border ${
                      darkMode ? 'border-indigo-700' : 'border-indigo-200'
                    }`}>
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
                      isScanning 
                        ? darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                        : scanFeedback[0].startsWith('❌') || scanFeedback[0].startsWith('⚠️')
                          ? darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'
                          : darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'
                    }`}>
                      {isScanning ? (
                        <p className={`font-medium animate-pulse ${
                          darkMode ? 'text-indigo-400' : 'text-indigo-600'
                        }`}>{scanFeedback[0]}</p>
                      ) : scanFeedback[0].startsWith('❌') || scanFeedback[0].startsWith('⚠️') ? (
                        <p className={`font-medium ${
                          darkMode ? 'text-red-400' : 'text-red-600'
                        }`}>{scanFeedback[0]}</p>
                      ) : (
                        <>
                          <p className={`font-semibold mb-1 ${
                            darkMode ? 'text-slate-300' : 'text-gray-700'
                          }`}>✅ Auto-filled {scanFeedback.length} field{scanFeedback.length !== 1 ? 's' : ''}:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {scanFeedback.map((f, i) => (
                              <span key={i} className={`px-2 py-0.5 rounded-full border ${
                                darkMode
                                  ? 'bg-green-900/30 border-green-700 text-green-400'
                                  : 'bg-white border-green-200 text-green-700'
                              }`}>{f}</span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

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

              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">label</span> Category
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => setNewContact({...newContact, category: ''})}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${!newContact.category ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      None
                    </button>
                    {categories.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => setNewContact({...newContact, category: newContact.category === cat.id ? '' : cat.id})}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                          newContact.category === cat.id ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                        style={newContact.category === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: newContact.category === cat.id ? 'rgba(255,255,255,0.6)' : cat.color }}></span>
                        {cat.name}
                      </button>
                    ))}
                    <button type="button" onClick={() => setShowCategoryManager(true)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition">
                      + New category
                    </button>
                  </div>
                </div>
              )}
              {categories.length === 0 && (
                <button type="button" onClick={() => setShowCategoryManager(true)}
                  className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-400 hover:text-gray-600 hover:border-gray-400 transition flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">label</span> Create categories to organise contacts
                </button>
              )}
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
                      <span className="material-symbols-outlined text-[16px] text-yellow-600">workspace_premium</span> Reminder (days)
                    </label>
                    <input type="number" min="1" value={newContact.reminderDays}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setNewContact({...newContact, reminderDays: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-yellow-600">workspace_premium</span> Contact Frequency
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
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Bulk Import Contacts</h2>
              <p className="text-sm text-gray-500 mb-6">Import from a spreadsheet, or directly from your phone or WhatsApp contacts.</p>

              {/* Phone / WhatsApp vCard import callout */}
              <div className="mb-5 bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-bold text-green-800 mb-1 flex items-center gap-2">📱 Import from Phone or WhatsApp</p>
                <p className="text-xs text-green-700 mb-3">Export your contacts as a <strong>.vcf</strong> file from your phone, then upload it here. Works with iPhone, Android, and WhatsApp contacts.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-green-700">
                  <div className="bg-white rounded-lg p-2 border border-green-100">
                    <p className="font-semibold mb-0.5">📱 iPhone</p>
                    <p>Contacts app → Select All → Share → Export vCard (.vcf)</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-green-100">
                    <p className="font-semibold mb-0.5">🤖 Android</p>
                    <p>Contacts app → Menu → Import/Export → Export to .vcf</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-green-100">
                    <p className="font-semibold mb-0.5">💬 WhatsApp</p>
                    <p>Open chat → tap name → Scroll down → Export Contact (.vcf)</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Upload File</label>
                <input type="file" accept=".xlsx,.xls,.csv,.tsv,.txt,.vcf" onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100" />
                <p className="text-xs text-gray-500 mt-2">Accepts: <strong>.vcf</strong> (phone/WhatsApp contacts), <strong>.csv</strong>, <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.tsv</strong> · Quoted fields with commas handled automatically</p>
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
                <div className={`mb-4 p-4 rounded-xl ${importStatus.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                  {importStatus}
                </div>
              )}

              {/* Assign category to all imported contacts */}
              {categories.length > 0 && (
                <div className="mb-5 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <label className="block text-sm font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">label</span> Assign category to all imported contacts <span className="font-normal text-indigo-400">(optional)</span>
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    <button type="button" onClick={() => setBulkImportCategory('')}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${!bulkImportCategory ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                      No category
                    </button>
                    {categories.map(cat => (
                      <button key={cat.id} type="button"
                        onClick={() => setBulkImportCategory(bulkImportCategory === cat.id ? '' : cat.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                          bulkImportCategory === cat.id ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                        style={bulkImportCategory === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bulkImportCategory === cat.id ? 'rgba(255,255,255,0.6)' : cat.color }}></span>
                        {cat.name}
                      </button>
                    ))}
                  </div>
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

        {/* Bulk Email Modal — OPTION 2 DESIGN: Two-panel layout with purple theme */}
        {showBulkEmail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-indigo-600">auto_awesome</span>
                      <h2 className="text-xl font-bold text-slate-900">Bulk Personalized Emails</h2>
                    </div>
                    <p className="text-sm text-slate-500">Compose and send high-conversion emails to your selected contacts.</p>
                  </div>
                  <button 
                    onClick={() => { 
                      setShowBulkEmail(false); 
                      setBulkEmailData({ subject: '', body: '', selectedContacts: [], purpose: '', scheduleDate: '', scheduleTime: '' }); 
                      setEmailSendStatus(''); 
                    }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                  >
                    <span className="material-symbols-outlined text-slate-400">close</span>
                  </button>
                </div>
              </div>

              {/* Two-Panel Layout */}
              <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT PANEL: Recipients */}
                <div className="w-[380px] border-r border-slate-200 flex flex-col bg-slate-50">
                  <div className="p-5 border-b border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                        Recipients ({bulkEmailData.selectedContacts.length} selected)
                      </h3>
                      <button 
                        onClick={() => {
                          const allEmails = contacts.filter(c => c.email).map(c => c.id);
                          setBulkEmailData({
                            ...bulkEmailData, 
                            selectedContacts: bulkEmailData.selectedContacts.length === allEmails.length ? [] : allEmails
                          });
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        {bulkEmailData.selectedContacts.length === contacts.filter(c => c.email).length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Recipients List - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {contacts.filter(c => c.email).length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <span className="material-symbols-outlined text-4xl opacity-30">mail</span>
                        <p className="text-sm mt-2">No contacts with email addresses</p>
                      </div>
                    ) : (
                      contacts.filter(c => c.email).map(contact => {
                        const isSelected = bulkEmailData.selectedContacts.includes(contact.id);
                        // Get category badge color
                        const category = contact.category ? categories.find(cat => cat.id === contact.category) : null;
                        
                        return (
                          <label 
                            key={contact.id}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-indigo-50 border-2 border-indigo-200' 
                                : 'bg-white border-2 border-transparent hover:border-slate-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                              isSelected 
                                ? 'bg-indigo-600 border-indigo-600' 
                                : 'border-slate-300'
                            }`}>
                              {isSelected && (
                                <span className="material-symbols-outlined text-white text-[14px]">check</span>
                              )}
                            </div>
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkEmailData({...bulkEmailData, selectedContacts: [...bulkEmailData.selectedContacts, contact.id]});
                                } else {
                                  setBulkEmailData({...bulkEmailData, selectedContacts: bulkEmailData.selectedContacts.filter(id => id !== contact.id)});
                                }
                              }}
                              className="sr-only"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-900 text-sm truncate">{contact.name}</p>
                              <p className="text-xs text-slate-500 truncate">{contact.email}</p>
                            </div>
                            {category && (
                              <span 
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white flex-shrink-0"
                                style={{ backgroundColor: category.color }}
                              >
                                {category.name}
                              </span>
                            )}
                            {!category && contact.vibeLabel && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 ${
                                contact.vibeLabel === 'hot' ? 'bg-red-100 text-red-700' :
                                contact.vibeLabel === 'warm' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {contact.vibeLabel === 'hot' ? 'Hot' : contact.vibeLabel === 'warm' ? 'Warm' : 'Cold'}
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* Schedule Send Toggle - Bottom of Left Panel */}
                  <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-600 text-[18px]">schedule</span>
                        <span className="text-sm font-semibold text-slate-700">Schedule Send</span>
                      </div>
                      <button
                        onClick={() => {
                          if (bulkEmailData.scheduleDate) {
                            setBulkEmailData({...bulkEmailData, scheduleDate: '', scheduleTime: ''});
                          } else {
                            setBulkEmailData({...bulkEmailData, scheduleDate: new Date().toISOString().split('T')[0]});
                          }
                        }}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
                        style={{ backgroundColor: bulkEmailData.scheduleDate ? '#6366f1' : '#cbd5e1' }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            bulkEmailData.scheduleDate ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {bulkEmailData.scheduleDate && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">Date</label>
                          <input
                            type="date"
                            value={bulkEmailData.scheduleDate}
                            onChange={(e) => setBulkEmailData({...bulkEmailData, scheduleDate: e.target.value})}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">Time</label>
                          <input
                            type="time"
                            value={bulkEmailData.scheduleTime || '09:00'}
                            onChange={(e) => setBulkEmailData({...bulkEmailData, scheduleTime: e.target.value})}
                            className="w-full mt-1 px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT PANEL: Email Draft */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Email Draft</h3>
                    <button
                      onClick={async () => {
                        if (bulkEmailData.selectedContacts.length === 0) {
                          alert('Please select at least one recipient first');
                          return;
                        }
                        
                        if (!bulkEmailData.purpose && !bulkEmailData.customPrompt) {
                          alert('Please select an email purpose or write a custom prompt - this helps AI generate relevant content');
                          return;
                        }
                        
                        const firstContact = contacts.find(c => c.id === bulkEmailData.selectedContacts[0]);
                        if (!firstContact) return;
                        
                        // Show loading state
                        const btn = event.target.closest('button');
                        const originalHTML = btn.innerHTML;
                        btn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Generating...';
                        btn.disabled = true;
                        
                        // SAVE current prompt/purpose before generating (for Regenerate button later)
                        const currentPrompt = bulkEmailData.customPrompt;
                        const currentPurpose = bulkEmailData.purpose;
                        
                        try {
                          // ALWAYS call API to generate FRESH email (even if prompt unchanged)
                          const response = await fetch('/api/generate-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              contact: firstContact,
                              businessProfile,
                              recipientCount: bulkEmailData.selectedContacts.length,
                              purpose: currentPurpose,
                              customPrompt: currentPrompt,
                              forceNew: true  // Flag to ensure fresh generation
                            })
                          });
                          
                          if (response.ok) {
                            const data = await response.json();
                            setBulkEmailData({
                              ...bulkEmailData,
                              subject: data.subject,  // ALWAYS replace (not ||)
                              body: data.body,        // ALWAYS replace (not ||)
                              lastUsedPrompt: currentPrompt,   // Save what was used
                              lastUsedPurpose: currentPurpose  // Save what was used
                            });
                            
                            // Show success toast
                            const toast = document.createElement('div');
                            toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
                            toast.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span> Fresh email generated!';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 2000);
                          } else {
                            // Fallback with purpose-aware templates
                            // PRIORITIZE CUSTOM PROMPT if it exists
                            if (currentPrompt && currentPrompt.trim()) {
                              // Use custom prompt as the main content
                              setBulkEmailData({
                                ...bulkEmailData,
                                subject: `Message for {firstName}`,
                                body: `Hi {firstName},\n\n${currentPrompt.trim()}\n\nBest regards,\n${user.name || businessProfile.businessName || 'Your Name'}`,
                                lastUsedPrompt: currentPrompt,
                                lastUsedPurpose: currentPurpose
                              });
                            } else {
                              // Use preset purpose templates
                              const purposeTemplates = {
                                'follow-up': {
                                  subject: `Following up on our conversation`,
                                  body: `Hi {firstName},\n\nI wanted to follow up on our recent conversation and see how things are progressing.\n\nLet me know if you have any questions or if there's anything I can help with.\n\nBest regards,\n${businessProfile.businessName || 'Your Name'}`
                                },
                                'introduction': {
                                  subject: `Introduction - ${businessProfile.businessName || 'Our Company'}`,
                                  body: `Hi {firstName},\n\nI hope this email finds you well. I wanted to introduce myself and ${businessProfile.businessName || 'our company'}.\n\n${businessProfile.description || 'We help businesses like yours achieve their goals.'}\n\nWould you be open to a brief call to discuss how we might be able to help?\n\nBest regards,\n${user.name || 'Your Name'}`
                                },
                                'sales': {
                                  subject: `Special offer for {companyName}`,
                                  body: `Hi {firstName},\n\nI wanted to reach out with a special opportunity for {companyName}.\n\n${businessProfile.valueProposition || 'We can help you save time and increase efficiency.'}\n\nAre you available for a quick call this week to discuss?\n\nBest regards,\n${user.name || 'Your Name'}`
                                },
                                'thank-you': {
                                  subject: `Thank you, {firstName}`,
                                  body: `Hi {firstName},\n\nI wanted to take a moment to thank you for your time and partnership.\n\nIt's been great working with you, and I'm looking forward to continuing our collaboration.\n\nBest regards,\n${user.name || 'Your Name'}`
                                },
                                'default': {
                                  subject: `Quick check-in from ${businessProfile.businessName || 'us'}`,
                                  body: `Hi {firstName},\n\nHope you're doing well! I wanted to reach out and see how things are going.\n\nLet me know if there's anything I can help with.\n\nBest regards,\n${user.name || 'Your Name'}`
                                }
                              };
                              
                              const template = purposeTemplates[currentPurpose] || purposeTemplates['default'];
                              setBulkEmailData({
                                ...bulkEmailData,
                                subject: template.subject,
                                body: template.body,
                                lastUsedPrompt: currentPrompt,
                                lastUsedPurpose: currentPurpose
                              });
                            }
                          }
                        } catch (error) {
                          alert('AI generation not available. Please write manually.');
                        } finally {
                          btn.innerHTML = originalHTML;
                          btn.disabled = false;
                        }
                      }}
                      disabled={bulkEmailData.selectedContacts.length === 0 || (!bulkEmailData.purpose && !bulkEmailData.customPrompt)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      Refine with AI
                    </button>
                  </div>

                  {/* Email Composer - Scrollable */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Email Purpose + Custom Prompt Toggle Row */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Email Purpose */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Email Purpose
                        </label>
                        <select
                          value={bulkEmailData.purpose || ''}
                          onChange={(e) => {
                            setBulkEmailData({...bulkEmailData, purpose: e.target.value});
                            // If selecting "custom", auto-expand the custom prompt box
                            if (e.target.value === 'custom') {
                              setShowCustomPrompt(true);
                            }
                          }}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                        >
                          <option value="">Select purpose...</option>
                          <option value="follow-up">Follow-up / Check-in</option>
                          <option value="introduction">Introduction / Meeting Request</option>
                          <option value="sales">Sales Pitch / Product Offer</option>
                          <option value="update">Update / News Share</option>
                          <option value="thank-you">Thank You / Appreciation</option>
                          <option value="feedback">Request Feedback</option>
                          <option value="networking">Networking / Collaboration</option>
                          <option value="reminder">Reminder / Nudge</option>
                          <option value="proposal">Proposal / Quote</option>
                          <option value="event-invite">Event Invitation</option>
                        </select>
                      </div>

                      {/* Custom Prompt Toggle */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-2">
                          Custom Instructions
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowCustomPrompt(!showCustomPrompt)}
                          className={`w-full px-4 py-3 border rounded-xl text-sm font-semibold flex items-center justify-between transition ${
                            showCustomPrompt || bulkEmailData.customPrompt
                              ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                            <span>{bulkEmailData.customPrompt ? 'Custom prompt set' : 'Add custom prompt'}</span>
                          </div>
                          <span className="material-symbols-outlined text-[18px]">
                            {showCustomPrompt ? 'expand_less' : 'expand_more'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Custom AI Prompt - Expandable */}
                    {showCustomPrompt && (
                      <div className="border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50/50">
                        <label className="block text-xs font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                          Write Your Custom Instructions
                          <span className="text-slate-500 font-normal ml-auto text-[11px]">Tell AI exactly what to write</span>
                        </label>
                        <textarea
                          value={bulkEmailData.customPrompt || ''}
                          onChange={(e) => setBulkEmailData({...bulkEmailData, customPrompt: e.target.value})}
                          placeholder="Example: Write a friendly email asking for a referral to their network. Mention that we helped them save 20% on costs last quarter. Keep it casual and under 100 words."
                          rows="4"
                          className="w-full px-4 py-3 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none bg-white"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[11px] text-indigo-700">
                            💡 Be specific: include tone, length, key points, and details
                          </p>
                          {bulkEmailData.customPrompt && (
                            <button
                              type="button"
                              onClick={() => {
                                setBulkEmailData({...bulkEmailData, customPrompt: ''});
                                setShowCustomPrompt(false);
                              }}
                              className="text-[11px] text-slate-500 hover:text-red-600 font-semibold"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Subject Line */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-2">Subject Line</label>
                      <input
                        type="text"
                        value={bulkEmailData.subject}
                        onChange={(e) => setBulkEmailData({...bulkEmailData, subject: e.target.value})}
                        placeholder="e.g., Quick check-in regarding {companyName}"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      />
                    </div>

                    {/* Email Body */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-slate-700">Email Body</label>
                        <div className="flex gap-2">
                          {/* Regenerate Button - Only shows if content exists */}
                          {(bulkEmailData.subject || bulkEmailData.body) && (
                            <button
                              onClick={async () => {
                                if (bulkEmailData.selectedContacts.length === 0) {
                                  alert('Please select at least one recipient first');
                                  return;
                                }
                                
                                // Use LAST USED prompt/purpose (not current!)
                                const promptToUse = bulkEmailData.lastUsedPrompt;
                                const purposeToUse = bulkEmailData.lastUsedPurpose;
                                
                                if (!purposeToUse && !promptToUse) {
                                  alert('No previous generation found. Use "Refine with AI" first.');
                                  return;
                                }
                                
                                const firstContact = contacts.find(c => c.id === bulkEmailData.selectedContacts[0]);
                                if (!firstContact) return;
                                
                                // Show loading state in button
                                const regenerateBtn = document.getElementById('regenerate-btn');
                                const originalHTML = regenerateBtn.innerHTML;
                                regenerateBtn.innerHTML = '<div class="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>';
                                regenerateBtn.disabled = true;
                                
                                try {
                                  // Use LAST USED settings, not current settings
                                  const response = await fetch('/api/generate-email', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      contact: firstContact,
                                      businessProfile,
                                      recipientCount: bulkEmailData.selectedContacts.length,
                                      purpose: purposeToUse,           // LAST USED purpose
                                      customPrompt: promptToUse,       // LAST USED prompt
                                      forceNew: true
                                    })
                                  });
                                  
                                  if (response.ok) {
                                    const data = await response.json();
                                    setBulkEmailData({
                                      ...bulkEmailData,
                                      subject: data.subject,  // ALWAYS replace
                                      body: data.body,        // ALWAYS replace
                                      // Keep lastUsed the same (still using same prompt)
                                      lastUsedPrompt: promptToUse,
                                      lastUsedPurpose: purposeToUse
                                    });
                                    
                                    // Show toast indicating regeneration with same prompt
                                    const toast = document.createElement('div');
                                    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
                                    toast.innerHTML = '<span class="material-symbols-outlined text-[18px]">refresh</span> New version generated with same prompt!';
                                    document.body.appendChild(toast);
                                    setTimeout(() => toast.remove(), 2000);
                                  } else {
                                    // Use fallback templates with LAST USED settings
                                    if (promptToUse && promptToUse.trim()) {
                                      setBulkEmailData({
                                        ...bulkEmailData,
                                        subject: `Message for {firstName}`,
                                        body: `Hi {firstName},\n\n${promptToUse.trim()}\n\nBest regards,\n${user.name || businessProfile.businessName || 'Your Name'}`,
                                        lastUsedPrompt: promptToUse,
                                        lastUsedPurpose: purposeToUse
                                      });
                                    } else {
                                      const purposeTemplates = {
                                        'follow-up': {
                                          subject: `Following up on our conversation`,
                                          body: `Hi {firstName},\n\nI wanted to follow up on our recent conversation and see how things are progressing.\n\nLet me know if you have any questions or if there's anything I can help with.\n\nBest regards,\n${businessProfile.businessName || 'Your Name'}`
                                        },
                                        'introduction': {
                                          subject: `Introduction - ${businessProfile.businessName || 'Our Company'}`,
                                          body: `Hi {firstName},\n\nI hope this email finds you well. I wanted to introduce myself and ${businessProfile.businessName || 'our company'}.\n\n${businessProfile.description || 'We help businesses like yours achieve their goals.'}\n\nWould you be open to a brief call to discuss how we might be able to help?\n\nBest regards,\n${user.name || 'Your Name'}`
                                        },
                                        'sales': {
                                          subject: `Special offer for {companyName}`,
                                          body: `Hi {firstName},\n\nI wanted to reach out with a special opportunity for {companyName}.\n\n${businessProfile.valueProposition || 'We can help you save time and increase efficiency.'}\n\nAre you available for a quick call this week to discuss?\n\nBest regards,\n${user.name || 'Your Name'}`
                                        },
                                        'thank-you': {
                                          subject: `Thank you, {firstName}`,
                                          body: `Hi {firstName},\n\nI wanted to take a moment to thank you for your time and partnership.\n\nIt's been great working with you, and I'm looking forward to continuing our collaboration.\n\nBest regards,\n${user.name || 'Your Name'}`
                                        },
                                        'default': {
                                          subject: `Quick check-in from ${businessProfile.businessName || 'us'}`,
                                          body: `Hi {firstName},\n\nHope you're doing well! I wanted to reach out and see how things are going.\n\nLet me know if there's anything I can help with.\n\nBest regards,\n${user.name || 'Your Name'}`
                                        }
                                      };
                                      
                                      const template = purposeTemplates[purposeToUse] || purposeTemplates['default'];
                                      setBulkEmailData({
                                        ...bulkEmailData,
                                        subject: template.subject,
                                        body: template.body,
                                        lastUsedPrompt: promptToUse,
                                        lastUsedPurpose: purposeToUse
                                      });
                                    }
                                  }
                                } catch (error) {
                                  console.error('Regenerate error:', error);
                                } finally {
                                  regenerateBtn.innerHTML = originalHTML;
                                  regenerateBtn.disabled = false;
                                }
                              }}
                              id="regenerate-btn"
                              className="px-2 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold transition flex items-center gap-1"
                              title="Generate new version"
                            >
                              <span className="material-symbols-outlined text-[14px]">refresh</span>
                              Regenerate
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const cursorPos = document.getElementById('email-body-textarea').selectionStart;
                              const textBefore = bulkEmailData.body.substring(0, cursorPos);
                              const textAfter = bulkEmailData.body.substring(cursorPos);
                              setBulkEmailData({...bulkEmailData, body: textBefore + '{firstName}' + textAfter});
                            }}
                            className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono transition"
                          >
                            {'{firstName}'}
                          </button>
                          <button
                            onClick={() => {
                              const cursorPos = document.getElementById('email-body-textarea').selectionStart;
                              const textBefore = bulkEmailData.body.substring(0, cursorPos);
                              const textAfter = bulkEmailData.body.substring(cursorPos);
                              setBulkEmailData({...bulkEmailData, body: textBefore + '{companyName}' + textAfter});
                            }}
                            className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono transition"
                          >
                            {'{companyName}'}
                          </button>
                        </div>
                      </div>
                      
                      {/* Rich Text Toolbar */}
                      <div className="border border-slate-300 rounded-t-xl bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 flex items-center gap-3 flex-wrap shadow-sm">
                        {/* Image Upload */}
                        <div>
                          <input
                            type="file"
                            id="email-image-upload"
                            accept="image/*"
                            multiple
                            className="hidden"
                              onChange={async (e) => {
              const files = Array.from(e.target.files);
              if (files.length === 0) return;

              // Show uploading indicator
              const uploadingToast = document.createElement('div');
              uploadingToast.id = 'uploading-toast';
              uploadingToast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
              uploadingToast.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Uploading image to CDN...';
              document.body.appendChild(uploadingToast);

              const newImages = [];

              for (const file of files) {
                if (file.size > 10 * 1024 * 1024) {
                  alert(`${file.name} is too large. Max size: 10MB`);
                  continue;
                }

                try {
                  // Read file as base64
                  const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                  });

                  // Upload directly to imgbb from the browser
                  const formData = new URLSearchParams();
                  formData.append('key', '45e4867978578c60e64cd227d710e1db');
                  formData.append('image', base64);
                  formData.append('name', file.name);

                  const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
                    method: 'POST',
                    body: formData,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                  });

                  const uploadData = await uploadRes.json();

                  if (uploadData.success && uploadData.data?.url) {
                    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    newImages.push({
                      id: imageId,
                      name: file.name,
                      url: uploadData.data.url,           // real hosted URL sent to server
                      data: uploadData.data.display_url   // preview shown in thumbnail
                    });
                  } else {
                    console.error('imgbb upload failed:', uploadData);
                    alert(`Failed to upload ${file.name}. Please try again.`);
                  }
                } catch (err) {
                  console.error('Upload error:', err);
                  alert(`Error uploading ${file.name}. Check your connection.`);
                }
              }

              // Remove uploading toast
              document.getElementById('uploading-toast')?.remove();

              if (newImages.length > 0) {
                const currentImages = bulkEmailData.images || [];
                setBulkEmailData({ ...bulkEmailData, images: [...currentImages, ...newImages] });

                const toast = document.createElement('div');
                toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
                toast.innerHTML = `<span class="material-symbols-outlined text-[18px]">check_circle</span> ${newImages.length} image(s) uploaded! Click thumbnails to insert.`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
              }

              e.target.value = '';
            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('email-image-upload').click()}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md"
                            title="Upload images"
                          >
                            <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                            Upload Images
                          </button>
                        </div>
                        
                        {/* Add Link to Selected Text */}
                        <button
                          type="button"
                          onClick={() => {
                            const textarea = document.getElementById('email-body-textarea');
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const selectedText = textarea.value.substring(start, end);
                            
                            if (!selectedText || selectedText.trim() === '') {
                              alert('Please highlight/select some text first, then click this button to add a link.');
                              return;
                            }
                            
                            const linkUrl = prompt(`Add link to "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '...' : ''}":\n\nEnter URL (e.g., https://example.com):`);
                            if (!linkUrl) return;
                            
                            let finalUrl = linkUrl.trim();
                            if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                              finalUrl = 'https://' + finalUrl;
                            }
                            
                            // Create unique link ID
                            const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            
                            // Store link data
                            const currentLinks = bulkEmailData.links || [];
                            const newLinks = [...currentLinks, { id: linkId, text: selectedText, url: finalUrl }];
                            
                            // Replace selected text with link marker
                            const textBefore = textarea.value.substring(0, start);
                            const textAfter = textarea.value.substring(end);
                            
                            setBulkEmailData({
                              ...bulkEmailData,
                              body: textBefore + `[LINK:${linkId}]` + textAfter,
                              links: newLinks
                            });
                            
                            const toast = document.createElement('div');
                            toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
                            toast.innerHTML = `<span class="material-symbols-outlined text-[18px]">check_circle</span> Link added!`;
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 2000);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-md"
                          title="Highlight text first, then click to add link"
                        >
                          <span className="material-symbols-outlined text-[20px]">link</span>
                          Link Text
                        </button>
                        
                        <div className="h-8 w-px bg-slate-300 mx-1"></div>
                        
                        {/* Existing variable buttons */}
                        <button
                          onClick={() => {
                            const textarea = document.getElementById('email-body-textarea');
                            const cursorPos = textarea.selectionStart;
                            const textBefore = bulkEmailData.body.substring(0, cursorPos);
                            const textAfter = bulkEmailData.body.substring(cursorPos);
                            setBulkEmailData({...bulkEmailData, body: textBefore + '{firstName}' + textAfter});
                          }}
                          className="px-3 py-1.5 text-[11px] bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-mono transition shadow-sm"
                        >
                          {'{firstName}'}
                        </button>
                        <button
                          onClick={() => {
                            const textarea = document.getElementById('email-body-textarea');
                            const cursorPos = textarea.selectionStart;
                            const textBefore = bulkEmailData.body.substring(0, cursorPos);
                            const textAfter = bulkEmailData.body.substring(cursorPos);
                            setBulkEmailData({...bulkEmailData, body: textBefore + '{companyName}' + textAfter});
                          }}
                          className="px-3 py-1.5 text-[11px] bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-mono transition shadow-sm"
                        >
                          {'{companyName}'}
                        </button>
                      </div>
                      
                      {/* Image Gallery */}
                      {bulkEmailData.images && bulkEmailData.images.length > 0 && (
                        <div className="border-x border-slate-300 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">photo_library</span>
                            Click images to insert at cursor position:
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {bulkEmailData.images.map((img) => (
                              <div
                                key={img.id}
                                className="relative group cursor-pointer"
                                title={`Click to insert ${img.name}`}
                              >
                                <div
                                  onClick={() => {
                                    const textarea = document.getElementById('email-body-textarea');
                                    const cursorPos = textarea.selectionStart;
                                    const textBefore = bulkEmailData.body.substring(0, cursorPos);
                                    const textAfter = bulkEmailData.body.substring(cursorPos);
                                    
                                    const imageMarker = `[IMAGE:${img.id}]`;
                                    
                                    setBulkEmailData({
                                      ...bulkEmailData,
                                      body: textBefore + '\n' + imageMarker + '\n' + textAfter
                                    });
                                    
                                    const toast = document.createElement('div');
                                    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
                                    toast.innerHTML = `<span class="material-symbols-outlined text-[18px]">check_circle</span> Image inserted!`;
                                    document.body.appendChild(toast);
                                    setTimeout(() => toast.remove(), 1500);
                                  }}
                                >
                                  <img
                                    src={img.data}
                                    alt={img.name}
                                    className="w-24 h-24 object-cover rounded-lg border-2 border-slate-300 group-hover:border-indigo-500 transition shadow-sm"
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg transition flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition text-[32px]">
                                      add_circle
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm(`Remove ${img.name}?`)) {
                                      // Remove from images array
                                      const newImages = bulkEmailData.images.filter(i => i.id !== img.id);
                                      // Remove from body
                                      const newBody = bulkEmailData.body.replace(new RegExp(`\\[IMAGE:${img.id}\\]`, 'g'), '');
                                      setBulkEmailData({
                                        ...bulkEmailData,
                                        images: newImages,
                                        body: newBody
                                      });
                                    }
                                  }}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                                  title="Remove image"
                                >
                                  <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                                <p className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-slate-600 truncate px-1">
                                  {img.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Email Body Textarea */}
                      <textarea
                        id="email-body-textarea"
                        value={bulkEmailData.body}
                        onChange={(e) => setBulkEmailData({...bulkEmailData, body: e.target.value})}
                        placeholder="Hi {firstName},&#10;&#10;I hope you are doing well!&#10;&#10;💡 Upload images, then click thumbnails to insert&#10;💡 Highlight text, then click 'Link Text' to add link&#10;&#10;Best regards"
                        rows="12"
                        className="w-full px-4 py-3 border-x border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none font-sans"
                      />
                      
                      {/* Email Preview */}
                      <div className="border-x border-b border-slate-300 rounded-b-xl bg-white px-4 py-3">
                        <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Preview (how recipients will see it):
                        </p>
                        <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-200 max-h-64 overflow-y-auto">
                          {(() => {
                            let preview = bulkEmailData.body || 'Your email content will appear here...';
                            
                            // Replace image markers with actual images
                            if (bulkEmailData.images) {
                              bulkEmailData.images.forEach(img => {
                                preview = preview.replace(
                                  new RegExp(`\\[IMAGE:${img.id}\\]`, 'g'),
                                  `<div class="my-3"><img src="${img.data}" alt="${img.name}" style="max-width: 100%; height: auto; border-radius: 8px; display: block;" /></div>`
                                );
                              });
                            }
                            
                            // Replace link markers with actual links
                            if (bulkEmailData.links) {
                              bulkEmailData.links.forEach(link => {
                                preview = preview.replace(
                                  new RegExp(`\\[LINK:${link.id}\\]`, 'g'),
                                  `<a href="${link.url}" style="color: #4F46E5; text-decoration: underline; font-weight: 500;" title="${link.url}">${link.text}</a>`
                                );
                              });
                            }
                            
                            // Replace line breaks
                            preview = preview.split('\n').map(line => 
                              line.trim() ? `<p style="margin: 0 0 10px 0;">${line}</p>` : '<br>'
                            ).join('');
                            
                            return <div dangerouslySetInnerHTML={{ __html: preview }} />;
                          })()}
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-xs font-bold text-blue-900 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                          How to use:
                        </p>
                        <div className="space-y-1.5 text-xs text-blue-800">
                          <p className="flex items-start gap-2">
                            <span className="font-bold">📷 Images:</span>
                            <span>Upload → Click thumbnail → See [IMAGE:...] marker in text → Check preview below</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="font-bold">🔗 Links:</span>
                            <span>Highlight text → Click "Link Text" → Enter URL → See [LINK:...] marker → Check preview</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span className="font-bold">👁️ Preview:</span>
                            <span>Check the preview box to see exactly how your email will look</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                <button
                  onClick={() => {
                    const selectedContactsList = contacts.filter(c => bulkEmailData.selectedContacts.includes(c.id) && c.email);
                    const emails = selectedContactsList.map(contact => {
                      const personalizedSubject = bulkEmailData.subject
                        .replace(/\{name\}/g, contact.name)
                        .replace(/\{firstName\}/g, contact.name.split(' ')[0])
                        .replace(/\{companyName\}/g, contact.company || '');
                      const personalizedBody = bulkEmailData.body
                        .replace(/\{name\}/g, contact.name)
                        .replace(/\{firstName\}/g, contact.name.split(' ')[0])
                        .replace(/\{companyName\}/g, contact.company || '');
                      return `To: ${contact.email}\nSubject: ${personalizedSubject}\n\n${personalizedBody}`;
                    }).join('\n\n---\n\n');
                    navigator.clipboard.writeText(emails);
                    
                    // Show success toast
                    const toast = document.createElement('div');
                    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
                    toast.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span> Copied ' + selectedContactsList.length + ' personalized email' + (selectedContactsList.length !== 1 ? 's' : '') + ' to clipboard!';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2000);
                  }}
                  disabled={bulkEmailData.selectedContacts.length === 0 || !bulkEmailData.subject || !bulkEmailData.body}
                  className="px-5 py-2.5 border-2 border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold rounded-xl transition flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">content_copy</span>
                  Copy to Clipboard
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Total Recipients: <strong className="text-slate-700">{bulkEmailData.selectedContacts.length}</strong></span>
                  <button
                    onClick={generateBulkEmails}
                    disabled={bulkEmailData.selectedContacts.length === 0 || !bulkEmailData.subject || !bulkEmailData.body || emailSendStatus === 'sending'}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-200"
                  >
                    {emailSendStatus === 'sending' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Send Bulk Emails
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Bulk Icebreaker Modal */}
        {showBulkIcebreaker && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">auto_awesome</span> Bulk Icebreaker
                    </h2>
                    <p className="text-indigo-200 text-sm mt-0.5">One message generated for all tagged contacts</p>
                  </div>
                  <button onClick={() => { setShowBulkIcebreaker(false); setBulkIcebreakerData({ selectedContacts: [], channel: 'email', social: 'whatsapp', customPrompt: '', generatedMessage: '', emailResults: {}, showSocialDropdown: false, sending: false }); }}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Channel row: Email | Socials dropdown */}
                <div className="flex gap-2 mt-4 items-center">
                  <span className="text-xs text-indigo-200 mr-1">Send via:</span>

                  {/* Email button */}
                  <button
                    onClick={() => setBulkIcebreakerData(prev => ({ ...prev, channel: 'email', generatedMessage: '' }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                      bulkIcebreakerData.channel === 'email' ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}>
                    ✉️ Email
                  </button>

                  {/* Socials dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setBulkIcebreakerData(prev => ({ ...prev, showSocialDropdown: !prev.showSocialDropdown }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        bulkIcebreakerData.channel === 'social' ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                      }`}>
                      {icebreakerChannels.find(c => c.id === bulkIcebreakerData.social)?.icon || '💬'}
                      {icebreakerChannels.find(c => c.id === bulkIcebreakerData.social)?.label || 'Social'}
                      <span className="material-symbols-outlined text-[14px]">expand_more</span>
                    </button>
                    {bulkIcebreakerData.showSocialDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden min-w-[150px]">
                        {icebreakerChannels.filter(c => c.id !== 'email').map(ch => (
                          <button key={ch.id}
                            onClick={() => setBulkIcebreakerData(prev => ({ ...prev, channel: 'social', social: ch.id, showSocialDropdown: false, generatedMessage: '' }))}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-indigo-50 transition ${
                              bulkIcebreakerData.social === ch.id && bulkIcebreakerData.channel === 'social' ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-gray-700'
                            }`}>
                            {ch.icon} {ch.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Custom prompt — shown first so message can be generated before tagging */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined text-[16px] text-indigo-500">edit_note</span>
                    Custom prompt <span className="text-gray-400 font-normal text-xs">(optional)</span>
                  </label>
                  <textarea
                    value={bulkIcebreakerData.customPrompt}
                    onChange={e => setBulkIcebreakerData(prev => ({ ...prev, customPrompt: e.target.value, generatedMessage: '' }))}
                    placeholder="e.g. Mention our upcoming product launch, keep it under 3 sentences, casual tone..."
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>

                {/* Contact selection — only never-contacted, full names */}
                {(() => {
                  const neverContacted = contacts.filter(c => !c.lastContactDate);
                  const isEmail = bulkIcebreakerData.channel === 'email';
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700">
                          Recipients
                          <span className="ml-1.5 text-xs font-normal text-gray-400">
                            ({isEmail ? 'email · ' : ''}never contacted · {neverContacted.length})
                          </span>
                          {!isEmail && <span className="ml-1.5 text-xs font-normal text-gray-400">— optional for social</span>}
                        </label>
                        <div className="flex gap-2">
                          <button onClick={() => setBulkIcebreakerData(prev => ({ ...prev, selectedContacts: neverContacted.map(c => c.id) }))}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Select all</button>
                          <span className="text-gray-300">|</span>
                          <button onClick={() => setBulkIcebreakerData(prev => ({ ...prev, selectedContacts: [] }))}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium">Clear</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl min-h-[52px] bg-gray-50">
                        {neverContacted.map(contact => {
                          const selected = bulkIcebreakerData.selectedContacts.includes(contact.id);
                          return (
                            <button key={contact.id}
                              onClick={() => setBulkIcebreakerData(prev => ({
                                ...prev,
                                selectedContacts: selected
                                  ? prev.selectedContacts.filter(id => id !== contact.id)
                                  : [...prev.selectedContacts, contact.id],
                                // Clear results when contacts change
                                generatedMessage: '', emailResults: {}
                              }))}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
                                selected
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                              }`}>
                              {contact.name}
                            </button>
                          );
                        })}
                        {neverContacted.length === 0 && (
                          <p className="text-xs text-gray-400 self-center">All contacts have been previously contacted</p>
                        )}
                      </div>
                      {bulkIcebreakerData.selectedContacts.length > 0 && (
                        <p className="text-xs text-gray-400 mt-1">{bulkIcebreakerData.selectedContacts.length} recipient{bulkIcebreakerData.selectedContacts.length !== 1 ? 's' : ''} selected</p>
                      )}
                    </div>
                  );
                })()}

                {/* Generate button */}
                {(() => {
                  const isEmail = bulkIcebreakerData.channel === 'email';
                  const emailResults = bulkIcebreakerData.emailResults || {};
                  const hasResults = isEmail
                    ? Object.keys(emailResults).length > 0
                    : !!bulkIcebreakerData.generatedMessage;
                  const disabled = bulkIcebreakerLoading || (isEmail && bulkIcebreakerData.selectedContacts.length === 0);
                  return (
                    <button onClick={generateBulkIcebreakers} disabled={disabled}
                      className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                      {bulkIcebreakerLoading ? (
                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {isEmail ? `Generating ${bulkIcebreakerData.selectedContacts.length} emails…` : 'Generating…'}</>
                      ) : (
                        <><span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                          {hasResults
                            ? (isEmail ? 'Regenerate All Emails' : 'Regenerate Message')
                            : (isEmail ? `Generate ${bulkIcebreakerData.selectedContacts.length || ''} Email${bulkIcebreakerData.selectedContacts.length !== 1 ? 's' : ''}` : 'Generate Message')
                          }</>
                      )}
                    </button>
                  );
                })()}

                {/* EMAIL RESULTS — one editable card per contact */}
                {bulkIcebreakerData.channel === 'email' && Object.keys(bulkIcebreakerData.emailResults || {}).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">Generated Emails ({Object.keys(bulkIcebreakerData.emailResults || {}).length}) <span className="font-normal text-gray-400 text-xs">— edit before sending</span></p>
                      <button onClick={sendAllBulkIcebreakers} disabled={bulkIcebreakerData.sending}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition">
                        {bulkIcebreakerData.sending
                          ? <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sending…</>
                          : <><span className="material-symbols-outlined text-[14px]">send</span> Send All</>
                        }
                      </button>
                    </div>
                    {bulkIcebreakerData.selectedContacts.map(contactId => {
                      const contact = contacts.find(c => c.id === contactId);
                      const msg = bulkIcebreakerData.emailResults[contactId] || '';
                      const hasSubject = msg.includes(' | ');
                      const subject = hasSubject ? msg.split(' | ')[0] : '';
                      const body = hasSubject ? msg.split(' | ').slice(1).join(' | ') : msg;
                      if (!contact) return null;
                      return (
                        <div key={contactId} className="rounded-xl border border-indigo-200 bg-indigo-50 overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-indigo-100">
                            <div>
                              <span className="text-xs font-bold text-indigo-800">{contact.name}</span>
                              {contact.email && <span className="text-xs text-indigo-500 ml-2">{contact.email}</span>}
                            </div>
                            <button onClick={() => navigator.clipboard.writeText(msg)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">content_copy</span> Copy
                            </button>
                          </div>
                          <div className="p-3 space-y-2">
                            {hasSubject && (
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 mb-1">Subject</p>
                                <input
                                  type="text"
                                  value={subject}
                                  onChange={e => {
                                    const newMsg = `${e.target.value} | ${body}`;
                                    setBulkIcebreakerData(prev => ({
                                      ...prev,
                                      emailResults: { ...prev.emailResults, [contactId]: newMsg }
                                    }));
                                  }}
                                  className="w-full text-xs border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 font-semibold text-gray-800"
                                />
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500 mb-1">Message</p>
                              <textarea
                                value={body}
                                rows={4}
                                onChange={e => {
                                  const newMsg = hasSubject ? `${subject} | ${e.target.value}` : e.target.value;
                                  setBulkIcebreakerData(prev => ({
                                    ...prev,
                                    emailResults: { ...prev.emailResults, [contactId]: newMsg }
                                  }));
                                }}
                                className="w-full text-xs border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700 leading-relaxed resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SOCIAL RESULT — editable broadcast message */}
                {bulkIcebreakerData.channel === 'social' && bulkIcebreakerData.generatedMessage && (
                  <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 overflow-hidden">
                    <div className="px-4 py-2 bg-indigo-100 flex items-center justify-between">
                      <p className="text-xs font-bold text-indigo-800">
                        Broadcast · {icebreakerChannels.find(c => c.id === bulkIcebreakerData.social)?.label}
                      </p>
                      <span className="text-[10px] text-indigo-400">edit before sending</span>
                    </div>
                    <div className="p-3">
                      <textarea
                        value={bulkIcebreakerData.generatedMessage}
                        rows={5}
                        onChange={e => setBulkIcebreakerData(prev => ({ ...prev, generatedMessage: e.target.value }))}
                        className="w-full text-sm border border-indigo-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-700 leading-relaxed resize-none"
                      />
                    </div>
                    <div className="border-t border-indigo-200 px-4 py-3 flex gap-2 bg-white">
                      <button onClick={copyAllBulkIcebreakers}
                        className="flex-1 text-xs font-semibold px-3 py-2 rounded-lg border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition flex items-center justify-center gap-1.5">
                        📋 Copy
                      </button>
                      <button onClick={sendAllBulkIcebreakers}
                        className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg text-white transition flex items-center justify-center gap-1.5 ${
                          icebreakerChannels.find(c => c.id === bulkIcebreakerData.social)?.color || 'bg-slate-700 hover:bg-slate-800'
                        }`}>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        Open {icebreakerChannels.find(c => c.id === bulkIcebreakerData.social)?.label}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Bulk Update Modal */}
        {showBulkUpdate && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-gray-800">Bulk Update Last Contact</h2>
                <button onClick={() => setShowBulkUpdate(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <span className="material-symbols-outlined text-[20px] text-gray-500">close</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 mb-6">Select the clients you spoke to offline, set the date, and optionally add a shared note — all updated in one click.</p>

              {/* Date + Note inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-orange-500">calendar_today</span> Last Contact Date *
                  </label>
                  <input type="date" value={bulkUpdate.date}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBulkUpdate({ ...bulkUpdate, date: e.target.value })}
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-orange-400" />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div onClick={() => setBulkUpdate({ ...bulkUpdate, addActivity: !bulkUpdate.addActivity })}
                      className={`w-10 h-6 rounded-full transition relative ${bulkUpdate.addActivity ? 'bg-orange-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${bulkUpdate.addActivity ? 'left-5' : 'left-1'}`}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Also log as activity</span>
                  </label>
                  <p className="text-xs text-gray-400 mt-1 ml-12">Adds a note entry to each contact's timeline</p>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Shared Note <span className="text-gray-400 font-normal">(optional — added to each selected contact)</span></label>
                <textarea
                  rows="3"
                  placeholder="e.g. Met at the industry event. Follow up next week."
                  value={bulkUpdate.note}
                  onChange={(e) => setBulkUpdate({ ...bulkUpdate, note: e.target.value })}
                  className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none"
                />
              </div>

              {/* Select All / None */}
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700">Select Contacts ({bulkUpdate.selectedIds.length} selected)</label>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => setBulkUpdate({ ...bulkUpdate, selectedIds: contacts.map(c => c.id) })}
                    className="text-xs px-3 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 transition font-medium">
                    Select All
                  </button>
                  <button type="button"
                    onClick={() => setBulkUpdate({ ...bulkUpdate, selectedIds: [] })}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition font-medium">
                    Clear
                  </button>
                </div>
              </div>

              {/* Contact checklist with search */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                  <input type="text" placeholder="Search contacts to narrow list…"
                    className="w-full text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-300"
                    onChange={(e) => {
                      const q = e.target.value.toLowerCase();
                      setBulkUpdate(prev => ({ ...prev, _search: q }));
                    }} />
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                  {contacts
                    .filter(c => !bulkUpdate._search || c.name.toLowerCase().includes(bulkUpdate._search))
                    .map(contact => {
                      const days = contact.lastContactDate
                        ? Math.ceil((new Date() - new Date(contact.lastContactDate)) / 86400000)
                        : null;
                      const checked = bulkUpdate.selectedIds.includes(contact.id);
                      return (
                        <label key={contact.id}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${checked ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <input type="checkbox" checked={checked}
                            onChange={(e) => {
                              setBulkUpdate(prev => ({
                                ...prev,
                                selectedIds: e.target.checked
                                  ? [...prev.selectedIds, contact.id]
                                  : prev.selectedIds.filter(id => id !== contact.id)
                              }));
                            }}
                            className="w-4 h-4 accent-orange-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-800 truncate">{contact.name}</p>
                              {contact.vibeLabel === 'hot' && <span className="text-[10px]">🔥</span>}
                              {contact.vibeLabel === 'warm' && <span className="text-[10px]">☕</span>}
                              {contact.vibeLabel === 'cold' && <span className="text-[10px]">❄️</span>}
                              {isStale(contact.lastContactDate) && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded font-bold">Stale</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate">
                              {contact.email || contact.phone || 'No contact info'}
                              {days !== null && <span className="ml-2 text-gray-300">· {days}d ago</span>}
                              {days === null && <span className="ml-2 text-gray-300">· never contacted</span>}
                            </p>
                          </div>
                          {checked && (
                            <span className="text-[10px] font-bold text-orange-500 flex-shrink-0">→ {bulkUpdate.date}</span>
                          )}
                        </label>
                      );
                    })}
                  {contacts.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No contacts yet.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBulkUpdate}
                  disabled={!bulkUpdate.selectedIds.length || !bulkUpdate.date}
                  className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  Update {bulkUpdate.selectedIds.length} Contact{bulkUpdate.selectedIds.length !== 1 ? 's' : ''}
                </button>
                <button onClick={() => { setShowBulkUpdate(false); setBulkUpdate({ selectedIds: [], date: new Date().toISOString().split('T')[0], note: '', addActivity: true }); }}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* FEATURE 1: ICEBREAKER AI MODAL — upgraded */}
        {showIcebreaker && icebreakerContact && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] ${
              darkMode ? 'bg-slate-800' : 'bg-white'
            }`}>

              {/* FIXED HEADER - Won't scroll */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white flex-shrink-0 rounded-t-2xl">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">auto_awesome</span> Icebreaker for {icebreakerContact.name}
                    </h2>
                    <p className="text-indigo-200 text-xs mt-0.5">
                      {icebreakerContact.company && `${icebreakerContact.company} · `}AI-generated opening lines
                    </p>
                  </div>
                  <button onClick={() => { setShowIcebreaker(false); setIcebreakerEditSubject(''); setIcebreakerEditBody(''); setIcebreakerLines([]); }} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Channel toggle */}
                <div className="flex gap-1.5 mt-4 flex-wrap">
                  <span className="text-xs text-indigo-200 self-center mr-1">Channel:</span>
                  {icebreakerChannels.map(ch => (
                    <button key={ch.id}
                      onClick={() => { setIcebreakerChannel(ch.id); generateIcebreaker(icebreakerContact, ch.id); }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        icebreakerChannel === ch.id ? 'bg-white text-indigo-700' : 'bg-white/20 text-white hover:bg-white/30'
                      }`}>
                      {ch.icon} {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SCROLLABLE CONTENT */}
              <div className="flex-1 overflow-y-auto p-6">
                {icebreakerLoading ? (
                  <div className="py-10 flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm">Crafting your {icebreakerChannels.find(c=>c.id===icebreakerChannel)?.label} message…</p>
                  </div>
                ) : icebreakerEditBody ? (
                  <IcebreakerMessageCard
                    channel={icebreakerChannel}
                    contact={icebreakerContact}
                    subject={icebreakerEditSubject}
                    body={icebreakerEditBody}
                    onSubjectChange={setIcebreakerEditSubject}
                    onBodyChange={setIcebreakerEditBody}
                    darkMode={darkMode}
                    isCopied={icebreakerCopied === 0}
                    onCopy={copyIcebreakerLine}
                    onOpen={openChannelWithMessage}
                    icebreakerChannels={icebreakerChannels}
                    user={user}
                  />
                ) : null}
              </div>

              {/* FIXED FOOTER */}
              {!icebreakerLoading && icebreakerLines.length > 0 && (
                <div className={`px-6 py-4 border-t flex gap-2 flex-shrink-0 rounded-b-2xl ${
                  darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}>
                  <button onClick={() => generateIcebreaker(icebreakerContact, icebreakerChannel)}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Regenerate
                  </button>
                  <button onClick={() => setShowIcebreaker(false)}
                    className={`px-5 rounded-xl text-sm font-medium transition ${
                      darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                    Done
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Category Manager Modal */}
        {showCategoryManager && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[24px] text-indigo-500">label</span> Categories
                </h2>
                <button onClick={() => setShowCategoryManager(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <span className="material-symbols-outlined text-[20px] text-gray-500">close</span>
                </button>
              </div>

              {/* Existing categories */}
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <span className="material-symbols-outlined text-[48px] opacity-30">label</span>
                  <p className="text-sm">No categories yet — create your first one below.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {categories.map(cat => {
                    const count = contacts.filter(c => c.category === cat.id).length;
                    return (
                      <div key={cat.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 group">
                        <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }}></span>
                        <span className="flex-1 font-semibold text-gray-800 text-sm">{cat.name}</span>
                        <span className="text-xs text-gray-400">{count} contact{count !== 1 ? 's' : ''}</span>
                        {/* Inline category filter shortcut */}
                        <button
                          onClick={() => { setFilterCategory(cat.id); setShowFilters(true); setShowCategoryManager(false); }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-indigo-500 hover:text-indigo-700 transition px-2 py-1 rounded-lg bg-indigo-50">
                          View
                        </button>
                        <button onClick={() => deleteCategory(cat.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-red-300 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Create new category */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Create New Category</p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="e.g. VIP Clients, Cold Leads, Partners…"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer">
                      <div className="w-10 h-10 rounded-xl border-2 border-gray-200 overflow-hidden flex items-center justify-center"
                        style={{ backgroundColor: newCategoryColor }}>
                        <span className="text-white text-[10px] font-bold">color</span>
                      </div>
                      <input type="color" value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="sr-only" />
                    </label>
                    <button onClick={addCategory} disabled={!newCategoryName.trim()}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                      Create
                    </button>
                  </div>
                </div>
                {/* Preset colours */}
                <div className="flex gap-2 mt-3 flex-wrap">
                  {['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#64748b','#84cc16'].map(col => (
                    <button key={col} type="button" onClick={() => setNewCategoryColor(col)}
                      className={`w-6 h-6 rounded-full border-2 transition ${newCategoryColor === col ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-110'}`}
                      style={{ backgroundColor: col }} />
                  ))}
                </div>
              </div>

              {/* Bulk reassign section */}
              {categories.length > 0 && contacts.length > 0 && (
                <div className="border-t border-gray-100 pt-5 mt-5">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Edit Contact Categories</p>
                  <p className="text-xs text-gray-400 mb-3">Click any contact card on the dashboard to edit its category in the detail view, or use the filter to select by category and bulk-reassign.</p>
                  <button onClick={() => { setShowCategoryManager(false); setShowFilters(true); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline">
                    Open filters on the dashboard →
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Premium Modal */}
        {showPremiumModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[32px]">workspace_premium</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Upgrade to Premium</h2>
                {upgradeReason && (
                  <p className="text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 mb-2">{upgradeReason}</p>
                )}
                <p className="text-4xl font-bold text-yellow-600 mb-1">$5</p>
                <p className="text-sm text-gray-500">one-time payment</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[20px] text-yellow-600">notifications</span><span className="text-sm text-gray-700">Custom Reminders</span></div>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[20px] text-yellow-600">mail</span><span className="text-sm text-gray-700">Bulk Personalized Emails</span></div>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[20px] text-yellow-600">upload</span><span className="text-sm text-gray-700">Bulk Import (Excel/CSV)</span></div>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[20px] text-yellow-600">timeline</span><span className="text-sm text-gray-700">Activity Timeline</span></div>
                <div className="flex items-center gap-3"><span className="material-symbols-outlined text-[20px] text-yellow-600">analytics</span><span className="text-sm text-gray-700">Advanced Analytics</span></div>
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

      </main>

      {/* TODAY'S FOCUS MODAL */}
      {showFocusModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-4xl">priority_high</span>
                  <div>
                    <h2 className="text-2xl font-bold">🔥 Today's Focus</h2>
                    <p className="text-orange-100 text-sm">Hot contacts that need attention</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFocusModal(false)}
                  className="hover:bg-white/10 p-2 rounded-lg transition"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            {/* Settings Section */}
            <div className="border-b border-slate-200 p-6 bg-slate-50">
              <button
                onClick={() => setShowFocusSettings(!showFocusSettings)}
                className="flex items-center justify-between w-full text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-600">settings</span>
                  <span className="font-semibold text-slate-800">Focus Settings</span>
                </div>
                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600">
                  {showFocusSettings ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {showFocusSettings && (
                <div className="mt-4 space-y-4 pl-8">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Show contacts not contacted in last:
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={focusSettings.dayThreshold}
                        onChange={(e) => setFocusSettings({
                          ...focusSettings,
                          dayThreshold: parseInt(e.target.value) || 7
                        })}
                        className="w-20 px-3 py-2 border border-slate-300 rounded-xl text-center font-bold text-lg"
                      />
                      <span className="text-slate-600">days</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Quick presets:</label>
                    <div className="flex gap-2 flex-wrap">
                      {[3, 7, 14, 30].map(days => (
                        <button
                          key={days}
                          onClick={() => setFocusSettings({...focusSettings, dayThreshold: days})}
                          className={`px-3 py-1.5 border rounded-lg text-sm font-medium transition ${
                            focusSettings.dayThreshold === days
                              ? 'bg-orange-500 text-white border-orange-500'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {days} day{days !== 1 ? 's' : ''}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="flex gap-2">
                      <span className="material-symbols-outlined text-blue-600 text-sm">info</span>
                      <div className="text-xs text-blue-800">
                        <p className="font-semibold mb-1">How it works:</p>
                        <p>Focus shows all 🔥 Hot contacts (vibe score ≥8) that you haven't contacted in {focusSettings.dayThreshold}+ days.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact List */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  <span className="font-bold text-slate-800">{focusContacts.length}</span> contact
                  {focusContacts.length !== 1 ? 's' : ''} need{focusContacts.length === 1 ? 's' : ''} attention
                </div>
                {focusContacts.length > 0 && (
                  <button
                    onClick={handleBulkFocusContact}
                    className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-base">done_all</span>
                    Mark all contacted
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {focusContacts.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="material-symbols-outlined text-6xl text-green-500">check_circle</span>
                    <h3 className="text-lg font-bold text-slate-800 mt-4">All caught up!</h3>
                    <p className="text-slate-600 text-sm">No hot contacts need attention right now.</p>
                  </div>
                ) : (
                  focusContacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => {
                        setShowFocusModal(false);
                        setSelectedContact(contact);
                      }}
                      className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">🔥</span>
                            <h3 className="font-bold text-slate-800 text-lg">{contact.name}</h3>
                          </div>
                          
                          <div className="text-sm text-slate-600 space-y-1">
                            {contact.company && (
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">business</span>
                                {contact.company}
                              </div>
                            )}
                            {contact.email && (
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs">mail</span>
                                {contact.email}
                              </div>
                            )}
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full"
                                style={{ width: `${(contact.vibeScore / 10) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">{contact.vibeScore}/10</span>
                          </div>
                        </div>

                        <div className="text-right ml-4">
                          <div className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-xl text-xs font-bold">
                            {getDaysSinceContact(contact)} days
                          </div>
                          <div className="text-xs text-slate-500 mt-1">since contact</div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickContact(contact);
                          }}
                          className="flex-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Mark Contacted
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFocusModal(false);
                            setShowIcebreaker(true);
                            setIcebreakerContact(contact);
                          }}
                          className="flex-1 px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-sm font-semibold hover:bg-indigo-600 flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">auto_awesome</span>
                          Icebreaker
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BUSINESS PROFILE MODAL */}
      {showBusinessProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold">Business Profile & Settings</h2>
                  <p className="text-indigo-100 text-sm">Help AI personalize your outreach</p>
                </div>
                <button
                  onClick={() => setShowBusinessProfile(false)}
                  className="hover:bg-white/10 p-2 rounded-lg transition"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* User Info */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={user.name || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>

              {/* Username for Email - NEW */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username (Optional)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={user?.emailConfig?.customEmailPrefix || ''}
                    onChange={async (e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                      const updatedUser = {
                        ...user,
                        emailConfig: {
                          ...user.emailConfig,
                          customEmailPrefix: value,
                          defaultEmail: value ? `${value}@mikrocrm.app` : null
                        }
                      };
                      setUser(updatedUser);
                      
                      // Save to Firestore
                      if (window.firebaseDb && user.uid && value) {
                        try {
                          await window.setDoc(
                            window.doc(window.firebaseDb, 'users', user.uid),
                            { emailConfig: updatedUser.emailConfig },
                            { merge: true }
                          );
                        } catch (err) {
                          console.error('Error saving username:', err);
                        }
                      }
                    }}
                    placeholder="e.g., john.smith"
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  />
                  <span className="text-slate-600 font-mono">@mikrocrm.app</span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[16px] mt-0.5">info</span>
                    <span>
                      This username will be used as your custom email address for sending emails from the CRM. You can set or change it anytime.
                    </span>
                  </p>
                </div>
              </div>

              {/* Business Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessProfile.businessName}
                  onChange={(e) => setBusinessProfile({...businessProfile, businessName: e.target.value})}
                  placeholder="e.g., Acme Corp"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={businessProfile.industry}
                  onChange={(e) => setBusinessProfile({...businessProfile, industry: e.target.value})}
                  placeholder="e.g., SaaS, E-commerce, Consulting"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Business Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  What does your business do?
                </label>
                <textarea
                  value={businessProfile.description}
                  onChange={(e) => setBusinessProfile({...businessProfile, description: e.target.value})}
                  placeholder="Describe your products/services, what problems you solve..."
                  rows="4"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
                <p className="text-xs text-slate-500 mt-1">
                  💡 This helps AI generate better, more relevant icebreakers and emails
                </p>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={businessProfile.targetAudience}
                  onChange={(e) => setBusinessProfile({...businessProfile, targetAudience: e.target.value})}
                  placeholder="e.g., Small business owners, Marketing directors"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Value Proposition */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Key Value Proposition
                </label>
                <input
                  type="text"
                  value={businessProfile.valueProposition}
                  onChange={(e) => setBusinessProfile({...businessProfile, valueProposition: e.target.value})}
                  placeholder="e.g., Save time, Increase revenue, Reduce costs"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex gap-3">
                  <span className="material-symbols-outlined text-blue-600">info</span>
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Why this matters:</p>
                    <p>This information is used by AI to generate personalized icebreakers and emails that are relevant to your business and audience. The more detail you provide, the better the AI output.</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={() => {
                  // Show success message
                  const tempDiv = document.createElement('div');
                  tempDiv.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg z-[60] flex items-center gap-2';
                  tempDiv.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Business profile saved successfully!';
                  document.body.appendChild(tempDiv);
                  
                  setTimeout(() => {
                    tempDiv.remove();
                  }, 3000);
                  
                  // Close modal after short delay
                  setTimeout(() => {
                    setShowBusinessProfile(false);
                  }, 500);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
{/* ===== FIRST-TIME EMAIL SETUP MODAL (OPTIONAL) ===== */}
{showEmailSetup && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[28px]">mail</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Set Up Your Email Address</h2>
              <p className="text-sm text-indigo-100">Choose your professional sending email (optional)</p>
            </div>
          </div>
          <button
            onClick={() => setShowEmailSetup(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <span className="material-symbols-outlined text-white">close</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Important Notice */}
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
          <div className="flex gap-3">
            <span className="material-symbols-outlined text-blue-600 text-[24px]">info</span>
            <div className="flex-1">
              <p className="font-bold text-blue-900 mb-1">Set Your Professional Email</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Choose your email address for sending emails from the CRM</li>
                <li>• You can skip this and set it later in Email Settings</li>
                <li>• Once set, changes require admin approval for security</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            Choose Your Email Address
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customEmailPrefix}
              onChange={(e) => {
                const value = e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                setCustomEmailPrefix(value);
                setEmailAvailable(null);
              }}
              placeholder="yourname"
              className="flex-1 px-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg font-mono"
            />
            <span className="text-lg font-mono text-slate-600">@mikrocrm.app</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Use lowercase letters, numbers, dots, hyphens, or underscores only
          </p>
        </div>

        {/* Live Preview */}
        {customEmailPrefix && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-indigo-900 mb-2">Preview:</p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">person</span>
              <div>
                <p className="font-bold text-indigo-900">{user?.name || 'Your Name'}</p>
                <p className="font-mono text-sm text-indigo-700">{customEmailPrefix}@mikrocrm.app</p>
              </div>
            </div>
          </div>
        )}

        {/* Check Availability */}
        {customEmailPrefix && (
          <button
            onClick={async () => {
              if (!customEmailPrefix || customEmailPrefix.length < 3) {
                alert('Email prefix must be at least 3 characters');
                return;
              }
              
              setCheckingAvailability(true);
              
              // Check if email is already taken in Firestore
              try {
                const usersRef = window.collection(window.firebaseDb, 'users');
                const q = window.query(usersRef, window.where('emailConfig.customEmailPrefix', '==', customEmailPrefix));
                const querySnapshot = await window.getDocs(q);
                
                if (querySnapshot.empty) {
                  setEmailAvailable(true);
                } else {
                  setEmailAvailable(false);
                }
              } catch (err) {
                console.error('Error checking availability:', err);
                alert('Error checking availability. Please try again.');
              }
              
              setCheckingAvailability(false);
            }}
            disabled={checkingAvailability || !customEmailPrefix || customEmailPrefix.length < 3}
            className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:cursor-not-allowed text-slate-700 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"
          >
            {checkingAvailability ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                Checking availability...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">search</span>
                Check Availability
              </>
            )}
          </button>
        )}

        {/* Availability Result */}
        {emailAvailable === true && (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600 text-[24px]">check_circle</span>
            <div>
              <p className="font-bold text-green-900">Available!</p>
              <p className="text-sm text-green-700">{customEmailPrefix}@mikrocrm.app is available</p>
            </div>
          </div>
        )}

        {emailAvailable === false && (
          <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-600 text-[24px]">cancel</span>
            <div>
              <p className="font-bold text-red-900">Not Available</p>
              <p className="text-sm text-red-700">{customEmailPrefix}@mikrocrm.app is already taken. Try another.</p>
            </div>
          </div>
        )}

        {/* Examples */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-700 mb-2">Examples:</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="font-mono">john.smith@mikrocrm.app</div>
            <div className="font-mono">sarah_johnson@mikrocrm.app</div>
            <div className="font-mono">mike-wilson@mikrocrm.app</div>
            <div className="font-mono">alex.dev@mikrocrm.app</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-2xl space-y-3">
        <button
          onClick={async () => {
            if (!emailAvailable) {
              alert('Please check availability first and choose an available email');
              return;
            }
            
            if (!customEmailPrefix || customEmailPrefix.length < 3) {
              alert('Email prefix must be at least 3 characters');
              return;
            }
            
            const fullEmail = `${customEmailPrefix}@mikrocrm.app`;
            
            if (confirm(`Confirm setting your email to ${fullEmail}?\n\nYou can change this later in Email Settings (requires admin approval).`)) {
              try {
                const updatedEmailConfig = {
                  ...user.emailConfig,
                  defaultEmail: fullEmail,
                  customEmailPrefix: customEmailPrefix,
                  emailPending: false,
                  createdAt: user.emailConfig.createdAt || new Date().toISOString()
                };
                
                // Update Firestore
                await window.setDoc(
                  window.doc(window.firebaseDb, 'users', user.uid),
                  { emailConfig: updatedEmailConfig },
                  { merge: true }
                );
                
                // Update local state
                setUser({
                  ...user,
                  emailConfig: updatedEmailConfig
                });
                
                setShowEmailSetup(false);
                setCustomEmailPrefix('');
                setEmailAvailable(null);
                
                // Show success message
                alert(`✅ Email set successfully!\n\nYou can now send emails from ${fullEmail}`);
              } catch (err) {
                console.error('Error setting email:', err);
                alert('Error setting email. Please try again.');
              }
            }
          }}
          disabled={!emailAvailable || checkingAvailability}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">check_circle</span>
          Confirm Email Address
        </button>
        
        <button
          onClick={async () => {
            if (confirm('Skip email setup?\n\nYou can set your email later in Email Settings.')) {
              try {
                // Mark as not pending so modal doesn't show again
                const updatedEmailConfig = {
                  ...user.emailConfig,
                  emailPending: false
                };
                
                await window.setDoc(
                  window.doc(window.firebaseDb, 'users', user.uid),
                  { emailConfig: updatedEmailConfig },
                  { merge: true }
                );
                
                setUser({
                  ...user,
                  emailConfig: updatedEmailConfig
                });
                
                setShowEmailSetup(false);
                setCustomEmailPrefix('');
                setEmailAvailable(null);
              } catch (err) {
                console.error('Error skipping setup:', err);
              }
            }
          }}
          className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 rounded-xl font-semibold transition"
        >
          Skip for Now
        </button>
      </div>
    </div>
  </div>
)}
{/* ===== EMAIL SETTINGS MODAL (UPDATED) ===== */}
{showEmailSettings && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-indigo-600">mail</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Email Configuration</h2>
            <p className="text-sm text-slate-500">Manage your sending email address</p>
          </div>
        </div>
        <button
          onClick={() => setShowEmailSettings(false)}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Current Email Status OR Set Email Prompt */}
        {user?.emailConfig?.defaultEmail ? (
          // Email is set - show current status
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white">verified</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-700">Your Sending Email</p>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">ACTIVE</span>
                </div>
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  {user?.emailConfig?.customEmail || user?.emailConfig?.defaultEmail}
                </p>
                <p className="text-sm text-slate-600">
                  From Name: <strong>{user?.emailConfig?.fromName || 'Your Name'}</strong>
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Email not set - show prompt
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-white">warning</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 mb-1">Email Not Set</p>
                <p className="text-slate-700 mb-3">
                  You haven't set up your sending email address yet. Set it now to send emails from the CRM.
                </p>
                <button
                  onClick={() => {
                    setShowEmailSettings(false);
                    setShowEmailSetup(true);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  Set Up Email Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* From Name */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            From Name
          </label>
          <input
            type="text"
            value={user?.emailConfig?.fromName || ''}
            onChange={async (e) => {
              const newFromName = e.target.value;
              const updatedUser = {
                ...user,
                emailConfig: {
                  ...user.emailConfig,
                  fromName: newFromName
                }
              };
              setUser(updatedUser);
              
              // Save to Firestore
              if (window.firebaseDb && user.uid) {
                try {
                  await window.setDoc(
                    window.doc(window.firebaseDb, 'users', user.uid),
                    { emailConfig: updatedUser.emailConfig },
                    { merge: true }
                  );
                } catch (err) {
                  console.error('Error saving from name:', err);
                }
              }
            }}
            placeholder="e.g., John Smith"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            This name will appear as the sender when recipients receive your emails
          </p>
        </div>

        {/* Use Existing Email as Reply-To - NEW */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">forward_to_inbox</span>
            Use Your Existing Email for Replies
          </h3>
          <p className="text-sm text-slate-700 mb-3">
            Set your personal email (e.g., Gmail) as the reply-to address. Recipients will reply to this email instead of your CRM email.
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Your Personal Email (Reply-To)
              </label>
              <input
                type="email"
                value={user?.emailConfig?.replyToEmail || user?.email || ''}
                onChange={async (e) => {
                  const newReplyTo = e.target.value;
                  const updatedUser = {
                    ...user,
                    emailConfig: {
                      ...user.emailConfig,
                      replyToEmail: newReplyTo
                    }
                  };
                  setUser(updatedUser);
                  
                  // Save to Firestore
                  if (window.firebaseDb && user.uid) {
                    try {
                      await window.setDoc(
                        window.doc(window.firebaseDb, 'users', user.uid),
                        { emailConfig: updatedUser.emailConfig },
                        { merge: true }
                      );
                    } catch (err) {
                      console.error('Error saving reply-to:', err);
                    }
                  }
                }}
                placeholder="your.email@gmail.com"
                className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[14px] mt-0.5">info</span>
                <span>
                  Emails will be sent from <strong>{user?.emailConfig?.defaultEmail || 'your-username@mikrocrm.app'}</strong> but replies will go to the email you specify above.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Change Email Section */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Change Email Address</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-amber-600">lock</span>
              <div className="flex-1">
                <p className="font-semibold text-amber-900 mb-2">Email changes require admin approval</p>
                <p className="text-sm text-amber-800 mb-3">
                  Your current email address is locked for security. To change it, submit a request for admin review.
                </p>
                <button
                  onClick={async () => {
                    const newEmail = prompt(`Current email: ${user?.emailConfig?.defaultEmail}\n\nEnter your desired new email prefix (e.g., "john.smith"):`);
                    
                    if (!newEmail) return;
                    
                    const cleanEmail = newEmail.toLowerCase().replace(/[^a-z0-9._-]/g, '');
                    
                    if (cleanEmail.length < 3) {
                      alert('Email prefix must be at least 3 characters');
                      return;
                    }
                    
                    const fullNewEmail = `${cleanEmail}@mikrocrm.app`;
                    const reason = prompt('Why do you need to change your email?\n(This will be sent to the admin)');
                    
                    if (!reason) return;
                    
                    try {
                      // Add change request to user's emailConfig
                      const changeRequest = {
                        id: Date.now().toString(),
                        currentEmail: user.emailConfig.defaultEmail,
                        requestedEmail: fullNewEmail,
                        requestedPrefix: cleanEmail,
                        reason: reason,
                        status: 'pending',  // 'pending', 'approved', 'rejected'
                        requestedAt: new Date().toISOString(),
                        userId: user.uid,
                        userName: user.name
                      };
                      
                      const updatedChangeRequests = [
                        ...(user.emailConfig.changeRequests || []),
                        changeRequest
                      ];
                      
                      await window.setDoc(
                        window.doc(window.firebaseDb, 'users', user.uid),
                        {
                          emailConfig: {
                            ...user.emailConfig,
                            changeRequests: updatedChangeRequests
                          }
                        },
                        { merge: true }
                      );
                      
                      // Update local state
                      setUser({
                        ...user,
                        emailConfig: {
                          ...user.emailConfig,
                          changeRequests: updatedChangeRequests
                        }
                      });
                      
                      alert('✅ Change request submitted!\n\nThe admin will review your request and respond soon.');
                    } catch (err) {
                      console.error('Error submitting change request:', err);
                      alert('Error submitting request. Please try again.');
                    }
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Request Email Change
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Change Requests */}
        {user?.emailConfig?.changeRequests && user.emailConfig.changeRequests.filter(r => r.status === 'pending').length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600">pending</span>
              <div className="flex-1">
                <p className="font-semibold text-blue-900 mb-2">Pending Change Requests</p>
                {user.emailConfig.changeRequests
                  .filter(r => r.status === 'pending')
                  .map((request) => (
                    <div key={request.id} className="bg-white rounded-lg p-3 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-mono text-sm font-bold text-slate-900">{request.requestedEmail}</p>
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">PENDING</span>
                      </div>
                      <p className="text-xs text-slate-600">Requested: {new Date(request.requestedAt).toLocaleDateString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Reason: {request.reason}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-indigo-600">workspace_premium</span>
            <h3 className="text-sm font-bold text-slate-700">Professional Upgrade</h3>
          </div>
        </div>

        {/* Custom Domain Section - Same as before */}
        {user?.emailConfig?.customDomain ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-green-600">verified</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-900 mb-1">Custom Domain Connected</p>
                <p className="font-mono text-lg font-bold text-green-900 mb-2">
                  {user.emailConfig.customDomain}
                </p>
                <p className="text-sm text-green-700 mb-3">
                  Sending from: <strong>{user.emailConfig.customEmail}</strong>
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to remove your custom domain?')) {
                      const updatedUser = {
                        ...user,
                        emailConfig: {
                          ...user.emailConfig,
                          customDomain: null,
                          customEmail: null,
                          domainVerified: false
                        }
                      };
                      setUser(updatedUser);
                      
                      if (window.firebaseDb && user.uid) {
                        window.setDoc(
                          window.doc(window.firebaseDb, 'users', user.uid),
                          { emailConfig: updatedUser.emailConfig },
                          { merge: true }
                        );
                      }
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-semibold"
                >
                  Remove Custom Domain
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-indigo-200 rounded-xl p-5">
            <h4 className="font-bold text-slate-900 mb-3">Use Your Company Email</h4>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                <span>Send from your actual business email (e.g., you@yourcompany.com)</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-700">
                <span className="material-symbols-outlined text-indigo-600 text-[18px]">check_circle</span>
                <span>Improved email deliverability and trust</span>
              </li>
            </ul>
            <button
              onClick={() => {
                setShowDomainWizard(true);
                setDomainWizardStep(1);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Connect My Domain
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4">
        <button
          onClick={() => setShowEmailSettings(false)}
          className="w-full bg-slate-700 hover:bg-slate-800 text-white py-3 rounded-xl font-bold transition"
        >
          Done
        </button>
      </div>
    </div>
  </div>
)}
{/* ===== ADMIN PANEL - EMAIL CHANGE REQUESTS ===== */}
{showAdminPanel && user?.isAdmin && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-red-600 to-pink-600 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Admin Panel</h2>
            <p className="text-sm text-red-100">Email Change Requests</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdminPanel(false)}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <AdminChangeRequests />
      </div>
    </div>
  </div>
)}

{/* Admin Change Requests Component */}
{/* ===== DOMAIN CONNECTION WIZARD ===== */}
{showDomainWizard && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white">dns</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Connect Your Domain</h2>
            <p className="text-sm text-indigo-100">Step {domainWizardStep} of 3</p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowDomainWizard(false);
            setDomainWizardStep(1);
            setCustomDomain('');
          }}
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </button>
      </div>

      {/* Progress Steps */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className={`flex items-center gap-2 ${domainWizardStep >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${domainWizardStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
              {domainWizardStep > 1 ? '✓' : '1'}
            </div>
            <span className="text-xs font-semibold hidden sm:inline">Enter</span>
          </div>
          <div className={`h-1 flex-1 mx-2 ${domainWizardStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center gap-2 ${domainWizardStep >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${domainWizardStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
              {domainWizardStep > 2 ? '✓' : '2'}
            </div>
            <span className="text-xs font-semibold hidden sm:inline">Configure</span>
          </div>
          <div className={`h-1 flex-1 mx-2 ${domainWizardStep >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
          <div className={`flex items-center gap-2 ${domainWizardStep >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${domainWizardStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
              3
            </div>
            <span className="text-xs font-semibold hidden sm:inline">Verify</span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {/* STEP 1: Enter Domain */}
        {domainWizardStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Enter Your Domain</h3>
              <p className="text-slate-600">What domain do you want to send emails from?</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Your Domain Name
              </label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, ''))}
                placeholder="e.g., yourcompany.com"
                className="w-full px-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
              />
              <p className="text-xs text-slate-500 mt-2">
                Enter just the domain (e.g., yourcompany.com) without http:// or www
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-amber-600">info</span>
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">Important:</p>
                  <p>You'll need access to your domain's DNS settings to complete this process. This is usually found in your domain registrar (GoDaddy, Namecheap, etc.) or hosting provider.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!customDomain || !customDomain.includes('.')) {
                  alert('Please enter a valid domain name');
                  return;
                }
                setDomainWizardStep(2);
              }}
              disabled={!customDomain || !customDomain.includes('.')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition flex items-center justify-center gap-2"
            >
              Continue to DNS Setup
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}

        {/* STEP 2: Add DNS Records */}
        {domainWizardStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Add DNS Records</h3>
              <p className="text-slate-600">Add these records to <strong>{customDomain}</strong></p>
            </div>

            {/* DNS Records */}
            <div className="space-y-4">
              {/* SPF Record */}
              <div className="border-2 border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">TXT</span>
                      <h4 className="font-bold text-slate-900">SPF Record</h4>
                    </div>
                    <p className="text-xs text-slate-500">Authorizes emails from your domain</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('v=spf1 include:resend.com ~all');
                      alert('Copied to clipboard!');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold transition"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 font-mono text-sm">
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-1">
                    <div>Type</div>
                    <div>Name</div>
                    <div>Value</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-blue-700 font-bold">TXT</div>
                    <div className="text-slate-900">@</div>
                    <div className="text-slate-900 break-all">v=spf1 include:resend.com ~all</div>
                  </div>
                </div>
              </div>

              {/* DKIM Record */}
              <div className="border-2 border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">CNAME</span>
                      <h4 className="font-bold text-slate-900">DKIM Record</h4>
                    </div>
                    <p className="text-xs text-slate-500">Verifies email authenticity</p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('resend._domainkey');
                      alert('Copied to clipboard!');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold transition"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 font-mono text-sm">
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 mb-1">
                    <div>Type</div>
                    <div>Name</div>
                    <div>Points to</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-purple-700 font-bold">CNAME</div>
                    <div className="text-slate-900">resend._domainkey</div>
                    <div className="text-slate-900">resend.com</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-blue-600">lightbulb</span>
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-2">How to add these records:</p>
                  <ol className="list-decimal list-inside space-y-1 text-blue-800">
                    <li>Log in to your domain registrar (GoDaddy, Namecheap, etc.)</li>
                    <li>Find DNS settings or DNS management</li>
                    <li>Add each record exactly as shown above</li>
                    <li>Save changes (propagation takes 5-30 minutes)</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDomainWizardStep(1)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition"
              >
                Back
              </button>
              <button
                onClick={() => setDomainWizardStep(3)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                I've Added the Records
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Verify */}
        {domainWizardStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {domainVerifying ? (
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-indigo-600 text-[40px]">verified</span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {domainVerifying ? 'Verifying Domain...' : 'Verify Your Domain'}
              </h3>
              <p className="text-slate-600">
                {domainVerifying ? 'This may take a few seconds...' : `Click verify to check if ${customDomain} is configured correctly`}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-amber-600">schedule</span>
                <div className="text-sm text-amber-900">
                  <p className="font-semibold mb-1">DNS Propagation:</p>
                  <p>DNS changes can take 5-30 minutes to propagate. If verification fails, wait a few minutes and try again.</p>
                </div>
              </div>
            </div>

            {/* Your Custom Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Your Custom Email Address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user?.name?.toLowerCase().replace(/\s+/g, '.') || 'you'}
                  onChange={(e) => {}}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <span className="text-slate-600 font-mono">@{customDomain}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setDomainWizardStep(2)}
                disabled={domainVerifying}
                className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 py-3 rounded-xl font-bold transition"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  setDomainVerifying(true);
                  
                  // Simulate verification (in production, call Resend API)
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // For now, mark as verified (in production, check actual DNS)
                  const customEmail = `${user?.name?.toLowerCase().replace(/\s+/g, '.')}@${customDomain}`;
                  const updatedUser = {
                    ...user,
                    emailConfig: {
                      ...user.emailConfig,
                      customDomain: customDomain,
                      customEmail: customEmail,
                      domainVerified: true
                    }
                  };
                  
                  setUser(updatedUser);
                  
                  // Save to Firestore
                  if (window.firebaseDb && user.uid) {
                    await window.setDoc(
                      window.doc(window.firebaseDb, 'users', user.uid),
                      { emailConfig: updatedUser.emailConfig },
                      { merge: true }
                    );
                  }
                  
                  setDomainVerifying(false);
                  
                  // Show success
                  alert(`✅ Domain verified! You can now send from ${customEmail}`);
                  setShowDomainWizard(false);
                  setShowEmailSettings(false);
                  setDomainWizardStep(1);
                  setCustomDomain('');
                }}
                disabled={domainVerifying}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                {domainVerifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">verified</span>
                    Verify Domain
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
)}

      {/* Mobile FAB */}
      <MobileFAB />

    </div>
  );
}
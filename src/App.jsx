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
  const [icebreakerChannel, setIcebreakerChannel] = useState('linkedin'); // 'linkedin' | 'email'
  const [icebreakerCopied, setIcebreakerCopied] = useState(null); // index of copied line
  const [nudgeEnabled, setNudgeEnabled] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState(null); // 'cold' | 'warm' | 'hot'
  const [draggingId, setDraggingId] = useState(null);
  const [bulkContactsText, setBulkContactsText] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [bulkEmailData, setBulkEmailData] = useState({ subject: '', body: '', selectedContacts: [] });
  const [emailSendMethod, setEmailSendMethod] = useState('mailto'); // 'copy' | 'mailto'
  const [emailSendStatus, setEmailSendStatus] = useState(''); // 'sending' | 'done' | ''
  const [showBulkIcebreaker, setShowBulkIcebreaker] = useState(false);
  const [bulkIcebreakerData, setBulkIcebreakerData] = useState({ selectedContacts: [], channel: 'linkedin', results: {} }); // results: { contactId: [line1, line2, line3] }
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
  
  const checkAuth = async () => {
    // Wait for Firebase to be ready
    if (!window.firebaseReady || !window.firebaseAuth || !window.onAuthStateChanged) {
      console.log('⏳ Waiting for Firebase to load...');
      setTimeout(checkAuth, 100);
      return;
    }
    
    console.log('✅ Firebase ready, checking auth state...');
    
    try {
      unsubscribe = window.onAuthStateChanged(window.firebaseAuth, async (firebaseUser) => {
        console.log('🔍 Auth state:', firebaseUser ? firebaseUser.email : 'No user');
        
        if (firebaseUser) {
          try {
            const userDocRef = window.doc(window.firebaseDb, 'users', firebaseUser.uid);
            const userDoc = await window.getDoc(userDocRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('✅ User data loaded:', userData.name);
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: userData.name || firebaseUser.email.split('@')[0],
                isPremium: userData.isPremium || false
              });
              setIsPremium(userData.isPremium || false);
            } else {
              console.log('📝 Creating user doc');
              await window.setDoc(window.doc(window.firebaseDb, 'users', firebaseUser.uid), {
                email: firebaseUser.email,
                name: firebaseUser.email.split('@')[0],
                isPremium: false,
                createdAt: new Date().toISOString()
              });
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.email.split('@')[0],
                isPremium: false
              });
            }
            setIsLoading(false);
          } catch (error) {
            console.error('❌ Firestore error:', error);
            setIsLoading(false);
          }
        } else {
          console.log('❌ No user - redirecting to landing');
          setIsLoading(false);
          window.location.href = '/';
        }
      });
    } catch (error) {
      console.error('❌ Auth error:', error);
      setIsLoading(false);
    }
  };
  
  checkAuth();
  
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, []);
// ===== END FIREBASE AUTH CHECK =====
          if (firebaseUser) {
            // User is logged in - get their data from Firestore
            try {
              const userDocRef = window.doc(window.firebaseDb, 'users', firebaseUser.uid);
              const userDoc = await window.getDoc(userDocRef);
              
              if (userDoc.exists()) {
                const userData = userDoc.data();
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: userData.name || firebaseUser.email.split('@')[0],
                  isPremium: userData.isPremium || false
                });
                setIsPremium(userData.isPremium || false);
              } else {
                // User exists in auth but not in Firestore - create doc
                await window.setDoc(window.doc(window.firebaseDb, 'users', firebaseUser.uid), {
                  email: firebaseUser.email,
                  name: firebaseUser.email.split('@')[0],
                  isPremium: false,
                  createdAt: new Date().toISOString()
                });
                setUser({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  name: firebaseUser.email.split('@')[0],
                  isPremium: false
                });
              }
            } catch (error) {
              console.error('Error loading user data:', error);
              // Redirect to landing if error
              window.location.href = '/';
            }
          } else {
            // No Firebase user - redirect to landing page
            console.log('No Firebase user found - redirecting to landing page');
            window.location.href = '/';
          }
          setIsLoading(false);
        });
        
        return unsubscribe;
      } else {
        // Firebase not loaded yet - retry in 500ms
        setTimeout(checkAuth, 500);
      }
    };
    
    checkAuth();
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
      setIcebreakerLines(data.lines || []);
    } catch (err) {
      setIcebreakerLines(['Could not generate — check your connection and try again.']);
    }
    setIcebreakerLoading(false);
  };

  const copyIcebreakerLine = (line, index) => {
    navigator.clipboard.writeText(line);
    setIcebreakerCopied(index);
    setTimeout(() => setIcebreakerCopied(null), 2000);
  };

  const copyAllIcebreakers = () => {
    navigator.clipboard.writeText(icebreakerLines.join('\n\n'));
    setIcebreakerCopied('all');
    setTimeout(() => setIcebreakerCopied(null), 2000);
  };

  // --- BULK ICEBREAKER ---
  const generateBulkIcebreakers = async () => {
    const selectedContactsList = contacts.filter(c => bulkIcebreakerData.selectedContacts.includes(c.id));
    setBulkIcebreakerLoading(true);
    
    try {
      // Call our serverless function with all contacts at once + business profile
      const response = await fetch('/api/generate-bulk-icebreakers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contacts: selectedContactsList,
          channel: bulkIcebreakerData.channel,
          businessProfile // Include business context
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate bulk icebreakers');
      }

      const data = await response.json();
      setBulkIcebreakerData(prev => ({ ...prev, results: data.results || {} }));
    } catch (err) {
      console.error('Bulk icebreaker error:', err);
      // Set error messages for all contacts
      const errorResults = {};
      selectedContactsList.forEach(c => {
        errorResults[c.id] = ['Error generating — try again later.'];
      });
      setBulkIcebreakerData(prev => ({ ...prev, results: errorResults }));
    }
    
    setBulkIcebreakerLoading(false);
  };

  const copyAllBulkIcebreakers = () => {
    const selectedContactsList = contacts.filter(c => bulkIcebreakerData.selectedContacts.includes(c.id));
    const formatted = selectedContactsList.map(contact => {
      const lines = bulkIcebreakerData.results[contact.id] || [];
      return `${contact.name} (${contact.email || 'no email'}):\n${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`;
    }).join('\n\n---\n\n');
    navigator.clipboard.writeText(formatted);
    alert('All icebreakers copied to clipboard!');
  };

  const sendAllBulkIcebreakers = async () => {
    if (bulkIcebreakerData.channel !== 'email') {
      alert('Direct send only works for Email channel. Use Copy for LinkedIn.');
      return;
    }
    const selectedContactsList = contacts.filter(c => bulkIcebreakerData.selectedContacts.includes(c.id) && c.email);
    for (let i = 0; i < selectedContactsList.length; i++) {
      const contact = selectedContactsList[i];
      const lines = bulkIcebreakerData.results[contact.id] || [];
      const firstLine = lines[0] || '';
      const parts = firstLine.includes(' | ') ? firstLine.split(' | ') : ['Quick hello', firstLine];
      const subject = parts[0];
      const body = parts[1] || firstLine;
      const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink, '_blank');
      if (i < selectedContactsList.length - 1) await new Promise(r => setTimeout(r, 500));
    }
    alert(`Opened ${selectedContactsList.length} emails in your mail client!`);
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
    
    if (emailSendMethod === 'copy') {
      // Original clipboard copy method
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
      alert(`${selectedContactsList.length} emails copied to clipboard!`);
      setShowBulkEmail(false);
      setBulkEmailData({ subject: '', body: '', selectedContacts: [] });
    } else {
      // mailto: method - open email client for each
      setEmailSendStatus('sending');
      for (let i = 0; i < selectedContactsList.length; i++) {
        const contact = selectedContactsList[i];
        const personalizedBody = bulkEmailData.body
          .replace(/\{name\}/g, contact.name)
          .replace(/\{firstName\}/g, contact.name.split(' ')[0]);
        const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(bulkEmailData.subject)}&body=${encodeURIComponent(personalizedBody)}`;
        window.open(mailtoLink, '_blank');
        
        // Log activity
        addActivity({
          contactId: contact.id,
          type: 'email',
          content: `Drafted: ${bulkEmailData.subject}`,
          date: new Date().toISOString().split('T')[0],
          id: Date.now() + '_' + contact.id,
          timestamp: new Date().toISOString()
        });
        
        // Small delay between opens to prevent browser blocking
        if (i < selectedContactsList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      setEmailSendStatus('done');
      setTimeout(() => {
        setShowBulkEmail(false);
        setBulkEmailData({ subject: '', body: '', selectedContacts: [] });
        setEmailSendStatus('');
      }, 2000);
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
    </nav>
    
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
          title={user.name || 'User'}
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

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );

  // NO AUTH CHECK NEEDED - Firebase redirects to landing page if not logged in

  // Show loading while checking auth
  if (isLoading) {
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
      className={`hidden lg:block fixed top-4 right-4 z-50 p-3 rounded-xl shadow-lg hover:shadow-xl transition-all ${
        darkMode 
          ? 'bg-slate-800 border border-slate-700' 
          : 'bg-white border border-slate-200'
      }`}
      title={darkMode ? 'Light mode' : 'Dark mode'}
    >
      <span className={`material-symbols-outlined ${darkMode ? 'text-yellow-400' : 'text-slate-700'}`}>
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
            <span className={`text-xs font-semibold uppercase tracking-wide mr-1 ${
              darkMode ? 'text-slate-500' : 'text-gray-400'
            }`}>Sort:</span>
            {[
              { id: 'name',        label: 'Name' },
              { id: 'lastContact', label: 'Last Contact' },
              { id: 'vibe',        label: 'Vibe' },
              { id: 'company',     label: 'Company' },
              { id: 'dateAdded',   label: 'Date Added' },
            ].map(s => (
              <button key={s.id} onClick={() => toggleSort(s.id)}
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
            <div className="border border-gray-100 rounded-xl p-4 bg-gray-50 space-y-3">

              {/* Category filter */}
              {categories.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Category</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFilterCategory('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${filterCategory === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Vibe</p>
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
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Tag</p>
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Quick Filters</p>
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
                          <span className={`material-symbols-outlined text-[16px] ${contact.isFavorite ? 'text-yellow-400' : 'text-gray-300'}`}>star</span>
                        </button>
                      </div>
                      {contact.email && <p className="text-xs text-gray-400">{contact.email}</p>}
                      {contact.company && <p className="text-xs text-gray-500">{contact.company}</p>}
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

        {/* Bulk Email Modal — upgraded with mailto: support */}
        {showBulkEmail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Bulk Personalized Emails</h2>
              <p className="text-sm text-gray-500 mb-6">Send emails directly from your mail client or copy them all to clipboard.</p>

              {/* Send method toggle */}
              <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-xl">
                <button onClick={() => setEmailSendMethod('mailto')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${emailSendMethod === 'mailto' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">send</span> Send via Email Client
                </button>
                <button onClick={() => setEmailSendMethod('copy')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${emailSendMethod === 'copy' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500'}`}>
                  <span className="material-symbols-outlined text-[16px]">description</span> Copy to Clipboard
                </button>
              </div>

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
                      {/* NEW - Email Purpose Dropdown */}
<div className="mb-4">
  <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>
    Email Purpose (helps AI generate better content)
  </label>
  <select
    value={bulkEmailData.purpose || ''}
    onChange={(e) => setBulkEmailData({...bulkEmailData, purpose: e.target.value})}
    className={`w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 ${
      darkMode 
        ? 'bg-slate-800 border-slate-600 text-white'
        : 'bg-gray-50 border-gray-200'
    }`}
  >
    <option value="">Select purpose...</option>
    <option value="follow-up">Follow-up / Check-in</option>
    <option value="introduction">Introduction / Meeting Request</option>
    <option value="sales">Sales Pitch / Product Offer</option>
    <option value="update">Update / News Share</option>
    <option value="thank-you">Thank You / Appreciation</option>
    <option value="feedback">Request Feedback</option>
    <option value="networking">Networking / Collaboration</option>
  </select>
</div>

{/* NEW - Email Scheduling */}
<div className={`mb-4 p-4 rounded-xl border ${
  darkMode 
    ? 'bg-blue-900/20 border-blue-800'
    : 'bg-blue-50 border-blue-200'
}`}>
  <div className="flex items-center gap-2 mb-3">
    <span className={`material-symbols-outlined ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
      schedule_send
    </span>
    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
      Schedule Email (Optional)
    </span>
  </div>
  <div className="grid grid-cols-2 gap-3">
    <div>
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        Date
      </label>
      <input
        type="date"
        value={bulkEmailData.scheduleDate || ''}
        onChange={(e) => setBulkEmailData({...bulkEmailData, scheduleDate: e.target.value})}
        min={new Date().toISOString().split('T')[0]}
        className={`w-full px-3 py-2 border rounded-xl ${
          darkMode 
            ? 'bg-slate-800 border-slate-600 text-white'
            : 'bg-white border-slate-300'
        }`}
      />
    </div>
    <div>
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
        Time
      </label>
      <input
        type="time"
        value={bulkEmailData.scheduleTime || ''}
        onChange={(e) => setBulkEmailData({...bulkEmailData, scheduleTime: e.target.value})}
        className={`w-full px-3 py-2 border rounded-xl ${
          darkMode 
            ? 'bg-slate-800 border-slate-600 text-white'
            : 'bg-white border-slate-300'
        }`}
      />
    </div>
  </div>
  {bulkEmailData.scheduleDate && (
    <p className={`text-xs mt-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
      📅 Will send on {new Date(bulkEmailData.scheduleDate).toLocaleDateString()}
      {bulkEmailData.scheduleTime && ` at ${bulkEmailData.scheduleTime}`}
    </p>
  )}
</div>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* AI Generate Button */}
              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-indigo-600">auto_awesome</span>
                    <span className="text-sm font-semibold text-gray-800">AI Email Generator</span>
                  </div>
                  <button
                    onClick={async () => {
                      if (bulkEmailData.selectedContacts.length === 0) {
                        alert('Please select at least one recipient first');
                        return;
                      }
                      
                      // Generate AI email content
                      const firstContact = contacts.find(c => c.id === bulkEmailData.selectedContacts[0]);
                      if (!firstContact) return;
                      
                      try {
                        const response = await fetch('/api/generate-email', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            contact: firstContact,
                           businessProfile,
                           recipientCount: bulkEmailData.selectedContacts.length,
                          purpose: bulkEmailData.purpose // NEW - Send purpose to API
                          })

                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          setBulkEmailData({
                            ...bulkEmailData,
                            subject: data.subject || bulkEmailData.subject,
                            body: data.body || bulkEmailData.body
                          });
                        } else {
                          // Fallback if API not available yet
                          const businessContext = businessProfile.description 
                            ? `\n\nContext: ${businessProfile.businessName || 'Our company'} - ${businessProfile.description}`
                            : '';
                          
                          setBulkEmailData({
                            ...bulkEmailData,
                            subject: bulkEmailData.subject || `Quick check-in from ${businessProfile.businessName || 'us'}`,
                            body: bulkEmailData.body || `Hi {firstName},\n\nHope you're doing well! ${businessContext}\n\nI wanted to reach out and see how things are going.\n\nBest regards,\n${businessProfile.businessName || 'Your Name'}`
                          });
                        }
                      } catch (error) {
                        alert('AI generation not available. Please write manually.');
                      }
                    }}
                    disabled={bulkEmailData.selectedContacts.length === 0}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    Generate with AI
                  </button>
                </div>
                <p className="text-xs text-gray-600">
                  AI will use your business profile to generate personalized email content
                </p>
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

              {/* Status message */}
              {emailSendStatus && (
                <div className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${emailSendStatus === 'sending' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                  {emailSendStatus === 'sending' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Opening emails in your mail client...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="text-sm font-medium">Done! Check your mail client to send.</span>
                    </>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={generateBulkEmails}
                  disabled={bulkEmailData.selectedContacts.length === 0 || !bulkEmailData.subject || !bulkEmailData.body || emailSendStatus === 'sending'}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-purple-700 transition flex items-center justify-center gap-2">
                  {emailSendMethod === 'mailto' ? (
                    <><span className="material-symbols-outlined text-[20px]">send</span> Send {bulkEmailData.selectedContacts.length} Emails</>
                  ) : (
                    <><span className="material-symbols-outlined text-[20px]">description</span> Copy {bulkEmailData.selectedContacts.length} Emails</>
                  )}
                </button>
                <button onClick={() => { setShowBulkEmail(false); setBulkEmailData({ subject: '', body: '', selectedContacts: [] }); setEmailSendStatus(''); }}
                  className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">Cancel</button>
              </div>

              {emailSendMethod === 'mailto' && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  📧 Each email will open in your default mail client. Make sure pop-ups are allowed.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Bulk Icebreaker Modal */}
        {showBulkIcebreaker && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white flex-shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">auto_awesome</span> Bulk Icebreaker
                    </h2>
                    <p className="text-indigo-200 text-sm mt-0.5">
                      Generate personalized opening lines for multiple contacts at once
                    </p>
                  </div>
                  <button onClick={() => { setShowBulkIcebreaker(false); setBulkIcebreakerData({ selectedContacts: [], channel: 'linkedin', results: {} }); }}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Channel toggle */}
                <div className="flex gap-2 mt-4">
                  <span className="text-xs text-indigo-200 self-center mr-1">Channel:</span>
                  {[
                    { id: 'linkedin', icon: '💼', label: 'LinkedIn DM' },
                    { id: 'email',    icon: '✉️', label: 'Email' },
                  ].map(ch => (
                    <button key={ch.id}
                      onClick={() => setBulkIcebreakerData(prev => ({ ...prev, channel: ch.id, results: {} }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        bulkIcebreakerData.channel === ch.id
                          ? 'bg-white text-indigo-700'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}>
                      {ch.icon} {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">

                {/* Contact selection */}
                {Object.keys(bulkIcebreakerData.results).length === 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Select Contacts</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4">
                      {contacts.map(contact => (
                        <label key={contact.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm">
                          <input type="checkbox"
                            checked={bulkIcebreakerData.selectedContacts.includes(contact.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setBulkIcebreakerData(prev => ({ ...prev, selectedContacts: [...prev.selectedContacts, contact.id] }));
                              } else {
                                setBulkIcebreakerData(prev => ({ ...prev, selectedContacts: prev.selectedContacts.filter(id => id !== contact.id) }));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600" />
                          <span className="truncate">{contact.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Generate button */}
                {Object.keys(bulkIcebreakerData.results).length === 0 && (
                  <button onClick={generateBulkIcebreakers}
                    disabled={bulkIcebreakerData.selectedContacts.length === 0 || bulkIcebreakerLoading}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    {bulkIcebreakerLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating {bulkIcebreakerData.selectedContacts.length} sets of icebreakers...
                      </>
                    ) : (
                      <><span className="material-symbols-outlined text-[20px]">auto_awesome</span> Generate {bulkIcebreakerData.selectedContacts.length} Icebreakers</>
                    )}
                  </button>
                )}

                {/* Results grid */}
                {Object.keys(bulkIcebreakerData.results).length > 0 && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {bulkIcebreakerData.selectedContacts.map(contactId => {
                        const contact = contacts.find(c => c.id === contactId);
                        const lines = bulkIcebreakerData.results[contactId] || [];
                        if (!contact) return null;
                        return (
                          <div key={contactId} className="border border-indigo-100 rounded-xl p-4 bg-indigo-50">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-bold text-gray-800">{contact.name}</h3>
                                {contact.email && <p className="text-xs text-gray-400">{contact.email}</p>}
                                {contact.company && <p className="text-xs text-gray-500">{contact.company}</p>}
                              </div>
                              <button onClick={() => navigator.clipboard.writeText(lines.join('\n\n'))}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">description</span> Copy
                              </button>
                            </div>
                            <div className="space-y-2">
                              {lines.map((line, i) => {
                                const parts = bulkIcebreakerData.channel === 'email' && line.includes(' | ')
                                  ? line.split(' | ')
                                  : null;
                                return (
                                  <div key={i} className="bg-white rounded-lg p-2.5 text-xs">
                                    <span className="inline-block w-4 h-4 bg-indigo-200 text-indigo-700 rounded-full text-center text-[9px] font-bold leading-4 mr-2">
                                      {i + 1}
                                    </span>
                                    {parts ? (
                                      <div className="inline">
                                        <span className="font-semibold text-indigo-600">{parts[0]}</span>
                                        <br />
                                        <span className="text-gray-600">{parts[1]}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-700">{line}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bulk actions */}
                    <div className="flex gap-3">
                      <button onClick={copyAllBulkIcebreakers}
                        className="flex-1 bg-white border-2 border-indigo-600 text-indigo-700 py-3 rounded-xl font-bold hover:bg-indigo-50 transition flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">description</span> Copy All
                      </button>
                      {bulkIcebreakerData.channel === 'email' && (
                        <button onClick={sendAllBulkIcebreakers}
                          className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[20px]">send</span> Send All via Email
                        </button>
                      )}
                      <button onClick={() => setBulkIcebreakerData({ selectedContacts: [], channel: bulkIcebreakerData.channel, results: {} })}
                        className="px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
                        Start Over
                      </button>
                    </div>
                  </>
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
                  <button onClick={() => setShowIcebreaker(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Channel toggle */}
                <div className="flex gap-2 mt-4">
                  <span className="text-xs text-indigo-200 self-center mr-1">Channel:</span>
                  {[
                    { id: 'linkedin', icon: '💼', label: 'LinkedIn DM' },
                    { id: 'email',    icon: '✉️', label: 'Email' },
                  ].map(ch => (
                    <button key={ch.id}
                      onClick={() => { setIcebreakerChannel(ch.id); generateIcebreaker(icebreakerContact, ch.id); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                        icebreakerChannel === ch.id
                          ? 'bg-white text-indigo-700'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}>
                      {ch.icon} {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* SCROLLABLE CONTENT AREA - Only this section scrolls */}
              <div className="flex-1 overflow-y-auto p-6">
                {icebreakerLoading ? (
                  <div className="py-10 flex flex-col items-center gap-3 text-gray-400">
                    <div className="w-8 h-8 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm">Crafting {icebreakerChannel === 'email' ? 'email openers' : 'LinkedIn messages'}…</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {icebreakerLines.map((line, i) => {
                      const isCopied = icebreakerCopied === i;
                      // For email, split "Subject | Body" format
                      const parts = icebreakerChannel === 'email' && line.includes(' | ')
                        ? line.split(' | ')
                        : null;
                      return (
                        <div key={i} className={`rounded-xl border-2 transition ${
                          isCopied 
                            ? darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-400 bg-green-50'
                            : darkMode ? 'border-indigo-700 bg-indigo-900/20' : 'border-indigo-100 bg-indigo-50'
                        }`}>
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                                isCopied 
                                  ? 'bg-green-500 text-white'
                                  : darkMode ? 'bg-indigo-700 text-indigo-200' : 'bg-indigo-200 text-indigo-700'
                              }`}>
                                {isCopied ? '✓' : i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                {parts ? (
                                  <>
                                    <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${
                                      darkMode ? 'text-indigo-400' : 'text-indigo-500'
                                    }`}>Subject</p>
                                    <p className={`text-xs font-semibold mb-2 ${
                                      darkMode ? 'text-slate-200' : 'text-gray-700'
                                    }`}>{parts[0]}</p>
                                    <p className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${
                                      darkMode ? 'text-indigo-400' : 'text-indigo-500'
                                    }`}>Opening</p>
                                    <p className={`text-sm leading-relaxed ${
                                      darkMode ? 'text-slate-300' : 'text-gray-700'
                                    }`}>{parts[1]}</p>
                                  </>
                                ) : (
                                  <p className={`text-sm leading-relaxed ${
                                    darkMode ? 'text-slate-300' : 'text-gray-700'
                                  }`}>{line}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className={`border-t px-4 py-2 flex justify-end ${
                            darkMode ? 'border-indigo-700' : 'border-indigo-100'
                          }`}>
                            <button
                              onClick={() => copyIcebreakerLine(line, i)}
                              className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                                isCopied
                                  ? darkMode ? 'text-green-400 bg-green-900/30' : 'text-green-600 bg-green-100'
                                  : darkMode ? 'text-indigo-400 hover:bg-indigo-900/30' : 'text-indigo-600 hover:bg-indigo-100'
                              }`}>
                              {isCopied ? '✓ Copied!' : '📋 Copy'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* FIXED FOOTER - Won't scroll */}
              {!icebreakerLoading && icebreakerLines.length > 0 && (
                <div className={`px-6 py-4 border-t flex gap-2 flex-shrink-0 rounded-b-2xl ${
                  darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}>
                  <button
                    onClick={copyAllIcebreakers}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition border-2 ${
                      icebreakerCopied === 'all'
                        ? 'border-green-500 bg-green-500 text-white'
                        : darkMode 
                          ? 'border-indigo-700 text-indigo-400 hover:bg-indigo-900/20'
                          : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                    }`}>
                    {icebreakerCopied === 'all' ? '✓ All Copied!' : '📋 Copy All 3'}
                  </button>
                  <button
                    onClick={() => generateIcebreaker(icebreakerContact, icebreakerChannel)}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span> Regenerate
                  </button>
                  <button
                    onClick={() => setShowIcebreaker(false)}
                    className={`px-4 rounded-xl text-sm font-medium transition ${
                      darkMode 
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      {/* Mobile FAB */}
      <MobileFAB />

    </div>
  );
}
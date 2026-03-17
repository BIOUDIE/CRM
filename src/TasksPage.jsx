import React, { useState, useEffect, useRef } from 'react';

// ── Priority config ────────────────────────────────────────────────────────
const PRIORITIES = [
  { id: 'urgent', label: 'Urgent',  color: '#ef4444', bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700'    },
  { id: 'high',   label: 'High',    color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  { id: 'medium', label: 'Medium',  color: '#eab308', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
  { id: 'low',    label: 'Low',     color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700'  },
];

// ── Category config ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'follow-up',   label: 'Follow Up',   icon: 'reply' },
  { id: 'meeting',     label: 'Meeting',      icon: 'event' },
  { id: 'email',       label: 'Email',        icon: 'mail' },
  { id: 'call',        label: 'Call',         icon: 'call' },
  { id: 'proposal',    label: 'Proposal',     icon: 'description' },
  { id: 'research',    label: 'Research',     icon: 'search' },
  { id: 'admin',       label: 'Admin',        icon: 'admin_panel_settings' },
  { id: 'other',       label: 'Other',        icon: 'more_horiz' },
];

const getPriority  = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[2];
const getCategory  = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDueDate = (dateStr) => {
  if (!dateStr) return null;
  const d   = new Date(dateStr);
  const now = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow  = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const taskDay   = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays  = Math.round((taskDay - today) / 86400000);

  if (diffDays < 0)  return { label: `${Math.abs(diffDays)}d overdue`, overdue: true };
  if (diffDays === 0) return { label: 'Today',    overdue: false, today: true };
  if (diffDays === 1) return { label: 'Tomorrow', overdue: false };
  if (diffDays <= 7)  return { label: `In ${diffDays} days`, overdue: false };
  return { label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), overdue: false };
};

const isOverdue  = (task) => {
  if (!task.dueDate || task.completed) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(task.dueDate) < today;
};

// ── Empty illustration ─────────────────────────────────────────────────────
const EmptyIllustration = ({ filter }) => (
  <div className="flex flex-col items-center justify-center py-24 text-center select-none">
    <div className="relative mb-6">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-inner">
        <span className="material-symbols-outlined text-[48px] text-indigo-400">
          {filter === 'completed' ? 'task_alt' : filter === 'overdue' ? 'schedule' : 'checklist'}
        </span>
      </div>
      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow">
        <span className="material-symbols-outlined text-white text-[14px]">add</span>
      </div>
    </div>
    <h3 className="text-lg font-bold text-slate-700 mb-1">
      {filter === 'completed' ? 'No completed tasks yet' :
       filter === 'overdue'   ? 'No overdue tasks 🎉' :
       filter === 'today'     ? 'Nothing due today' :
       'No tasks yet'}
    </h3>
    <p className="text-sm text-slate-400 max-w-xs">
      {filter === 'all' ? 'Create your first task to get started. Set due dates and reminders so nothing falls through the cracks.' :
       filter === 'completed' ? 'Complete some tasks and they\'ll show up here.' :
       'Great — you\'re all caught up!'}
    </p>
  </div>
);

// ── Task Card ──────────────────────────────────────────────────────────────
const TaskCard = ({ task, onToggle, onEdit, onDelete, darkMode }) => {
  const priority  = getPriority(task.priority);
  const category  = getCategory(task.category);
  const due       = formatDueDate(task.dueDate);
  const overdue   = isOverdue(task);

  return (
    <div className={`group relative rounded-2xl border transition-all duration-200 ${
      task.completed
        ? darkMode ? 'bg-slate-800/50 border-slate-700/50 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
        : overdue
          ? darkMode ? 'bg-red-950/30 border-red-800/50 shadow-sm' : 'bg-red-50/60 border-red-200 shadow-sm'
          : darkMode ? 'bg-slate-800 border-slate-700 hover:border-indigo-600/50 shadow-sm hover:shadow-md'
                     : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md'
    }`}>
      {/* Priority accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
           style={{ backgroundColor: task.completed ? '#94a3b8' : priority.color }} />

      <div className="px-5 py-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={() => onToggle(task.id)}
            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              task.completed
                ? 'bg-indigo-500 border-indigo-500'
                : darkMode ? 'border-slate-500 hover:border-indigo-400' : 'border-slate-300 hover:border-indigo-500'
            }`}
          >
            {task.completed && (
              <span className="material-symbols-outlined text-white text-[12px]">check</span>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={`font-semibold text-sm leading-snug ${
                task.completed
                  ? darkMode ? 'line-through text-slate-500' : 'line-through text-slate-400'
                  : darkMode ? 'text-white' : 'text-slate-800'
              }`}>{task.title}</p>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => onEdit(task)}
                  className={`p-1.5 rounded-lg transition ${
                    darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                  }`}>
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                </button>
                <button onClick={() => onDelete(task.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition">
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                </button>
              </div>
            </div>

            {/* Notes */}
            {task.notes && (
              <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>{task.notes}</p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {/* Priority badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${priority.badge}`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: priority.color }}></span>
                {priority.label}
              </span>

              {/* Category */}
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
              }`}>
                <span className="material-symbols-outlined text-[11px]">{category.icon}</span>
                {category.label}
              </span>

              {/* Due date */}
              {due && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                  due.overdue
                    ? 'bg-red-100 text-red-700'
                    : due.today
                      ? 'bg-amber-100 text-amber-700'
                      : darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className="material-symbols-outlined text-[11px]">
                    {due.overdue ? 'warning' : 'calendar_today'}
                  </span>
                  {due.label}
                </span>
              )}

              {/* Reminder */}
              {task.reminder && !task.completed && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                  darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  <span className="material-symbols-outlined text-[11px]">notifications</span>
                  Reminder set
                </span>
              )}

              {/* Linked contact */}
              {task.linkedContactName && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                  darkMode ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-50 text-violet-600'
                }`}>
                  <span className="material-symbols-outlined text-[11px]">person</span>
                  {task.linkedContactName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Task Form Modal ────────────────────────────────────────────────────────
const TaskFormModal = ({ task, contacts, onSave, onClose, darkMode }) => {
  const isEditing = !!task;
  const [form, setForm] = useState({
    title:             task?.title             || '',
    notes:             task?.notes             || '',
    priority:          task?.priority          || 'medium',
    category:          task?.category          || 'other',
    dueDate:           task?.dueDate           || '',
    reminder:          task?.reminder          || false,
    reminderDateTime:  task?.reminderDateTime  || '',
    linkedContactId:   task?.linkedContactId   || '',
    linkedContactName: task?.linkedContactName || '',
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.reminder && !form.reminderDateTime) e.reminderDateTime = 'Choose a reminder date & time';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      ...form,
      title: form.title.trim(),
      notes: form.notes.trim(),
    });
  };

  const handleContactChange = (id) => {
    const contact = contacts.find(c => c.id === id);
    setForm(f => ({
      ...f,
      linkedContactId:   id,
      linkedContactName: contact ? contact.name : '',
    }));
  };

  const base = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 ${
    darkMode
      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:ring-indigo-500/30 focus:border-indigo-500'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-indigo-300 focus:border-indigo-400'
  }`;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className={`w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {isEditing ? 'Edit Task' : 'New Task'}
              </h2>
              <p className="text-indigo-200 text-xs mt-0.5">
                {isEditing ? 'Update task details' : 'Add a task and set a reminder'}
              </p>
            </div>
            <button onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition">
              <span className="material-symbols-outlined text-white text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-4">

            {/* Title */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>Task *</label>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={`${base} ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`}
                autoFocus
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            {/* Notes */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>Notes</label>
              <textarea
                placeholder="Any additional details..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={3}
                className={`${base} resize-none`}
              />
            </div>

            {/* Priority + Category row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>Priority</label>
                <div className="flex flex-col gap-1.5">
                  {PRIORITIES.map(p => (
                    <button key={p.id} type="button"
                      onClick={() => setForm(f => ({ ...f, priority: p.id }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        form.priority === p.id
                          ? 'border-transparent text-white shadow-sm'
                          : darkMode ? 'border-slate-600 text-slate-400 bg-slate-700/50 hover:bg-slate-700' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                      }`}
                      style={form.priority === p.id ? { backgroundColor: p.color, borderColor: p.color } : {}}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: form.priority === p.id ? 'rgba(255,255,255,0.7)' : p.color }}></span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>Category</label>
                <div className="flex flex-col gap-1.5">
                  {CATEGORIES.slice(0, 4).map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        form.category === cat.id
                          ? darkMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-indigo-600 border-indigo-600 text-white'
                          : darkMode ? 'border-slate-600 text-slate-400 bg-slate-700/50 hover:bg-slate-700' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                      }`}>
                      <span className="material-symbols-outlined text-[13px]">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5 mt-1.5">
                  {CATEGORIES.slice(4).map(cat => (
                    <button key={cat.id} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.id }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                        form.category === cat.id
                          ? darkMode ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-indigo-600 border-indigo-600 text-white'
                          : darkMode ? 'border-slate-600 text-slate-400 bg-slate-700/50 hover:bg-slate-700' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                      }`}>
                      <span className="material-symbols-outlined text-[13px]">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className={base}
              />
            </div>

            {/* Reminder toggle */}
            <div className={`rounded-2xl border p-4 ${
              darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-indigo-50/60 border-indigo-100'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[20px] ${
                    form.reminder ? 'text-indigo-500' : darkMode ? 'text-slate-400' : 'text-slate-400'
                  }`}>notifications</span>
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      Set Reminder
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Get notified at a specific time
                    </p>
                  </div>
                </div>
                <button type="button"
                  onClick={() => setForm(f => ({ ...f, reminder: !f.reminder, reminderDateTime: '' }))}
                  className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${
                    form.reminder ? 'bg-indigo-600' : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                  }`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    form.reminder ? 'translate-x-5' : 'translate-x-1'
                  }`}/>
                </button>
              </div>

              {form.reminder && (
                <div>
                  <input
                    type="datetime-local"
                    value={form.reminderDateTime}
                    min={new Date().toISOString().slice(0,16)}
                    onChange={e => setForm(f => ({ ...f, reminderDateTime: e.target.value }))}
                    className={`${base} ${errors.reminderDateTime ? 'border-red-400' : ''}`}
                  />
                  {errors.reminderDateTime && (
                    <p className="text-red-500 text-xs mt-1">{errors.reminderDateTime}</p>
                  )}
                  <p className={`text-xs mt-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    💡 Allow browser notifications to receive this reminder
                  </p>
                </div>
              )}
            </div>

            {/* Link to contact */}
            {contacts.length > 0 && (
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wide mb-1.5 ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>Link to Contact <span className="font-normal opacity-60">(optional)</span></label>
                <select
                  value={form.linkedContactId}
                  onChange={e => handleContactChange(e.target.value)}
                  className={base}
                >
                  <option value="">— No contact —</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className={`px-6 pb-6 pt-2 flex gap-3 flex-shrink-0 border-t ${
            darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'
          }`}>
            <button type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">
                {isEditing ? 'save' : 'add_task'}
              </span>
              {isEditing ? 'Save Changes' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose}
              className={`px-5 py-3 rounded-xl font-semibold transition ${
                darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main TasksPage ─────────────────────────────────────────────────────────
export default function TasksPage({ user, contacts = [], darkMode = false }) {
  const [tasks,        setTasks]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editingTask,  setEditingTask]  = useState(null);
  const [filter,       setFilter]       = useState('all');   // all | today | overdue | completed
  const [sortBy,       setSortBy]       = useState('dueDate');
  const reminderTimers = useRef({});

  // ── Firebase helpers ─────────────────────────────────────────────────────
  const getUid = () => user?.uid;

  const saveTask = async (task) => {
    const uid = getUid();
    if (!uid || !window.firebaseDb) return;
    try {
      await window.setDoc(
        window.doc(window.firebaseDb, 'users', uid, 'tasks', task.id),
        task
      );
    } catch (e) {
      try {
        const userDoc = await window.getDoc(window.doc(window.firebaseDb, 'users', uid));
        const existing = userDoc.exists() ? (userDoc.data().tasks || []) : [];
        const updated  = existing.some(t => t.id === task.id)
          ? existing.map(t => t.id === task.id ? task : t)
          : [...existing, task];
        await window.setDoc(window.doc(window.firebaseDb, 'users', uid), { tasks: updated }, { merge: true });
      } catch (e2) { console.error('Fallback save error:', e2); }
    }
  };

  const deleteTaskDoc = async (id) => {
    const uid = getUid();
    if (!uid || !window.firebaseDb) return;
    try {
      if (window.deleteDoc) {
        await window.deleteDoc(window.doc(window.firebaseDb, 'users', uid, 'tasks', id));
      }
    } catch (e) { console.error('Delete task error:', e); }
  };

  // ── Load tasks ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    const load = async () => {
      try {
        const snap = await window.getDocs(
          window.collection(window.firebaseDb, 'users', user.uid, 'tasks')
        );
        const loaded = [];
        snap.forEach(doc => loaded.push(doc.data()));
        setTasks(loaded.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      } catch (e) {
        try {
          const ud = await window.getDoc(window.doc(window.firebaseDb, 'users', user.uid));
          if (ud.exists() && ud.data().tasks) setTasks(ud.data().tasks);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.uid]);

  // ── Browser reminder notifications ───────────────────────────────────────
  useEffect(() => {
    Object.values(reminderTimers.current).forEach(clearTimeout);
    reminderTimers.current = {};

    tasks.forEach(task => {
      if (!task.reminder || !task.reminderDateTime || task.completed) return;
      const fireAt = new Date(task.reminderDateTime).getTime();
      const delay  = fireAt - Date.now();
      if (delay <= 0 || delay > 2147483647) return;

      reminderTimers.current[task.id] = setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`⏰ Task Reminder: ${task.title}`, {
            body: task.notes || `Due: ${task.dueDate || 'soon'}`,
            icon: '/favicon.ico',
            tag: `task-${task.id}`,
          });
        }
      }, delay);
    });

    return () => Object.values(reminderTimers.current).forEach(clearTimeout);
  }, [tasks]);

  const requestNotifPermission = async () => {
    if (!('Notification' in window)) return;
    await Notification.requestPermission();
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSave = async (formData) => {
    if (editingTask) {
      const updated = { ...editingTask, ...formData, updatedAt: new Date().toISOString() };
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      await saveTask(updated);
    } else {
      const newTask = {
        ...formData,
        id:        Date.now().toString(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks(prev => [newTask, ...prev]);
      await saveTask(newTask);
      if (formData.reminder) requestNotifPermission();
    }
    setShowForm(false);
    setEditingTask(null);
  };

  const handleToggle = async (id) => {
    const task    = tasks.find(t => t.id === id);
    const updated = { ...task, completed: !task.completed, updatedAt: new Date().toISOString() };
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    await saveTask(updated);
  };

  const handleDelete = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await deleteTaskDoc(id);
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  // ── Filter + sort ────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = tasks.filter(t => {
    if (filter === 'completed') return t.completed;
    if (filter === 'today')     return !t.completed && t.dueDate === todayStr;
    if (filter === 'overdue')   return !t.completed && t.dueDate && t.dueDate < todayStr;
    return !t.completed;
  });

  const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'priority') {
      return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = {
    total:     tasks.length,
    active:    tasks.filter(t => !t.completed).length,
    completed: tasks.filter(t => t.completed).length,
    overdue:   tasks.filter(t => isOverdue(t)).length,
    today:     tasks.filter(t => !t.completed && t.dueDate === todayStr).length,
  };

  const card = `rounded-2xl border p-4 flex flex-col gap-1 transition ${
    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
  }`;

  const filterBtn = (id, label, count, icon) => (
    <button key={id} onClick={() => setFilter(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
        filter === id
          ? 'bg-indigo-600 text-white shadow-sm'
          : darkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}>
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
      {count > 0 && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          filter === id ? 'bg-white/30 text-white' : darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'
        }`}>{count}</span>
      )}
    </button>
  );

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3"></div>
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Tasks
          </h1>
          <p className={`text-sm mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {stats.active} active · {stats.completed} done
            {stats.overdue > 0 && <span className="text-red-500 ml-1">· {stats.overdue} overdue</span>}
          </p>
        </div>
        <button
          onClick={() => { setEditingTask(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-indigo-200/50 flex-shrink-0">
          <span className="material-symbols-outlined text-[18px]">add_task</span>
          New Task
        </button>
      </div>

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Active',    value: stats.active,    color: 'text-indigo-600', icon: 'pending_actions' },
            { label: 'Due Today', value: stats.today,     color: 'text-amber-600',  icon: 'today' },
            { label: 'Overdue',   value: stats.overdue,   color: 'text-red-600',    icon: 'warning' },
            { label: 'Completed', value: stats.completed, color: 'text-green-600',  icon: 'task_alt' },
          ].map(s => (
            <div key={s.label} className={card}>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
                <span className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</span>
              </div>
              <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs + sort */}
      <div className={`rounded-2xl border p-3 flex items-center gap-1 overflow-x-auto ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {filterBtn('all',       'Active',    stats.active,    'pending_actions')}
        {filterBtn('today',     'Today',     stats.today,     'today')}
        {filterBtn('overdue',   'Overdue',   stats.overdue,   'warning')}
        {filterBtn('completed', 'Completed', stats.completed, 'task_alt')}

        <div className="flex-1" />

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-xs font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sort:</span>
          {[
            { id: 'dueDate',  label: 'Due date' },
            { id: 'priority', label: 'Priority' },
            { id: 'created',  label: 'Created'  },
          ].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                sortBy === s.id
                  ? darkMode ? 'bg-slate-600 text-white' : 'bg-slate-800 text-white'
                  : darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'
              }`}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Task list */}
      {sorted.length === 0 ? (
        <EmptyIllustration filter={filter} />
      ) : (
        <div className="space-y-2.5">
          {sorted.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              darkMode={darkMode}
            />
          ))}
        </div>
      )}

      {/* Notification permission nudge */}
      {'Notification' in window && Notification.permission === 'default' && tasks.some(t => t.reminder && !t.completed) && (
        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${
          darkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'
        }`}>
          <span className="material-symbols-outlined text-amber-500 text-[24px] flex-shrink-0">notifications</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>Enable notifications</p>
            <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>You have reminders set — allow notifications to receive them.</p>
          </div>
          <button onClick={requestNotifPermission}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition flex-shrink-0">
            Allow
          </button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <TaskFormModal
          task={editingTask}
          contacts={contacts}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          darkMode={darkMode}
        />
      )}

    </div>
  );
}

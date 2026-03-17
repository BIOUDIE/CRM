// apply-tasks-patch.mjs
// Run this ONCE from your project root:  node apply-tasks-patch.mjs
// It makes the 3 changes needed to wire up the Tasks page in App.jsx

import { readFileSync, writeFileSync, copyFileSync } from 'fs';

const FILE = 'src/App.jsx';
const BACKUP = 'src/App.jsx.bak';

console.log('📂 Reading', FILE);
let src = readFileSync(FILE, 'utf8');

// ── Backup ──────────────────────────────────────────────────────────────────
copyFileSync(FILE, BACKUP);
console.log('💾 Backup saved to', BACKUP);

let modified = src;
let changesMade = 0;

// ════════════════════════════════════════════════════════════════════════════
// CHANGE 1: Add TasksPage import after the React import line
// ════════════════════════════════════════════════════════════════════════════
const IMPORT_FIND = `import React, { useState, useEffect } from 'react';`;
const IMPORT_REPLACE = `import React, { useState, useEffect } from 'react';
import TasksPage from './TasksPage.jsx';`;

if (modified.includes("import TasksPage")) {
  console.log('⚠️  Change 1 already applied (TasksPage import exists), skipping.');
} else if (modified.includes(IMPORT_FIND)) {
  modified = modified.replace(IMPORT_FIND, IMPORT_REPLACE);
  console.log('✅ Change 1 applied: Added TasksPage import');
  changesMade++;
} else {
  console.error('❌ Change 1 FAILED: Could not find React import line. Check your App.jsx.');
}

// ════════════════════════════════════════════════════════════════════════════
// CHANGE 2: Wrap main content with tasks conditional
// ════════════════════════════════════════════════════════════════════════════

// 2a — opening: insert tasks conditional BEFORE the HeaderSection comment
const HEADER_FIND = `        {/* Header Row: Welcome + Premium */}
        <HeaderSection />`;

const HEADER_REPLACE = `        {/* ── TASKS VIEW ── */}
        {currentView === 'tasks' ? (
          <TasksPage user={user} contacts={contacts} darkMode={darkMode} />
        ) : (<>

        {/* Header Row: Welcome + Premium */}
        <HeaderSection />`;

// 2b — closing: insert closing tag AFTER <MobileFAB />
const FAB_FIND = `      {/* Mobile FAB */}
      <MobileFAB />`;

const FAB_REPLACE = `      {/* Mobile FAB */}
      <MobileFAB />
      </>)}`;

if (modified.includes('<TasksPage user={user}')) {
  console.log('⚠️  Change 2 already applied (TasksPage render exists), skipping.');
} else {
  let ok = true;
  if (!modified.includes(HEADER_FIND)) {
    console.error('❌ Change 2a FAILED: Could not find HeaderSection block. Check App.jsx.');
    ok = false;
  }
  if (!modified.includes(FAB_FIND)) {
    console.error('❌ Change 2b FAILED: Could not find MobileFAB block. Check App.jsx.');
    ok = false;
  }
  if (ok) {
    modified = modified.replace(HEADER_FIND, HEADER_REPLACE);
    modified = modified.replace(FAB_FIND, FAB_REPLACE);
    console.log('✅ Change 2 applied: Wrapped main content with tasks conditional');
    changesMade++;
  }
}

// ════════════════════════════════════════════════════════════════════════════
// CHANGE 3: Replace mobile bottom nav with working Tasks button
// ════════════════════════════════════════════════════════════════════════════
const NAV_FIND = `      {/* MOBILE BOTTOM TAB BAR */}
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
      </nav>`;

const NAV_REPLACE = `      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-2 safe-area-pb">
        <button
          className={\`flex flex-col items-center gap-0.5 px-3 py-1 \${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}\`}
          onClick={() => setCurrentView('dashboard')}
        >
          <span className="material-symbols-outlined text-xl">dashboard</span>
          <span className="text-[10px] font-semibold">Dashboard</span>
        </button>
        <button
          className={\`flex flex-col items-center gap-0.5 px-3 py-1 \${currentView === 'tasks' ? 'text-indigo-600' : 'text-slate-400'}\`}
          onClick={() => setCurrentView('tasks')}
        >
          <span className="material-symbols-outlined text-xl">checklist</span>
          <span className="text-[10px] font-semibold">Tasks</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-400" onClick={() => setShowAnalytics(true)}>
          <span className="material-symbols-outlined text-xl">analytics</span>
          <span className="text-[10px] font-semibold">Analytics</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 px-3 py-1 text-slate-400" onClick={() => isPremium ? setShowBulkImport(true) : setShowPremiumModal(true)}>
          <span className="material-symbols-outlined text-xl">upload</span>
          <span className="text-[10px] font-semibold">Import</span>
        </button>
      </nav>`;

if (modified.includes(`currentView === 'tasks' ? 'text-indigo-600'`)) {
  console.log('⚠️  Change 3 already applied (Tasks nav button exists), skipping.');
} else if (modified.includes(NAV_FIND)) {
  modified = modified.replace(NAV_FIND, NAV_REPLACE);
  console.log('✅ Change 3 applied: Fixed mobile bottom nav Tasks button');
  changesMade++;
} else {
  console.error('❌ Change 3 FAILED: Could not find mobile bottom nav block.');
  console.error('   The nav may have been modified. Apply this change manually (see README).');
}

// ── Write output ─────────────────────────────────────────────────────────────
if (changesMade > 0) {
  writeFileSync(FILE, modified, 'utf8');
  console.log(`\n🎉 Done! ${changesMade} change(s) applied to ${FILE}`);
  console.log('📌 Next step: copy TasksPage.jsx → src/TasksPage.jsx');
} else {
  console.log('\n⚠️  No changes were written (either all already applied or all failed).');
}

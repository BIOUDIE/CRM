import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, TrendingUp, AlertCircle, Upload, Users, Crown, Mail, Bell, Clock, Zap } from 'lucide-react';

export default function MicroCRM() {
  const [contacts, setContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkEmail, setShowBulkEmail] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [bulkContactsText, setBulkContactsText] = useState('');
  const [bulkEmailData, setBulkEmailData] = useState({
    subject: '',
    body: '',
    selectedContacts: []
  });
  const [formData, setFormData] = useState({
    name: '',
    lastContactDate: '',
    vibeScore: 5,
    notes: '',
    email: '',
    reminderDays: 30,
    contactFrequency: 30
  });
  const [isLoading, setIsLoading] = useState(true);
  const [importStatus, setImportStatus] = useState('');

  // Load contacts from storage on mount
  useEffect(() => {
    loadContacts();
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      const result = await window.storage.get('premium_status');
      if (result && result.value) {
        setIsPremium(JSON.parse(result.value));
      }
    } catch (error) {
      console.log('No premium status found');
    }
  };

  const activatePremium = async () => {
    // In a real app, this would integrate with Stripe or another payment processor
    // For demo purposes, we'll just set the flag
    await window.storage.set('premium_status', JSON.stringify(true));
    setIsPremium(true);
    setShowPremiumModal(false);
    alert('Premium activated! Thank you for your support! 🎉');
  };

  const requirePremium = (action) => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return false;
    }
    return true;
  };

  const loadContacts = async () => {
    try {
      const result = await window.storage.list('contact:');
      if (result && result.keys) {
        const loadedContacts = await Promise.all(
          result.keys.map(async (key) => {
            try {
              const data = await window.storage.get(key);
              return data ? JSON.parse(data.value) : null;
            } catch {
              return null;
            }
          })
        );
        setContacts(loadedContacts.filter(c => c !== null));
      }
    } catch (error) {
      console.log('No existing contacts found');
    } finally {
      setIsLoading(false);
    }
  };

  const saveContact = async (contact) => {
    const key = `contact:${contact.id}`;
    await window.storage.set(key, JSON.stringify(contact));
  };

  const deleteContact = async (id) => {
    const key = `contact:${id}`;
    await window.storage.delete(key);
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    const newContact = {
      ...formData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    await saveContact(newContact);
    setContacts([...contacts, newContact]);
    setFormData({ 
      name: '', 
      lastContactDate: '', 
      vibeScore: 5, 
      notes: '',
      email: '',
      reminderDays: 30,
      contactFrequency: 30
    });
    setShowAddForm(false);
  };

  const handleUpdateContact = async (id, updates) => {
    const updatedContacts = contacts.map(c => 
      c.id === id ? { ...c, ...updates } : c
    );
    setContacts(updatedContacts);
    const contact = updatedContacts.find(c => c.id === id);
    if (contact) {
      await saveContact(contact);
    }
  };

  const handleDeleteContact = async (id) => {
    await deleteContact(id);
    setContacts(contacts.filter(c => c.id !== id));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportStatus('Processing file...');
    
    try {
      const text = await file.text();
      let rows;
      
      // Check if CSV or TSV
      if (file.name.endsWith('.csv')) {
        rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
      } else if (file.name.endsWith('.tsv') || file.name.endsWith('.txt')) {
        rows = text.split('\n').map(row => row.split('\t').map(cell => cell.trim()));
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // For Excel files, we'll use SheetJS library available in the environment
        const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.0/package/xlsx.mjs');
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        rows = jsonData;
      } else {
        setImportStatus('Unsupported file type. Use CSV, TSV, or Excel files.');
        return;
      }

      // Filter out empty rows
      rows = rows.filter(row => row.some(cell => cell && cell.toString().trim()));
      
      if (rows.length < 2) {
        setImportStatus('File appears to be empty or has no data rows.');
        return;
      }

      // Parse rows (expecting: Name, Last Contact Date, Vibe Score, Notes)
      const newContacts = [];
      const header = rows[0];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue; // Skip if no name
        
        const contact = {
          id: Date.now().toString() + '_' + i,
          name: row[0].toString().trim(),
          lastContactDate: row[1] ? parseDate(row[1].toString().trim()) : '',
          vibeScore: row[2] ? parseInt(row[2]) || 5 : 5,
          notes: row[3] ? row[3].toString().trim() : '',
          createdAt: new Date().toISOString()
        };
        
        newContacts.push(contact);
        await saveContact(contact);
      }

      setContacts([...contacts, ...newContacts]);
      setImportStatus(`Successfully imported ${newContacts.length} contacts!`);
      setTimeout(() => {
        setShowBulkImport(false);
        setImportStatus('');
      }, 2000);
      
    } catch (error) {
      setImportStatus(`Error processing file: ${error.message}`);
    }
  };

  const parseDate = (dateStr) => {
    // Try to parse various date formats
    if (!dateStr) return '';
    
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Try parsing as date
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return '';
  };

  const handleBulkTextImport = async () => {
    if (!requirePremium('bulk import')) return;
    
    setImportStatus('Processing...');
    
    try {
      const lines = bulkContactsText.split('\n').filter(line => line.trim());
      const newContacts = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse line - expecting format: "Name, Date, Score, Notes" or just "Name"
        const parts = line.split(',').map(p => p.trim());
        
        const contact = {
          id: Date.now().toString() + '_' + i,
          name: parts[0],
          email: parts[1] && parts[1].includes('@') ? parts[1] : '',
          lastContactDate: parts[2] || parts[1] && !parts[1].includes('@') ? parseDate(parts[2] || parts[1]) : '',
          vibeScore: parts[3] ? parseInt(parts[3]) || 5 : 5,
          notes: parts[4] || '',
          reminderDays: 30,
          contactFrequency: 30,
          createdAt: new Date().toISOString()
        };
        
        newContacts.push(contact);
        await saveContact(contact);
      }

      setContacts([...contacts, ...newContacts]);
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
    if (!requirePremium('bulk email')) return;
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
      
      return {
        to: contact.email,
        subject: bulkEmailData.subject,
        body: personalizedBody
      };
    });

    // Create mailto links or copy to clipboard
    const mailtoLinks = emails.map(email => 
      `To: ${email.to}\nSubject: ${email.subject}\n\n${email.body}`
    ).join('\n\n---\n\n');

    // Copy to clipboard
    navigator.clipboard.writeText(mailtoLinks);
    alert(`${emails.length} emails prepared! Content copied to clipboard. You can paste into your email client.`);
    setShowBulkEmail(false);
    setBulkEmailData({ subject: '', body: '', selectedContacts: [] });
  };

  const toggleAllContacts = () => {
    const contactsWithEmail = contacts.filter(c => c.email);
    if (bulkEmailData.selectedContacts.length === contactsWithEmail.length) {
      setBulkEmailData({ ...bulkEmailData, selectedContacts: [] });
    } else {
      setBulkEmailData({ 
        ...bulkEmailData, 
        selectedContacts: contactsWithEmail.map(c => c.id) 
      });
    }
  };

  const daysSinceContact = (dateString) => {
    if (!dateString) return null;
    const lastContact = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - lastContact);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getVibeColor = (score) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getUrgencyLevel = (days) => {
    if (days === null) return 'neutral';
    if (days > 90) return 'urgent';
    if (days > 60) return 'warning';
    return 'good';
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const daysA = daysSinceContact(a.lastContactDate) || 0;
    const daysB = daysSinceContact(b.lastContactDate) || 0;
    return daysB - daysA;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading contacts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2 flex-wrap">
                Micro-CRM
                {isPremium && (
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4" />
                    Premium
                  </span>
                )}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Keep track of your client relationships</p>
            </div>
            {!isPremium && (
              <button
                onClick={() => setShowPremiumModal(true)}
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition flex items-center gap-2 shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Upgrade to Premium - $5</span>
                <span className="sm:hidden">Premium - $5</span>
              </button>
            )}
          </div>
        </div>

        {/* Search and Add */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex gap-2 sm:gap-4 mb-4 flex-col sm:flex-row">
            <div className="flex-1 min-w-0 relative order-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
            <div className="flex gap-2 order-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex-1 sm:flex-none bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add</span>
              </button>
              <button
                onClick={() => {
                  if (!requirePremium('bulk import')) return;
                  setShowBulkImport(!showBulkImport);
                  setShowAddForm(false);
                  setShowBulkEmail(false);
                }}
                className={`flex-1 sm:flex-none ${isPremium ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400'} text-white px-3 sm:px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 relative text-sm sm:text-base`}
              >
                <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Import</span>
                {!isPremium && <Crown className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-1 -right-1" />}
              </button>
              <button
                onClick={handleBulkEmail}
                className={`flex-1 sm:flex-none ${isPremium ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-400'} text-white px-3 sm:px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 relative text-sm sm:text-base`}
              >
                <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Email</span>
                {!isPremium && <Crown className="w-3 h-3 sm:w-4 sm:h-4 absolute -top-1 -right-1" />}
              </button>
            </div>
          </div>

          {/* Add Contact Form */}
          {showAddForm && (
            <form onSubmit={handleAddContact} className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email {isPremium && '*'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Contact Date
                  </label>
                  <input
                    type="date"
                    value={formData.lastContactDate}
                    onChange={(e) => setFormData({ ...formData, lastContactDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {isPremium && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-yellow-600" />
                      Contact Frequency (days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.contactFrequency}
                      onChange={(e) => setFormData({ ...formData, contactFrequency: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vibe Score: {formData.vibeScore}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.vibeScore}
                  onChange={(e) => setFormData({ ...formData, vibeScore: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              {isPremium && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-600" />
                    Custom Reminder (days until next contact)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.reminderDays}
                    onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional context..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Save Contact
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Bulk Import Form */}
          {showBulkImport && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Bulk Import Contacts
              </h3>
              
              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Excel or CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Supports: .xlsx, .xls, .csv, .tsv files
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,.tsv,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <div className="mt-3 text-xs text-gray-500 text-left bg-gray-50 p-3 rounded">
                    <p className="font-medium mb-1">Expected format:</p>
                    <p>Column 1: Name (required)</p>
                    <p>Column 2: Last Contact Date (optional, format: YYYY-MM-DD or MM/DD/YYYY)</p>
                    <p>Column 3: Vibe Score (optional, 1-10)</p>
                    <p>Column 4: Notes (optional)</p>
                  </div>
                </div>
              </div>

              {/* OR Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Text Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paste Contact List
                </label>
                <textarea
                  value={bulkContactsText}
                  onChange={(e) => setBulkContactsText(e.target.value)}
                  rows="8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="Enter one contact per line. Format: Name, Date, Score, Notes&#10;&#10;Examples:&#10;John Smith&#10;Jane Doe, 2024-01-15, 8, Great client&#10;Bob Johnson, 12/20/2023, 6"
                />
                <p className="text-xs text-gray-500 mt-1">
                  One contact per line. Separate fields with commas. Name is required, other fields optional.
                </p>
              </div>

              {importStatus && (
                <div className={`mb-4 p-3 rounded-lg ${
                  importStatus.includes('Success') ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'
                }`}>
                  {importStatus}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBulkTextImport}
                  disabled={!bulkContactsText.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Import from Text
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImport(false);
                    setBulkContactsText('');
                    setImportStatus('');
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Email Form */}
        {showBulkEmail && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Bulk Personalized Emails
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recipients
              </label>
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                <label className="flex items-center gap-2 mb-2 font-medium">
                  <input
                    type="checkbox"
                    checked={bulkEmailData.selectedContacts.length === contacts.filter(c => c.email).length}
                    onChange={toggleAllContacts}
                    className="w-4 h-4"
                  />
                  Select All ({contacts.filter(c => c.email).length} contacts with emails)
                </label>
                {contacts.filter(c => c.email).map(contact => (
                  <label key={contact.id} className="flex items-center gap-2 mb-2 ml-4">
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
                      className="w-4 h-4"
                    />
                    <span>{contact.name} ({contact.email})</span>
                  </label>
                ))}
                {contacts.filter(c => c.email).length === 0 && (
                  <p className="text-gray-500 text-sm">No contacts have email addresses yet.</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={bulkEmailData.subject}
                onChange={(e) => setBulkEmailData({ ...bulkEmailData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Quick check-in"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Body
                <span className="text-sm text-gray-500 ml-2">(Use {'{name}'} or {'{firstName}'} for personalization)</span>
              </label>
              <textarea
                value={bulkEmailData.body}
                onChange={(e) => setBulkEmailData({ ...bulkEmailData, body: e.target.value })}
                rows="8"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hi {firstName},&#10;&#10;Hope you're doing well! I wanted to reach out and see how things are going...&#10;&#10;Best,&#10;Your Name"
              />
              <p className="text-xs text-gray-500 mt-1">
                Each recipient will receive a personalized email with their name automatically inserted.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={generateBulkEmails}
                disabled={bulkEmailData.selectedContacts.length === 0 || !bulkEmailData.subject || !bulkEmailData.body}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Prepare {bulkEmailData.selectedContacts.length} Emails
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBulkEmail(false);
                  setBulkEmailData({ subject: '', body: '', selectedContacts: [] });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Premium Modal */}
        {showPremiumModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-4 sm:mb-6">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Upgrade to Premium</h2>
                <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-3 sm:mb-4">$5 <span className="text-base sm:text-lg text-gray-600">one-time</span></p>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Custom Reminders</p>
                    <p className="text-xs sm:text-sm text-gray-600">Set personalized reminder schedules for each client</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Bulk Personalized Emails</p>
                    <p className="text-xs sm:text-sm text-gray-600">Send customized emails to multiple clients at once</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Contact Frequency Settings</p>
                    <p className="text-xs sm:text-sm text-gray-600">Define ideal contact intervals for each relationship</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Bulk Import</p>
                    <p className="text-xs sm:text-sm text-gray-600">Import contacts from Excel, CSV, or paste lists</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-800 text-sm sm:text-base">Priority Support</p>
                    <p className="text-xs sm:text-sm text-gray-600">Get help when you need it</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={activatePremium}
                  className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-yellow-500 hover:to-yellow-700 transition font-semibold text-sm sm:text-base"
                >
                  Upgrade Now
                </button>
                <button
                  onClick={() => setShowPremiumModal(false)}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm sm:text-base"
                >
                  Maybe Later
                </button>
              </div>
              
              <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
                💡 This is a demo. In production, this would integrate with Stripe or another payment processor.
              </p>
            </div>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-4">
          {sortedContacts.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center text-gray-500">
              {contacts.length === 0 ? 'No contacts yet. Add your first contact above!' : 'No contacts found.'}
            </div>
          ) : (
            sortedContacts.map(contact => {
              const days = daysSinceContact(contact.lastContactDate);
              const urgency = getUrgencyLevel(days);
              
              return (
                <div key={contact.id} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">{contact.name}</h3>
                      {contact.email && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{contact.email}</p>
                      )}
                      {contact.notes && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{contact.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-red-500 hover:text-red-700 text-xs sm:text-sm ml-2 flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* Last Contact */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm text-gray-500">Last Contact</div>
                        <div className="font-medium text-gray-800 text-sm sm:text-base">
                          {contact.lastContactDate ? (
                            <>
                              <span className="block sm:inline">{new Date(contact.lastContactDate).toLocaleDateString()}</span>
                              <span className={`block sm:inline sm:ml-2 text-xs sm:text-sm ${
                                urgency === 'urgent' ? 'text-red-600' :
                                urgency === 'warning' ? 'text-yellow-600' :
                                'text-green-600'
                              }`}>
                                ({days} days ago)
                              </span>
                            </>
                          ) : (
                            'Not set'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Vibe Score */}
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs sm:text-sm text-gray-500">Vibe Score</div>
                        <div className={`font-medium px-2 sm:px-3 py-1 rounded-full inline-block text-xs sm:text-sm ${getVibeColor(contact.vibeScore)}`}>
                          {contact.vibeScore}/10
                        </div>
                      </div>
                    </div>

                    {/* Urgency Alert or Premium Info */}
                    {isPremium && contact.contactFrequency && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                        <div>
                          <div className="text-xs sm:text-sm text-gray-500">Contact Every</div>
                          <div className="text-xs sm:text-sm font-medium text-gray-700">{contact.contactFrequency} days</div>
                        </div>
                      </div>
                    )}
                    {urgency === 'urgent' && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-red-600">Check in soon!</div>
                          <div className="text-xs text-red-500">90+ days</div>
                        </div>
                      </div>
                    )}
                    {urgency === 'warning' && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-yellow-600">Consider reaching out</div>
                          <div className="text-xs text-yellow-500">60+ days</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Premium Reminder */}
                  {isPremium && contact.reminderDays && days !== null && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600 flex-shrink-0" />
                        <span className="text-gray-600">
                          Next reminder: {contact.reminderDays - days > 0 ? `in ${contact.reminderDays - days} days` : 'overdue'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick Update */}
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex gap-2">
                    <button
                      onClick={() => handleUpdateContact(contact.id, { 
                        lastContactDate: new Date().toISOString().split('T')[0] 
                      })}
                      className="text-xs sm:text-sm bg-green-100 text-green-700 px-3 py-1.5 sm:py-1 rounded hover:bg-green-200 transition"
                    >
                      Mark Contacted Today
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Firebase Authentication & Database Utilities
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  getDocs,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';

// ========== AUTHENTICATION ==========

// Sign Up
export const signUp = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      name: name || email.split('@')[0],
      isPremium: false,
      createdAt: Timestamp.now()
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign In
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign Out
export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Reset Password
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get Current User Data
export const getUserData = async (uid) => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== CONTACTS DATABASE ==========

// Add Contact
export const addContact = async (userId, contact) => {
  try {
    const contactsRef = collection(db, 'users', userId, 'contacts');
    const docRef = await addDoc(contactsRef, {
      ...contact,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get All Contacts
export const getContacts = async (userId) => {
  try {
    const contactsRef = collection(db, 'users', userId, 'contacts');
    const q = query(contactsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const contacts = [];
    querySnapshot.forEach((doc) => {
      contacts.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, contacts };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update Contact
export const updateContact = async (userId, contactId, updates) => {
  try {
    const contactRef = doc(db, 'users', userId, 'contacts', contactId);
    await updateDoc(contactRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete Contact
export const deleteContact = async (userId, contactId) => {
  try {
    const contactRef = doc(db, 'users', userId, 'contacts', contactId);
    await deleteDoc(contactRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== ACTIVITIES DATABASE ==========

// Add Activity
export const addActivity = async (userId, activity) => {
  try {
    const activitiesRef = collection(db, 'users', userId, 'activities');
    const docRef = await addDoc(activitiesRef, {
      ...activity,
      timestamp: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get Activities for Contact
export const getActivities = async (userId, contactId = null) => {
  try {
    const activitiesRef = collection(db, 'users', userId, 'activities');
    let q;
    
    if (contactId) {
      q = query(activitiesRef, where('contactId', '==', contactId), orderBy('timestamp', 'desc'));
    } else {
      q = query(activitiesRef, orderBy('timestamp', 'desc'));
    }
    
    const querySnapshot = await getDocs(q);
    const activities = [];
    querySnapshot.forEach((doc) => {
      activities.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, activities };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========== AUTH STATE LISTENER ==========

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

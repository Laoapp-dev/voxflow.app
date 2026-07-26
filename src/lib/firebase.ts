import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { VocabularyWord, SRSItem, ShadowingPracticeRecord, UserProfile } from '../types';

// Load config for voxflow-app project
const firebaseConfig = {
  projectId: "voxflow-app",
  appId: "1:296292513863:web:cb2a3ad09210bf712fd962",
  apiKey: "AIzaSyBIP2OyIsfJ1H_YVMQ1U7t45tw3bDd1N0I",
  authDomain: "voxflow-app.firebaseapp.com",
  storageBucket: "voxflow-app.firebasestorage.app",
  messagingSenderId: "296292513863"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Specify custom databaseId if configured
export const db = getFirestore(app, "ai-studio-voxflowapp-1a4e3ed7-9bb4-4bb8-88f1-c0e113e21ad3");
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    if (user) {
      await saveUserProfileToFirestore({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Learner',
        photoURL: user.photoURL || null,
        dailyGoal: 10,
        streak: 1,
        role: 'learner'
      });
    }
    return user;
  } catch (error: any) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

export async function registerUserWithEmail(
  fullName: string,
  email: string,
  pass: string,
  targetLevel: string = 'A1',
  dailyGoal: number = 10
) {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanName = fullName.trim() || normalizedEmail.split('@')[0];

  try {
    const result = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
    const user = result.user;
    if (user) {
      await updateProfile(user, {
        displayName: cleanName
      }).catch(err => console.warn('updateProfile warning:', err));

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || normalizedEmail,
        displayName: cleanName,
        photoURL: user.photoURL || null,
        dailyGoal: dailyGoal || 10,
        streak: 1,
        role: 'learner'
      };
      await saveUserProfileToFirestore(profile);
      return user;
    }
  } catch (error: any) {
    console.error('createUserWithEmailAndPassword attempt error:', error?.code, error?.message);

    if (error.code === 'auth/email-already-in-use') {
      try {
        const signinRes = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
        const user = signinRes.user;
        if (user) {
          const profile: UserProfile = {
            uid: user.uid,
            email: user.email || normalizedEmail,
            displayName: cleanName || user.displayName || normalizedEmail.split('@')[0],
            photoURL: user.photoURL || null,
            dailyGoal: dailyGoal || 10,
            streak: 1,
            role: 'learner'
          };
          await saveUserProfileToFirestore(profile);
          return user;
        }
      } catch (signInErr: any) {
        console.error('SignIn during email-already-in-use failed:', signInErr);
        throw new Error('This email is already registered. Please check your password or switch to Sign In.');
      }
    } else if (
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/admin-restricted-operation' ||
      error.code === 'auth/configuration-not-found'
    ) {
      // Fallback to anonymous auth session if Email/Password provider is disabled in Firebase console
      console.warn('Firebase Email Auth disabled in console. Fallback to anonymous session + Firestore user record.');
      const anonResult = await signInAnonymously(auth);
      const user = anonResult.user;
      if (user) {
        await updateProfile(user, { displayName: cleanName }).catch(() => {});
        const profile: UserProfile = {
          uid: user.uid,
          email: normalizedEmail,
          displayName: cleanName,
          photoURL: null,
          dailyGoal: dailyGoal || 10,
          streak: 1,
          role: 'learner'
        };
        await saveUserProfileToFirestore(profile);
        return user;
      }
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password must be at least 6 characters long.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid Gmail or Email address.');
    }
    throw error;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const result = await signInWithEmailAndPassword(auth, normalizedEmail, pass);
    const user = result.user;
    if (user) {
      const existingProfile = await fetchUserProfileFromFirestore(user.uid);
      await saveUserProfileToFirestore({
        uid: user.uid,
        email: user.email || normalizedEmail,
        displayName: existingProfile?.displayName || user.displayName || normalizedEmail.split('@')[0],
        photoURL: user.photoURL || null,
        dailyGoal: existingProfile?.dailyGoal || 10,
        streak: existingProfile?.streak || 1,
        role: existingProfile?.role || 'learner'
      });
    }
    return user;
  } catch (error: any) {
    console.error('loginWithEmail failed:', error?.code, error?.message);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
      // Auto register for convenience
      try {
        const created = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
        if (created.user) {
          const namePart = normalizedEmail.split('@')[0];
          const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
          await updateProfile(created.user, { displayName }).catch(() => {});
          await saveUserProfileToFirestore({
            uid: created.user.uid,
            email: created.user.email || normalizedEmail,
            displayName,
            photoURL: created.user.photoURL || null,
            dailyGoal: 10,
            streak: 1,
            role: 'learner'
          });
          return created.user;
        }
      } catch (createErr: any) {
        if (
          createErr.code === 'auth/operation-not-allowed' ||
          createErr.code === 'auth/admin-restricted-operation'
        ) {
          const anonResult = await signInAnonymously(auth);
          const user = anonResult.user;
          if (user) {
            const namePart = normalizedEmail.split('@')[0];
            const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
            await saveUserProfileToFirestore({
              uid: user.uid,
              email: normalizedEmail,
              displayName,
              photoURL: null,
              dailyGoal: 10,
              streak: 1,
              role: 'learner'
            });
            return user;
          }
        }
        throw createErr;
      }
    } else if (
      error.code === 'auth/operation-not-allowed' ||
      error.code === 'auth/admin-restricted-operation'
    ) {
      const anonResult = await signInAnonymously(auth);
      const user = anonResult.user;
      if (user) {
        const namePart = normalizedEmail.split('@')[0];
        const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        await saveUserProfileToFirestore({
          uid: user.uid,
          email: normalizedEmail,
          displayName,
          photoURL: null,
          dailyGoal: 10,
          streak: 1,
          role: 'learner'
        });
        return user;
      }
    }
    throw error;
  }
}

export async function loginGuest() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Anonymous Sign-in failed:', error);
    throw error;
  }
}

export async function logoutUser() {
  return firebaseSignOut(auth);
}

// Helper to clean undefined values before sending to Firestore
export function sanitizeFirestoreData<T extends Record<string, any>>(data: T): T {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value?.constructor?.name === 'FieldValue')) {
        cleaned[key] = sanitizeFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned as T;
}

// Firestore Persistence Helpers
export async function saveWordToFirestore(word: VocabularyWord, userId: string) {
  try {
    const wordRef = doc(db, 'words', word.id);
    const cleaned = sanitizeFirestoreData({
      ...word,
      userId,
      updatedAt: serverTimestamp(),
    });
    await setDoc(wordRef, cleaned, { merge: true });
  } catch (e) {
    console.error('Error saving word to Firestore:', e);
  }
}

export async function pushAllWordsToFirestore(
  words: VocabularyWord[], 
  userId: string,
  onProgress?: (current: number, total: number) => void
) {
  try {
    const total = words.length;
    if (total === 0) return true;

    // Use writeBatch in chunks of 200
    const chunkSize = 200;
    for (let i = 0; i < total; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      for (const word of chunk) {
        const wordRef = doc(db, 'words', word.id);
        const cleanedData = sanitizeFirestoreData({
          ...word,
          userId,
          updatedAt: serverTimestamp(),
        });
        batch.set(wordRef, cleanedData, { merge: true });
      }

      await batch.commit();
      if (onProgress) {
        onProgress(Math.min(i + chunkSize, total), total);
      }
    }
    return true;
  } catch (e) {
    console.error('Error pushing words batch to Firestore:', e);
    throw e;
  }
}

export async function fetchAllWordsFromFirestore(userId?: string): Promise<VocabularyWord[]> {
  try {
    const wordsCol = collection(db, 'words');
    const q = userId ? query(wordsCol, where('userId', '==', userId)) : query(wordsCol);
    const snapshot = await getDocs(q);
    const words: VocabularyWord[] = [];
    snapshot.forEach(docSnap => {
      words.push(docSnap.data() as VocabularyWord);
    });
    return words;
  } catch (e) {
    console.error('Error fetching words from Firestore:', e);
    return [];
  }
}

export async function fetchSRSDataFromFirestore(userId?: string): Promise<Record<string, SRSItem>> {
  try {
    const srsCol = collection(db, 'srsData');
    const q = userId ? query(srsCol, where('userId', '==', userId)) : query(srsCol);
    const snapshot = await getDocs(q);
    const srsMap: Record<string, SRSItem> = {};
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as SRSItem;
      if (data.wordId) {
        srsMap[data.wordId] = data;
      }
    });
    return srsMap;
  } catch (e) {
    console.error('Error fetching SRS data from Firestore:', e);
    return {};
  }
}

export async function deleteWordFromFirestore(wordId: string) {
  try {
    await deleteDoc(doc(db, 'words', wordId));
    await deleteDoc(doc(db, 'srsData', wordId));
  } catch (e) {
    console.error('Error deleting word from Firestore:', e);
  }
}

export async function saveSRSDataToFirestore(srsItem: SRSItem, userId: string) {
  try {
    const srsRef = doc(db, 'srsData', srsItem.wordId);
    await setDoc(srsRef, {
      ...srsItem,
      userId,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('Error saving SRS data to Firestore:', e);
  }
}

export async function saveShadowingRecordToFirestore(record: ShadowingPracticeRecord, userId: string) {
  try {
    const practiceRef = doc(db, 'shadowingPractices', record.id);
    await setDoc(practiceRef, {
      ...record,
      userId,
      recordedAtIso: record.recordedAt,
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('Error saving shadowing practice to Firestore:', e);
  }
}

export async function saveUserProfileToFirestore(profile: UserProfile) {
  try {
    const userRef = doc(db, 'users', profile.uid);
    const cleaned = sanitizeFirestoreData({
      ...profile,
      email: profile.email || '',
      displayName: profile.displayName || '',
      photoURL: profile.photoURL || null,
      updatedAt: serverTimestamp(),
    });
    await setDoc(userRef, cleaned, { merge: true });
    console.log('User profile saved successfully to Firestore:', profile.uid);
  } catch (e) {
    console.error('Error saving user profile to Firestore:', e);
  }
}

export async function fetchUserProfileFromFirestore(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
  } catch (e) {
    console.error('Error fetching user profile from Firestore:', e);
  }
  return null;
}

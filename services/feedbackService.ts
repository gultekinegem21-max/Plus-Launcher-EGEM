import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export type FeedbackCategory = 'feature' | 'bug' | 'general' | 'praise';
export type FeedbackStatus = 'new' | 'reviewed' | 'resolved';

export interface UserFeedback {
  id: string;
  user: string;
  text: string;
  category: FeedbackCategory;
  rating: number; // 1 to 5
  createdAt: string;
  status: FeedbackStatus;
  deviceInfo?: string;
  adminNote?: string;
}

const LOCAL_STORAGE_KEY = "plus-launcher-feedback-v2";
const FIRESTORE_DOC_PATH = "feedbacks";
const FEEDBACK_EVENT = "plus-feedback-updated";

// Helper: Get local feedbacks
export function getLocalFeedbacks(): UserFeedback[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      // Check legacy key
      const legacy = localStorage.getItem("plus-launcher-feedback");
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          return parsedLegacy.map((item: any, idx: number) => ({
            id: String(item.id || Date.now() - idx * 1000),
            user: item.user || "Anonymous",
            text: item.text || "",
            category: 'general' as FeedbackCategory,
            rating: 5,
            createdAt: item.date || new Date().toISOString(),
            status: 'new' as FeedbackStatus,
          }));
        }
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("Error reading feedbacks from localStorage", err);
    return [];
  }
}

// Helper: Save local feedbacks and notify
export function saveLocalFeedbacks(feedbacks: UserFeedback[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(feedbacks));
    window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: feedbacks }));
  } catch (err) {
    console.error("Error writing feedbacks to localStorage", err);
  }
}

// Sync feedbacks to Firestore
async function syncToFirestore(feedbacks: UserFeedback[]) {
  try {
    await setDoc(
      doc(db, "globals", FIRESTORE_DOC_PATH),
      {
        list: feedbacks,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    // Graceful offline fallback: log error without breaking UI
    console.warn("Firestore sync warning (using localStorage fallback):", err);
  }
}

// Submit a new feedback
export async function submitFeedback(data: {
  user: string;
  text: string;
  category?: FeedbackCategory;
  rating?: number;
}): Promise<UserFeedback> {
  const newFeedback: UserFeedback = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user: data.user.trim() || "Anonymous",
    text: data.text.trim(),
    category: data.category || 'general',
    rating: typeof data.rating === 'number' && data.rating >= 1 && data.rating <= 5 ? data.rating : 5,
    createdAt: new Date().toISOString(),
    status: 'new',
    deviceInfo: typeof navigator !== 'undefined' ? `${navigator.platform || 'Web'}` : 'Web',
  };

  const current = getLocalFeedbacks();
  const updated = [newFeedback, ...current];
  saveLocalFeedbacks(updated);
  await syncToFirestore(updated);

  return newFeedback;
}

// Update feedback status
export async function updateFeedbackStatus(id: string, status: FeedbackStatus): Promise<void> {
  const current = getLocalFeedbacks();
  const updated = current.map(item => item.id === id ? { ...item, status } : item);
  saveLocalFeedbacks(updated);
  await syncToFirestore(updated);
}

// Add an admin note
export async function addAdminNote(id: string, note: string): Promise<void> {
  const current = getLocalFeedbacks();
  const updated = current.map(item => item.id === id ? { ...item, adminNote: note } : item);
  saveLocalFeedbacks(updated);
  await syncToFirestore(updated);
}

// Delete a feedback
export async function deleteFeedback(id: string): Promise<void> {
  const current = getLocalFeedbacks();
  const updated = current.filter(item => item.id !== id);
  saveLocalFeedbacks(updated);
  await syncToFirestore(updated);
}

// Clear all feedbacks
export async function clearAllFeedbacks(): Promise<void> {
  saveLocalFeedbacks([]);
  await syncToFirestore([]);
}

// Seed sample feedbacks for testing
export async function seedSampleFeedbacks(): Promise<void> {
  const samples: UserFeedback[] = [
    {
      id: `fb_sample_1`,
      user: "Alex Rivera",
      category: "feature",
      rating: 5,
      text: "Love the new weather widget! Could you add animated weather backgrounds when raining?",
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      status: "new",
      deviceInfo: "Chrome / macOS",
    },
    {
      id: `fb_sample_2`,
      user: "Jordan Lee",
      category: "bug",
      rating: 4,
      text: "Clock formatting works great in 24h mode, but when I switch wallpapers it takes 1 sec to refresh.",
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      status: "reviewed",
      deviceInfo: "Safari / iOS",
    },
    {
      id: `fb_sample_3`,
      user: "Morgan K.",
      category: "praise",
      rating: 5,
      text: "The launcher is super fast and clean. Best custom launcher for Chrome OS / Web!",
      createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      status: "resolved",
      deviceInfo: "Chrome / Android",
    },
  ];

  const current = getLocalFeedbacks();
  // Merge samples without duplicating IDs
  const existingIds = new Set(current.map(c => c.id));
  const toAdd = samples.filter(s => !existingIds.has(s.id));
  const merged = [...toAdd, ...current];
  saveLocalFeedbacks(merged);
  await syncToFirestore(merged);
}

// Subscribe to real-time feedback updates (combining Firestore and local storage events)
export function subscribeToFeedbacks(callback: (feedbacks: UserFeedback[]) => void): () => void {
  // Initial fire with local data
  callback(getLocalFeedbacks());

  // Listen to local custom event
  const handleLocalChange = () => {
    callback(getLocalFeedbacks());
  };
  window.addEventListener(FEEDBACK_EVENT, handleLocalChange);
  window.addEventListener('storage', handleLocalChange);

  // Firestore real-time listener
  let unsubscribeFirestore: (() => void) | null = null;
  try {
    const feedbackDocRef = doc(db, "globals", FIRESTORE_DOC_PATH);
    unsubscribeFirestore = onSnapshot(
      feedbackDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.list)) {
            // Merge with local storage
            const remoteList: UserFeedback[] = data.list;
            const localList = getLocalFeedbacks();
            
            // Map by id for fast merging
            const mergedMap = new Map<string, UserFeedback>();
            remoteList.forEach(item => mergedMap.set(item.id, item));
            localList.forEach(item => {
              if (!mergedMap.has(item.id)) {
                mergedMap.set(item.id, item);
              }
            });

            const merged = Array.from(mergedMap.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            callback(merged);
          }
        }
      },
      (error) => {
        console.warn("Firestore feedback listener error (relying on localStorage):", error);
      }
    );
  } catch (err) {
    console.warn("Failed to attach Firestore listener:", err);
  }

  return () => {
    window.removeEventListener(FEEDBACK_EVENT, handleLocalChange);
    window.removeEventListener('storage', handleLocalChange);
    if (unsubscribeFirestore) {
      unsubscribeFirestore();
    }
  };
}

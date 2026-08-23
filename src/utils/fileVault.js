// IndexedDB 7-Day File Vault for I HATE PDF

const DB_NAME = 'IHatePdfVault';
const DB_VERSION = 1;
const STORE_NAME = 'saved_files';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Open or create the IndexedDB database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.target.result);
    request.onerror = () => reject(request.error);
  });
}

import { uploadToCloudinary } from './cloudinary';

// Save a processed file to 7-day storage (Local + Cloudinary Cloud)
export async function saveFileToVault({ fileName, toolId, toolName, blob, fileSize }) {
  try {
    const db = await openDB();
    const now = Date.now();
    const expiresAt = now + SEVEN_DAYS_MS;

    // Optional Cloudinary Upload in parallel
    let cloudData = null;
    try {
      cloudData = await uploadToCloudinary(blob, fileName);
    } catch (e) {
      console.warn('Cloudinary backup skipped:', e);
    }

    const fileRecord = {
      id: 'file_' + now + '_' + Math.random().toString(36).substring(2, 7),
      fileName,
      toolId,
      toolName: toolName || toolId,
      blob,
      cloudUrl: cloudData?.secureUrl || null,
      cloudPublicId: cloudData?.publicId || null,
      fileSize: fileSize || blob.size,
      mimeType: blob.type || 'application/pdf',
      createdAt: now,
      expiresAt: expiresAt,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(fileRecord);

      request.onsuccess = () => {
        // Also cleanup expired files in background
        cleanExpiredFiles().catch(() => {});
        resolve(fileRecord);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to save to File Vault:', err);
    return null;
  }
}

// Retrieve all valid stored files (auto-purging expired files older than 7 days)
export async function getVaultFiles() {
  try {
    const db = await openDB();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const allFiles = request.result || [];
        const validFiles = [];
        const expiredIds = [];

        for (const file of allFiles) {
          if (file.expiresAt && file.expiresAt > now) {
            validFiles.push(file);
          } else {
            expiredIds.push(file.id);
          }
        }

        // Delete expired records
        for (const id of expiredIds) {
          store.delete(id);
        }

        // Sort latest first
        validFiles.sort((a, b) => b.createdAt - a.createdAt);
        resolve(validFiles);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to get files from vault:', err);
    return [];
  }
}

// Delete a single file from vault
export async function deleteVaultFile(id) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to delete file from vault:', err);
    return false;
  }
}

// Clear all files from vault
export async function clearVault() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to clear vault:', err);
    return false;
  }
}

// Background cleanup routine
export async function cleanExpiredFiles() {
  try {
    const db = await openDB();
    const now = Date.now();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('expiresAt');
    const range = IDBKeyRange.upperBound(now);

    const request = index.openCursor(range);
    request.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (e) {
    // Ignore cleanup errors
  }
}

// Helper: Calculate remaining time string
export function getRemainingTimeString(expiresAt) {
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return `${hours}h ${mins}m left`;
}

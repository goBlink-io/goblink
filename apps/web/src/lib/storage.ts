/**
 * Encrypted localStorage wrapper for sensitive data.
 * Uses Web Crypto API for AES-GCM encryption.
 */

const ENCRYPTION_SALT = 'goblink-storage-v1';
const KEY_ITERATIONS = 100000;

/**
 * Derive encryption key from a password/seed
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive AES-GCM key
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(ENCRYPTION_SALT),
      iterations: KEY_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  
  // Combine IV and encrypted data
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted)),
  });
}

/**
 * Decrypt data using AES-GCM
 */
async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  const { iv, data } = JSON.parse(encryptedData);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data)
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Get encryption key for this browser session
 * In a real app, you might derive this from user's wallet signature
 */
function getEncryptionPassword(): string {
  // For now, use a browser-specific key
  // In production, consider deriving from wallet signature
  let password = sessionStorage.getItem('__enc_key');
  
  if (!password) {
    // Generate random key for this session
    password = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    sessionStorage.setItem('__enc_key', password);
  }
  
  return password;
}

/**
 * Encrypted localStorage wrapper
 */
export const secureStorage = {
  /**
   * Store encrypted data
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const password = getEncryptionPassword();
      const encryptionKey = await deriveKey(password);
      const serialized = JSON.stringify(value);
      const encrypted = await encrypt(serialized, encryptionKey);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      // Fallback to unencrypted if crypto fails
      console.error('Encryption failed, falling back to plaintext:', error);
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  
  /**
   * Retrieve and decrypt data
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      // Try to decrypt
      try {
        const password = getEncryptionPassword();
        const encryptionKey = await deriveKey(password);
        const decrypted = await decrypt(encrypted, encryptionKey);
        return JSON.parse(decrypted);
      } catch {
        // If decryption fails, might be plaintext (old data)
        try {
          return JSON.parse(encrypted);
        } catch {
          return null;
        }
      }
    } catch (error) {
      console.error('Failed to retrieve item:', error);
      return null;
    }
  },
  
  /**
   * Remove item
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
  
  /**
   * Clear all encrypted storage
   */
  clear(): void {
    localStorage.clear();
  },
};

/**
 * For backward compatibility, also export a sync version that uses base64 obfuscation
 * This is less secure but doesn't require async/await everywhere
 */
export const obfuscatedStorage = {
  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encoded = btoa(serialized);
      localStorage.setItem(key, encoded);
    } catch (error) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  },
  
  getItem<T = any>(key: string): T | null {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      
      try {
        const decoded = atob(encoded);
        return JSON.parse(decoded);
      } catch {
        // Fallback to direct parse if not encoded
        return JSON.parse(encoded);
      }
    } catch (error) {
      return null;
    }
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },
};

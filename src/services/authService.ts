import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as fbSignOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';

export const authService = {
  /**
   * Get the currently active Firebase auth user.
   */
  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      }, (error) => {
        console.warn("Error getting current user session:", error.message);
        resolve(null);
      });
    });
  },

  /**
   * Log in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase Sign In error:", error.message);
      throw error;
    }
  },

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      console.error("Firebase Sign Up error:", error.message);
      throw error;
    }
  },

  /**
   * Sign out of the session
   */
  async signOut() {
    try {
      await fbSignOut(auth);
    } catch (error: any) {
      console.error("Firebase Sign Out error:", error.message);
      throw error;
    }
  },

  /**
   * Send a password reset email
   */
  async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Firebase Password Reset error:", error.message);
      throw error;
    }
  },

  /**
   * Listen to auth state updates.
   * Returns an unsubscribe handler object to match legacy Supabase pattern.
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    const unsub = onAuthStateChanged(auth, (user) => {
      callback(user);
    });
    return {
      unsubscribe: () => unsub()
    };
  }
};

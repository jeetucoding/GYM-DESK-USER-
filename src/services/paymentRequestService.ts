import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  query, 
  where, 
  setDoc 
} from 'firebase/firestore';
import { PaymentRequest } from '../types';

export const paymentRequestService = {
  /**
   * Submit a new payment verification request
   */
  async submitPaymentRequest(request: Omit<PaymentRequest, 'id' | 'status' | 'requested_at'>): Promise<PaymentRequest> {
    const requestDocRef = doc(collection(db, 'payment_requests'));
    const generatedId = requestDocRef.id;

    const payload: PaymentRequest = {
      id: generatedId,
      member_id: request.member_id,
      amount: request.amount,
      payment_mode: request.payment_mode,
      transaction_id: request.transaction_id,
      screenshot_url: request.screenshot_url || '',
      notes: request.notes || '',
      status: 'Pending',
      requested_at: new Date().toISOString()
    };

    try {
      await setDoc(requestDocRef, payload);
      return payload;
    } catch (error: any) {
      console.error("Firebase payment request creation failed:", error);
      handleFirestoreError(error, OperationType.CREATE, `payment_requests/${generatedId}`);
    }
  },

  /**
   * Fetch payment requests submitted by the logged-in member
   */
  async getMyPaymentRequests(memberId: string): Promise<PaymentRequest[]> {
    try {
      const q = query(collection(db, 'payment_requests'), where('member_id', '==', memberId));
      const snapshot = await getDocs(q);
      const requestsList: PaymentRequest[] = [];
      
      snapshot.forEach((docSnap) => {
        requestsList.push({ id: docSnap.id, ...docSnap.data() } as PaymentRequest);
      });

      // Sort in memory to avoid index requirements in Firestore
      return requestsList.sort((a, b) => b.requested_at.localeCompare(a.requested_at));
    } catch (error: any) {
      console.error("Firebase payment requests query failed:", error);
      handleFirestoreError(error, OperationType.LIST, 'payment_requests');
    }
  }
};

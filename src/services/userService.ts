import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where,
  setDoc,
  updateDoc,
  onSnapshot,
  orderBy
} from 'firebase/firestore';
import { authService } from './authService';
import { Member, Attendance, Payment, Plan, DashboardSummary, GlobalMessage } from '../types';

// ==========================================
// DEMO SANDBOX DATA FOR PASSWORD-FREE ACCESS
// ==========================================

export const DEMO_MEMBERS_MAP: Record<string, Member> = {
  "demo-vijay-id": {
    id: "demo-vijay-id",
    name: "Vijay Kumar",
    mobile: "9876543210",
    whatsapp: "9876543210",
    gender: "Male",
    age: 28,
    address: "Flat 402, Royal Residency, Sector 62, Noida, UP",
    join_date: "2026-01-01",
    plan_id: "premium-plan",
    status: "Active",
    plan_start_date: "2026-01-01",
    plan_end_date: "2026-07-01",
    user_id: "demo-user-vijay"
  },
  "demo-anjali-id": {
    id: "demo-anjali-id",
    name: "Anjali Sharma",
    mobile: "9440123456",
    whatsapp: "9440123456",
    gender: "Female",
    age: 24,
    address: "Apt 20B, Green Glen Layout, Bellandur, Bangalore",
    join_date: "2026-02-15",
    plan_id: "gold-plan",
    status: "Active",
    plan_start_date: "2026-02-15",
    plan_end_date: "2026-05-15",
    user_id: "demo-user-anjali"
  },
  "demo-rajesh-id": {
    id: "demo-rajesh-id",
    name: "Rajesh Singh",
    mobile: "9112233445",
    whatsapp: "9112233445",
    gender: "Male",
    age: 42,
    address: "Block C-4, Dwarka Sector 10, New Delhi",
    join_date: "2025-10-01",
    plan_id: "basic-plan",
    status: "Expired",
    plan_start_date: "2025-10-01",
    plan_end_date: "2025-11-01",
    user_id: "demo-user-rajesh"
  }
};

export const DEMO_PLANS: Record<string, Plan> = {
  "premium-plan": {
    id: "premium-plan",
    name: "Premium 6-Month Plan",
    duration_months: 6,
    price: 3000
  },
  "gold-plan": {
    id: "gold-plan",
    name: "Gold 3-Month Plan",
    duration_months: 3,
    price: 1500
  },
  "basic-plan": {
    id: "basic-plan",
    name: "Basic 1-Month Plan",
    duration_months: 1,
    price: 500
  }
};

export const DEMO_ATTENDANCE: Record<string, Attendance[]> = {
  "demo-vijay-id": [
    { id: "att-v1", member_id: "demo-vijay-id", date: "2026-05-31", check_in_time: "07:15 AM", status: "Present" },
    { id: "att-v2", member_id: "demo-vijay-id", date: "2026-05-29", check_in_time: "07:22 AM", status: "Present" },
    { id: "att-v3", member_id: "demo-vijay-id", date: "2026-05-28", check_in_time: "07:08 AM", status: "Present" },
    { id: "att-v4", member_id: "demo-vijay-id", date: "2026-05-26", check_in_time: "07:30 AM", status: "Present" },
    { id: "att-v5", member_id: "demo-vijay-id", date: "2026-05-25", check_in_time: "07:12 AM", status: "Present" },
    { id: "att-v6", member_id: "demo-vijay-id", date: "2026-05-23", check_in_time: "07:19 AM", status: "Present" }
  ],
  "demo-anjali-id": [
    { id: "att-a1", member_id: "demo-anjali-id", date: "2026-05-30", check_in_time: "06:30 PM", status: "Present" },
    { id: "att-a2", member_id: "demo-anjali-id", date: "2026-05-27", check_in_time: "06:45 PM", status: "Present" },
    { id: "att-a3", member_id: "demo-anjali-id", date: "2026-05-24", check_in_time: "06:22 PM", status: "Present" },
    { id: "att-a4", member_id: "demo-anjali-id", date: "2026-05-22", check_in_time: "06:40 PM", status: "Present" }
  ],
  "demo-rajesh-id": [
    { id: "att-r1", member_id: "demo-rajesh-id", date: "2025-10-28", check_in_time: "08:00 AM", status: "Present" },
    { id: "att-r2", member_id: "demo-rajesh-id", date: "2025-10-26", check_in_time: "08:15 AM", status: "Present" },
    { id: "att-r3", member_id: "demo-rajesh-id", date: "2025-10-24", check_in_time: "08:05 AM", status: "Present" }
  ]
};

export const DEMO_PAYMENTS: Record<string, Payment[]> = {
  "demo-vijay-id": [
    { id: "pay-v1", member_id: "demo-vijay-id", amount: 12000, payment_date: "2026-01-02", payment_mode: "UPI", status: "Paid", receipt_number: "REC10293847" }
  ],
  "demo-anjali-id": [
    { id: "pay-a1", member_id: "demo-anjali-id", amount: 7500, payment_date: "2026-02-15", payment_mode: "Bank", status: "Paid", receipt_number: "REC88472849" }
  ],
  "demo-rajesh-id": [
    { id: "pay-r1", member_id: "demo-rajesh-id", amount: 500, payment_date: "2025-10-01", payment_mode: "Cash", status: "Paid", receipt_number: "REC0000001" },
    { id: "pay-r2", member_id: "demo-rajesh-id", amount: 500, due_amount: 500, payment_date: "2025-11-01", payment_mode: "UPI", status: "Pending", receipt_number: "" }
  ]
};

export const userService = {
  /**
   * Fetch all members to allow testing / select bypass profile
   */
  async getAllMembers(): Promise<Member[]> {
    // Return demo members immediately if the user is not authenticated to avoid unauthorized firestore fetches
    if (!auth.currentUser) {
      return Object.values(DEMO_MEMBERS_MAP);
    }

    try {
      const q = collection(db, 'members');
      const snapshot = await getDocs(q);
      const dbMembers: Member[] = [];
      snapshot.forEach((d) => {
        dbMembers.push({ id: d.id, ...d.data() } as Member);
      });
      
      // Sort database members alphabetically by name
      dbMembers.sort((a, b) => a.name.localeCompare(b.name));

      // Combine with local demo members to ensure failure-free display
      const demoList = Object.values(DEMO_MEMBERS_MAP);
      return [...demoList, ...dbMembers];
    } catch (err) {
      console.warn("Could not fetch database members, returning demo fallback:", err);
      // Fallback gracefully to demo profiles on initial setup / permission limits
      return Object.values(DEMO_MEMBERS_MAP);
    }
  },

  /**
   * Fetch a single member by their ID directly
   */
  async getMemberById(id: string): Promise<Member | null> {
    if (id.startsWith("demo-")) {
      return DEMO_MEMBERS_MAP[id] || null;
    }

    try {
      const docRef = doc(db, 'members', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Member;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `members/${id}`);
    }
    return null;
  },

  /**
   * Search member by registered mobile number
   */
  async getMemberByMobile(mobile: string): Promise<Member | null> {
    const cleanMobile = mobile.trim();
    if (!cleanMobile) return null;

    // 1. Check local demo members first
    const demoMembers = Object.values(DEMO_MEMBERS_MAP);
    const foundDemo = demoMembers.find(
      m => m.mobile === cleanMobile || m.mobile.replace(/\D/g, '') === cleanMobile.replace(/\D/g, '')
    );
    if (foundDemo) {
      return foundDemo;
    }

    // 2. Check real Firestore database
    try {
      const q = query(collection(db, 'members'), where('mobile', '==', cleanMobile));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as Member;
      }

      // If exact query doesn't work, let's fetch list and match by stripping formatting characters
      const allSnapshot = await getDocs(collection(db, 'members'));
      const strippedTarget = cleanMobile.replace(/\D/g, '');
      let matched: Member | null = null;
      allSnapshot.forEach((docSnap) => {
        const mData = docSnap.data();
        const strippedMemberMobile = ((mData.mobile || mData.phone || '') as string).replace(/\D/g, '');
        if (strippedMemberMobile && strippedMemberMobile === strippedTarget) {
          matched = { id: docSnap.id, ...mData } as Member;
        }
      });
      if (matched) return matched;
    } catch (err) {
      console.warn("Could not query member by mobile:", err);
    }

    return null;
  },

  /**
   * Get the member profile linked to the currently authenticated user's ID
   */
  async getCurrentMember(): Promise<Member | null> {
    const user = await authService.getCurrentUser();
    if (!user) {
      return null;
    }

    try {
      const q = query(collection(db, 'members'), where('user_id', '==', user.uid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null; // Not linked
      }

      const docSnap = snapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() } as Member;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'members');
    }
  },

  /**
   * Fetch attendance records for a specific member ID
   */
  async getMyAttendance(memberId: string): Promise<Attendance[]> {
    if (memberId.startsWith("demo-")) {
      return DEMO_ATTENDANCE[memberId] || [];
    }

    try {
      const q = query(collection(db, 'attendance'), where('member_id', '==', memberId));
      const snapshot = await getDocs(q);
      const logs: Attendance[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let formattedCheckInTime = data.check_in_time || '';
        
        // If it's an ISO string (contains 'T' and 'Z'), format it to a readable time
        if (formattedCheckInTime.includes('T') && formattedCheckInTime.includes('Z')) {
           try {
              const d = new Date(formattedCheckInTime);
              formattedCheckInTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
           } catch (e) {
              // fallback to raw if error
           }
        }
        
        logs.push({ 
          id: docSnap.id, 
          ...data,
          date: data.attendance_date || data.date || '',
          check_in_time: formattedCheckInTime
        } as Attendance);
      });

      // Sort in memory to avoid needing composite index in Firestore
      return logs.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `attendance`);
    }
  },

  /**
   * Fetch payment records for a specific member ID
   */
  async getMyPayments(memberId: string): Promise<Payment[]> {
    if (memberId.startsWith("demo-")) {
      return DEMO_PAYMENTS[memberId] || [];
    }

    try {
      const q = query(collection(db, 'payments'), where('member_id', '==', memberId));
      const snapshot = await getDocs(q);
      const paymentsList: Payment[] = [];
      snapshot.forEach((docSnap) => {
        paymentsList.push({ id: docSnap.id, ...docSnap.data() } as Payment);
      });

      // Sort in memory to avoid needing composite index in Firestore
      return paymentsList.sort((a, b) => (b.payment_date || '').localeCompare(a.payment_date || ''));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `payments`);
    }
  },

  /**
   * Subscribe to payment records for real-time updates
   */
  subscribeToMyPayments(memberId: string, onUpdate: (p: Payment[]) => void): () => void {
    if (memberId.startsWith("demo-")) {
      onUpdate(DEMO_PAYMENTS[memberId] || []);
      return () => {}; // return empty unsubscribe
    }

    try {
      const q = query(collection(db, 'payments'), where('member_id', '==', memberId));
      return onSnapshot(q, (snapshot) => {
        const paymentsList: Payment[] = [];
        snapshot.forEach((docSnap) => {
          paymentsList.push({ id: docSnap.id, ...docSnap.data() } as Payment);
        });
        const sorted = paymentsList.sort((a, b) => (b.payment_date || '').localeCompare(a.payment_date || ''));
        onUpdate(sorted);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'payments_subscription');
      });
    } catch (err) {
      console.error("Error setting up payments subscription:", err);
      return () => {};
    }
  },

  /**
   * Subscribe to member profile for real-time updates
   */
  subscribeToMember(memberId: string, onUpdate: (m: Member | null) => void): () => void {
    if (memberId.startsWith("demo-")) {
      const demoM = [this.adminMemberProfile, DEMO_MEMBERS_MAP["demo-vijay-id"], DEMO_MEMBERS_MAP["demo-anjali-id"], DEMO_MEMBERS_MAP["demo-rajesh-id"]].find(m => m?.id === memberId);
      onUpdate(demoM || null);
      return () => {};
    }
    
    try {
      const docRef = doc(db, 'members', memberId);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          onUpdate({ id: docSnap.id, ...docSnap.data() } as Member);
        } else {
          onUpdate(null);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'members_subscription');
      });
    } catch(err) {
      console.error("Error setting up member subscription:", err);
      return () => {};
    }
  },

  /**
   * Subscribe to global messages
   */
  subscribeToGlobalMessages(onUpdate: (messages: GlobalMessage[]) => void): () => void {
    try {
      const q = query(collection(db, 'global_messages'), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const messages: GlobalMessage[] = [];
        snapshot.forEach((docSnap) => {
          messages.push({ id: docSnap.id, ...docSnap.data() } as GlobalMessage);
        });
        onUpdate(messages);
      }, (error) => {
        console.error("Error setting up global messages subscription:", error);
      });
    } catch (err) {
      console.error("Error setting up global messages subscription:", err);
      return () => {};
    }
  },

  /**
   * Fetch details of a plan ID
   */
  async getPlan(planId: string): Promise<Plan | null> {
    if (planId in DEMO_PLANS) {
      return DEMO_PLANS[planId];
    }

    try {
      const docRef = doc(db, 'plans', planId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Plan;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `plans/${planId}`);
    }
    return null;
  },

  /**
   * getMyPlan is requested - fetches the current active plan for a member using their plan_id or members information
   */
  async getMyPlan(memberId: string): Promise<Plan | null> {
    if (memberId.startsWith("demo-")) {
      const demoMember = DEMO_MEMBERS_MAP[memberId];
      if (!demoMember || !demoMember.plan_id) return null;
      return this.getPlan(demoMember.plan_id);
    }

    try {
      const member = await this.getMemberById(memberId);
      if (!member || !member.plan_id) return null;

      return this.getPlan(member.plan_id);
    } catch (err) {
      console.error("Error in getMyPlan:", err);
      return null;
    }
  },

  /**
   * Generates a dashboard summary aggregations for a member ID
   */
  async getDashboardSummary(memberId: string): Promise<DashboardSummary> {
    if (memberId.startsWith("demo-")) {
      const member = DEMO_MEMBERS_MAP[memberId];
      if (!member) {
        throw new Error("Demo profile not found");
      }

      const plan = member.plan_id ? DEMO_PLANS[member.plan_id] : null;
      const attendance = DEMO_ATTENDANCE[memberId] || [];
      const payments = DEMO_PAYMENTS[memberId] || [];

      // Calculate days left
      let daysLeft = 0;
      if (member.plan_end_date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let endDateRaw = member.plan_end_date;
        if (endDateRaw && typeof endDateRaw === 'object' && 'toDate' in (endDateRaw as any)) {
          endDateRaw = (endDateRaw as any).toDate();
        }
        if (endDateRaw) {
          const endDate = new Date(endDateRaw as string | number | Date);
          endDate.setHours(0, 0, 0, 0);

          const diffTime = endDate.getTime() - today.getTime();
          daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (isNaN(daysLeft) || daysLeft < 0) daysLeft = 0;
        }
      }

      const attendanceThisMonth = attendance.length;
      const weeklyGoal = member.weekly_goal || 4;
      const today = new Date();
      const currentWeekStart = new Date(today);
      currentWeekStart.setDate(today.getDate() - today.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);

      const attendanceThisWeek = attendance.filter(att => {
        if (!att.date) return false;
        const attDate = new Date(att.date);
        return attDate >= currentWeekStart;
      }).length;

      const lastCheckIn = attendance.length > 0 ? attendance[0] : null;

      const totalPaidThisMonth = payments
        .filter(p => p.status === 'Paid')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const pendingDue = payments
        .filter(p => p.status !== 'Paid' && p.due_amount)
        .reduce((sum, p) => sum + Number(p.due_amount || 0), 0);

      return {
        member,
        plan,
        daysLeft,
        attendanceThisMonth,
        attendanceThisWeek,
        lastCheckIn,
        totalPaidThisMonth,
        pendingDue,
        weeklyGoal
      };
    }

    // 1. Fetch current Member
      console.log("[DEBUG] Fetching Member", memberId);
      const member = await this.getMemberById(memberId);
      if (!member) {
        throw new Error("Member profile not found");
      }
      console.log("[DEBUG] Member fetched:", member);

      // 2. Fetch Plan
      let plan: Plan | null = null;
      if (member.plan_id) {
        plan = await this.getPlan(member.plan_id);
      }
      console.log("[DEBUG] Plan fetched:", plan);

    // 3. Fetch Attendance
    const attendance = await this.getMyAttendance(memberId);

    // 4. Fetch Payments
    const payments = await this.getMyPayments(memberId);

    // Calculate days left
    let daysLeft = 0;
    if (member.plan_end_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let endDateRaw = member.plan_end_date;
      if (endDateRaw && typeof endDateRaw === 'object' && 'toDate' in (endDateRaw as any)) {
        endDateRaw = (endDateRaw as any).toDate();
      }
      if (endDateRaw) {
        const endDate = new Date(endDateRaw as string | number | Date);
        endDate.setHours(0, 0, 0, 0);

        const diffTime = endDate.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (isNaN(daysLeft) || daysLeft < 0) {
          daysLeft = 0;
        }
      }
    }

    // HOTFIX: If the plan name indicates 1 month, but daysLeft is excessively high (like 90 days), 
    // it means there was a data creation bug. Auto-correct it based on start date.
    if (plan && (plan.duration_months === 1 || plan.name?.toUpperCase().includes("1 MONTH")) && daysLeft > 35) {
       if (member.plan_start_date) {
         let startObj = member.plan_start_date;
         if (startObj && typeof startObj === 'object' && 'toDate' in (startObj as any)) {
            startObj = (startObj as any).toDate();
         }
         if (startObj) {
           const correctEnd = new Date(startObj as string | number | Date);
           correctEnd.setMonth(correctEnd.getMonth() + 1);
           correctEnd.setHours(0, 0, 0, 0);
           
           const today = new Date();
           today.setHours(0, 0, 0, 0);
           const diffTime = correctEnd.getTime() - today.getTime();
           daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
           if (isNaN(daysLeft) || daysLeft < 0) daysLeft = 0;

           // Visually patch the member record for this immediate session render
           member.plan_end_date = correctEnd.toISOString().split('T')[0];
           
           // Async write the fix back to firestore to repair the corrupt record
           this.updateMemberProfile(member.id, { plan_end_date: member.plan_end_date }).catch(() => {});
         }
       }
    }

    // Attendance this month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    const attendanceThisMonth = attendance.filter(att => {
      if (!att.date) return false;
      const attDate = new Date(att.date);
      return attDate.getFullYear() === currentYear && attDate.getMonth() === currentMonth;
    }).length;

    const weeklyGoal = member.weekly_goal || 4;
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    const attendanceThisWeek = attendance.filter(att => {
      if (!att.date) return false;
      const attDate = new Date(att.date);
      return attDate >= currentWeekStart;
    }).length;

    // Last check-in
    const lastCheckIn = attendance.length > 0 ? attendance[0] : null;

    // Total paid this month
    const totalPaidThisMonth = payments.reduce((sum, pay) => {
      if (!pay.payment_date || pay.status !== 'Paid') return sum;
      const payDate = new Date(pay.payment_date);
      const isThisMonth = payDate.getFullYear() === currentYear && payDate.getMonth() === currentMonth;
      return isThisMonth ? sum + Number(pay.amount || 0) : sum;
    }, 0);

    // Pending UI Balance Dues directly calculated from payments
    // Only fetch the FIRST latest pending invoice, as ERP pushes singleton invoices
    const latestPending = payments.find(pay => pay.status === 'Pending' || pay.status === 'Pending_Invoice' || pay.status === 'Partial');
    const pendingDue = latestPending ? Number(latestPending.due_amount ? latestPending.due_amount : latestPending.amount || 0) : 0;

    return {
      member,
      plan,
      daysLeft,
      attendanceThisMonth,
      attendanceThisWeek,
      lastCheckIn,
      totalPaidThisMonth,
      pendingDue,
      weeklyGoal
    };
  },

  /**
   * Fetch all available subscription packages from Firestore
   */
  async getAllPlans(): Promise<Plan[]> {
    try {
      const q = collection(db, 'plans');
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return Object.values(DEMO_PLANS);
      }
      const list: Plan[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Plan);
      });
      return list;
    } catch (err) {
      console.warn("Could not fetch database plans, returning demo fallback:", err);
      return Object.values(DEMO_PLANS);
    }
  },

  /**
   * Create a new member profile in Firestore
   */
  async createMemberProfile(memberData: Member): Promise<void> {
    try {
      const docRef = doc(db, 'members', memberData.id);
      await setDoc(docRef, memberData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${memberData.id}`);
    }
  },

  /**
   * Update fields inside a member's Firestore document
   */
  async updateMemberProfile(memberId: string, updates: Partial<Member>): Promise<void> {
    if (memberId.startsWith("demo-")) {
      const existing = DEMO_MEMBERS_MAP[memberId];
      if (existing) {
        DEMO_MEMBERS_MAP[memberId] = { ...existing, ...updates };
      }
      return;
    }
    try {
      const docRef = doc(db, 'members', memberId);
      await updateDoc(docRef, updates);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `members/${memberId}`);
    }
  },

  /**
   * Register a new punch-in attendance log in Firestore
   */
  async addAttendance(memberId: string, dateStr: string): Promise<void> {
    if (memberId.startsWith("demo-")) {
      const list = DEMO_ATTENDANCE[memberId] || [];
      const alreadyCheckedIn = list.some(att => att.date === dateStr);
      if (alreadyCheckedIn) {
        throw new Error("Already checked in today.");
      }
      const newId = `demo-att-${Date.now()}`;
      list.unshift({
        id: newId,
        member_id: memberId,
        date: dateStr,
        check_in_time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'Present'
      });
      DEMO_ATTENDANCE[memberId] = list;
      return;
    }

    try {
      const formattedDate = new Date().toISOString().substring(0, 10);
      const attCollection = collection(db, 'attendance');
      
      // Check for duplicate
      const q = query(
        attCollection, 
        where('member_id', '==', memberId),
        where('attendance_date', '==', formattedDate)
      );
      const existingSnap = await getDocs(q);
      if (!existingSnap.empty) {
        throw new Error("Already checked in today.");
      }

      const docRef = doc(attCollection);
      
      const attendanceDoc = {
        member_id: memberId,
        attendance_date: formattedDate,
        check_in_time: new Date().toISOString()
      };

      await setDoc(docRef, attendanceDoc);
    } catch (err: any) {
      if (err.message === "Already checked in today.") {
        throw err;
      }
      handleFirestoreError(err, OperationType.WRITE, `attendance`);
    }
  },

  /**
   * Update payment to Paid and set receipt document path
   */
  async updatePaymentAsPaid(paymentId: string, screenshotUrl: string): Promise<void> {
    if (paymentId.startsWith("demo-")) {
       console.log("Demo payment bypass", paymentId);
       return;
    }
    
    try {
      const docRef = doc(db, 'payments', paymentId);
      await updateDoc(docRef, {
        status: 'Paid',
        screenshot_url: screenshotUrl,
        payment_date: new Date().toISOString(),
        receipt_number: `RCPT-${Math.floor(100000 + Math.random() * 900000)}`
      });
    } catch (err) {
       handleFirestoreError(err, OperationType.WRITE, `payments/${paymentId}`);
    }
  }
};

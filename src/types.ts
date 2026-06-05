export interface Plan {
  id: string;
  name: string;
  price: number;
  duration_months?: number; // duration of the plan in months
  duration_days?: number; // or days
  created_at?: string;
  // any additional fields
}

export interface Member {
  id: string;
  user_id?: string; // Links to auth.users.id
  name: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  gender: string;
  age: number;
  address?: string;
  join_date: string;
  plan_id?: string;
  plan?: string;
  status: 'Active' | 'Expired' | string;
  plan_start_date?: string;
  plan_end_date?: string;
  created_at?: string;
  avatar_url?: string;
  weekly_goal?: number;
  start_weight?: number;
  current_weight?: number;
  target_weight?: number;
  fitness_goal?: string;
}

export interface Attendance {
  id: string;
  member_id: string;
  date: string;
  attendance_date?: string;
  check_in_time?: string;
  check_out_time?: string;
  status?: string;
  remarks?: string;
  created_at?: string;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  due_amount?: number;
  payment_mode: 'UPI' | 'Cash' | 'Bank' | string;
  payment_date: string;
  receipt_number?: string;
  status: 'Paid' | 'Pending' | 'Partial' | string;
  created_at?: string;
}

export interface Trainer {
  id: string;
  name: string;
  mobile: string;
  specialty?: string;
  salary?: number;
}

export interface Salary {
  id: string;
  trainer_id: string;
  amount: number;
  payment_date: string;
  status: string;
}

export interface PaymentRequest {
  id: string;
  member_id: string;
  amount: number;
  payment_mode: 'UPI' | 'Cash' | 'Bank' | string;
  transaction_id: string;
  screenshot_url?: string;
  status: 'Pending' | 'Verified' | 'Rejected' | string;
  requested_at: string;
  verified_at?: string;
  notes?: string;
}

export interface GlobalMessage {
  id: string;
  title: string;
  text?: string;
  message?: string;
  createdAt?: string;
}

export interface DashboardSummary {
  member: Member;
  plan: Plan | null;
  daysLeft: number;
  attendanceThisMonth: number;
  attendanceThisWeek: number;
  lastCheckIn: Attendance | null;
  totalPaidThisMonth: number;
  pendingDue: number;
  weeklyGoal: number;
}

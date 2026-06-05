import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { Plan, Member } from '../types';
import { Dumbbell, Lock, Mail, Eye, EyeOff, CheckCircle, ShieldCheck, Phone, ArrowRight, User, MapPin, Calendar, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface LoginViewProps {
  onLoginSuccess: () => void;
  onBypassLogin: (member: Member) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState<number>(25);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  // Load plans from database or demo on mount
  useEffect(() => {
    let active = true;
    userService.getAllPlans()
      .then(loadedPlans => {
        if (active) {
          setPlans(loadedPlans);
          if (loadedPlans.length > 0) {
            setSelectedPlanId(loadedPlans[0].id);
          }
        }
      })
      .catch(err => {
        console.warn("Failed to load plans:", err);
      });
    return () => { active = false; };
  }, []);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        // Enforce validation matching firestore rules
        if (!name.trim()) throw new Error("Full Name is required.");
        if (!mobile.trim()) throw new Error("WhatsApp contact number is required.");
        if (mobile.length < 10) throw new Error("Mobile number must be at least 10 digits.");
        if (!address.trim()) throw new Error("Residential Address is required.");
        if (age < 0 || age > 120) throw new Error("Please enter a valid age.");

        // 1. SignUp with Firebase Auth
        const user = await authService.signUp(email, password);
        if (!user) {
          throw new Error("Could not register user. Please check your credentials.");
        }

        // 2. Identify selected plan details
        const chosenPlan = plans.find(p => p.id === selectedPlanId);
        const planName = chosenPlan ? chosenPlan.name : "Custom Plan";
        const durationMonths = Number(chosenPlan?.duration_months) || 0;
        const durationDays = Number(chosenPlan?.duration_days) || 0;

        // 3. Compute Dates
        const today = new Date();
        const formatDateStr = (d: Date) => d.toISOString().split('T')[0];
        const joinDateStr = formatDateStr(today);

        const endDate = new Date();
        if (durationDays > 0) {
          endDate.setDate(endDate.getDate() + durationDays);
        } else {
          endDate.setMonth(endDate.getMonth() + (durationMonths > 0 ? durationMonths : 1));
        }
        const planEndDateStr = formatDateStr(endDate);

        // 4. Post member object to 'members' database
        const payload = {
          user_id: user.uid,
          name: name.trim(),
          mobile: mobile.trim(),
          whatsapp: mobile.trim(),
          email: email.trim(),
          address: address.trim(),
          gender,
          age: Number(age),
          plan_id: selectedPlanId,
          plan: planName,
          join_date: joinDateStr,
          plan_start_date: joinDateStr,
          plan_end_date: planEndDateStr,
          status: 'Pending Approval',
          created_at: new Date().toISOString()
        };

        await addDoc(collection(db, 'members'), payload);
        setSuccessMsg(`Your membership request has been submitted successfully! Welcome, ${name}.`);
        
        // Wait 2.5 seconds to show success flow, then trigger parent component's logged-in listener state
        setTimeout(() => {
          onLoginSuccess();
        }, 2200);

      } else {
        // Just standard Sign In
        if (!email.trim() || !password.trim()) {
          throw new Error("Please enter both email and password.");
        }
        await authService.signIn(email.trim(), password.trim());
        setSuccessMsg("Logged in successfully! Redirecting...");
        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Auth action failed:", err);
      let showErr = err.message || "An unexpected error occurred.";
      if (showErr.includes("auth/email-already-in-use")) {
        showErr = "This email is already registered. Please sign in instead.";
      } else if (showErr.includes("auth/weak-password")) {
        showErr = "The password is too weak. Please write a password with at least 6 characters.";
      } else if (showErr.includes("auth/invalid-credential") || showErr.includes("auth/wrong-password")) {
        showErr = "Invalid email credentials or password mismatch.";
      }
      setErrorMsg(showErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 min-h-[calc(100vh-4rem)] w-full font-sans" id="login-viewport">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/60 p-6 sm:p-10 text-center"
        id="login-card"
      >
        {/* Brand/Icons */}
        <div className="mb-6 text-center flex flex-col items-center" id="login-brand">
          <div className="relative mb-3 inline-flex items-center justify-center p-3.5 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30" id="brand-logo">
            <Dumbbell className="h-6 w-6 relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight" id="brand-text">
            GYM<span className="text-indigo-600 uppercase">PORTAL</span>
          </h2>
          <p className="mt-1 text-xs text-slate-400 font-mono" id="app-motto">
            MANAGE MEMBERSHIP & CHECK-IN PORTAL
          </p>
        </div>

        {/* Action Toggle Tab */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200/50 rounded-2xl mb-6" id="login-signup-toggle">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              !isSignUp
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="login-tab-btn"
          >
            Sign In Account
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              isSignUp
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            id="register-tab-btn"
          >
            Request Membership
          </button>
        </div>

        {/* Dynamic Status Notifications */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-start text-left gap-2 mb-4 font-mono leading-relaxed" 
              id="auth-error-alert"
            >
              <span className="font-extrabold shrink-0 block">❌ ERROR:</span>
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-start text-left gap-2 mb-4 font-sans font-medium" 
              id="auth-success-alert"
            >
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left" id="membership-auth-form">
          
          {/* Full Name field (Only on register) */}
          {isSignUp && (
            <div className="space-y-1.5" id="field-name-group">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="reg-name">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800"
                  placeholder="Enter full name"
                />
              </div>
            </div>
          )}

          {/* WhatsApp Contact Field (Only on register) */}
          {isSignUp && (
            <div className="space-y-1.5" id="field-whatsapp-group">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="reg-mobile">
                WhatsApp Contact Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Phone className="h-4 w-4" />
                </span>
                <input
                  id="reg-mobile"
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 15))}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-mono text-slate-800"
                  placeholder="e.g. 9876543210"
                />
              </div>
            </div>
          )}

          {/* Email field (Always) */}
          <div className="space-y-1.5" id="field-email-group">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="reg-email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800"
                placeholder="athletes@gymportal.com"
              />
            </div>
          </div>

          {/* Password field (Always) */}
          <div className="space-y-1.5" id="field-pass-group">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="reg-password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Age & Gender side-by-side (Only on register) */}
          {isSignUp && (
            <div className="grid grid-cols-2 gap-4" id="field-demographics-group">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="reg-age">
                  Age
                </label>
                <input
                  id="reg-age"
                  type="number"
                  required
                  min="5"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="reg-gender">
                  Gender
                </label>
                <select
                  id="reg-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Address field (Only on register) */}
          {isSignUp && (
            <div className="space-y-1.5" id="field-address-group">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="reg-address">
                Residential Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <input
                  id="reg-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800"
                  placeholder="Enter full address"
                />
              </div>
            </div>
          )}

          {/* Plan Selection Dropdown (Only on register) */}
          {isSignUp && (
            <div className="space-y-1.5" id="field-plan-dropdown">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="reg-plan">
                Plan Selection
              </label>
              <select
                id="reg-plan"
                required
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800 font-bold"
              >
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 mt-6 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10"
            id="auth-submit-btn"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                 <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg> Processing request...
              </span>
            ) : isSignUp ? (
              <>
                <span>Submit Request & Auth</span>
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-[10px] text-slate-400 font-mono" id="security-assurance">
          <ShieldCheck className="h-4.5 w-4.5 text-indigo-500" />
          <span>Real-time Secure Firebase Session Mapping</span>
        </div>
      </motion.div>
    </div>
  );
}

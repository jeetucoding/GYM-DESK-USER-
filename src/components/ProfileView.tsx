import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckSquare, 
  Save, 
  Info, 
  Sparkles, 
  Camera, 
  Lock, 
  Mail, 
  RefreshCw, 
  AlertTriangle, 
  KeyRound, 
  Check 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { userService } from '../services/userService';
import { authService } from '../services/authService';

interface ProfileViewProps {
  member: Member;
  onRefreshProfile: () => Promise<void>;
}

export default function ProfileView({ member, onRefreshProfile }: ProfileViewProps) {
  // Direct editable states
  const [name, setName] = useState(member.name || '');
  const [mobile, setMobile] = useState(member.mobile || '');
  const [address, setAddress] = useState(member.address || '');

  // Avatar states
  const [avatarUrl, setAvatarUrl] = useState(member.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Password reset states
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Operation notifications
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state if prop changes
  useEffect(() => {
    setName(member.name || '');
    setMobile(member.mobile || '');
    setAddress(member.address || '');
    setAvatarUrl(member.avatar_url || '');
  }, [member]);

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return 'Not configured';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (!name.trim()) throw new Error("Full Name cannot be empty.");
      if (!mobile.trim()) throw new Error("Mobile/WhatsApp contact number cannot be empty.");
      if (!address.trim()) throw new Error("Residential Address cannot be empty.");

      await userService.updateMemberProfile(member.id, {
        name: name.trim(),
        mobile: mobile.trim(),
        whatsapp: mobile.trim(),
        address: address.trim()
      });

      setSuccessMsg("Profile information updated successfully.");
      await onRefreshProfile();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error("Profile updates failed:", err);
      setErrorMsg(err.message || "Could not write profile updates safely.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setResetLoading(true);
    setResetSuccess(null);
    setResetError(null);

    const email = member.email || '';
    if (!email) {
      setResetError("No email address registered for this athlete.");
      setResetLoading(false);
      return;
    }

    try {
      if (member.id.startsWith('demo-')) {
        setTimeout(() => {
          setResetSuccess(`[DEMO] Reset email link simulated for ${email}!`);
          setResetLoading(false);
        }, 1200);
        return;
      }
      await authService.sendPasswordReset(email);
      setResetSuccess(`Password reset link dispatched to ${email}.`);
    } catch (err: any) {
      console.error("Password reset error:", err);
      setResetError(err.message || "Could not complete password reset.");
    } finally {
      if (!member.id.startsWith('demo-')) {
        setResetLoading(false);
      }
    }
  };

  const generateSignature = async (params: Record<string, string | number>, apiSecret: string) => {
    const sortedKeys = Object.keys(params).sort();
    const parameterString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    const stringToSign = parameterString + apiSecret;
    const utf8 = new TextEncoder().encode(stringToSign);
    const hashBuffer = await crypto.subtle.digest('SHA-1', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg("Please select a valid image file.");
      return;
    }

    setUploading(true);
    setErrorMsg(null);
    setUploadSuccess(null);

    try {
      const cloudinaryCloudName = 'dmyvdy0pq';
      const cloudinaryApiKey = '873674972212718';
      const cloudinaryApiSecret = 'wp9GXmW5P2F05D_PioLDVq5Ka-o';
      
      const url = `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`;
      const formData = new FormData();
      formData.append('file', file);

      const timestamp = Math.round(new Date().getTime() / 1000).toString();
      const signature = await generateSignature({ timestamp }, cloudinaryApiSecret);
      
      formData.append('api_key', cloudinaryApiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);

      const response = await fetch(url, { method: 'POST', body: formData });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Cloudinary image upload failed.");
      }

      const imageUrl = result.secure_url || result.url;
      if (!imageUrl) throw new Error("No image URL returned from upload response.");

      await userService.updateMemberProfile(member.id, { avatar_url: imageUrl });
      setAvatarUrl(imageUrl);
      setUploadSuccess("Profile photo updated successfully!");
      await onRefreshProfile();
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (err: any) {
      console.error("Cloudinary upload failed:", err);
      setErrorMsg(err.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-6 font-sans text-left"
    >
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
        
        <div className="relative group shrink-0">
          <label htmlFor="direct-photo-picker-hero" className={`w-24 h-24 rounded-full bg-slate-800 text-slate-300 font-bold text-2xl uppercase tracking-wider flex items-center justify-center shadow-lg shadow-indigo-600/10 overflow-hidden relative cursor-pointer border-4 border-slate-800 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? (
              <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin" />
            ) : avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
            ) : name ? (
              name.substring(0, 2)
            ) : (
              <User className="h-8 w-8" />
            )}
            
            {!uploading && (
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                <Camera className="h-5 w-5 text-indigo-300" />
              </div>
            )}
          </label>
          <input 
            id="direct-photo-picker-hero"
            type="file" 
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
            className="hidden"
            disabled={uploading}
          />
        </div>

        <div className="text-center sm:text-left flex-1 z-10">
          <p className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-black">Official Profile</p>
          <h2 className="text-2xl font-black tracking-tight block mt-0.5 uppercase">{member.name || 'Athlete'}</h2>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs font-mono text-slate-400">
            <span>UID: {member.id.substring(0, 8).toUpperCase()}</span>
            <span>•</span>
            <span className="capitalize">{member.gender || 'Active'}</span>
            <span>•</span>
            <span>Age: {member.age}</span>
          </div>
        </div>

        <div className="px-5 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5 text-center z-10">
          <span className="text-[9px] block uppercase font-mono tracking-widest text-indigo-300 font-bold leading-none">Membership</span>
          <span className="text-sm font-bold font-mono text-emerald-400 block mt-1.5 uppercase">{member.status || 'Active'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 shrink-0" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">Base Configuration</h3>
                  <p className="text-[10px] text-slate-400 font-mono">Modifications write directly to your database</p>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl mb-4 font-mono">
                  <span>❌ ERROR: {errorMsg}</span>
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl mb-4 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}
              {uploadSuccess && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl mb-4 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span>{uploadSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="edit-name">Full Athlete Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><User className="h-4 w-4" /></span>
                  <input id="edit-name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800" placeholder="Enter full name" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="edit-email">Account Email</label>
                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" /> Locked</span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail className="h-4 w-4" /></span>
                  <input id="edit-email" type="email" disabled value={member.email || 'No email registered'} className="w-full pl-9 pr-4 py-2 bg-slate-100/80 border border-slate-200 rounded-xl text-sm transition-all text-slate-500 cursor-not-allowed font-sans font-medium" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="edit-mobile">WhatsApp / Contact Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Phone className="h-4 w-4" /></span>
                  <input id="edit-mobile" type="text" required value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-mono text-slate-800" placeholder="e.g. 9876543210" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block" htmlFor="edit-address">Residential Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><MapPin className="h-4 w-4" /></span>
                  <input id="edit-address" type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-600 transition-all font-sans text-slate-800" placeholder="Street and City address" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full px-6 py-2.5 bg-slate-900 border border-slate-800 hover:bg-black disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin text-indigo-200" /> : <Save className="h-4 w-4 text-indigo-400" />}
                <span>Save Profile Updates</span>
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase flex items-center gap-2">
                <KeyRound className="h-4.5 w-4.5 text-indigo-500" />
                Auth Credentials
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {resetError && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-rose-50 border border-rose-150 text-rose-800 text-xs rounded-xl font-mono leading-relaxed">
                  <AlertTriangle className="h-4 w-4 inline shrink-0 mr-1.5 -mt-0.5" /><span>{resetError}</span>
                </motion.div>
              )}
              {resetSuccess && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                  <CheckSquare className="h-4.5 w-4.5 mt-0.5 shrink-0" /><span>{resetSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-xl bg-slate-50 border border-slate-150 p-4 text-xs font-sans text-slate-600 space-y-2">
              <span className="font-semibold block">Password Reset</span>
              <span>Sends a secure verification link to <strong className="text-slate-800 font-mono">{member.email || 'your email'}</strong> to establish a new password.</span>
            </div>

            <button onClick={handlePasswordReset} disabled={resetLoading} className="w-full px-5 py-2.5 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer">
              {resetLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-4 w-4 text-slate-400" />}
              <span>Dispatch Reset Link</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 space-y-4 h-fit">
          <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 leading-none">ReadOnly Analytics</p>
          <div className="pt-2 space-y-4 text-left">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Assigned Plan ID</span>
              <span className="text-xs font-semibold text-slate-700 block mt-0.5">{member.plan_id || 'unassigned'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Gym Joining Date</span>
              <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-slate-700">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>{formatDateStr(member.join_date)}</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 block">Billing Account Email</span>
              <span className="text-xs font-semibold text-slate-700 block mt-0.5 truncate">{member.email || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

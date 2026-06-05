import { Member, Plan } from '../types';
import { Award, Calendar, DollarSign, Clock, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface PlanViewProps {
  member: Member;
  plan: Plan | null;
  daysLeft: number;
  onNavigate: (route: string) => void;
}

export default function PlanView({ member, plan, daysLeft, onNavigate }: PlanViewProps) {
  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return 'Not configured';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isRenewalRequired = daysLeft <= 7;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto space-y-6"
      id="plan-view"
    >
      {/* Plan Header Card */}
      <div className="bg-gradient-to-tr from-orange-500 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden" id="plan-header-card">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -mr-12 -mt-12" />
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6" id="plan-header-inner">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-mono tracking-widest text-orange-200 uppercase font-black">Current Subscribed Tier</span>
            <h2 className="text-3xl font-black tracking-tight mt-0.5 uppercase">{plan?.name || 'No Plan Subscribed'}</h2>
            <p className="text-orange-100 font-mono text-xs mt-1">Status: Active & Registered Member</p>
          </div>
          <div className="px-5 py-3 h-20 flex flex-col justify-center bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-center" id="plan-badge">
            <span className="text-[9px] uppercase font-mono text-orange-200">Total Price</span>
            <span className="text-xl font-black font-sans mt-0.5">₹{plan?.price ? plan?.price.toLocaleString('en-IN') : '0'}</span>
          </div>
        </div>
      </div>

      {/* Expiry Alerts & Bulletins */}
      {isRenewalRequired && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900" id="plan-warning">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs" id="plan-warning-content">
            <p className="font-bold">⚠️ Renewal Period Initiated</p>
            <p className="text-amber-700 mt-1">Your current subscription is scheduled to lapse in {daysLeft} days. Click the button below or contact front desk to submit your receipt verification.</p>
            <button 
              onClick={() => onNavigate('pay-now')}
              className="mt-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-[11px] font-bold rounded-lg tracking-tight font-sans cursor-pointer flex items-center gap-1.5"
              id="plan-warning-action"
            >
              <RefreshCw className="h-3 w-3" /> Initiate Renewal Now
            </button>
          </div>
        </div>
      )}

      {/* Plan Details Checklist */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-6" id="plan-details-card">
        <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-extrabold block border-b border-gray-50 pb-3">Membership Schedule & Validity parameters</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="plan-details-grid">
          {/* Item 1 */}
          <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center gap-4" id="plan-item-duration">
            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl" id="plan-duration-box">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-semibold">Plan Duration</span>
              <span className="text-sm font-sans font-extrabold text-gray-800 block mt-0.5 uppercase">
                {plan?.duration_months ? `${plan.duration_months} Months` : plan?.duration_days ? `${plan.duration_days} Days` : '1 Month'}
              </span>
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center gap-4" id="plan-item-price">
            <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl" id="plan-price-box">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-semibold">Calculated Cost</span>
              <span className="text-sm font-sans font-extrabold text-gray-800 block mt-0.5 font-mono">
                ₹{plan?.price ? plan.price.toLocaleString('en-IN') : '0.00'}
              </span>
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center gap-4" id="plan-item-start">
            <div className="p-2.5 bg-emerald-50 text-emerald-500 rounded-xl" id="plan-start-box">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-semibold">Activation Timestamp</span>
              <span className="text-sm font-sans font-extrabold text-gray-800 block mt-0.5">
                {formatDateStr(member.plan_start_date)}
              </span>
            </div>
          </div>

          {/* Item 4 */}
          <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100 flex items-center gap-4" id="plan-item-end">
            <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl" id="plan-end-box">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-semibold">Schedule Expiration</span>
              <span className="text-sm font-sans font-extrabold text-gray-800 block mt-0.5">
                {formatDateStr(member.plan_end_date)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4" id="plan-action-bar">
          <div className="flex items-center gap-2" id="plan-badge-footer">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-gray-800">Secure Active Profile</p>
              <p className="text-[10px] text-gray-500 font-mono">Your plan features are verified via gym registry logs.</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => onNavigate('pay-now')}
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            id="plan-action-btn"
          >
            Declare Renewal Payment
          </button>
        </div>
      </div>
    </motion.div>
  );
}

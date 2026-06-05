import React, { useState } from 'react';
import { Member } from '../types';
import { MessageSquare, Phone, Mail, HelpCircle, ChevronDown, ChevronUp, Sparkles, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportViewProps {
  member: Member;
}

export default function SupportView({ member }: SupportViewProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [msgTitle, setMsgTitle] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [successNotif, setSuccessNotif] = useState('');

  const faqs = [
    {
      q: "How to check in when entering the gym room?",
      a: "Present your personal QR code or contact the desk manager to verify your active attendance record. The desk manager scans and registers timestamps directly into Supabase."
    },
    {
      q: "My payment has went through but membership status is Expired?",
      a: "All online UPI or credit transfers must be verified manually by the gym accountant. File a payment declaration check using the 'Pay Now' menu. Verification usually completes within 1-2 hours."
    },
    {
      q: "How can I change my membership plan?",
      a: "Changing active plans requires direct front desk approval. Visit the reception counter or file a help query down below with your requested plan details."
    },
    {
      q: "Is there any lockdown freeze period available?",
      a: "Yes, members can pause their active subscriptions for up to 14 days annually in case of emergencies or medical concerns. Please contact the senior trainer for assistance."
    }
  ];

  const handleSendHelpTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgTitle.trim() || !msgBody.trim()) return;

    setSuccessNotif('Your premium support ticket has been received! Our front desk manager will respond shortly via Whatsapp or call.');
    setMsgTitle('');
    setMsgBody('');
    setTimeout(() => {
      setSuccessNotif('');
    }, 6000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-6"
      id="support-view"
    >
      {/* Header card banner */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm" id="support-header">
        <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" id="support-lead-icon">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div className="text-center md:text-left flex-1" id="support-lead-titles">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight uppercase">Help desk & Support channels</h2>
          <p className="text-xs text-gray-500 leading-relaxed mt-1 font-mono">
            Have questions regarding payment verifications, subscription suspensions, or active workout sessions? Connect with our crew.
          </p>
        </div>
        <div className="px-4 py-2 bg-orange-50 text-orange-700 font-mono text-[11px] font-bold rounded-xl border border-orange-100 uppercase" id="support-tag">
          Direct Line
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="support-grid-layout">
        {/* Contact info and FAQs */}
        <div className="md:col-span-7 space-y-6" id="support-faq-box">
          {/* Quick contact list */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm" id="support-contact-list">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-extrabold mb-4 block">Primary Contact details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="support-channels">
              <a 
                href="tel:+919876543210" 
                className="p-3 bg-gray-50 hover:bg-orange-50/50 border border-gray-100 hover:border-orange-200 transition-all rounded-2xl text-left block group"
                id="support-call-link"
              >
                <div className="flex items-center gap-2.5 text-gray-900 group-hover:text-orange-600 transition-colors">
                  <Phone className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-bold font-sans">Front Gate Desk</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">+91-98765-43210</p>
              </a>

              <a 
                href="mailto:support@gymdesk.co" 
                className="p-3 bg-gray-50 hover:bg-orange-50/50 border border-gray-100 hover:border-orange-200 transition-all rounded-2xl text-left block group"
                id="support-mail-link"
              >
                <div className="flex items-center gap-2.5 text-gray-900 group-hover:text-orange-600 transition-colors">
                  <Mail className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-bold font-sans">Email Dispatcher</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">support@gymdesk.co</p>
              </a>
            </div>
          </div>

          {/* FAQ Accordion container */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm" id="support-faq-accordion">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-extrabold mb-4 block">Frequently Asked Questions</h3>
            <div className="space-y-2" id="faqs-list">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index;
                return (
                  <div key={index} className="border border-gray-50 rounded-2xl overflow-hidden bg-gray-50/30" id={`faq-${index}`}>
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors focus:outline-none"
                      id={`faq-btn-${index}`}
                    >
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-2">
                        <HelpCircle className="h-4.5 w-4.5 text-orange-500 shrink-0" />
                        {faq.q}
                      </span>
                      {isOpen ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                    </button>
                    
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                          id={`faq-ans-wrapper-${index}`}
                        >
                          <p className="px-4 pb-4 pt-1 text-xs text-gray-500 leading-relaxed font-mono border-t border-gray-50">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right side: Quick Support Request Ticket */}
        <div className="md:col-span-5 bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col" id="support-ticket-form">
          <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 font-extrabold mb-3 block">Query Ticket Form</h3>
          <p className="text-[11px] text-gray-400 font-mono leading-relaxed mb-4">File custom help requests directly from your device.</p>

          {successNotif && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] rounded-xl flex items-start gap-2 mb-4 font-mono leading-relaxed" id="ticket-success">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{successNotif}</span>
            </div>
          )}

          <form onSubmit={handleSendHelpTicket} className="space-y-4 flex-1 flex flex-col" id="ticket-form flex-1">
            <div className="space-y-1.5" id="ticket-title-group">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block" htmlFor="ticket-title-input">
                Regarding Category
              </label>
              <input
                id="ticket-title-input"
                type="text"
                required
                placeholder="e.g. UPI Verification / Plan Freeze"
                value={msgTitle}
                onChange={(e) => setMsgTitle(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-orange-500"
              />
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col" id="ticket-memo-group">
              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 block" htmlFor="ticket-msg-textarea">
                Describe details
              </label>
              <textarea
                id="ticket-msg-textarea"
                required
                rows={4}
                placeholder="Describe your query or feedback message here..."
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-orange-500 flex-1 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 active:scale-95 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer mt-4"
              id="ticket-submit-btn"
            >
              <Sparkles className="h-4 w-4 text-orange-400" /> Submit Help Query
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

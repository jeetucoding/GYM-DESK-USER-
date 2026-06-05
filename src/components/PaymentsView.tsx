import { useState } from 'react';
import { Payment } from '../types';
import { CreditCard, DollarSign, Receipt, Clock, CheckCircle, XCircle, Info, Calendar, Printer, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PaymentsViewProps {
  payments: Payment[];
  onNavigate: (route: string) => void;
}

export default function PaymentsView({ payments, onNavigate }: PaymentsViewProps) {
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [successPrintMsg, setSuccessPrintMsg] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Payment | null>(null);

  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPaid = payments
    .filter(p => p.status === 'Paid')
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);

  const latestPending = payments.find(p => p.status === 'Pending' || p.status === 'Pending_Invoice' || p.status === 'Partial');
  const totalOutstanding = latestPending ? Number(latestPending.due_amount ? latestPending.due_amount : (latestPending.amount ?? 0)) : 0;

  const handlePrintReceipt = async (payment: Payment) => {
    setPrintingId(payment.id);
    setSelectedInvoice(payment);
    
    setTimeout(async () => {
      try {
        const receiptElement = document.getElementById('printable-receipt');
        if (receiptElement) {
          const canvas = await html2canvas(receiptElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          
          const receiptNo = payment.receipt_number?.trim() || `RCPT-${payment.id.substring(0, 6).toUpperCase()}`;
          pdf.save(`${receiptNo}.pdf`);
          
          setSuccessPrintMsg(`Downloaded ${receiptNo}.pdf successfully`);
          setTimeout(() => setSuccessPrintMsg(null), 4000);
        }
      } catch (error) {
        console.error("Error generating PDF", error);
      } finally {
        setPrintingId(null);
      }
    }, 300);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto space-y-6 font-sans text-left"
      id="payments-view"
    >
      {/* Off-screen Printable Receipt for PDF Generation */}
      <div className="fixed top-0 left-[-9999px] z-[-50]">
        <div id="printable-receipt" className="w-[800px] bg-white text-black font-sans p-12 shrink-0">
          {selectedInvoice && (
            <div className="max-w-3xl mx-auto border-2 border-slate-900 p-10 rounded-2xl relative">
              <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-slate-200">
                <div>
                  <h1 className="text-4xl font-black uppercase tracking-widest text-slate-900 mb-2">GYMDESK</h1>
                  <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Digital Payment Receipt</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">Receipt No</p>
                  <p className="text-xl font-black text-slate-900 font-mono tracking-wider">
                    {selectedInvoice.receipt_number?.trim() ? selectedInvoice.receipt_number : `RCPT-${selectedInvoice.id.substring(0, 6).toUpperCase()}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-10 mb-12">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Date Issued</p>
                  <p className="text-lg font-bold text-slate-800">{formatDateStr(selectedInvoice.payment_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Payment Method</p>
                  <p className="text-lg font-bold text-slate-800">{selectedInvoice.payment_mode || 'Cash'}</p>
                </div>
              </div>

              <table className="w-full text-left mb-12 border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-sm font-black uppercase tracking-widest text-slate-400">
                    <th className="py-4">Description</th>
                    <th className="py-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="text-lg divide-y divide-slate-100">
                  <tr>
                    <td className="py-6 font-bold text-slate-800">Membership Fee / Renewal</td>
                    <td className="py-6 text-right font-black text-slate-900">₹{selectedInvoice.amount?.toLocaleString('en-IN') || '0'}</td>
                  </tr>
                  {(selectedInvoice.due_amount && selectedInvoice.due_amount > 0) ? (
                    <tr>
                      <td className="py-6 text-slate-500 font-bold">Pending Dues Remaining</td>
                      <td className="py-6 text-right font-black text-slate-500">₹{Number(selectedInvoice.due_amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="flex justify-between items-center pt-8 border-t-2 border-slate-900">
                <div className="text-sm font-bold uppercase tracking-widest text-slate-400">Total Paid</div>
                <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">₹{selectedInvoice.amount?.toLocaleString('en-IN') || '0'}</div>
              </div>

              <div className="mt-24 pt-8 border-t border-slate-200 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Thank you for your business. This is an electronically generated receipt.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="print:hidden space-y-6">
        {/* Dynamic printer notification */}
        <AnimatePresence>
        {successPrintMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs rounded-2xl flex items-center gap-2.5 font-medium shadow-sm font-sans"
            id="print-notification"
          >
            <Printer className="h-4 w-4 text-indigo-600 shrink-0 animate-bounce" />
            <span>{successPrintMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Financial aggregate header row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="payments-metric-grid">
        {/* Stat Box Paid */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="pay-stat-paid">
          <div className="flex items-center gap-4" id="pay-stat-paid-lead">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl" id="pay-stat-emerald-box">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Aggregated Total Paid</span>
              <span className="text-2xl font-black text-slate-800 block font-mono mt-0.5">₹{totalPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[10px]">Zero Dues</span>
        </div>

        {/* Stat Box Dues */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex items-center justify-between" id="pay-stat-outstanding">
          <div className="flex items-center gap-4" id="pay-stat-outstanding-lead">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl" id="pay-stat-red-box">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Pending Due Balance</span>
              <span className="text-2xl font-black text-rose-600 block font-mono mt-0.5">₹{totalOutstanding.toLocaleString('en-IN')}</span>
            </div>
          </div>
          {totalOutstanding > 0 ? (
            <button
              onClick={() => onNavigate('pay-now')}
              className="text-xs font-sans font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 px-4.5 py-2 rounded-xl transition-all cursor-pointer"
              id="pay-unpaid-action-btn"
            >
              Pay Now
            </button>
          ) : (
            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase">Clear</span>
          )}
        </div>
      </div>

      {/* Receipts listing */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm" id="payments-history-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">Payment History Receipts</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Summary ledger of past membership invoices</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/40 rounded-lg text-[10px] font-mono text-slate-500">
            <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            Accounting Records Audited
          </div>
        </div>

        {selectedInvoice ? (
          <div className="animate-fade-in">
            <button 
              onClick={() => setSelectedInvoice(null)}
              className="mb-6 flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition uppercase tracking-widest"
            >
              <ArrowLeft className="h-4 w-4" /> Back to History
            </button>
            <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 sm:p-10 font-mono text-slate-800 max-w-2xl mx-auto shadow-inner">
              <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 mb-1">Invoice / Receipt</h2>
                  <p className="text-xs text-slate-500 font-medium tracking-widest">
                    #{selectedInvoice.receipt_number && selectedInvoice.receipt_number.trim() ? selectedInvoice.receipt_number : `RCPT-${selectedInvoice.id.substring(0, 6).toUpperCase()}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Date Issued</p>
                  <p className="text-sm font-semibold">{formatDateStr(selectedInvoice.payment_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Billed To</p>
                  <p className="font-semibold text-sm">Gym Member</p>
                  <p className="text-xs text-slate-500 mt-1">Payment via {selectedInvoice.payment_mode || 'Cash'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Status</p>
                  {selectedInvoice.status === 'Paid' ? (
                    <span className="inline-flex px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md text-xs font-black tracking-widest uppercase">
                      VERIFIED PAID
                    </span>
                  ) : selectedInvoice.status === 'Partial' ? (
                    <span className="inline-flex px-3 py-1 bg-amber-100 text-amber-800 rounded-md text-xs font-black tracking-widest uppercase">
                      PARTIAL PAYMENT
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 bg-rose-100 text-rose-800 rounded-md text-xs font-black tracking-widest uppercase">
                      UNPAID / PENDING
                    </span>
                  )}
                </div>
              </div>

              <table className="w-full text-left border-collapse mb-8">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  <tr>
                    <td className="py-4 font-semibold text-slate-700">Membership Fee / Renewal</td>
                    <td className="py-4 text-right font-black">₹{selectedInvoice.amount?.toLocaleString('en-IN') || '0'}</td>
                  </tr>
                  {(selectedInvoice.due_amount && selectedInvoice.due_amount > 0) ? (
                    <tr>
                      <td className="py-3 text-rose-600 font-bold text-xs uppercase tracking-widest">Pending Dues Remaining</td>
                      <td className="py-3 text-right text-rose-600 font-black">₹{Number(selectedInvoice.due_amount).toLocaleString('en-IN')}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={() => handlePrintReceipt(selectedInvoice)}
                  disabled={printingId === selectedInvoice.id}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" /> Download PDF / Print
                </button>
              </div>
            </div>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-slate-400" id="payments-empty-state">
            <Receipt className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No payment records found</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 font-mono">You do not have any historical transactions. When you register a payment with the administrative desk, the records will sync dynamically here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto" id="payments-table-wrapper">
            <table className="w-full text-left border-collapse" id="payments-table">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold" id="payments-table-header">
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-4">Paid Date</th>
                  <th className="py-3 px-4">Class Mode</th>
                  <th className="py-3 px-4 text-right">Dues Outstanding</th>
                  <th className="py-3 px-4 text-right">Amount Raw</th>
                  <th className="py-3 px-4 text-right">Status</th>
                  <th className="py-3 px-4 text-center">Receipts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 animate-fade-in" id="payments-table-body">
                {payments.map((p) => {
                  const isCurrentPrinting = printingId === p.id;
                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => setSelectedInvoice(p)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer" 
                      id={`payments-row-${p.id}`}
                    >
                      {/* Invoice ID / receipt */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-900" id={`payments-cell-receipt-${p.id}`}>
                        {p.receipt_number && p.receipt_number.trim() ? p.receipt_number : `RCPT-${p.id ? p.id.substring(0, 6).toUpperCase() : 'AUTO'}`}
                      </td>
                      
                      {/* Date */}
                      <td className="py-4 px-4 font-semibold text-slate-800" id={`payments-cell-date-${p.id}`}>
                        <div className="flex items-center gap-1.5 font-sans">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {formatDateStr(p.payment_date)}
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-4 px-4 font-mono text-slate-500 uppercase font-medium" id={`payments-cell-mode-${p.id}`}>
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200/50 rounded-md text-[10px] font-bold">
                          {p.payment_mode || 'Cash'}
                        </span>
                      </td>

                      {/* Due Amount */}
                      <td className="py-4 px-4 text-right font-mono text-slate-500" id={`payments-cell-due-${p.id}`}>
                        {['Pending', 'Pending_Invoice', 'Partial'].includes(p.status || '') ? (
                          <span className="text-rose-600 font-extrabold font-mono">₹{Number(p.due_amount ? p.due_amount : (p.amount || 0)).toLocaleString('en-IN')}</span>
                        ) : (p.due_amount && p.due_amount > 0) ? (
                          <span className="text-rose-600 font-extrabold font-mono">₹{Number(p.due_amount).toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-slate-400 font-mono">₹0</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-4 text-right font-mono font-black text-slate-800" id={`payments-cell-amount-${p.id}`}>
                        ₹{p.amount ? p.amount.toLocaleString('en-IN') : '0'}
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-4 text-right" id={`payments-cell-status-${p.id}`}>
                        {p.status === 'Paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                            VERIFIED
                          </span>
                        ) : p.status === 'Partial' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                            PARTIAL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-rose-50 text-rose-700 border border-rose-100">
                            UNPAID
                          </span>
                        )}
                      </td>

                      {/* Print Receipt button */}
                      <td className="py-4 px-4 text-center" id={`payments-cell-print-${p.id}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintReceipt(p);
                          }}
                          disabled={isCurrentPrinting}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-all inline-flex items-center justify-center cursor-pointer disabled:opacity-40"
                          title="Print Receipt Bill"
                          id={`print-btn-${p.id}`}
                        >
                          {isCurrentPrinting ? (
                            <svg className="animate-spin h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
}

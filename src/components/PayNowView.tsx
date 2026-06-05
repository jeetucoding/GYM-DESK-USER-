import React, { useState } from 'react';
import { Member, Payment } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import { Wallet, Send, CheckCircle2, AlertTriangle, UploadCloud } from 'lucide-react';
import { motion } from 'motion/react';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { userService } from '../services/userService';

interface PayNowViewProps {
  member: Member;
  payments: Payment[];
  onPaymentSuccess?: () => void;
}

export default function PayNowView({ member, payments, onPaymentSuccess }: PayNowViewProps) {
  const [errorStatus, setErrorStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Find the first pending or partial payment. In a real app we might allow them to select.
  const pendingPayment = payments.find(p => p.status === 'Pending' || p.status === 'Pending_Invoice' || p.status === 'Partial');
  const invoiceAmount = pendingPayment ? (pendingPayment.due_amount || pendingPayment.amount) : 0;

  // The generated UPI string format must be: upi://pay?pa=8853921178@ptyes&pn=GymPayment&am={invoiceAmount}&cu=INR.
  const upiString = `upi://pay?pa=8853921178@ptyes&pn=GymPayment&am=${invoiceAmount}&cu=INR`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const generatePDFReceipt = (payment: Payment, txId: string) => {
    const doc = new jsPDF();
    
    // Aesthetic minimalistic styling without external fonts
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('GYM PORTAL', 15, 20);

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    doc.text('PAYMENT RECEIPT', 15, 45);

    doc.setFontSize(10);
    doc.text(`Receipt ID: RCPT-${Math.floor(100000 + Math.random() * 900000)}`, 15, 60);
    doc.text(`Date of Payment: ${new Date().toLocaleDateString()}`, 15, 66);
    doc.text(`Linked Member: ${member.name}`, 15, 72);
    doc.text(`Email Address: ${member.email || 'N/A'}`, 15, 78);
    
    // Receipt Summary
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 90, 195, 90);
    
    doc.setFontSize(11);
    doc.text('Description', 15, 100);
    doc.text('Amount Paid', 160, 100);
    
    doc.setFontSize(10);
    doc.text('Membership Dues Clearance', 15, 110);
    doc.text(`INR ${invoiceAmount.toLocaleString('en-IN')}.00`, 160, 110);
    
    doc.line(15, 120, 195, 120);

    // Final Footer
    doc.text(`Payment Screenshot Verified / Transaction ID: ${txId}`, 15, 135);
    doc.setFontSize(8);
    doc.text('Electronically generated receipt. Standard T&C applies.', 15, 280);

    doc.save(`Gym_Receipt_${member.name.replace(/\s+/g, '_')}.pdf`);
  };

  const handleUploadAndPay = async () => {
    if (!pendingPayment) {
      setErrorStatus("No pending payments found.");
      return;
    }
    if (!selectedFile) {
      setErrorStatus("Please attach a screenshot of your successful UPI transaction.");
      return;
    }

    setLoading(true);
    setErrorStatus("");
    setUploadProgress(0);

    try {
      // 1. Upload to Firebase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `payments/${member.id}/${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Storage error:", error);
          setErrorStatus("Failed to upload screenshot. Please make sure Firebase Storage is initialized.");
          setLoading(false);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // 2. Update Database Record instantly to 'Paid'
            await userService.updatePaymentAsPaid(pendingPayment.id, downloadUrl);
            
            // 3. Generate PDF Receipt
            generatePDFReceipt(pendingPayment, `UPI-${Date.now().toString().substring(5)}`);
            
            if (onPaymentSuccess) onPaymentSuccess();
          } catch (e: any) {
            setErrorStatus(`Error finalizing payment: ${e.message}`);
          } finally {
            setLoading(false);
          }
        }
      );
    } catch (err: any) {
      console.error(err);
      setErrorStatus("Error connecting to upload servers.");
      setLoading(false);
    }
  };

  if (!pendingPayment || invoiceAmount <= 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-gray-100 rounded-3xl mt-12 text-center" id="pay-none-pending">
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-3" />
        <h3 className="text-sm text-slate-800 font-bold uppercase tracking-widest font-mono">No Outstanding Dues</h3>
        <p className="text-xs text-slate-500 mt-2 font-sans max-w-sm">All membership payments are clear. You do not have any invoices pending at this time.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto space-y-6"
      id="pay-now-view"
    >
      <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6" id="pay-header-banner">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner" id="pay-lead-icon">
          <Wallet className="h-6 w-6" />
        </div>
        <div className="text-center md:text-left flex-1" id="pay-lead-titles">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight uppercase">Dynamic UPI Secure Payment</h2>
          <p className="text-xs text-gray-500 leading-relaxed mt-1 font-mono">
            Scan the QR code below through PhonePe, Google Pay, or Paytm. Ensure you upload the exact screenshot verification here.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm flex flex-col items-center space-y-6 text-center" id="pay-decl-form-wrapper">
        <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-2 font-mono border-b border-gray-200 pb-2 border-dashed">
          ₹ {invoiceAmount.toLocaleString('en-IN')}
        </h3>

        <div className="p-4 bg-white border-4 border-indigo-50 rounded-3xl shadow-sm inline-block">
          <QRCodeSVG 
            value={upiString} 
            size={180} 
            level={"H"} 
            includeMargin={true}
            fgColor="#1e293b"
          />
        </div>

        <p className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-bold max-w-xs">
          Scan QR Code using any UPI App
        </p>

        {errorStatus && (
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 w-full font-mono text-left">
            <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <p className="font-bold">{errorStatus}</p>
          </div>
        )}

        <div className="w-full text-left space-y-2 pt-4 border-t border-slate-100 mt-4">
          <label className="text-xs font-mono font-bold uppercase tracking-wider text-gray-800 block text-center" htmlFor="payment-screenshot">
            Upload Payment Screenshot
          </label>
          <div className="relative">
             <input
                id="payment-screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer text-center bg-slate-50 rounded-xl"
             />
          </div>
        </div>

        <button
          onClick={handleUploadAndPay}
          disabled={loading || !selectedFile}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs shadow-md tracking-widest transition-all uppercase flex items-center justify-center gap-2 cursor-pointer mt-6 disabled:opacity-50"
          id="pay-submit-form-btn"
        >
          {loading ? (
             <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading {Math.round(uploadProgress)}%
             </span>
          ) : (
            <span className="flex items-center gap-1 font-mono tracking-widest text-[#fff] font-black"><UploadCloud className="h-4 w-4" /> Verify Upload & Generate Receipt</span>
          )}
        </button>
      </div>
    </motion.div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Paperclip, X } from 'lucide-react';
import { Member } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // Add base64 image field
}

interface AiChatViewProps {
  member: Member;
  attendance?: any[];
  payments?: any[];
  dashboardSummary?: any;
  currentPlan?: any;
}

export default function AiChatView({ member, attendance, payments, dashboardSummary, currentPlan }: AiChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Namaste ${member.name.split(' ')[0]}! Main aapka personal digital coach hoon. Aap diet, workouts, health, ya body pain ke baare me mujhse pooch sakte hain. Aaiye, shuru karein!` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{data: string, mimeType: string} | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, selectedImage]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please select an image under 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      // Extract mime type and base64 data
      const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        setSelectedImage({
          data: matches[2],
          mimeType: matches[1]
        });
      }
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && !selectedImage) return;

    const userMessage: Message = { 
      role: 'user', 
      text: trimmed,
      image: selectedImage ? `data:${selectedImage.mimeType};base64,${selectedImage.data}` : undefined
    };
    
    // Create history (just texts)
    const chatHistory = [...messages.slice(1)].map(msg => ({ role: msg.role, text: msg.text }));

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: trimmed, 
          history: chatHistory,
          image: imageToSend ? { inlineData: imageToSend } : undefined,
          context: {
            member,
            attendance,
            payments,
            dashboardSummary,
            currentPlan
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'model', text: 'Sorry, I am facing a network issue right now. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col absolute inset-0 bg-slate-50 border-0 md:rounded-3xl md:border border-slate-200 overflow-hidden shadow-none md:shadow-sm" id="ai-chat-view">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-20 shrink-0 shadow-sm">
        <div className="relative">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md rotate-3">
            <Bot className="h-5 w-5 -rotate-3" />
          </div>
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>
        <div>
          <h2 className="text-[15px] font-black tracking-tight text-slate-800 leading-none">GymDesk AI Coach</h2>
          <p className="text-[11px] text-indigo-600 font-bold tracking-widest uppercase mt-1">Online & Ready</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-slate-50 to-white/50 scroll-smooth scrollbar-hide">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[88%] sm:max-w-[75%] gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center mt-auto mb-1 ${
                msg.role === 'user' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-indigo-600 text-white shadow-md'
              }`}>
                {msg.role === 'user' ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </div>
              <div
                className={`py-3 px-4 sm:px-5 rounded-3xl text-[13.5px] sm:text-[14px] font-medium leading-relaxed whitespace-pre-wrap shadow-sm border ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white border-orange-600 rounded-br-sm'
                    : 'bg-white text-slate-700 border-slate-100 rounded-bl-sm'
                }`}
              >
                {msg.image && (
                  <img src={msg.image} alt="User upload" className="max-w-[200px] w-full max-h-[200px] object-contain rounded-xl mb-2" />
                )}
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex max-w-[85%] gap-2 sm:gap-3">
              <div className="shrink-0 h-7 w-7 sm:h-8 sm:w-8 mt-auto mb-1 rounded-full flex items-center justify-center bg-indigo-600 text-white shadow-md">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="py-3.5 px-5 rounded-3xl bg-white border border-slate-100 rounded-bl-sm flex items-center gap-2.5 text-slate-500 shadow-sm text-sm font-medium">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Input Form */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-100 shrink-0 relative z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        {messages.length === 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide snap-x">
            <button 
              onClick={() => {
                setInput("Can you analyze my recent attendance and my current plan to suggest specific workout goals and intensity adjustments to improve my performance?");
              }}
              className="snap-start shrink-0 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 transition-colors whitespace-nowrap"
            >
              📊 Generate Performance Summary
            </button>
            <button 
              onClick={() => {
                setInput("What should be my workout goals for this month?");
              }}
              className="snap-start shrink-0 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-full text-xs font-bold border border-orange-100 transition-colors whitespace-nowrap"
            >
              💪 Suggest Workout Goals
            </button>
            <button 
              onClick={() => {
                setInput("Can you give me diet suggestions that fit my routine?");
              }}
              className="snap-start shrink-0 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold border border-emerald-100 transition-colors whitespace-nowrap"
            >
              🥗 Diet Suggestions
            </button>
          </div>
        )}
        
        {selectedImage && (
          <div className="mb-2 relative inline-block">
            <img src={`data:${selectedImage.mimeType};base64,${selectedImage.data}`} alt="Selected" className="h-20 w-20 object-cover rounded-xl border border-slate-200 shadow-sm" />
            <button 
              type="button" 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-slate-800 text-white p-1 rounded-full hover:bg-slate-700 shadow-md"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-end gap-2 bg-slate-50/80 border border-slate-200/80 p-1.5 sm:p-2 rounded-3xl focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-400 transition-all focus-within:bg-white"
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all cursor-pointer shrink-0 mb-0.5 ml-0.5 shadow-sm bg-white border border-slate-100"
            title="Attach Image"
          >
            <Paperclip className="h-5 w-5 sm:h-5 sm:w-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about workout, diet, pain..."
            className="flex-1 bg-transparent border-none text-[14px] px-2 sm:px-3 py-2.5 sm:py-3 min-h-[44px] max-h-32 resize-none focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400 font-medium leading-relaxed"
            rows={1}
          />
          <button
            type="submit"
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className="p-3 sm:p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 flex items-center justify-center cursor-pointer shadow-md shadow-indigo-500/20 mb-0.5 mr-0.5"
          >
            <Send className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </form>
        <div className="text-center mt-3 mb-1">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
            AI can make mistakes. Always consult a physician for injuries.
          </p>
        </div>
      </div>
    </div>
  );
}

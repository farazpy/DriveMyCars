import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Car as CarIcon,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Layers,
  IndianRupee,
  MapPin,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { UserProfile, Car } from '../types.ts';

interface AICarAssistantProps {
  user: UserProfile | null;
  onApplyDraftToForm: (draftCar: any) => void;
  onDirectPublishCar: (draftCar: any) => Promise<void>;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AICarAssistant: React.FC<AICarAssistantProps> = ({
  user,
  onApplyDraftToForm,
  onDirectPublishCar,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `Hello ${user?.name || 'Host'}! I'm your Charvi Rental Fleet AI Agent powered by Gemini 3.1 Flash Lite. Tell me about the car you want to list (e.g. "I want to list my 2024 Black Hyundai Creta in Wakad Pune for ₹3,500/day with Sunroof and FASTag"). I'll gather all details and prepare your listing draft!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMsg, setInputMsg] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [carDraft, setCarDraft] = useState<any>({
    make: 'Hyundai',
    model: 'Creta',
    year: 2024,
    type: 'SUV',
    transmission: 'Automatic',
    fuel: 'Diesel',
    seats: 5,
    price_per_day: 3500,
    security_deposit: 2000,
    location: user?.location || user?.address || 'Wakad, Pune, Maharashtra',
    city: 'Pune, Maharashtra',
    description: 'Pristine condition SUV with smooth automatic gearbox, perfect for city commutes and highway trips.',
    features: ['FASTag Toll Enabled', 'Keyless Self-Pickup', 'Electric Sunroof'],
    reg_number: 'MH 14 NH 7408',
  });

  const [isReadyToPublish, setIsReadyToPublish] = useState(false);
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputMsg.trim();
    if (!text || isThinking) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMsg('');
    setIsThinking(true);

    try {
      const res = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
          currentDraft: carDraft,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply || "I've updated your car draft details!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (data.extracted_car) {
          setCarDraft((prev: any) => {
            const next = { ...prev };
            Object.keys(data.extracted_car).forEach((key) => {
              if (data.extracted_car[key] !== null && data.extracted_car[key] !== undefined) {
                if (key === 'features' && Array.isArray(data.extracted_car[key])) {
                  // Merge features without duplicates
                  const combined = new Set([...(prev.features || []), ...data.extracted_car[key]]);
                  next.features = Array.from(combined);
                } else {
                  next[key] = data.extracted_car[key];
                }
              }
            });
            return next;
          });
        }

        if (typeof data.is_ready_to_publish === 'boolean') {
          setIsReadyToPublish(data.is_ready_to_publish);
        }
      } else {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `I experienced a brief connection hiccup (${err.error || 'Server error'}). Let's try again!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Network connection issue. Please check your connection and message again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleDirectSubmit = async () => {
    setIsSubmittingDirect(true);
    try {
      await onDirectPublishCar(carDraft);
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-white/20 backdrop-blur-xs">
              <Bot className="w-5 h-5 text-white" />
            </span>
            <h2 className="text-lg font-black tracking-tight">Gemini 3.1 Flash Lite AI Fleet Agent</h2>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
              Token-Efficient Agent
            </span>
          </div>
          <p className="text-xs text-orange-100 max-w-xl">
            Chat naturally in English or Hindi to list your vehicle. Gemini AI automatically parses make, model, daily rate, location, preferences and builds your listing draft in real time.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-[11px] font-bold bg-black/20 px-3 py-1.5 rounded-2xl border border-white/20 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-300" />
          <span>Server-side Gemini 3.1 Flash Lite API</span>
        </div>
      </div>

      {/* Grid Layout: Chat Left (60%), Live Draft Right (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Interactive Chat Window */}
        <div className="lg:col-span-7 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs flex flex-col h-[560px] overflow-hidden">
          
          {/* Chat Header */}
          <div className="p-3.5 px-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">AI Listing Chat Assistant</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              Model: gemini-3.1-flash-lite
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start space-x-2.5 ${
                  m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    m.role === 'user'
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-100 dark:bg-orange-950 text-orange-600 border border-orange-200 dark:border-orange-800'
                  }`}
                >
                  {m.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[82%] p-3.5 rounded-2xl leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-orange-600 text-white rounded-tr-none font-medium'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200/80 dark:border-neutral-700/80 rounded-tl-none'
                  }`}
                >
                  <p>{m.content}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.role === 'user' ? 'text-orange-200' : 'text-neutral-400'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center space-x-2 text-neutral-400 text-xs italic p-2 bg-neutral-50 dark:bg-neutral-850 rounded-2xl w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-600" />
                <span>Gemini 3.1 Flash Lite parsing vehicle details...</span>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950 flex items-center space-x-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="e.g. List my 2024 Black Hyundai Creta in Wakad Pune for 3500/day..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-medium focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={isThinking || !inputMsg.trim()}
              className="p-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right: AI Live Extracted Draft Card */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <h3 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
                  AI Extracted Draft
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Live Auto-Synced
              </span>
            </div>

            {/* Extracted Card Preview */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Vehicle Title</span>
                  <h4 className="font-extrabold text-sm text-neutral-900 dark:text-white">
                    {carDraft.make} {carDraft.model} ({carDraft.year})
                  </h4>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-xs font-black">
                  ₹{carDraft.price_per_day}/day
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-400">
                <div>
                  <span className="block text-[9px] text-neutral-400 font-bold uppercase">Specs</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{carDraft.type} · {carDraft.transmission} · {carDraft.fuel}</span>
                </div>
                <div>
                  <span className="block text-[9px] text-neutral-400 font-bold uppercase">Plate Reg</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">{carDraft.reg_number || 'MH 14 XX 0000'}</span>
                </div>
              </div>

              <div>
                <span className="block text-[9px] text-neutral-400 font-bold uppercase">Pickup Address</span>
                <span className="text-[11px] font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-orange-600 shrink-0" />
                  {carDraft.location}
                </span>
              </div>

              {carDraft.description && (
                <div>
                  <span className="block text-[9px] text-neutral-400 font-bold uppercase">Overview</span>
                  <p className="text-[11px] text-neutral-600 dark:text-neutral-400 line-clamp-2 italic">
                    &quot;{carDraft.description}&quot;
                  </p>
                </div>
              )}

              {carDraft.features && carDraft.features.length > 0 && (
                <div>
                  <span className="block text-[9px] text-neutral-400 font-bold uppercase mb-1">Preferences & Equipment</span>
                  <div className="flex flex-wrap gap-1">
                    {carDraft.features.map((feat: string) => (
                      <span key={feat} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300">
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Approval Notice */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start space-x-2 text-xs text-amber-800 dark:text-amber-300">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Admin Review Policy:</span>
                <span>Submitted vehicles require admin inspection before going live on the marketplace.</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={() => onApplyDraftToForm(carDraft)}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shadow-2xs transition-colors cursor-pointer"
            >
              <span>Transfer AI Draft to Step-by-Step Form</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDirectSubmit}
              disabled={isSubmittingDirect}
              className="w-full py-2.5 bg-neutral-900 dark:bg-neutral-800 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 border border-neutral-700 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>{isSubmittingDirect ? 'Submitting to Admin...' : 'Submit AI Car directly to Admin Review'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

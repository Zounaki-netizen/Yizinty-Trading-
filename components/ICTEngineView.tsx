
import React, { useState, useRef, useEffect } from 'react';
import { Trade, PropAccount } from '../types';
import { BrainCircuit, Send, User, Bot, Trash2, ArrowLeft, Sparkles, Paperclip, ImageIcon, X } from 'lucide-react';
import { sendICTChatMessage, ChatMessage, ChatAttachment } from '../services/geminiService';
import { AnimatedAIChat } from './ui/AnimatedAIChat';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface Props {
  trades: Trade[];
  accounts: PropAccount[];
}

export const ICTEngineView: React.FC<Props> = ({ trades, accounts }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
      try {
          const saved = localStorage.getItem('yizinity_ict_chat');
          return saved ? JSON.parse(saved) : [{ role: 'model', text: "I am the ICT Engine. I have access to your trading journal and funded account stats. How can I help you optimize your performance today?" }];
      } catch (e) {
          return [{ role: 'model', text: "I am the ICT Engine. I have access to your trading journal and funded account stats. How can I help you optimize your performance today?" }];
      }
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(messages.length > 1);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('yizinity_ict_chat', JSON.stringify(messages));
  }, [messages, hasStartedChat]);

  const handleSendMessage = async (text: string, newAttachments: ChatAttachment[] = []) => {
      if (!text.trim() && newAttachments.length === 0) return;
      
      // Switch to chat view if not already
      if (!hasStartedChat) setHasStartedChat(true);

      const userMsg: ChatMessage = { role: 'user', text: text, attachments: newAttachments };
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setAttachments([]);
      setIsTyping(true);

      const responseText = await sendICTChatMessage(messages, text, newAttachments, trades, accounts);
      
      const botMsg: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input, attachments);
    }
  };

  const clearChat = () => {
      const initialMsg: ChatMessage = { role: 'model', text: "Chat history cleared. Ready to analyze." };
      setMessages([initialMsg]);
      setHasStartedChat(false);
      localStorage.setItem('yizinity_ict_chat', JSON.stringify([initialMsg]));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const mimeType = base64.split(';')[0].split(':')[1];
                setAttachments(prev => [...prev, { name: file.name, data: base64, mimeType }]);
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
  };

  const removeAttachment = (index: number) => {
      setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- Hero View (Animated AI Chat) ---
  if (!hasStartedChat && messages.length <= 1) {
      return (
          <div className="h-[85vh] w-full">
              <AnimatedAIChat onSendMessage={(text, atts) => handleSendMessage(text, atts)} />
          </div>
      );
  }

  // --- Standard Chat View (Once conversation starts) ---
  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full h-[85vh] max-w-5xl mx-auto flex flex-col font-sans overflow-hidden rounded-3xl border border-white/[0.05] shadow-2xl bg-[#050505]/60 backdrop-blur-2xl"
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-500/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-600/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
             <button 
                onClick={() => setHasStartedChat(false)} 
                className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"
            >
                <ArrowLeft size={18} />
             </button>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-orange-600/20 border border-brand-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <BrainCircuit size={20} className="text-brand-500" />
                </div>
                <div>
                    <h2 className="text-base font-bold text-white/90 tracking-tight">ICT Engine Chat</h2>
                    <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Online & Ready</p>
                    </div>
                </div>
             </div>
        </div>
        <button 
            onClick={clearChat} 
            className="p-2 text-white/20 hover:text-rose-500 transition-colors hover:bg-rose-500/10 rounded-lg" 
            title="Clear Chat"
        >
            <Trash2 size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10 custom-scrollbar">
          {messages.map((msg, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={idx} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                  <div className={`max-w-[80%] relative group`}>
                      {msg.role === 'model' && (
                          <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-500/80 ml-1">
                              <Sparkles size={10} /> ICT Engine
                          </div>
                      )}
                      
                      <div className={cn(
                          "p-5 rounded-2xl text-sm leading-relaxed shadow-xl backdrop-blur-md",
                          msg.role === 'user' 
                            ? "bg-gradient-to-br from-brand-500 to-brand-600 text-black font-medium rounded-tr-sm border border-brand-400/20" 
                            : "bg-white/[0.03] border border-white/[0.05] text-white/90 rounded-tl-sm"
                      )}>
                          {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                  {msg.attachments.map((att, i) => (
                                      <div key={i} className="rounded-lg overflow-hidden border border-white/10">
                                          <img src={att.data} alt="attachment" className="max-h-48 object-cover" />
                                      </div>
                                  ))}
                              </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      
                      {msg.role === 'user' && (
                          <div className="absolute bottom-0 right-[-6px] w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-brand-600 border-r-[6px] border-r-transparent transform rotate-90"></div>
                      )}
                  </div>
              </motion.div>
          ))}
          
          {isTyping && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl rounded-tl-sm p-4 flex items-center gap-2 w-fit">
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-75"></div>
                      <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce delay-150"></div>
                  </div>
              </motion.div>
          )}
          <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/[0.05] bg-white/[0.01] backdrop-blur-md relative z-10">
          <div className="relative group">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyPress}
                placeholder="Ask about your psychology, specific trades, or setups..."
                className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-5 pr-14 py-4 text-white placeholder:text-white/20 focus:border-brand-500/50 focus:bg-white/[0.05] outline-none resize-none h-[70px] transition-all shadow-inner"
              />
              
              <div className="absolute right-2 top-2 bottom-2 flex items-center gap-2">
                  {/* File Upload */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center justify-center"
                  >
                    <Paperclip size={18} />
                  </button>

                  <button 
                    onClick={() => handleSendMessage(input, attachments)}
                    disabled={(!input.trim() && attachments.length === 0) || isTyping}
                    className="w-10 h-10 bg-brand-500 hover:bg-brand-400 rounded-xl text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg shadow-brand-500/20 hover:scale-105"
                  >
                      <Send size={18} strokeWidth={2.5} className={input.trim() ? "ml-0.5" : ""} />
                  </button>
              </div>
          </div>
          
          {/* Attachment Previews */}
          <AnimatePresence>
            {attachments.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 flex gap-2 flex-wrap"
                >
                    {attachments.map((att, idx) => (
                        <div key={idx} className="relative bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                            <ImageIcon size={12} className="text-white/60" />
                            <span className="text-xs text-white/80 max-w-[100px] truncate">{att.name || 'Image'}</span>
                            <button onClick={() => removeAttachment(idx)} className="text-white/40 hover:text-white"><X size={12} /></button>
                        </div>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-[10px] text-white/20 mt-3 font-medium tracking-wide">
            AI can make mistakes. Always verify important trading decisions.
          </p>
      </div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Mail, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onSwitchToLogin: () => void;
}

export const SignUpPage: React.FC<Props> = ({ onSwitchToLogin }) => {
  const { signup } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mobile fix: Trim inputs before validation
    const cleanEmail = email.trim();
    const cleanPass = password.trim();
    const cleanConfirm = confirmPassword.trim();
    
    if (!cleanEmail || !cleanPass || !name) {
        setError('All fields are required');
        return;
    }
    
    if (cleanPass !== cleanConfirm) {
        setError('Passwords do not match');
        return;
    }
    
    setIsLoading(true);

    try {
        // Check if user already exists locally
        const existing = localStorage.getItem(`yizinity_user_profile_${cleanEmail.toLowerCase()}`);
        if (existing) {
            setError('Account with this email already exists. Please Sign In.');
            setIsLoading(false);
            return;
        }

        await signup(cleanEmail, name, cleanPass);
        // AuthContext will handle redirect via state change
    } catch (err) {
        setError('Failed to create account.');
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] relative overflow-hidden p-4">
      {/* Ambient Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-blue-600/10 rounded-full mix-blend-normal filter blur-[80px] md:blur-[128px] animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-brand-500/5 rounded-full mix-blend-normal filter blur-[80px] md:blur-[128px] animate-pulse delay-700" />
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-200 uppercase italic mb-2">
            YIZINITY
          </h1>
          <p className="text-white/40 text-sm font-medium">Join the Elite Trading Circle</p>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.05] p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
          
          {error && (
            <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold px-4 py-3 rounded-lg mb-6 flex items-center justify-center text-center"
            >
                {error}
            </motion.div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Create Account</h2>
            <p className="text-white/40 text-xs mt-1">Start your journey to funded trading.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Full Name</label>
            <div className="relative group">
                <User size={16} className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" />
                <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/20 border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-brand-500 transition-all text-sm font-medium placeholder:text-white/10"
                placeholder="John Doe"
                />
            </div>
            </div>

            <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Email Address</label>
            <div className="relative group">
                <Mail size={16} className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" />
                <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/20 border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-brand-500 transition-all text-sm font-medium placeholder:text-white/10"
                placeholder="trader@example.com"
                />
            </div>
            </div>

            <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Password</label>
            <div className="relative group">
                <Lock size={16} className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" />
                <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-brand-500 transition-all text-sm font-medium placeholder:text-white/10"
                placeholder="••••••••"
                />
            </div>
            </div>
            
            <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Confirm Password</label>
            <div className="relative group">
                <Lock size={16} className="absolute left-3 top-3.5 text-white/20 group-focus-within:text-brand-500 transition-colors" />
                <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:border-brand-500 transition-all text-sm font-medium placeholder:text-white/10"
                placeholder="••••••••"
                />
            </div>
            </div>

            <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-black font-bold py-3.5 rounded-xl shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
                <>
                <span>Create Account</span>
                <ShieldCheck size={16} strokeWidth={3} />
                </>
            )}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-white/[0.05] text-center">
            <p className="text-xs text-white/40">
            Already have an account?{' '}
            <button 
                onClick={onSwitchToLogin}
                className="text-brand-500 hover:text-brand-400 font-bold transition-colors ml-1"
            >
                Sign In
            </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
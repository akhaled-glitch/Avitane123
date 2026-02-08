import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { SparklesIcon, UserIcon, StethoscopeIcon } from './ui/icons';
import type { UserRole } from '../types';

interface LoginScreenProps {
    onLoginSuccess: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        if (!isSupabaseConfigured()) {
            // Demo Mode fallback
            onLoginSuccess(selectedRole || 'Patient');
            return;
        }

        setLoading(true);
        setAuthError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) setAuthError(error.message);
        } catch (err: any) {
            setAuthError(err.message || "Failed to initialize login");
        }
        setLoading(false);
    };

    const handlePhoneLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isSupabaseConfigured()) {
            // Demo Mode fallback
            onLoginSuccess(selectedRole || 'Patient');
            return;
        }

        setLoading(true);
        setAuthError(null);
        
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: phoneNumber
            });

            if (error) {
                setAuthError(error.message);
            } else {
                setShowOtpInput(true);
            }
        } catch (err: any) {
            setAuthError(err.message || "Login failed");
        }
        setLoading(false);
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                phone: phoneNumber,
                token: otp,
                type: 'sms'
            });

            if (error) {
                setAuthError(error.message);
            } else {
                // Success
                 onLoginSuccess(selectedRole || 'Patient');
            }
        } catch (err: any) {
             setAuthError(err.message || "Verification failed");
        }
        setLoading(false);
    };

    const handleDemoLogin = () => {
        // Bypass for demonstration purposes
        onLoginSuccess(selectedRole || 'Patient');
    };

    if (!selectedRole) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200">
                            <SparklesIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">MediDash AI</h1>
                    <p className="text-slate-500 font-medium">Select your portal to continue</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button 
                            onClick={() => setSelectedRole('Patient')}
                            className="group relative flex flex-col items-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-indigo-600 hover:shadow-xl transition-all duration-300"
                        >
                             <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                                <UserIcon className="w-8 h-8" />
                             </div>
                             <span className="font-black text-slate-900 text-lg">Patient</span>
                             <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Personal Health</span>
                        </button>

                        <button 
                            onClick={() => setSelectedRole('Provider')}
                            className="group relative flex flex-col items-center p-8 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-emerald-600 hover:shadow-xl transition-all duration-300"
                        >
                             <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                                <StethoscopeIcon className="w-8 h-8" />
                             </div>
                             <span className="font-black text-slate-900 text-lg">Doctor</span>
                             <span className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Clinical Studio</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300">
                <button 
                    onClick={() => setSelectedRole(null)}
                    className="mb-8 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                    ← Back to Role Selection
                </button>

                <div className="text-center mb-10">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {selectedRole === 'Provider' ? 'Provider Login' : 'Patient Access'}
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Secure Authentication</p>
                </div>

                {authError && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl">
                        {authError}
                    </div>
                )}

                <div className="space-y-4">
                    <button 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-4 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all font-bold text-slate-700 hover:border-indigo-100"
                    >
                         <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                         Continue with Google
                    </button>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Or with Phone</span></div>
                    </div>

                    {!showOtpInput ? (
                        <form onSubmit={handlePhoneLogin} className="space-y-4">
                            <input 
                                type="tel" 
                                placeholder="+1 (555) 000-0000"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300"
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                            >
                                {loading ? 'Sending Code...' : 'Send Verification Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <input 
                                type="text" 
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-800 transition-all text-center tracking-[0.5em]"
                                required
                            />
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setShowOtpInput(false)}
                                className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                Change Phone Number
                            </button>
                        </form>
                    )}
                    
                    {/* Fallback to Demo Mode if Auth fails or just as an option */}
                    <div className="mt-8 pt-6 border-t border-slate-50 text-center">
                        <p className="text-[10px] text-slate-400 mb-3 font-medium">Having trouble? Use Demo Mode:</p>
                        <button 
                            onClick={handleDemoLogin}
                            className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                        >
                            Enter Demo Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
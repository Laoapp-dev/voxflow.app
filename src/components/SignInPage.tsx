import React, { useState } from 'react';
import { 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Mail, 
  Eye, 
  EyeOff, 
  UserPlus, 
  LogIn 
} from 'lucide-react';
import { loginWithGoogle, loginWithEmail, registerUserWithEmail } from '../lib/firebase';

interface SignInPageProps {
  onSignedIn: (user: any, role: 'learner') => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignedIn }) => {
  const [authTab, setAuthTab] = useState<'register' | 'signin'>('register');
  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetLevel, setTargetLevel] = useState<string>('A1');
  const [dailyGoal, setDailyGoal] = useState<number>(10);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        onSignedIn(user, 'learner');
      }
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google Sign-In popup was closed. Please try again.');
      } else if (err.message?.includes('access_denied') || err.message?.includes('verification')) {
        setErrorMessage('Google OAuth Domain testing mode active. Please register or sign in with Option 2 below.');
      } else {
        setErrorMessage(err.message || 'Google Sign-In error. You can register with email below.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Please enter a valid Email address.');
      return;
    }
    if (!fullNameInput.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    const pwd = passwordInput.trim() || 'voxflow2026';
    if (pwd.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await registerUserWithEmail(
        fullNameInput.trim(),
        emailInput.trim(),
        pwd,
        targetLevel,
        dailyGoal
      );
      if (user) {
        setSuccessMessage('Account registered successfully! Data saved to Firebase Cloud Store.');
        setTimeout(() => {
          onSignedIn(user, 'learner');
        }, 500);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err.message || 'Failed to register account. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const user = await loginWithEmail(emailInput.trim(), passwordInput || 'voxflow2026');
      if (user) {
        onSignedIn(user, 'learner');
      }
    } catch (err: any) {
      console.error('Email sign in error:', err);
      setErrorMessage(err.message || 'Failed to sign in. Please verify your email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Auth Form Card */}
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl backdrop-blur-xl relative z-10">
          
          <div className="space-y-5">
            
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-600/30 mb-2">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-extrabold text-white">Learner Account Sign In</h2>
              <p className="text-xs text-slate-400">
                Choose your sign in option to access your personal study dashboard
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-start gap-2.5 animate-fade-in shadow-md">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-start gap-2.5 animate-fade-in shadow-md">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{successMessage}</span>
                </div>
              </div>
            )}

            {/* Google Account Sign-In */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Google Account
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Instant Sign-In</span>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all duration-200 active:scale-98 disabled:opacity-60"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isLoading ? 'Connecting Google...' : 'Sign in with Google Account'}</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                OR EMAIL REGISTER & SIGN IN
              </span>
            </div>

            {/* Email Registration & Sign-In Form */}
            <div className="space-y-3.5">
              
              {/* Form Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAuthTab('register')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    authTab === 'register' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register New Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('signin')}
                  className={`py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    authTab === 'signin' 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In to Account</span>
                </button>
              </div>

              {/* Form Body */}
              {authTab === 'register' ? (
                /* REGISTER FORM */
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-[11px]">
                    If you don't have a Gmail account, please fill in your details below to register first.
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sarah Connor"
                        value={fullNameInput}
                        onChange={(e) => setFullNameInput(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Create password (min 6 characters)"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Target CEFR Level Selection */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Target CEFR English Level</span>
                      <span className="text-indigo-400 font-extrabold">{targetLevel}</span>
                    </label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setTargetLevel(lvl)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            targetLevel === lvl
                              ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Daily Practice Goal */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Daily Practice Goal</span>
                      <span className="text-purple-400 font-extrabold">{dailyGoal} Words / Day</span>
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[5, 10, 15, 20].map((goal) => (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => setDailyGoal(goal)}
                          className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            dailyGoal === goal
                              ? 'bg-purple-600 border-purple-400 text-white shadow'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {goal} W/Day
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 active:scale-98"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isLoading ? 'Registering Account...' : 'Register Account'}</span>
                  </button>
                </form>
              ) : (
                /* SIGN IN FORM */
                <form onSubmit={handleSignIn} className="space-y-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px]">
                    Already registered? Sign in with your registered email and password below.
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="yourname@example.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !emailInput}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50 active:scale-98"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Signing In...' : 'Sign In with Email & Password'}</span>
                  </button>
                </form>
              )}

            </div>

          </div>

        </div>
      </div>
    );
  };


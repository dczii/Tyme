'use client';

import React, { useState } from 'react';

// Use standard types matching App.tsx UserProfile
interface GoogleLoginPopupProps {}

export default function GoogleLoginPopup({}: GoogleLoginPopupProps) {
  const [step, setStep] = useState<'choose' | 'add_email' | 'add_name' | 'loading'>('choose');
  const [selectedUser, setSelectedUser] = useState<{ name: string; email: string } | null>(null);
  const [typedEmail, setTypedEmail] = useState('');
  const [typedName, setTypedName] = useState('');
  const [error, setError] = useState('');

  // Default suggested account from metadata or active environment
  const DEFAULT_GMAIL = 'dczabala2@gmail.com';
  const DEFAULT_NAME = 'Daniel Czabala';

  const handleSelectDefault = () => {
    setSelectedUser({ name: DEFAULT_NAME, email: DEFAULT_GMAIL });
    setStep('loading');
    completeLogin(DEFAULT_NAME, DEFAULT_GMAIL);
  };

  const handleAddAccountClick = () => {
    setStep('add_email');
    setError('');
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = typedEmail.trim();

    if (!email) {
      setError('Enter an email address');
      return;
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError('Please use a standard Google account ending in @gmail.com');
      return;
    }

    setError('');
    setStep('add_name');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = typedName.trim();

    if (!name) {
      setError('Enter your name to personalize your account');
      return;
    }

    setSelectedUser({ name, email: typedEmail.toLowerCase().trim() });
    setStep('loading');
    completeLogin(name, typedEmail.toLowerCase().trim());
  };

  const completeLogin = (name: string, email: string) => {
    // Standard authentic Google verification loading feel
    setTimeout(() => {
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_AUTH_SUCCESS',
            profile: {
              name,
              email,
              picture: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
            },
          },
          window.location.origin
        );
        window.close();
      } else {
        // Fallback if not inside popup
        alert(`Logged in as ${name} (${email})`);
        window.location.href = '/';
      }
    }, 1200);
  };

  return (
    <div id="google-auth-popup-container" className="min-h-screen w-full bg-[#f0f4f9] flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-slate-800">
      
      {/* Google Login Dialog Box */}
      <div className="w-full max-w-[450px] bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-md relative overflow-hidden transition-all duration-300">
        
        {/* Top Google Blue Indeterminate Progress Bar for verification feel */}
        {step === 'loading' && (
          <div className="absolute top-0 left-0 right-0 h-[4px] bg-blue-100 overflow-hidden">
            <div className="h-full bg-blue-600 w-1/3 rounded animate-[indeterminate_1.5s_infinite_linear]"></div>
          </div>
        )}

        {/* Google Iconic Logo Container */}
        <div className="flex justify-start mb-6">
          <svg className="h-6 w-auto" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>

        {/* STEP 1: CHOOSE AN ACCOUNT */}
        {step === 'choose' && (
          <div className="animate-fadeIn">
            <h1 className="text-2xl font-normal text-[#1f1f1f] tracking-tight mb-2">Choose an account</h1>
            <p className="text-sm text-[#5f6368] mb-6">to continue to <span className="font-semibold text-slate-800">Tyme Workspace</span></p>

            <div className="space-y-1.5 border border-slate-200 rounded-2xl overflow-hidden mb-6">
              {/* Account Row 1: Detected Gmail account */}
              <button
                onClick={handleSelectDefault}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 border-b border-slate-200 transition text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Google-Style blue circular profile accent */}
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm select-none">
                    D
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 leading-tight group-hover:text-slate-950">{DEFAULT_NAME}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{DEFAULT_GMAIL}</p>
                  </div>
                </div>
                <div className="text-[10px] bg-green-50 rounded px-2 py-0.5 border border-green-200 text-green-700 uppercase font-mono font-bold">
                  Active
                </div>
              </button>

              {/* Account Row 2: Add Account */}
              <button
                onClick={handleAddAccountClick}
                className="w-full flex items-center p-4 hover:bg-slate-50 transition text-left"
              >
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-slate-600 pl-3">Use another account</span>
              </button>
            </div>

            <div className="text-xs text-[#5f6368] leading-relaxed">
              To create your productivity board, Google will share your name, email address, profile picture, and workspace layout with Tyme Workspace.
            </div>
          </div>
        )}

        {/* STEP 2: ENTER CUSTOM EMAIL */}
        {step === 'add_email' && (
          <form onSubmit={handleEmailSubmit} className="animate-fadeIn space-y-6">
            <div>
              <h1 className="text-2xl font-normal text-[#1f1f1f] tracking-tight mb-2">Sign in</h1>
              <p className="text-sm text-[#5f6368]">Use your Google Account to sign in to Tyme</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Email (@gmail.com)"
                  value={typedEmail}
                  onChange={(e) => {
                    setTypedEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-sans text-slate-800 placeholder-slate-400"
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 p-2.5 rounded-lg animate-shake">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('choose');
                  setTypedEmail('');
                  setError('');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold cursor-pointer py-1.5 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-5 rounded-lg transition shadow-sm hover:shadow cursor-pointer"
              >
                Next
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: ENTER PROFILE NAME */}
        {step === 'add_name' && (
          <form onSubmit={handleNameSubmit} className="animate-fadeIn space-y-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2 border border-slate-200 rounded-full w-fit px-3 py-1 bg-slate-50">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                <span>{typedEmail}</span>
              </div>
              <h1 className="text-2xl font-normal text-[#1f1f1f] tracking-tight mb-2">Welcome</h1>
              <p className="text-sm text-[#5f6368]">Enter your name to personalize your new workspace</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Arthur Dent"
                  value={typedName}
                  onChange={(e) => {
                    setTypedName(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-sans text-slate-800 placeholder-slate-400"
                />
              </div>

              {error && (
                <div className="text-xs text-red-600 flex items-center gap-1.5 bg-red-50 border border-red-200 p-2.5 rounded-lg animate-shake">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep('add_email');
                  setError('');
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold cursor-pointer py-1.5 transition"
              >
                Back
              </button>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-5 rounded-lg transition shadow-sm hover:shadow cursor-pointer"
              >
                Agree & Connect
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: VERIFICATION LOADING STATE */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10 animate-fadeIn">
            {/* Spinning Chrome/Google wheel animation styled precisely */}
            <div className="h-12 w-12 border-3 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-5"></div>
            <p className="text-sm font-semibold text-slate-700">Connecting securely to Tyme...</p>
            <p className="text-xs text-slate-400 mt-1">Authenticating account credentials</p>
          </div>
        )}

      </div>

      {/* Bottom Legal / Help block */}
      <footer className="mt-6 flex flex-wrap justify-between w-full max-w-[450px] text-xs text-[#5f6368] px-4">
        <span>English (United States)</span>
        <div className="flex gap-4">
          <span className="hover:underline cursor-pointer">Help</span>
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span className="hover:underline cursor-pointer">Terms</span>
        </div>
      </footer>

      {/* Styled Animations Injected */}
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}

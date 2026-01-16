import type { FormEvent } from 'react';
import { useState } from 'react';
import { useSignIn } from '../index';
import { useNavigate } from 'react-router-dom';

/**
 * Custom OTP Sign-In Page for Agrellus AgFin MVP
 *
 * Two-step authentication flow:
 * 1. Email input - user enters email address
 * 2. OTP verification - user enters 6-digit code sent to email
 *
 * Features:
 * - Agrellus dark theme branding (#061623 background, #30714C primary)
 * - Loading states and error handling
 * - Direct redirect to chat on successful authentication
 */

type SignInStep = 'email' | 'otp';

export function SignInPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const [step, setStep] = useState<SignInStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Step 1: Send OTP to email
   */
  const handleSendOTP = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      // Start sign-in flow with email code strategy
      const signInAttempt = await signIn.create({
        identifier: email,
        strategy: 'email_code',
      });

      // Send OTP to email
      await signInAttempt.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: signInAttempt.supportedFirstFactors.find(
          (factor: any) => factor.strategy === 'email_code'
        )?.emailAddressId,
      });

      // Move to OTP verification step
      setStep('otp');
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(err.errors?.[0]?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP and complete sign-in
   */
  const handleVerifyOTP = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      // Verify OTP code
      const completeSignIn = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: otp,
      });

      if (completeSignIn.status === 'complete') {
        // Set the active session
        await setActive({ session: completeSignIn.createdSessionId });

        // Redirect to chat
        navigate('/chat');
      } else {
        // Handle unexpected status
        console.error('Unexpected sign-in status:', completeSignIn.status);
        setError('Sign-in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError(err.errors?.[0]?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset to email step
   */
  const handleBackToEmail = () => {
    setStep('email');
    setOtp('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#061623] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Agrellus Logo & Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-[#30714C] rounded-xl flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h2 className="text-3xl font-bold text-white">
            Welcome to Agrellus
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {step === 'email'
              ? 'Sign in to your AgFin analyst account'
              : 'Enter the code sent to your email'
            }
          </p>
        </div>

        {/* Sign-In Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          {step === 'email' ? (
            // Step 1: Email Input
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="analyst@agfin.com"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email}
                aria-label={isLoading ? "Sending verification code" : "Continue with email to sign in"}
                className="w-full px-4 py-3 bg-[#30714C] hover:bg-[#28593d] text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:ring-offset-2 focus:ring-offset-[#061623] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending code...
                  </>
                ) : (
                  'Continue with email'
                )}
              </button>
            </form>
          ) : (
            // Step 2: OTP Verification
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-300 mb-2">
                  Verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                  disabled={isLoading}
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl tracking-widest placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="000000"
                />
                <p className="mt-2 text-xs text-gray-400 text-center">
                  Code sent to {email}
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                aria-label={isLoading ? "Verifying code" : "Verify code and sign in"}
                className="w-full px-4 py-3 bg-[#30714C] hover:bg-[#28593d] text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#30714C] focus:ring-offset-2 focus:ring-offset-[#061623] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </>
                ) : (
                  'Verify and sign in'
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                disabled={isLoading}
                aria-label="Go back to email input"
                className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Back to email
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Agrellus AgFin MVP - Secure Analyst Access
        </p>
      </div>
    </div>
  );
}

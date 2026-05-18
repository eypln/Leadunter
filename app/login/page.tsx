'use client';

import { signIn } from 'next-auth/react';
import { Facebook } from 'lucide-react';

export default function LoginPage() {
  const handleFacebookLogin = () => {
    signIn('facebook', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Logo & Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Lead Hunter</h1>
          <p className="text-gray-400">Real Estate Lead Generation</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-400 text-sm">
                Sign in to access your lead dashboard
              </p>
            </div>

            {/* Facebook Login Button */}
            <button
              onClick={handleFacebookLogin}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <Facebook className="w-5 h-5" />
              Continue with Facebook
            </button>

            {/* Info Text */}
            <div className="text-center text-xs text-gray-500">
              <p>
                By signing in, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="text-center space-y-2">
          <p className="text-gray-400 text-sm">What you&apos;ll get:</p>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
            <span>✓ Lead Management</span>
            <span>✓ AI-Powered Scoring</span>
            <span>✓ Auto Message Generation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

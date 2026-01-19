'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Declare chrome types for extension messaging
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          extensionId: string,
          message: unknown,
          callback?: (response: { success?: boolean }) => void
        ) => void;
        lastError?: { message: string };
      };
    };
  }
}

export default function ExtensionAuthPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'no-session'>('loading');
  const [message, setMessage] = useState('Connecting to extension...');

  useEffect(() => {
    async function sendAuthToExtension() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const params = new URLSearchParams(window.location.search);
      // Support both 'extension' and 'extensionId' parameter names
      const extensionId = params.get('extension') || params.get('extensionId') || '';

      if (!session) {
        // Redirect to login with extension callback
        if (extensionId) {
          // Redirect to login, preserving extension params
          window.location.href = `/login?extension=${extensionId}&callback=extension`;
        } else {
          setStatus('no-session');
          setMessage('Please sign in first, then try connecting your extension again.');
        }
        return;
      }

      if (!extensionId) {
        setStatus('error');
        setMessage('No extension ID provided. Please try connecting from the extension again.');
        return;
      }

      // Check if chrome.runtime is available
      if (typeof window.chrome === 'undefined' || !window.chrome?.runtime?.sendMessage) {
        setStatus('error');
        setMessage('Chrome extension API not available. Make sure you\'re using Chrome browser.');
        return;
      }

      try {
        setMessage('Fetching your account data...');

        // Fetch profile data
        const profileResponse = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profileData = await profileResponse.json();

        setMessage('Sending credentials to extension...');

        // Send to extension
        window.chrome!.runtime!.sendMessage(extensionId, {
          type: 'AUTH_TOKEN',
          token: session.access_token,
          userId: session.user.id,
          tier: profileData.subscription?.plans?.name?.toLowerCase() || 'free',
          user: profileData.user,
          subscription: profileData.subscription,
          userCredits: profileData.credits,
          credits: {
            available: profileData.credits?.available_credits || 0,
            used_this_period: profileData.credits?.used_this_period || 0,
            plan_allocation: profileData.subscription?.plans?.credits_per_month || 30,
            percent_consumed: profileData.subscription?.plans?.credits_per_month
              ? (profileData.credits?.used_this_period / profileData.subscription.plans.credits_per_month) * 100
              : 0,
            plan: profileData.subscription?.plans?.name?.toLowerCase() || 'free',
          }
        }, (response) => {
          if (window.chrome?.runtime?.lastError) {
            console.error('Extension message error:', window.chrome.runtime.lastError);
            setStatus('error');
            setMessage('Could not connect to extension. Make sure the SafePlay extension is installed and enabled.');
            return;
          }

          if (response?.success) {
            setStatus('success');
            setMessage('Successfully connected! You can close this tab.');
            // Auto-close after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          } else {
            setStatus('error');
            setMessage('Extension did not accept the connection. Please try again.');
          }
        });
      } catch (error) {
        console.error('Extension auth error:', error);
        setStatus('error');
        setMessage('An error occurred while connecting. Please try again.');
      }
    }

    sendAuthToExtension();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-white" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold text-foreground mb-2">Connecting Extension</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">Connected!</h1>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground mt-4">This tab will close automatically...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-error mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">Connection Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </>
        )}

        {status === 'no-session' && (
          <>
            <XCircle className="w-16 h-16 text-warning mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-2">Not Signed In</h1>
            <p className="text-muted-foreground">{message}</p>
            <a
              href="/login"
              className="mt-6 inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Sign In
            </a>
          </>
        )}
      </div>
    </div>
  );
}

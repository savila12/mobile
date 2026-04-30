import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { USE_MOCK_DATA } from '../lib/devConfig';

const useMockData = USE_MOCK_DATA;

const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 31536000,
  expires_at: 2082758400,
  token_type: 'bearer',
  user: {
    id: 'mock-user-1',
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      name: 'Mock Driver',
    },
    aud: 'authenticated',
    created_at: '2026-04-27T00:00:00.000Z',
  },
};

export const useAuthSession = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (useMockData) {
      setSession(mockSession);
      setAuthError(null);
      setIsLoading(false);
      return;
    }

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (isMounted) {
          setSession(data.session ?? null);
          setAuthError(null);
        }
      } catch (error) {
        if (isMounted) {
          setSession(null);
          setAuthError(error instanceof Error ? error : new Error('Failed to load auth session.'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession ?? null);
        setAuthError(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    isLoading,
    authError,
  };
}

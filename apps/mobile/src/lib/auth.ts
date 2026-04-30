import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';
import { USE_MOCK_DATA } from './devConfig';

const useMockData = USE_MOCK_DATA;

WebBrowser.maybeCompleteAuthSession();

const parseAuthTokens = (url: string): { access_token?: string; refresh_token?: string } => {
  const parsed = Linking.parse(url).queryParams as {
    access_token?: string;
    refresh_token?: string;
  };

  if (parsed.access_token && parsed.refresh_token) {
    return parsed;
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) {
    return parsed;
  }

  const hashParams = new URLSearchParams(url.slice(hashIndex + 1));
  const accessToken = hashParams.get('access_token') || undefined;
  const refreshToken = hashParams.get('refresh_token') || undefined;

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};

export const signInWithPassword = async (email: string, password: string) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
};

export const signUpWithPassword = async (email: string, password: string) => {
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw error;
  }
};

export const signInWithGoogle = async () => {
  const redirectTo = Linking.createURL('auth/callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error('Google auth URL was not returned.');
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type === 'success' && result.url) {
    const tokenParams = parseAuthTokens(result.url);

    if (tokenParams.access_token && tokenParams.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: tokenParams.access_token,
        refresh_token: tokenParams.refresh_token,
      });

      if (sessionError) {
        throw sessionError;
      }
    }
  }
};

export const signOut = async () => {
  if (useMockData) {
    if (!__DEV__) {
      throw new Error('Mock mode is enabled in a non-development build. Refusing to skip sign-out.');
    }
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

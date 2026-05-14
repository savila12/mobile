/**
 * Development configuration flags.
 * Toggle USE_MOCK_DATA to bypass Supabase and use local in-memory data.
 */
const rawUseMockData = (process.env.EXPO_PUBLIC_USE_MOCK_DATA ?? '').trim().toLowerCase();

const parseUseMockData = (value: string): boolean => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return false;
};

export const USE_MOCK_DATA = parseUseMockData(rawUseMockData);
export const MOCK_USER_ID = 'mock-user-1';
export const APP_VERSION = '1.0.0';

const parseOptionalUrl = (value: string | undefined): string | null => {
    const trimmed = (value ?? '').trim();
    return trimmed.length ? trimmed : null;
};

export const PRIVACY_POLICY_URL = parseOptionalUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL);
export const TERMS_OF_SERVICE_URL = parseOptionalUrl(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL);

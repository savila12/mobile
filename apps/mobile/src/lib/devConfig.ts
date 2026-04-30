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

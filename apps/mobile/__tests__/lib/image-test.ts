import * as ImagePicker from 'expo-image-picker';
import { pickImageAsync, resolveReceiptUrl, uploadReceipt } from '../../src/lib/image';
import { supabase } from '../../src/lib/supabase';

jest.mock('expo-image-picker');
jest.mock('../../src/lib/supabase', () => ({
    supabase: {
        storage: {
            from: jest.fn(),
        },
    },
}));

describe('image utilities', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('pickImageAsync', () => {
        it('returns null when user cancels', async () => {
            (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
                granted: true,
            });
            (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
                canceled: true,
            });

            const result = await pickImageAsync();

            expect(result).toBeNull();
        });

        it('throws error when permission is denied', async () => {
            (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
                granted: false,
            });

            await expect(pickImageAsync()).rejects.toThrow('Photo library permission is required');
        });

        it('returns image asset when user picks an image', async () => {
            const mockAsset = {
                uri: 'file:///path/to/image.jpg',
                width: 800,
                height: 600,
            };

            (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
                granted: true,
            });
            (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
                canceled: false,
                assets: [mockAsset],
            });

            const result = await pickImageAsync();

            expect(result).toEqual(mockAsset);
        });
    });

    describe('uploadReceipt', () => {
        it('uploads receipt and returns storage path', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
            });

            const mockStorage = {
                upload: jest.fn().mockResolvedValue({ error: null }),
            };

            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorage);

            const result = await uploadReceipt('user-123', 'file:///path/to/image.jpg');

            expect(result.startsWith('user-123/')).toBe(true);
            expect(mockStorage.upload).toHaveBeenCalled();
        });

        it('throws error when upload fails', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
            });

            const mockStorage = {
                upload: jest.fn().mockResolvedValue({ error: new Error('Upload failed') }),
            };

            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorage);

            await expect(uploadReceipt('user-123', 'file:///path/to/image.jpg')).rejects.toThrow(
                'Upload failed',
            );
        });
    });

    describe('resolveReceiptUrl', () => {
        it('returns null for empty reference', async () => {
            await expect(resolveReceiptUrl(null)).resolves.toBeNull();
            await expect(resolveReceiptUrl(undefined)).resolves.toBeNull();
        });

        it('creates signed URL for stored path', async () => {
            const mockStorage = {
                createSignedUrl: jest.fn().mockResolvedValue({
                    data: { signedUrl: 'https://example.com/signed.jpg' },
                    error: null,
                }),
            };

            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorage);

            const result = await resolveReceiptUrl('user-123/file.jpg');

            expect(result).toBe('https://example.com/signed.jpg');
            expect(mockStorage.createSignedUrl).toHaveBeenCalledWith('user-123/file.jpg', 3600);
        });

        it('converts legacy public URL to signed URL', async () => {
            const mockStorage = {
                createSignedUrl: jest.fn().mockResolvedValue({
                    data: { signedUrl: 'https://example.com/signed.jpg' },
                    error: null,
                }),
            };

            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorage);

            const result = await resolveReceiptUrl(
                'https://project.supabase.co/storage/v1/object/public/service-attachments/user-123/file.jpg',
            );

            expect(result).toBe('https://example.com/signed.jpg');
            expect(mockStorage.createSignedUrl).toHaveBeenCalledWith('user-123/file.jpg', 3600);
        });

        it('passes through unknown URL references', async () => {
            const result = await resolveReceiptUrl('https://cdn.example.com/image.jpg');
            expect(result).toBe('https://cdn.example.com/image.jpg');
        });
    });
});

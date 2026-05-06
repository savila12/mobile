import * as ImagePicker from 'expo-image-picker';
import { pickImageAsync, uploadReceipt } from '../../src/lib/image';
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
        it('uploads receipt and returns public URL', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
            });

            const mockStorage = {
                upload: jest.fn().mockResolvedValue({ error: null }),
                getPublicUrl: jest.fn().mockReturnValue({
                    data: { publicUrl: 'https://example.com/image.jpg' },
                }),
            };

            (supabase.storage.from as jest.Mock).mockReturnValue(mockStorage);

            const result = await uploadReceipt('user-123', 'file:///path/to/image.jpg');

            expect(result).toBe('https://example.com/image.jpg');
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
});

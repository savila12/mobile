import * as devConfig from '../../src/lib/devConfig';

describe('devConfig', () => {
    it('exports APP_VERSION', () => {
        expect(devConfig.APP_VERSION).toBeDefined();
        expect(typeof devConfig.APP_VERSION).toBe('string');
    });

    it('exports USE_MOCK_DATA boolean', () => {
        expect(typeof devConfig.USE_MOCK_DATA).toBe('boolean');
    });

    it('APP_VERSION is a valid semantic version or numeric string', () => {
        const versionPattern = /^\d+(\.\d+)?(\.\d+)?$/;
        expect(versionPattern.test(devConfig.APP_VERSION)).toBe(true);
    });
});

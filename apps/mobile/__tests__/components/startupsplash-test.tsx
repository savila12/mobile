/**
 * Tests for StartupSplash component.
 */

import { render, screen } from '@testing-library/react-native';
import { StartupSplash } from '../../src/components/StartupSplash';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => 'MockIcon',
}));

describe('StartupSplash', () => {
    it('renders with default subtitle', () => {
        render(<StartupSplash />);
        expect(screen.getByText('AutoTrack')).toBeOnTheScreen();
        expect(screen.getByText('Preparing your garage...')).toBeOnTheScreen();
    });

    it('renders with custom subtitle', () => {
        render(<StartupSplash subtitle="Loading..." />);
        expect(screen.getByText('AutoTrack')).toBeOnTheScreen();
        expect(screen.getByText('Loading...')).toBeOnTheScreen();
    });
});

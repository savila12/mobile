/**
 * Tests for AppErrorBoundary component.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, screen, userEvent } from '@testing-library/react-native';
import { AppErrorBoundary } from '../../src/components/AppErrorBoundary';

jest.mock('@expo/vector-icons', () => ({
    Ionicons: () => 'MockIcon',
}));

describe('AppErrorBoundary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders children when there is no error', () => {
        render(
            <AppErrorBoundary>
                <Text>Hello World</Text>
            </AppErrorBoundary>,
        );
        expect(screen.getByText('Hello World')).toBeOnTheScreen();
    });

    it('renders error UI when child throws', () => {
        const ThrowError = () => {
            throw new Error('Test error');
        };

        const onError = jest.fn();
        render(
            <AppErrorBoundary onError={onError}>
                <ThrowError />
            </AppErrorBoundary>,
        );

        expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
        expect(screen.getByText('Please try again. Your saved data remains intact.')).toBeOnTheScreen();
        expect(screen.getByLabelText('Retry app')).toBeOnTheScreen();
        expect(onError).toHaveBeenCalled();
    });

    it('calls onError callback when error is caught', () => {
        const onError = jest.fn();
        const ThrowError = () => {
            throw new Error('Custom error message');
        };

        render(
            <AppErrorBoundary onError={onError}>
                <ThrowError />
            </AppErrorBoundary>,
        );

        expect(onError).toHaveBeenCalled();
        const [error, errorInfo] = (onError as jest.Mock).mock.calls[0];
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Custom error message');
        expect(errorInfo).toHaveProperty('componentStack');
    });
});

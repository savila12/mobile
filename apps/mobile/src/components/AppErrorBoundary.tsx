import { Component, type ErrorInfo, type PropsWithChildren } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AppErrorBoundaryProps = PropsWithChildren<{
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}>;

type AppErrorBoundaryState = {
  hasError: boolean;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.error('AppErrorBoundary caught an error:', error, errorInfo);
    }

    this.props.onError?.(error, errorInfo);
  }

  private onRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>Please try again. Your saved data remains intact.</Text>
          <TouchableOpacity style={styles.button} onPress={this.onRetry} accessibilityLabel="Retry app">
            <Text style={styles.buttonLabel}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111113',
    paddingHorizontal: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    color: '#a1a1aa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: '#0fb37f',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

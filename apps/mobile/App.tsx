import './global.css';
import { useEffect, useState } from 'react';

import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';

import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { useSyncQueue } from './src/hooks/useSyncQueue';
import { StartupSplash } from './src/components/StartupSplash';
import { queryClient } from './src/lib/queryClient';
import { requestNotificationPermission } from './src/lib/notifications';
import { AppNavigator } from './src/navigation/AppNavigator';


const AppBootstrap = () => {
  useSyncQueue();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      await Promise.allSettled([
        requestNotificationPermission(),
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);

      if (isMounted) {
        setIsBootstrapping(false);
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isBootstrapping) {
    return <StartupSplash subtitle="Warming up your dashboard..." />;
  }

  return <AppNavigator />;
};

const App = () => {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <AppBootstrap />
      </QueryClientProvider>
    </AppErrorBoundary>
  );
};

export default App;

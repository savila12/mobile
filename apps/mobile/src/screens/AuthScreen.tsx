import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

// Styling tier: critical. Keep core layout and form surfaces on explicit RN styles.
import { signInWithGoogle, signInWithPassword } from '../lib/auth';
import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';

export const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Auth'>>();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithPassword(email.trim(), password);
    } catch (error: unknown) {
      Alert.alert('Sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    navigation.navigate('CreateAccount');
  };

  const handleGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error: unknown) {
      Alert.alert('Google sign in failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>AutoTrack</Text>
          <Text style={styles.subtitle}>Track maintenance, fuel, and service history for every vehicle.</Text>

          <View style={styles.card}>
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="you@domain.com"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
            />
            <InputField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              secureTextEntry={!showPassword}
              rightIconName={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword((prev) => !prev)}
              rightIconAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              rightIconDisabled={isLoading}
            />

            <View style={styles.actions}>
              <PrimaryButton label={isLoading ? 'Loading...' : 'Sign In'} onPress={handleSignIn} disabled={isLoading} />
              <PrimaryButton label={isLoading ? 'Loading...' : 'Create Account'} onPress={handleSignUp} disabled={isLoading} />
            </View>

            <View style={styles.googleAction}>
              <PrimaryButton
                label={isLoading ? 'Loading...' : 'Continue with Google'}
                onPress={handleGoogle}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#a1a1aa',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  card: {
    marginTop: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 20,
  },
  actions: {
    marginTop: 15,
    gap: 12,
  },
  googleAction: {
    marginTop: 12,
  },
});

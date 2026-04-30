import { useEffect, useRef, useState } from 'react';

import { InputField } from '../components/InputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { signUpWithPassword } from '../lib/auth';
import { View, Text, StyleSheet, BackHandler, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const maybeError = error as { message?: string; details?: string; hint?: string };
    return maybeError.message || maybeError.details || maybeError.hint || 'Please try again.';
  }

  return 'Please try again.';
};

export const CreateAccountScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'CreateAccount'>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validateForm = (): string | null => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password || !confirmPassword) {
      return 'Please fill out all fields.';
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return 'Enter a valid email address.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters.';
    }

    if (password !== confirmPassword) {
      return 'Passwords do not match.';
    }

    return null;
  };

  const handleCreateAccount = async () => {
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setIsSuccess(false);

      await signUpWithPassword(email.trim(), password);

      setIsSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Handle Android back to return to auth instead of exiting.
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.goBack();
      return true;
    });

    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timer = setTimeout(() => {
      navigation.goBack();
    }, 1600);

    return () => {
      clearTimeout(timer);
    };
  }, [isSuccess, navigation]);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.backButtonContainer}>
          <PrimaryButton label="‹ Back" onPress={() => navigation.goBack()} disabled={isLoading} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Create your account, then verify your email before signing in.</Text>

          <View style={styles.card}>
            <InputField 
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="First and last name"
            returnKeyType='next'

            />

            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="you@domain.com"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
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
              inputRef={passwordRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              rightIconName={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword((prev) => !prev)}
              rightIconAccessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              rightIconDisabled={isLoading}
            />
            <InputField
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="••••••••"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              secureTextEntry={!showConfirmPassword}
              inputRef={confirmPasswordRef}
              returnKeyType="done"
              onSubmitEditing={handleCreateAccount}
              rightIconName={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowConfirmPassword((prev) => !prev)}
              rightIconAccessibilityLabel={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              rightIconDisabled={isLoading}
            />

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {isSuccess ? (
              <Text style={styles.successText}>
                Account created. Check your inbox to verify your email, then return to sign in.
              </Text>
            ) : null}

            <PrimaryButton
              label={isLoading ? 'Creating account...' : 'Create Account'}
              onPress={handleCreateAccount}
              disabled={isLoading}
            />
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
    alignItems: 'center',
  },
  backButtonContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    padding: 20,
  },
  card: {
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#27272a',
    backgroundColor: '#18181b',
    padding: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    marginBottom: 10,
    color: '#fca5a5',
    fontSize: 13,
  },
  successText: {
    marginBottom: 10,
    color: '#6ee7b7',
    fontSize: 13,
    lineHeight: 18,
  },
});
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export const PrimaryButton = ({
  label,
  onPress,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const buttonStateStyle =
    variant === 'secondary'
      ? disabled
        ? styles.secondaryDisabled
        : isPressed
          ? styles.secondaryPressed
          : styles.secondaryActive
      : disabled
        ? styles.primaryDisabled
        : isPressed
          ? styles.primaryPressed
          : styles.primaryActive;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.button, buttonStateStyle]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2f',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryActive: {
    backgroundColor: '#0fb37f',
    borderColor: '#0fb37f',
  },
  primaryDisabled: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  primaryPressed: {
    backgroundColor: '#0da36b',
    borderColor: '#0da36b',
  },
  secondaryActive: {
    backgroundColor: 'transparent',
    borderColor: '#3f3f46',
  },
  secondaryPressed: {
    backgroundColor: '#1f1f23',
    borderColor: '#52525b',
  },
  secondaryDisabled: {
    backgroundColor: 'transparent',
    borderColor: '#2f2f35',
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

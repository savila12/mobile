import { Pressable, StyleSheet, Text } from 'react-native';

export const PrimaryButton = ({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.button,
        disabled ? styles.buttonDisabled : styles.buttonActive,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonActive: {
    backgroundColor: '#0fb37f',
  },
  buttonDisabled: {
    backgroundColor: '#3f3f46',
  },
  label: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonPressed: {
    backgroundColor: '#0da36b',
  },
});

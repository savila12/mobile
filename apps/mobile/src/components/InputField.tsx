import { RefObject } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

export const InputField = ({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  secureTextEntry,
  inputRef,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit,
  rightIconName,
  onRightIconPress,
  rightIconAccessibilityLabel,
  rightIconDisabled,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  placeholder?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  spellCheck?: boolean;
  secureTextEntry?: boolean;
  inputRef?: RefObject<TextInput | null>;
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  blurOnSubmit?: boolean;
  rightIconName?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  rightIconDisabled?: boolean;
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          spellCheck={spellCheck}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
          placeholderTextColor="#71717a"
          selectionColor="#0fb37f"
          style={[styles.input, rightIconName ? styles.inputWithIcon : null]}
        />

        {rightIconName ? (
          <TouchableOpacity
            style={styles.rightIconButton}
            onPress={onRightIconPress}
            disabled={rightIconDisabled}
            accessibilityRole="button"
            accessibilityLabel={rightIconAccessibilityLabel}
          >
            <Ionicons name={rightIconName} size={20} color="#a1a1aa" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#09090b',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#ffffff',
    fontSize: 16,
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  rightIconButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 14,
    justifyContent: 'center',
  },
});

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Radii } from '@/constants/theme';

interface CustomInputProps extends TextInputProps {
  label?: string;
  iconName?: keyof typeof Feather.glyphMap;
  isPassword?: boolean;
  error?: string | null;
  containerStyle?: object;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  iconName,
  isPassword = false,
  error,
  containerStyle,
  value,
  onChangeText,
  placeholder,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getBorderColor = () => {
    if (error) return Colors.errorRed;
    if (isFocused) return Colors.forestGreen;
    return Colors.border;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            backgroundColor: isFocused ? '#FFFFFF' : '#FAFAFA',
          },
        ]}
      >
        {iconName && (
          <View style={styles.iconContainer}>
            <Feather
              name={iconName}
              size={18}
              color={error ? Colors.errorRed : isFocused ? Colors.forestGreen : Colors.textMuted}
            />
          </View>
        )}

        <TextInput
          style={[styles.input, { paddingLeft: iconName ? 8 : 16 }]}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selectionColor={Colors.forestGreen}
          autoCapitalize="none"
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Feather name="alert-circle" size={13} color={Colors.errorRed} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.2,
    borderRadius: Radii.input,
    paddingHorizontal: 14,
    ...Platform.select({
      web: {
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
      },
    }),
  },
  iconContainer: {
    marginRight: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: Colors.textPrimary,
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 4,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.errorRed,
    fontWeight: '500',
  },
});

export default CustomInput;

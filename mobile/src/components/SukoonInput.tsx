import React from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { colors } from "../theme/colors";

interface SukoonInputProps extends TextInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function SukoonInput({
  label,
  helperText,
  error,
  containerStyle,
  style,
  ...props
}: SukoonInputProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        accessible={true}
        accessibilityLabel={label || props.placeholder}
        accessibilityHint={helperText}
        {...props}
      />
      {error ? (
        <Text style={styles.errorText} accessibilityRole="alert">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: "100%",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
  },
  helperText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 4,
    fontWeight: "500",
  },
});


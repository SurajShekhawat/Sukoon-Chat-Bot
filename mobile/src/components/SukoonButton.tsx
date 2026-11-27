import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { colors } from "../theme/colors";

interface SukoonButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  disabled?: boolean;
  isLoading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function SukoonButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  isLoading = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: SukoonButtonProps) {
  const isInteractive = !disabled && !isLoading;

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case "secondary":
        return styles.secondaryContainer;
      case "outline":
        return styles.outlineContainer;
      case "danger":
        return styles.dangerContainer;
      case "primary":
      default:
        return styles.primaryContainer;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "secondary":
        return styles.secondaryText;
      case "outline":
        return styles.outlineText;
      case "danger":
        return styles.dangerText;
      case "primary":
      default:
        return styles.primaryText;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!isInteractive}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !isInteractive, busy: isLoading }}
      style={[
        styles.baseContainer,
        getContainerStyle(),
        !isInteractive && styles.disabledContainer,
        style,
      ]}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "outline" ? colors.primary : colors.textInverse}
        />
      ) : (
        <Text style={[styles.baseText, getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    flexDirection: "row",
  },
  baseText: {
    fontSize: 15,
    fontWeight: "600",
  },
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryContainer: {
    backgroundColor: colors.primarySurface,
  },
  secondaryText: {
    color: colors.primary,
  },
  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.textPrimary,
  },
  dangerContainer: {
    backgroundColor: colors.danger,
  },
  dangerText: {
    color: colors.textInverse,
  },
  disabledContainer: {
    opacity: 0.5,
  },
});


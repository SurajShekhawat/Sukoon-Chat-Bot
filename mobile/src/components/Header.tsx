import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function Header({ title, subtitle, onBack, rightAction }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightAction && <View style={styles.right}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWarm,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 12,
    paddingHorizontal: 6,
    justifyContent: "center",
  },
  backText: {
    fontSize: 28,
    color: colors.primary,
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
});


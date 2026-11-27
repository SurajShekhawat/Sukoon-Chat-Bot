import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

interface OfflineBannerProps {
  isOffline: boolean;
}

export function OfflineBanner({ isOffline }: OfflineBannerProps) {
  if (!isOffline) return null;

  return (
    <View
      style={styles.banner}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel="No internet connection. Sukoon is currently offline."
    >
      <Text style={styles.text}>
        You are currently offline. Check your internet connection to continue chatting.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warningSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.warningBorder,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  text: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: "600",
    textAlign: "center",
  },
});


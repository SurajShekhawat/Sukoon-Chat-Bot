import React from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { env } from "../config/env";

export function EmergencyCard() {
  const handleCall = (number: string) => {
    const cleanNumber = number.replace(/[^0-9+]/g, "");
    Linking.openURL(`tel:${cleanNumber}`);
  };

  return (
    <View style={styles.card} accessible={true} accessibilityLabel="Crisis Support and Emergency Helplines">
      <View style={styles.header}>
        <Text style={styles.title}>24/7 Free Immediate Crisis Support</Text>
        <Text style={styles.description}>
          Sukoon is an AI companion for everyday reflection, not a crisis service. If you or someone you know is in distress or feeling unsafe, please reach out directly:
        </Text>
      </View>

      <View style={styles.helplineList}>
        {env.HELPLINES.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.helplineRow}
            onPress={() => handleCall(item.number)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Call ${item.name} at ${item.number}`}
            accessibilityHint="Opens phone dialer"
          >
            <View style={styles.helplineInfo}>
              <Text style={styles.helplineName}>{item.name}</Text>
              <Text style={styles.helplineTiming}>{item.timing}</Text>
            </View>
            <View style={styles.callBadge}>
              <Text style={styles.callNumber}>{item.number}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footer}>
        Always free, confidential, and available in multiple Indian languages.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginVertical: 12,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.danger,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  helplineList: {
    gap: 8,
    marginVertical: 8,
  },
  helplineRow: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  helplineInfo: {
    flex: 1,
    marginRight: 8,
  },
  helplineName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  helplineTiming: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  callBadge: {
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  callNumber: {
    color: colors.textInverse,
    fontWeight: "700",
    fontSize: 13,
  },
  footer: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
});


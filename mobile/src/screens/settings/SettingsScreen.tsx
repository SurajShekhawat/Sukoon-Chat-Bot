import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { Header } from "../../components/Header";
import { EmergencyCard } from "../../components/EmergencyCard";
import { SukoonButton } from "../../components/SukoonButton";
import { colors } from "../../theme/colors";

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await api.exportData();
      Alert.alert(
        "Data Export Ready",
        `Your Sukoon data archive contains ${data.conversations?.length || 0} reflections, ${data.memories?.length || 0} memories, and ${data.mood_entries?.length || 0} mood logs. Under DPDP Act 2023 & GDPR, you have full ownership of your data.`
      );
    } catch (err: any) {
      Alert.alert("Export Failed", err.message || "Could not generate data export archive.");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Purge Account & Data",
      "This action will permanently delete all your conversations, consent records, memories, and mood logs under Right to be Forgotten. This CANNOT be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Permanently Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await api.deleteAccount();
              await signOut();
            } catch (err: any) {
              Alert.alert("Delete Failed", err.message || "Failed to purge account.");
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of Sukoon?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title="Settings & Safety" subtitle="Privacy and safety controls" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Account Info Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account & Session</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Signed in as:</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {user?.email || "Authenticated User"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Encryption & Auth:</Text>
            <Text style={styles.infoValue}>Hardware Keystore (AES-256)</Text>
          </View>
        </View>

        {/* Helplines Card */}
        <EmergencyCard />

        {/* Privacy & Data Ownership Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Data Portability & Privacy</Text>
          <Text style={styles.cardDescription}>
            In compliance with the India DPDP Act 2023 and GDPR Article 20, you retain full ownership and portability of your reflections and memories.
          </Text>

          <SukoonButton
            title="Download Personal Data Export"
            variant="outline"
            onPress={handleExport}
            isLoading={exporting}
            style={styles.actionBtn}
          />
        </View>

        {/* Danger Zone */}
        <View style={[styles.card, styles.dangerCard]}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.cardDescription}>
            Execute an irreversible cascading deletion of your user account, chats, and vault records.
          </Text>

          <SukoonButton
            title="Purge My Account & Data"
            variant="danger"
            onPress={handleDeleteAccount}
            isLoading={deleting}
            style={styles.actionBtn}
          />
        </View>

        {/* Sign Out Button */}
        <SukoonButton
          title="Sign Out"
          variant="secondary"
          onPress={handleSignOut}
          style={styles.signOutBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderWarm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderWarm,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
    maxWidth: "60%",
  },
  actionBtn: {
    height: 44,
  },
  dangerCard: {
    borderColor: colors.dangerBorder,
    backgroundColor: colors.dangerSurface,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.danger,
    marginBottom: 4,
  },
  signOutBtn: {
    marginTop: 8,
  },
});


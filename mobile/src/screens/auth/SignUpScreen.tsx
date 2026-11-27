import React, { useState } from "react";
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { SukoonInput } from "../../components/SukoonInput";
import { SukoonButton } from "../../components/SukoonButton";
import { colors } from "../../theme/colors";

const LANGUAGES = [
  { id: "hinglish", label: "Hinglish (Natural Blend)" },
  { id: "hi", label: "हिन्दी (Hindi)" },
  { id: "en", label: "English" },
];

export function SignUpScreen({ navigation }: { navigation: any }) {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [language, setLanguage] = useState("hinglish");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    const result = await signUp(
      email,
      password,
      displayName || "Friend",
      language
    );
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.successMessage) {
      setSuccess(result.successMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Your Safe Space</Text>
          <Text style={styles.cardSubtitle}>
            A confidential environment designed for calm and mindful reflections.
          </Text>

          {error && (
            <View style={styles.errorAlert} accessible={true} accessibilityRole="alert">
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          )}

          {success && (
            <View style={styles.successAlert} accessible={true} accessibilityRole="status">
              <Text style={styles.successAlertText}>{success}</Text>
            </View>
          )}

          <SukoonInput
            label="Preferred Name or Nickname"
            placeholder="e.g. Priya or Rahul"
            value={displayName}
            onChangeText={setDisplayName}
            helperText="How your companion will gently address you."
            editable={!loading}
          />

          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>Preferred Conversation Language</Text>
            <View style={styles.languageOptions}>
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.id;
                return (
                  <TouchableOpacity
                    key={lang.id}
                    onPress={() => setLanguage(lang.id)}
                    style={[
                      styles.langChip,
                      isSelected && styles.langChipSelected,
                    ]}
                    accessible={true}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={lang.label}
                  >
                    <Text
                      style={[
                        styles.langChipText,
                        isSelected && styles.langChipTextSelected,
                      ]}
                    >
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <SukoonInput
            label="Email Address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <SukoonInput
            label="Password"
            placeholder="At least 8 characters"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              Sukoon is an AI companion, not a medical or clinical crisis provider.
              By registering, you agree to our non-clinical pledge and privacy protections.
            </Text>
          </View>

          <SukoonButton
            title="Create Free Account"
            onPress={handleSignUp}
            isLoading={loading}
            style={styles.submitBtn}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.switchLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    marginTop: 4,
    lineHeight: 18,
  },
  errorAlert: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorAlertText: {
    fontSize: 13,
    color: colors.danger,
    fontWeight: "500",
  },
  successAlert: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  successAlertText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: "500",
  },
  languageSection: {
    marginBottom: 16,
  },
  languageLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  languageOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  langChip: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.cardSecondary,
  },
  langChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  langChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  langChipTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  disclaimerBox: {
    backgroundColor: colors.cardSecondary,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: 4,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    alignItems: "center",
  },
  switchPrompt: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  switchLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },
});


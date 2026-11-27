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

export function LoginScreen({ navigation }: { navigation: any }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
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
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>सुकून</Text>
          </View>
          <Text style={styles.brandTitle}>Sukoon AI</Text>
          <Text style={styles.brandSubtitle}>Your reflective companion for emotional calm</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>
            Sign in to continue your private reflections.
          </Text>

          {error && (
            <View style={styles.errorAlert} accessible={true} accessibilityRole="alert">
              <Text style={styles.errorAlertText}>{error}</Text>
            </View>
          )}

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
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          <SukoonButton
            title="Sign In"
            onPress={handleSignIn}
            isLoading={loading}
            style={styles.submitBtn}
            accessibilityLabel="Sign in button"
            accessibilityHint="Double tap to sign in to your Sukoon account"
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchPrompt}>New to Sukoon? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("SignUp")}
              accessible={true}
              accessibilityRole="link"
              accessibilityLabel="Create an account"
            >
              <Text style={styles.switchLink}>Create an account</Text>
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
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 12,
  },
  logoBadgeText: {
    color: colors.textInverse,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  brandSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
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
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
    marginTop: 4,
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
  submitBtn: {
    marginTop: 8,
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


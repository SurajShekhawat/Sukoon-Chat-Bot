import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { SignUpScreen } from "../screens/auth/SignUpScreen";
import { ConversationListScreen } from "../screens/chat/ConversationListScreen";
import { ChatScreen } from "../screens/chat/ChatScreen";
import { MemoryVaultScreen } from "../screens/memory/MemoryVaultScreen";
import { MoodJournalScreen } from "../screens/mood/MoodJournalScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { colors } from "../theme/colors";
import {
  AuthStackParamList,
  ChatStackParamList,
  AppTabParamList,
} from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const AppTab = createBottomTabNavigator<AppTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
    </AuthStack.Navigator>
  );
}

function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatStack.Screen name="ConversationList" component={ConversationListScreen} />
      <ChatStack.Screen name="Chat" component={ChatScreen} />
    </ChatStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderWarm,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <AppTab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          tabBarLabel: "Reflect",
          tabBarAccessibilityLabel: "Reflect and Chat Tab",
        }}
      />
      <AppTab.Screen
        name="MemoryTab"
        component={MemoryVaultScreen}
        options={{
          tabBarLabel: "Vault",
          tabBarAccessibilityLabel: "Memory Vault Tab",
        }}
      />
      <AppTab.Screen
        name="MoodTab"
        component={MoodJournalScreen}
        options={{
          tabBarLabel: "Journal",
          tabBarAccessibilityLabel: "Mood Journal Tab",
        }}
      />
      <AppTab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: "Settings",
          tabBarAccessibilityLabel: "Settings and Safety Tab",
        }}
      />
    </AppTab.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>सुकून</Text>
        </View>
        <Text style={styles.appName}>Sukoon AI</Text>
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  logoBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
  },
  logoText: {
    color: colors.textInverse,
    fontSize: 24,
    fontWeight: "800",
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  loader: {
    marginTop: 20,
  },
});


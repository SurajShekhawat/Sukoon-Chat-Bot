import { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type ChatStackParamList = {
  ConversationList: undefined;
  Chat: { conversationId: string; title: string };
};

export type AppTabParamList = {
  ChatTab: NavigatorScreenParams<ChatStackParamList>;
  MemoryTab: undefined;
  MoodTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
};


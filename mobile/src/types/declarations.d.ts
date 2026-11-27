declare module "react-native" {
  export const Platform: {
    OS: "ios" | "android" | "web" | string;
    select: <T>(obj: Record<string, T>) => T;
  };
  export const StyleSheet: {
    create: <T extends Record<string, any>>(styles: T) => T;
  };
  export const Linking: {
    openURL: (url: string) => Promise<any>;
  };
  export const View: any;
  export const Text: any;
  export const TouchableOpacity: any;
  export const TextInput: any;
  export const FlatList: any;
  export const ScrollView: any;
  export const Switch: any;
  export const Alert: {
    alert: (title: string, message?: string, buttons?: any[], options?: any) => void;
  };
  export const ActivityIndicator: any;
  export const KeyboardAvoidingView: any;
  export const RefreshControl: any;
  export type ViewStyle = any;
  export type TextStyle = any;
  export type TextInputProps = any;
}

declare module "expo-secure-store" {
  export const AFTER_FIRST_UNLOCK = "AFTER_FIRST_UNLOCK";
  export function getItemAsync(key: string, options?: any): Promise<string | null>;
  export function setItemAsync(key: string, value: string, options?: any): Promise<void>;
  export function deleteItemAsync(key: string, options?: any): Promise<void>;
}

declare module "expo-status-bar" {
  export const StatusBar: any;
}

declare module "react-native-safe-area-context" {
  export const SafeAreaProvider: any;
  export const SafeAreaView: any;
}

declare module "@react-navigation/native" {
  export const NavigationContainer: any;
  export type NavigatorScreenParams<T> = any;
}

declare module "@react-navigation/native-stack" {
  export function createNativeStackNavigator<T = any>(): any;
}

declare module "@react-navigation/bottom-tabs" {
  export function createBottomTabNavigator<T = any>(): any;
}

declare module "expo" {
  export function registerRootComponent(component: any): void;
}

declare module "react-native-url-polyfill/auto" {}


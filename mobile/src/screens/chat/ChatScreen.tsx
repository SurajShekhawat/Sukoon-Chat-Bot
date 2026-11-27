import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { api, MessageItem } from "../../services/api";
import { Header } from "../../components/Header";
import { EmergencyCard } from "../../components/EmergencyCard";
import { colors } from "../../theme/colors";

const QUICK_PROMPTS = [
  "Aaj mann thoda bhari hai",
  "Office mein burnout feel ho raha hai",
  "Need to untangle my thoughts",
  "Bas thodi der baat karni hai",
];

export function ChatScreen({ route, navigation }: { route: any; navigation: any }) {
  const { conversationId, title } = route.params;
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const flatListRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const data = await api.getConversation(conversationId);
      setMessages(data.messages || []);
    } catch (err: any) {
      console.warn("Failed to load conversation history:", err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleSend = async (retryContent?: string) => {
    const textToSend = (retryContent || inputText).trim();
    if (!textToSend || isStreaming) return;

    if (!retryContent) {
      setInputText("");
    }
    setStreamError(null);

    const userMessage: MessageItem = {
      id: `client-user-${Date.now()}`,
      conversation_id: conversationId,
      role: "user",
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    const pendingAssistantId = `client-assistant-${Date.now()}`;
    const initialAssistantMessage: MessageItem = {
      id: pendingAssistantId,
      conversation_id: conversationId,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let accumulatedContent = "";

    await api.sendStreamingMessage({
      conversationId,
      message: textToSend,
      language: "hinglish",
      abortSignal: controller.signal,
      onChunk: (chunk: string) => {
        accumulatedContent += chunk;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingAssistantId ? { ...m, content: accumulatedContent } : m
          )
        );
      },
      onDone: (meta) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        if (meta?.assistantMessageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === pendingAssistantId ? { ...m, id: meta.assistantMessageId! } : m
            )
          );
        }
      },
      onError: (err: string) => {
        setIsStreaming(false);
        abortControllerRef.current = null;
        setStreamError(err);
      },
    });
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setIsNearBottom(true);
  };

  const handleCopy = (content: string, id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderItem = ({ item }: { item: MessageItem }) => {
    const isUser = item.role === "user";
    const isCopied = copiedId === item.id;
    const hasCrisisHelpline =
      !isUser &&
      (item.content.includes("14416") ||
        item.content.includes("Tele-MANAS") ||
        item.content.includes("1800-599-0019"));

    const formattedTime = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    return (
      <View style={[styles.bubbleWrapper, isUser ? styles.bubbleUserWrapper : styles.bubbleAssistantWrapper]}>
        {!isUser && (
          <View style={styles.assistantHeaderRow}>
            <Text style={styles.assistantTag}>✨ Sukoon • सुकून</Text>
            {formattedTime ? <Text style={styles.timestampText}>{formattedTime}</Text> : null}
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`${isUser ? "You said: " : "Sukoon said: "} ${item.content || "thinking..."}`}
        >
          {item.content ? (
            <Text style={isUser ? styles.userText : styles.assistantText}>
              {item.content}
            </Text>
          ) : (
            <View style={styles.thinkingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.thinkingText}>Sukoon is reflecting softly...</Text>
            </View>
          )}
        </View>

        {isUser && formattedTime ? (
          <Text style={[styles.timestampText, styles.userTimestamp]}>{formattedTime}</Text>
        ) : null}

        {/* Copy Button for Assistant */}
        {!isUser && item.content && !isStreaming && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => handleCopy(item.content, item.id)}
              style={styles.copyBtn}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Copy response"
            >
              <Text style={[styles.copyBtnText, isCopied && styles.copyBtnTextSuccess]}>
                {isCopied ? "✓ Copied" : "Copy"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {hasCrisisHelpline && (
          <View style={styles.emergencyContainer}>
            <EmergencyCard />
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <Header
        title={title || "Sukoon Reflection"}
        subtitle="End-to-End Encrypted • Non-Clinical"
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Opening safe space...</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item: MessageItem) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.messageList}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            windowSize={5}
            onScroll={(e: any) => {
              const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
              const paddingToBottom = 120;
              const isClose =
                layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
              setIsNearBottom(isClose);
            }}
            scrollEventThrottle={100}
            onContentSizeChange={() => {
              if (isNearBottom) {
                flatListRef.current?.scrollToEnd({ animated: true });
              }
            }}
          />

          {/* Floating Jump to Latest Button */}
          {!isNearBottom && messages.length > 0 && (
            <TouchableOpacity
              style={styles.floatingScrollBtn}
              onPress={scrollToBottom}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Scroll to latest messages"
            >
              <Text style={styles.floatingScrollText}>↓ Latest</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {streamError && (
        <View style={styles.errorBanner} accessible={true} accessibilityRole="alert">
          <Text style={styles.errorText} numberOfLines={2}>
            {streamError}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
              if (lastUserMsg) handleSend(lastUserMsg.content);
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Retry sending message"
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Prompts Row */}
      {!inputText && !isStreaming && (
        <View style={styles.quickPromptsContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={QUICK_PROMPTS}
            keyExtractor={(item: string) => item}
            renderItem={({ item }: { item: string }) => (
              <TouchableOpacity
                style={styles.quickPromptChip}
                onPress={() => setInputText(item)}
                accessible={true}
                accessibilityRole="button"
              >
                <Text style={styles.quickPromptText}>{item}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.quickPromptsList}
          />
        </View>
      )}

      {/* Floating Input Dock */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Share what is on your mind... दिल की बात कहें"
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={4000}
          editable={!isStreaming}
          accessible={true}
          accessibilityLabel="Message input field"
          accessibilityHint="Type your thoughts here to reflect with Sukoon"
        />

        {isStreaming ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.stopBtn]}
            onPress={handleStop}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Stop generation"
          >
            <View style={styles.stopSquare} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flex: 1,
    position: "relative",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  messageList: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  bubbleWrapper: {
    width: "100%",
  },
  bubbleUserWrapper: {
    alignItems: "flex-end",
  },
  bubbleAssistantWrapper: {
    alignItems: "flex-start",
  },
  assistantHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
    marginLeft: 4,
  },
  assistantTag: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  timestampText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  userTimestamp: {
    marginRight: 4,
    marginTop: 2,
  },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  userText: {
    color: colors.textInverse,
    fontSize: 14.5,
    lineHeight: 21,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    borderBottomLeftRadius: 4,
  },
  assistantText: {
    color: colors.textPrimary,
    fontSize: 14.5,
    lineHeight: 22,
  },
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  thinkingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 4,
    marginLeft: 4,
  },
  copyBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.primarySurface,
  },
  copyBtnText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  copyBtnTextSuccess: {
    color: "#059669",
  },
  floatingScrollBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingScrollText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  emergencyContainer: {
    width: "100%",
    marginTop: 8,
  },
  errorBanner: {
    backgroundColor: colors.dangerSurface,
    borderTopWidth: 1,
    borderTopColor: colors.dangerBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.danger,
    marginRight: 8,
  },
  retryBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  retryBtnText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: "700",
  },
  quickPromptsContainer: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderWarm,
    backgroundColor: colors.surface,
  },
  quickPromptsList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickPromptChip: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderWarm,
  },
  quickPromptText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderWarm,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14.5,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderWarm,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtn: {
    backgroundColor: colors.primary,
  },
  sendBtnDisabled: {
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  sendBtnText: {
    color: colors.textInverse,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 24,
  },
  stopBtn: {
    backgroundColor: "#F43F5E",
  },
  stopSquare: {
    width: 14,
    height: 14,
    backgroundColor: colors.textInverse,
    borderRadius: 2,
  },
});

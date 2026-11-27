import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { api, ConversationItem } from "../../services/api";
import { Header } from "../../components/Header";
import { colors } from "../../theme/colors";

export function ConversationListScreen({ navigation }: { navigation: any }) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.getConversations();
      setConversations(data || []);
    } catch (err: any) {
      console.warn("Failed to load conversations:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleNewConversation = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const newConv = await api.createConversation("New Reflection");
      navigation.navigate("Chat", { conversationId: newConv.id, title: newConv.title });
      loadConversations();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create a new reflection.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Reflection",
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const previous = conversations;
            setConversations((prev) => prev.filter((c) => c.id !== id));
            try {
              await api.deleteConversation(id);
            } catch (err: any) {
              setConversations(previous);
              Alert.alert("Error", err.message || "Failed to delete reflection.");
            }
          },
        },
      ]
    );
  };

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const renderItem = ({ item }: { item: ConversationItem }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() =>
        navigation.navigate("Chat", { conversationId: item.id, title: item.title })
      }
      onLongPress={() => handleDelete(item.id, item.title)}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Conversation: ${item.title}`}
      accessibilityHint="Tap to open, hold to delete"
    >
      <View style={styles.cardHeader}>
        <Text style={styles.conversationTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.conversationTime}>
          {new Date(item.updated_at || item.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardSubtitle}>Tap to resume calm reflection</Text>
        <Text style={styles.holdHint}>Hold to delete</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Reflections"
        subtitle="Your private conversations"
        rightAction={
          <TouchableOpacity
            style={styles.newBtn}
            onPress={handleNewConversation}
            disabled={creating}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Start a new reflection"
          >
            {creating ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.newBtnText}>+ New</Text>
            )}
          </TouchableOpacity>
        }
      />

      {/* Search & Statistics Section */}
      <View style={styles.searchSection}>
        <View style={styles.statChip}>
          <Text style={styles.statChipText}>
            {conversations.length} {conversations.length === 1 ? "Reflection" : "Reflections"} • Encrypted
          </Text>
        </View>

        {conversations.length > 2 && (
          <TextInput
            style={styles.searchInput}
            placeholder="Search reflections by title..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            accessible={true}
            accessibilityLabel="Search reflections"
          />
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your safe space...</Text>
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>🌱</Text>
          </View>
          <Text style={styles.emptyTitle}>No reflections yet</Text>
          <Text style={styles.emptySubtitle}>
            Whenever you need a calm listening ear, start a conversation.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={handleNewConversation}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Begin your first conversation"
          >
            <Text style={styles.emptyBtnText}>Start First Reflection</Text>
          </TouchableOpacity>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No matching reflections</Text>
          <Text style={styles.emptySubtitle}>Try searching with a different term.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  newBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newBtnText: {
    color: colors.textInverse,
    fontWeight: "700",
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  statChip: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  conversationCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  conversationTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  conversationTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  holdHint: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySurface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 18,
  },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: colors.textInverse,
    fontWeight: "700",
    fontSize: 14,
  },
});

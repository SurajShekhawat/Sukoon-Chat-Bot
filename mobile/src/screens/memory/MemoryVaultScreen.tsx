import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Switch,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { api, MemoryItem } from "../../services/api";
import { Header } from "../../components/Header";
import { colors } from "../../theme/colors";

const CATEGORIES = ["all", "preference", "context", "goal", "other"];

export function MemoryVaultScreen() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [consentGranted, setConsentGranted] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingConsent, setTogglingConsent] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadMemories = useCallback(async () => {
    try {
      const data = await api.getMemories();
      setMemories(data.memories || []);
      setConsentGranted(data.consentGranted);
    } catch (err: any) {
      console.warn("Failed to load memories:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const handleConsentToggle = async (newConsent: boolean) => {
    setTogglingConsent(true);
    const previousConsent = consentGranted;
    // Optimistic update
    setConsentGranted(newConsent);
    try {
      await api.setMemoryConsent(newConsent);
    } catch (err: any) {
      setConsentGranted(previousConsent);
      Alert.alert("Error", err.message || "Failed to update memory consent.");
    } finally {
      setTogglingConsent(false);
    }
  };

  const handleToggleItem = async (id: string, currentStatus: boolean) => {
    // Optimistic toggle
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_active: !currentStatus } : m))
    );
    try {
      await api.toggleMemoryActive(id, !currentStatus);
    } catch (err: any) {
      // Revert on failure
      setMemories((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_active: currentStatus } : m))
      );
      Alert.alert("Error", err.message || "Failed to update memory.");
    }
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      "Delete Memory",
      "Are you sure you want to permanently delete this memory? Sukoon will forget it immediately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Forever",
          style: "destructive",
          onPress: async () => {
            const previousMemories = memories;
            setMemories((prev) => prev.filter((m) => m.id !== id));
            try {
              await api.deleteMemory(id);
            } catch (err: any) {
              setMemories(previousMemories);
              Alert.alert("Error", err.message || "Failed to delete memory.");
            }
          },
        },
      ]
    );
  };

  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const matchesCategory =
        selectedCategory === "all" ||
        (m.category && m.category.toLowerCase().includes(selectedCategory));
      const matchesSearch =
        !searchQuery.trim() ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        m.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [memories, selectedCategory, searchQuery]);

  const activeCount = useMemo(() => memories.filter((m) => m.is_active).length, [memories]);

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case "preference":
        return { bg: "#EEF2FF", text: "#4F46E5" };
      case "context":
        return { bg: "#F0FDFA", text: "#0F766E" };
      case "goal":
        return { bg: "#FEF3C7", text: "#B45309" };
      default:
        return { bg: colors.primarySurface, text: colors.primary };
    }
  };

  const renderItem = ({ item }: { item: MemoryItem }) => {
    const badgeColors = getCategoryColor(item.category);
    return (
      <View style={[styles.memoryCard, !item.is_active && styles.memoryCardInactive]}>
        <View style={styles.cardTop}>
          <View style={[styles.categoryBadge, { backgroundColor: badgeColors.bg }]}>
            <Text style={[styles.categoryText, { color: badgeColors.text }]}>
              {item.category.replace("_", " ")}
            </Text>
          </View>
          <View style={styles.switchWrapper}>
            <Text style={styles.switchLabel}>
              {item.is_active ? "Active" : "Paused"}
            </Text>
            <Switch
              value={item.is_active}
              onValueChange={() => handleToggleItem(item.id, item.is_active)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.surface}
              accessible={true}
              accessibilityLabel={`Memory active toggle: ${item.content}`}
            />
          </View>
        </View>

        <Text style={[styles.content, !item.is_active && styles.contentInactive]}>
          {item.content}
        </Text>

        <View style={styles.cardBottom}>
          <Text style={styles.date}>
            Saved {new Date(item.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item.id)}
            style={styles.deleteBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete this memory"
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Memory Vault"
        subtitle="Consent-driven reflection history"
      />

      {/* Master Consent Switch Card */}
      <View style={styles.consentCard}>
        <View style={styles.consentInfo}>
          <View style={styles.consentHeaderRow}>
            <Text style={styles.consentIcon}>🧠</Text>
            <Text style={styles.consentTitle}>Allow Memory Recall</Text>
          </View>
          <Text style={styles.consentSubtitle}>
            When enabled, Sukoon remembers your context & preferences between reflections.
          </Text>
        </View>
        {togglingConsent ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            value={consentGranted}
            onValueChange={handleConsentToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            accessible={true}
            accessibilityLabel="Master memory recall consent switch"
          />
        )}
      </View>

      {!consentGranted && (
        <View style={styles.revokedNotice} accessible={true} accessibilityRole="alert">
          <Text style={styles.revokedNoticeIcon}>🔒</Text>
          <Text style={styles.revokedNoticeText}>
            Memory recall is paused. Existing memories are locked and will not be accessed during reflections.
          </Text>
        </View>
      )}

      {/* Vault Statistics & Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.statsPillRow}>
          <View style={styles.statsPill}>
            <Text style={styles.statsPillText}>
              {activeCount} of {memories.length} Active
            </Text>
          </View>
          <View style={[styles.statsPill, { backgroundColor: "#F1F5F9" }]}>
            <Text style={[styles.statsPillText, { color: "#475569" }]}>
              {consentGranted ? "Recall Active" : "Recall Paused"}
            </Text>
          </View>
        </View>

        {memories.length > 2 && (
          <TextInput
            style={styles.searchInput}
            placeholder="Search saved memories..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            accessible={true}
            accessibilityLabel="Search saved memories"
          />
        )}

        {/* Category Chips */}
        {memories.length > 0 && (
          <View style={styles.chipsRow}>
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[styles.chipText, isSelected && styles.chipTextSelected]}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Accessing secure vault...</Text>
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>🔒</Text>
          </View>
          <Text style={styles.emptyTitle}>Your Vault is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Sukoon only saves memories you explicitly choose to remember. Nothing is recorded without your say.
          </Text>
        </View>
      ) : filteredMemories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No matching memories</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search query or category filter.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMemories}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadMemories();
              }}
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
  consentCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  consentInfo: {
    flex: 1,
    marginRight: 12,
  },
  consentHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  consentIcon: {
    fontSize: 16,
  },
  consentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  consentSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  revokedNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.warningSurface,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 6,
    padding: 12,
    gap: 8,
  },
  revokedNoticeIcon: {
    fontSize: 14,
  },
  revokedNoticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning,
    fontWeight: "600",
    lineHeight: 16,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  statsPillRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  statsPill: {
    backgroundColor: colors.primarySurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsPillText: {
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
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderWarm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  memoryCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  memoryCardInactive: {
    opacity: 0.65,
    backgroundColor: "#F8FAFC",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  switchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  switchLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  content: {
    fontSize: 14.5,
    color: colors.textPrimary,
    lineHeight: 21,
    marginBottom: 12,
  },
  contentInactive: {
    color: colors.textSecondary,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderWarm,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
  },
  deleteBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "600",
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
    lineHeight: 18,
  },
});

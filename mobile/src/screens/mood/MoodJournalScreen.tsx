import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { api, MoodItem } from "../../services/api";
import { Header } from "../../components/Header";
import { SukoonButton } from "../../components/SukoonButton";
import { colors } from "../../theme/colors";

const MOOD_OPTIONS = [
  { score: 1, label: "Overwhelmed", emoji: "😔" },
  { score: 2, label: "Restless", emoji: "😟" },
  { score: 3, label: "Steady", emoji: "😐" },
  { score: 4, label: "Calm", emoji: "😌" },
  { score: 5, label: "Grateful", emoji: "😊" },
];

const QUICK_TAGS = ["Work", "Sleep", "Family", "Health", "Peace", "Gratitude"];

export function MoodJournalScreen() {
  const [entries, setEntries] = useState<MoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New check-in state
  const [selectedScore, setSelectedScore] = useState<number>(3);
  const [notes, setNotes] = useState("");

  const loadMoods = useCallback(async () => {
    try {
      const data = await api.getMoodEntries();
      setEntries(data.entries || []);
    } catch (err: any) {
      console.warn("Failed to load mood entries:", err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadMoods();
  }, [loadMoods]);

  const handleSaveCheckIn = async () => {
    const selectedOption = MOOD_OPTIONS.find((o) => o.score === selectedScore) || MOOD_OPTIONS[2];
    setSubmitting(true);
    try {
      const newEntry = await api.createMoodEntry({
        score: selectedScore,
        moodLabel: selectedOption.label,
        notes: notes.trim() || undefined,
      });
      setEntries((prev) => [newEntry, ...prev]);
      setNotes("");
      Alert.alert("Recorded", "Your mood check-in has been gently saved.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save mood check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = (id: string) => {
    Alert.alert(
      "Delete Check-In",
      "Remove this mood record from your reflection log?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const previous = entries;
            setEntries((prev) => prev.filter((e) => e.id !== id));
            try {
              await api.deleteMoodEntry(id);
            } catch (err: any) {
              setEntries(previous);
              Alert.alert("Error", err.message || "Failed to delete entry.");
            }
          },
        },
      ]
    );
  };

  const handleAddTag = (tag: string) => {
    setNotes((prev) => (prev.trim() ? `${prev.trim()} #${tag}` : `#${tag} `));
  };

  // Average mood calculation for the rhythm summary
  const averageMood = useMemo(() => {
    if (entries.length === 0) return null;
    const sum = entries.reduce((acc, curr) => acc + curr.score, 0);
    const avg = Math.round(sum / entries.length);
    return MOOD_OPTIONS.find((o) => o.score === avg) || MOOD_OPTIONS[2];
  }, [entries]);

  const renderHeader = () => (
    <View style={styles.headerSection}>
      {/* Mood Rhythm Overview Banner */}
      {entries.length > 0 && averageMood && (
        <View style={styles.rhythmBanner}>
          <Text style={styles.rhythmEmoji}>{averageMood.emoji}</Text>
          <View style={styles.rhythmTextCol}>
            <Text style={styles.rhythmTitle}>Weekly Rhythm: {averageMood.label}</Text>
            <Text style={styles.rhythmSubtitle}>
              Based on your last {entries.length} gentle check-ins.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.checkInCard}>
        <Text style={styles.cardTitle}>How are you feeling right now?</Text>
        <Text style={styles.cardSubtitle}>
          Check in with yourself without any judgment or pressure.
        </Text>

        <View style={styles.moodSelector}>
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = selectedScore === opt.score;
            return (
              <TouchableOpacity
                key={opt.score}
                style={[styles.moodBtn, isSelected && styles.moodBtnSelected]}
                onPress={() => setSelectedScore(opt.score)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${opt.score} of 5: ${opt.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                <Text
                  style={[
                    styles.moodBtnLabel,
                    isSelected && styles.moodBtnLabelSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick Feeling Tags */}
        <View style={styles.tagsRow}>
          {QUICK_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => handleAddTag(tag)}
              style={styles.tagChip}
              accessible={true}
              accessibilityRole="button"
            >
              <Text style={styles.tagChipText}>+{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.notesInput}
          placeholder="Add an optional reflection note..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          accessible={true}
          accessibilityLabel="Optional journal note"
        />

        <SukoonButton
          title="Save Check-In"
          onPress={handleSaveCheckIn}
          isLoading={submitting}
          style={styles.saveBtn}
        />
      </View>

      <View style={styles.disclaimerPill}>
        <Text style={styles.disclaimerText}>
          Personal Reflection Only: Sukoon mood trends are gentle self-reflections and do not constitute clinical diagnosis or therapy.
        </Text>
      </View>

      <Text style={styles.historyHeading}>Recent Reflections</Text>
    </View>
  );

  const renderItem = ({ item }: { item: MoodItem }) => {
    const option = MOOD_OPTIONS.find((o) => o.score === item.score);
    return (
      <View style={styles.entryCard}>
        <View style={styles.entryTop}>
          <View style={styles.entryMoodRow}>
            <Text style={styles.entryEmoji}>{option?.emoji || "🌱"}</Text>
            <View>
              <Text style={styles.entryLabel}>{item.mood_label}</Text>
              <Text style={styles.entryDate}>
                {new Date(item.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteEntry(item.id)}
            style={styles.deleteBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Delete entry"
          >
            <Text style={styles.entryDeleteText}>✕</Text>
          </TouchableOpacity>
        </View>
        {item.notes ? <Text style={styles.entryNotes}>{item.notes}</Text> : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Mood Journal" subtitle="Track your emotional rhythm" />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading your journal...</Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
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
                loadMoods();
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerSection: {
    marginBottom: 16,
  },
  rhythmBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySurface,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    marginBottom: 12,
    gap: 12,
  },
  rhythmEmoji: {
    fontSize: 28,
  },
  rhythmTextCol: {
    flex: 1,
  },
  rhythmTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.primary,
  },
  rhythmSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkInCard: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  moodSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  moodBtn: {
    alignItems: "center",
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    width: "18%",
  },
  moodBtnSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodBtnLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  moodBtnLabelSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tagChip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  tagChipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  saveBtn: {
    height: 44,
  },
  disclaimerPill: {
    backgroundColor: colors.cardSecondary,
    padding: 12,
    borderRadius: 14,
    marginVertical: 14,
  },
  disclaimerText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    textAlign: "center",
  },
  historyHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  entryCard: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderWarm,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  entryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  entryMoodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  entryEmoji: {
    fontSize: 24,
  },
  entryLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  entryDate: {
    fontSize: 11,
    color: colors.textMuted,
  },
  deleteBtn: {
    padding: 4,
  },
  entryDeleteText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  entryNotes: {
    marginTop: 10,
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 19,
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
});

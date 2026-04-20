import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Meeting, useMeetings } from '@/hooks/use-meetings';

function MeetingCard({
  meeting,
  colorScheme,
  onPress,
  onDelete,
}: {
  meeting: Meeting;
  colorScheme: 'light' | 'dark';
  onPress: () => void;
  onDelete: () => void;
}) {
  const cardBg = colorScheme === 'dark' ? '#1e2022' : '#f8f9fa';
  const borderColor = colorScheme === 'dark' ? '#2c2f31' : '#e8ebed';

  const confirmDelete = () => {
    Alert.alert(
      'Delete Meeting',
      `Are you sure you want to delete "${meeting.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
      <TouchableOpacity style={styles.cardTappable} activeOpacity={0.75} onPress={onPress}>
        <View style={styles.cardLeft}>
          <View style={[styles.avatarCircle, { backgroundColor: Colors[colorScheme].tint + '22' }]}>
            <ThemedText style={[styles.avatarIcon, { color: Colors[colorScheme].tint }]}>
              🎙
            </ThemedText>
          </View>
        </View>
        <View style={styles.cardContent}>
          <ThemedText style={styles.cardTitle} numberOfLines={1}>
            {meeting.title}
          </ThemedText>
          <ThemedText style={[styles.cardMeta, { color: Colors[colorScheme].icon }]}>
            {meeting.date} · {meeting.duration}
          </ThemedText>
          <ThemedText style={[styles.cardParticipants, { color: Colors[colorScheme].icon }]}>
            👥 {meeting.participants} participant{meeting.participants !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        <ThemedText style={[styles.chevron, { color: Colors[colorScheme].icon }]}>›</ThemedText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={confirmDelete}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <ThemedText style={styles.deleteIcon}>🗑</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  return (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyIcon}>🎙️</ThemedText>
      <ThemedText style={styles.emptyTitle}>No meetings yet</ThemedText>
      <ThemedText style={[styles.emptySub, { color: Colors[colorScheme].icon }]}>
        Your saved meetings will appear here once you record one.
      </ThemedText>
    </View>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();
  const { meetings, loading, reload, deleteMeeting } = useMeetings();

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.pageTitle}>
            History
          </ThemedText>
          <ThemedText style={[styles.count, { color: Colors[colorScheme].icon }]}>
            {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors[colorScheme].tint} />
          </View>
        ) : meetings.length === 0 ? (
          <EmptyState colorScheme={colorScheme} />
        ) : (
          <FlatList
            data={meetings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MeetingCard
                meeting={item}
                colorScheme={colorScheme}
                onPress={() =>
                  router.push({
                    pathname: '/meeting-detail' as any,
                    params: {
                      id: item.id,
                      title: item.title,
                      date: item.date,
                      duration: item.duration,
                      participants: String(item.participants),
                      notes: item.notes,
                      participantNames: JSON.stringify(item.participantNames),
                      minutes: item.minutes,
                      boardText: item.boardText,
                    },
                  })
                }
                onDelete={() => deleteMeeting(item.id)}
              />
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: { fontSize: 32, fontWeight: '800' },
  count: { fontSize: 14 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingBottom: 24 },
  separator: { height: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingRight: 12,
  },
  cardTappable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  cardLeft: { justifyContent: 'center' },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 20 },
  cardContent: { flex: 1, gap: 3 },
  cardTitle: { fontSize: 16, fontWeight: '600' },
  cardMeta: { fontSize: 13 },
  cardParticipants: { fontSize: 12 },
  chevron: { fontSize: 24, fontWeight: '300' },
  deleteBtn: {
    padding: 6,
    marginLeft: 4,
  },
  deleteIcon: { fontSize: 18 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingBottom: 80,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptySub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});

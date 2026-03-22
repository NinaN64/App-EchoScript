import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type Meeting = {
  id: string;
  title: string;
  date: string;
  duration: string;
  participants: number;
};

export const MOCK_MEETINGS: Meeting[] = [
  {
    id: '1',
    title: 'Sprint Planning',
    date: 'Today, 10:00 AM',
    duration: '45 min',
    participants: 5,
  }
];

function MeetingCard({
  meeting,
  colorScheme,
  onPress,
}: {
  meeting: Meeting;
  colorScheme: 'light' | 'dark';
  onPress: () => void;
}) {
  const cardBg = colorScheme === 'dark' ? '#1e2022' : '#f8f9fa';
  const borderColor = colorScheme === 'dark' ? '#2c2f31' : '#e8ebed';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.avatarCircle, { backgroundColor: Colors[colorScheme].tint + '22' }]}>
          <ThemedText style={[styles.avatarIcon, { color: Colors[colorScheme].tint }]}>
            🎙
          </ThemedText>
        </View>
      </View>
      <View style={styles.cardContent}>
        <ThemedText style={styles.cardTitle}>{meeting.title}</ThemedText>
        <ThemedText style={[styles.cardMeta, { color: Colors[colorScheme].icon }]}>
          {meeting.date} · {meeting.duration}
        </ThemedText>
        <ThemedText style={[styles.cardParticipants, { color: Colors[colorScheme].icon }]}>
          👥 {meeting.participants} participants
        </ThemedText>
      </View>
      <ThemedText style={[styles.chevron, { color: Colors[colorScheme].icon }]}>›</ThemedText>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.pageTitle}>History</ThemedText>
          <ThemedText style={[styles.count, { color: Colors[colorScheme].icon }]}>
            {MOCK_MEETINGS.length} meetings
          </ThemedText>
        </View>
        <FlatList
          data={MOCK_MEETINGS}
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
                  },
                })
              }
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
  list: { paddingBottom: 24 },
  separator: { height: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
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
});

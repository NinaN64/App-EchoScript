import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMeetings } from '@/hooks/use-meetings';

export default function MeetingDetailScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { deleteMeeting } = useMeetings();

  const { id, title, date, duration, participants, notes, participantNames } =
    useLocalSearchParams<{
      id: string;
      title: string;
      date: string;
      duration: string;
      participants: string;
      notes: string;
      participantNames: string;
    }>();

  const confirmDelete = () => {
    Alert.alert(
      'Delete Meeting',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMeeting(id);
            router.back();
          },
        },
      ],
    );
  };

  const parsedParticipants: string[] = (() => {
    try {
      return participantNames ? JSON.parse(participantNames) : [];
    } catch {
      return [];
    }
  })();

  const cardBg = isDark ? '#1e2022' : '#f8f9fa';
  const borderColor = isDark ? '#2c2f31' : '#e8ebed';
  const metaColor = Colors[colorScheme].icon;
  const tint = Colors[colorScheme].tint;

  const infoPills: { label: string; value: string }[] = [
    { label: 'Date', value: date ?? '—' },
    { label: 'Duration', value: duration ?? '—' },
    { label: 'Participants', value: `${participants ?? '0'} people` },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ThemedText style={[styles.backIcon, { color: tint }]}>‹</ThemedText>
          <ThemedText style={[styles.backLabel, { color: tint }]}>History</ThemedText>
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.titleRow}>
            <View style={[styles.titleIcon, { backgroundColor: tint + '22' }]}>
              <ThemedText style={{ fontSize: 28 }}>🎙</ThemedText>
            </View>
            <ThemedText style={styles.meetingTitle}>{title ?? 'Meeting'}</ThemedText>
          </View>

          <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
            {infoPills.map((pill, i) => (
              <View key={pill.label}>
                <View style={styles.infoRow}>
                  <View style={styles.infoText}>
                    <ThemedText style={[styles.infoLabel, { color: metaColor }]}>
                      {pill.label}
                    </ThemedText>
                    <ThemedText style={styles.infoValue}>{pill.value}</ThemedText>
                  </View>
                </View>
                {i < infoPills.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: borderColor }]} />
                )}
              </View>
            ))}
          </View>

          {parsedParticipants.length > 0 && (
            <>
              <ThemedText style={[styles.sectionLabel, { color: metaColor }]}>
                PARTICIPANTS
              </ThemedText>
              <View style={[styles.infoCard, { backgroundColor: cardBg, borderColor }]}>
                {parsedParticipants.map((name, i) => (
                  <View key={name + i}>
                    <View style={styles.infoRow}>
                      <ThemedText style={{ fontSize: 18, width: 28, textAlign: 'center' }}>
                        👤
                      </ThemedText>
                      <ThemedText style={[styles.infoValue, { flex: 1 }]}>{name}</ThemedText>
                    </View>
                    {i < parsedParticipants.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: borderColor }]} />
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          {notes ? (
            <>
              <ThemedText style={[styles.sectionLabel, { color: metaColor }]}>NOTES</ThemedText>
              <View style={[styles.notesCard, { backgroundColor: cardBg, borderColor }]}>
                <ThemedText style={[styles.notesText, { color: Colors[colorScheme].text }]}>
                  {notes}
                </ThemedText>
              </View>
            </>
          ) : null}

          <ThemedText style={[styles.sectionLabel, { color: metaColor }]}>CONTENT</ThemedText>

          {(['Live Transcript', 'Uploaded Images'] as const).map((label) => (
            <TouchableOpacity
              key={label}
              style={[styles.actionButton, { backgroundColor: cardBg, borderColor }]}
              activeOpacity={0.75}
            >
              <ThemedText style={styles.actionLabel}>{label}</ThemedText>
              <ThemedText style={[styles.chevron, { color: metaColor }]}>›</ThemedText>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={[styles.editButton, { borderColor: tint }]}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.editLabel, { color: tint }]}>Edit Meeting</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton]}
            onPress={confirmDelete}
            activeOpacity={0.8}
          >
            <ThemedText style={styles.deleteLabel}>🗑  Delete Meeting</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
  },
  backIcon: { fontSize: 26, fontWeight: '300', lineHeight: 30 },
  backLabel: { fontSize: 17, fontWeight: '500' },
  scroll: { paddingTop: 16, paddingBottom: 48, gap: 14 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 6,
  },
  titleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    flex: 1,
    flexWrap: 'wrap',
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  infoText: { flex: 1, gap: 2 },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginLeft: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 6,
    marginBottom: -4,
    paddingHorizontal: 4,
  },
  notesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  notesText: { fontSize: 15, lineHeight: 24 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 14,
  },
  actionLabel: { flex: 1, fontSize: 16, fontWeight: '600' },
  chevron: { fontSize: 22, fontWeight: '300' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    gap: 10,
    marginTop: 8,
  },
  editLabel: { fontSize: 16, fontWeight: '700' },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    gap: 10,
    marginTop: 4,
  },
  deleteLabel: { fontSize: 16, fontWeight: '700', color: '#ef4444' },
});

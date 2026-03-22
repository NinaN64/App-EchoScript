import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function NewMeetingScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRecording]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0)
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (isRecording) {
      setIsRecording(false);
      setSeconds(0);
    } else {
      setIsRecording(true);
    }
  };

  const accent = Colors[colorScheme].tint;
  const cardBg = isDark ? '#1e2022' : '#f8f9fa';
  const borderColor = isDark ? '#2c2f31' : '#e8ebed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.pageTitle}>New Meeting</ThemedText>

        <View style={styles.topRow}>
          <View
            style={[
              styles.timerRing,
              {
                borderColor: isRecording ? accent : Colors[colorScheme].icon + '33',
                shadowColor: isRecording ? accent : 'transparent',
              },
            ]}
          >
            <ThemedText
              style={[styles.timer, { color: isRecording ? accent : Colors[colorScheme].text }]}
            >
              {formatTime(seconds)}
            </ThemedText>
            {isRecording && (
              <View style={styles.liveRow}>
                <View style={[styles.liveDot, { backgroundColor: '#ef4444' }]} />
                <ThemedText style={[styles.liveLabel, { color: '#ef4444' }]}>LIVE</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.controlsCol}>
            <ThemedText style={[styles.statusText, { color: Colors[colorScheme].icon }]}>
              {isRecording ? 'Recording in progress…' : 'Ready to record'}
            </ThemedText>

            <TouchableOpacity
              style={[styles.recordButton, { backgroundColor: isRecording ? '#ef4444' : accent }]}
              onPress={handleToggle}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.recordButtonText}>
                {isRecording ? '⏹  Stop' : '⏺  Start'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {isRecording ? (
          <View style={[styles.transcriptCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.transcriptHeader}>
              <View style={[styles.liveDot, { backgroundColor: '#ef4444' }]} />
              <ThemedText style={[styles.transcriptTitle, { color: Colors[colorScheme].icon }]}>
                LIVE TRANSCRIPT
              </ThemedText>
            </View>
            <ScrollView
              style={styles.transcriptScroll}
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={false}
            >
              <ThemedText style={[styles.transcriptPlaceholder, { color: Colors[colorScheme].icon }]}>
                Listening… transcript will appear here as you speak.
              </ThemedText>
            </ScrollView>
          </View>
        ) : (
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]}
            >
              <ThemedText style={{ fontSize: 20 }}>👥</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                Add Participants
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]}
            >
              <ThemedText style={{ fontSize: 20 }}>🪧</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                Add Board
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]}
            >
              <ThemedText style={{ fontSize: 20 }}>📝</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                Add Notes
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 20,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 40,
    alignSelf: 'flex-start',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  timerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  timer: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
    lineHeight: 40,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  controlsCol: {
    flex: 1,
    gap: 14,
    alignItems: 'flex-start',
  },
  statusText: { fontSize: 14, lineHeight: 20 },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  transcriptCard: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transcriptTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  transcriptScroll: { flex: 1 },
  transcriptContent: { paddingBottom: 8 },
  transcriptPlaceholder: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickBtnLabel: { fontSize: 12, textAlign: 'center' },
});

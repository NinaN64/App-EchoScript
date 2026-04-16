import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMeetings } from '@/hooks/use-meetings';

function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min ${sec}s`;
  return `${sec}s`;
}

function friendlyDate() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${dateStr}, ${h}:${minutes} ${ampm}`;
}

function generateId() {
  return `mtg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

type SaveModalProps = {
  visible: boolean;
  durationSeconds: number;
  colorScheme: 'light' | 'dark';
  onSave: (title: string) => void;
  onDiscard: () => void;
};

function SaveModal({ visible, durationSeconds, colorScheme, onSave, onDiscard }: SaveModalProps) {
  const isDark = colorScheme === 'dark';
  const tint = Colors[colorScheme].tint;
  const cardBg = isDark ? '#1e2022' : '#ffffff';
  const overlaySlide = useRef(new Animated.Value(300)).current;
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (visible) {
      setTitle('');
      Animated.spring(overlaySlide, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(overlaySlide, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, overlaySlide]);

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Title required', 'Please enter a meeting title before saving.');
      return;
    }
    Keyboard.dismiss();
    onSave(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDiscard}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.modalBg} onPress={Keyboard.dismiss} />
        <Animated.View
          style={[
            styles.saveSheet,
            { backgroundColor: cardBg, transform: [{ translateY: overlaySlide }] },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#444' : '#ddd' }]} />

          <ThemedText style={styles.sheetTitle}>Save Meeting</ThemedText>
          <ThemedText style={[styles.sheetSub, { color: Colors[colorScheme].icon }]}>
            Duration: {formatDuration(durationSeconds)}
          </ThemedText>

          <View style={[styles.inputWrapper, { borderColor: isDark ? '#333' : '#ddd', backgroundColor: isDark ? '#28292b' : '#f5f5f7' }]}>
            <TextInput
              style={[styles.titleInput, { color: isDark ? '#fff' : '#111' }]}
              placeholder="Meeting title…"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={title}
              onChangeText={setTitle}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              autoFocus
            />
          </View>

          <View style={styles.sheetButtons}>
            <TouchableOpacity
              style={[styles.discardBtn, { borderColor: isDark ? '#444' : '#ddd' }]}
              onPress={onDiscard}
              activeOpacity={0.75}
            >
              <ThemedText style={[styles.discardLabel, { color: Colors[colorScheme].icon }]}>
                Discard
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: tint }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <ThemedText style={styles.saveBtnLabel}>Save Meeting</ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function NewMeetingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { saveMeeting } = useMeetings();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [stoppedAt, setStoppedAt] = useState(0);
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

  const handleStop = () => {
    setIsRecording(false);
    setStoppedAt(seconds);
    setShowSaveModal(true);
  };

  const handleStart = () => {
    setSeconds(0);
    setIsRecording(true);
  };

  const handleSave = async (title: string) => {
    const meeting = {
      id: generateId(),
      title,
      date: friendlyDate(),
      duration: formatDuration(stoppedAt),
      durationSeconds: stoppedAt,
      participants: 0,
      participantNames: [],
      notes: '',
      createdAt: Date.now(),
    };
    const ok = await saveMeeting(meeting);
    setShowSaveModal(false);
    setSeconds(0);
    if (ok) {
      router.push('/(tabs)/history');
    }
  };

  const handleDiscard = () => {
    setShowSaveModal(false);
    setSeconds(0);
  };

  const accent = Colors[colorScheme].tint;
  const cardBg = isDark ? '#1e2022' : '#f8f9fa';
  const borderColor = isDark ? '#2c2f31' : '#e8ebed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.pageTitle}>
          New Meeting
        </ThemedText>

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

            {!isRecording ? (
              <TouchableOpacity
                style={[styles.recordButton, { backgroundColor: accent }]}
                onPress={handleStart}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.recordButtonText}>⏺  Start</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.recordButton, { backgroundColor: '#ef4444' }]}
                onPress={handleStop}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.recordButtonText}>⏹  Stop</ThemedText>
              </TouchableOpacity>
            )}
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
            <TouchableOpacity style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]}>
              <ThemedText style={{ fontSize: 20 }}>👥</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                Add Participants
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]}>
              <ThemedText style={{ fontSize: 20 }}>🪧</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                Add Board
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]}>
              <ThemedText style={{ fontSize: 20 }}>📝</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                Add Notes
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </ThemedView>

      <SaveModal
        visible={showSaveModal}
        durationSeconds={stoppedAt}
        colorScheme={colorScheme}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
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
  controlsCol: { flex: 1, gap: 14, alignItems: 'flex-start' },
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
  recordButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  transcriptCard: {
    flex: 1,
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  transcriptHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  transcriptTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  transcriptScroll: { flex: 1 },
  transcriptContent: { paddingBottom: 8 },
  transcriptPlaceholder: { fontSize: 14, lineHeight: 22, fontStyle: 'italic' },
  quickActions: { flexDirection: 'row', gap: 12, width: '100%' },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickBtnLabel: { fontSize: 12, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  saveSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 22, fontWeight: '800' },
  sheetSub: { fontSize: 14, marginTop: -8 },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  titleInput: {
    fontSize: 17,
    fontWeight: '500',
    paddingVertical: 12,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  discardBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  discardLabel: { fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

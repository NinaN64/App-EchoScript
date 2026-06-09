import * as ImagePicker from 'expo-image-picker';
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
import Tesseract from 'tesseract.js';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMeetings } from '@/hooks/use-meetings';

// implementation of speech-to-text fallback
let ExpoSpeechRecognitionModule: any = {
  start: () => {},
  stop: () => {},
  requestPermissionsAsync: async () => ({ status: 'denied' }),
};
let useSpeechRecognitionEvent: any = () => {};
let isSpeechRecognitionSupported = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SpeechModule = require('expo-speech-recognition');
  if (SpeechModule?.ExpoSpeechRecognitionModule) {
    ExpoSpeechRecognitionModule = SpeechModule.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = SpeechModule.useSpeechRecognitionEvent;
    isSpeechRecognitionSupported = true;
  }
} catch {
}

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
  const tint = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].card;
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
          <View style={[styles.sheetHandle, { backgroundColor: Colors[colorScheme].border }]} />

          <ThemedText style={styles.sheetTitle}>Save Meeting</ThemedText>
          <ThemedText style={[styles.sheetSub, { color: Colors[colorScheme].textMuted }]}>
            Duration: {formatDuration(durationSeconds)}
          </ThemedText>

          <View style={[styles.inputWrapper, { borderColor: Colors[colorScheme].border, backgroundColor: Colors[colorScheme].background }]}>
            <TextInput
              style={[styles.titleInput, { color: Colors[colorScheme].text }]}
              placeholder="Meeting title…"
              placeholderTextColor={Colors[colorScheme].textMuted}
              value={title}
              onChangeText={setTitle}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              autoFocus
            />
          </View>

          <View style={styles.sheetButtons}>
            <TouchableOpacity
              style={[styles.discardBtn, { borderColor: Colors[colorScheme].border }]}
              onPress={onDiscard}
              activeOpacity={0.75}
            >
              <ThemedText style={[styles.discardLabel, { color: Colors[colorScheme].textMuted }]}>
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

type InputModalProps = {
  visible: boolean;
  title: string;
  placeholder: string;
  initialValue: string;
  colorScheme: 'light' | 'dark';
  multiline?: boolean;
  onSave: (val: string) => void;
  onDiscard: () => void;
};

function InputModal({ visible, title, placeholder, initialValue, colorScheme, multiline, onSave, onDiscard }: InputModalProps) {
  const tint = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].card;
  const overlaySlide = useRef(new Animated.Value(300)).current;
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) {
      setValue(initialValue);
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
  }, [visible, overlaySlide, initialValue]);

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
            multiline && { height: 400 },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: Colors[colorScheme].border }]} />
          <ThemedText style={styles.sheetTitle}>{title}</ThemedText>
          <View style={[styles.inputWrapper, { borderColor: Colors[colorScheme].border, backgroundColor: Colors[colorScheme].background }, multiline && { flex: 1 }]}>
            <TextInput
              style={[styles.titleInput, { color: Colors[colorScheme].text }, multiline && { flex: 1, textAlignVertical: 'top' }]}
              placeholder={placeholder}
              placeholderTextColor={Colors[colorScheme].textMuted}
              value={value}
              onChangeText={setValue}
              multiline={multiline}
              returnKeyType={multiline ? 'default' : 'done'}
              onSubmitEditing={multiline ? undefined : () => { Keyboard.dismiss(); onSave(value); }}
              autoFocus
            />
          </View>
          <View style={styles.sheetButtons}>
            <TouchableOpacity style={[styles.discardBtn, { borderColor: Colors[colorScheme].border }]} onPress={onDiscard} activeOpacity={0.75}>
              <ThemedText style={[styles.discardLabel, { color: Colors[colorScheme].textMuted }]}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: tint }]} onPress={() => { Keyboard.dismiss(); onSave(value); }} activeOpacity={0.85}>
              <ThemedText style={styles.saveBtnLabel}>Save</ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ParticipantsModalProps = {
  visible: boolean;
  initialParticipants: string[];
  colorScheme: 'light' | 'dark';
  onSave: (participants: string[]) => void;
  onDiscard: () => void;
};

function ParticipantsModal({ visible, initialParticipants, colorScheme, onSave, onDiscard }: ParticipantsModalProps) {
  const tint = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].card;
  const overlaySlide = useRef(new Animated.Value(300)).current;
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');

  useEffect(() => {
    if (visible) {
      setParticipants(initialParticipants);
      setNewParticipant('');
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
  }, [visible, overlaySlide, initialParticipants]);

  const addParticipant = () => {
    if (newParticipant.trim()) {
      setParticipants(prev => [...prev, newParticipant.trim()]);
      setNewParticipant('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDiscard}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Pressable style={styles.modalBg} onPress={Keyboard.dismiss} />
        <Animated.View style={[styles.saveSheet, { backgroundColor: cardBg, transform: [{ translateY: overlaySlide }], height: 500 }]}>
          <View style={[styles.sheetHandle, { backgroundColor: Colors[colorScheme].border }]} />
          <ThemedText style={styles.sheetTitle}>Add Participants</ThemedText>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8, paddingBottom: 20 }}>
              {participants.map((p, idx) => (
                <View key={idx} style={[styles.participantRow, { backgroundColor: Colors[colorScheme].background, borderColor: Colors[colorScheme].border }]}>
                  <ThemedText style={{ flex: 1, color: Colors[colorScheme].text }}>{p}</ThemedText>
                  <TouchableOpacity onPress={() => setParticipants(prev => prev.filter((_, i) => i !== idx))}>
                    <ThemedText style={{ color: Colors[colorScheme].danger, fontWeight: '600' }}>Remove</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <View style={[styles.inputWrapper, { flex: 1, borderColor: Colors[colorScheme].border, backgroundColor: Colors[colorScheme].background }]}>
                  <TextInput
                    style={[styles.titleInput, { color: Colors[colorScheme].text }]}
                    placeholder="New participant name"
                    placeholderTextColor={Colors[colorScheme].textMuted}
                    value={newParticipant}
                    onChangeText={setNewParticipant}
                    onSubmitEditing={addParticipant}
                  />
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: tint, paddingHorizontal: 16, borderRadius: 14, justifyContent: 'center' }}
                  onPress={addParticipant}
                >
                  <ThemedText style={{ color: '#fff', fontWeight: '600' }}>Add</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.sheetButtons}>
            <TouchableOpacity style={[styles.discardBtn, { borderColor: Colors[colorScheme].border }]} onPress={onDiscard} activeOpacity={0.75}>
              <ThemedText style={[styles.discardLabel, { color: Colors[colorScheme].textMuted }]}>Cancel</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: tint }]} onPress={() => { Keyboard.dismiss(); onSave(participants); }} activeOpacity={0.85}>
              <ThemedText style={styles.saveBtnLabel}>Save</ThemedText>
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
  const { saveMeeting } = useMeetings();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [stoppedAt, setStoppedAt] = useState(0);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [manualNotes, setManualNotes] = useState('');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [inputConfig, setInputConfig] = useState<{
    visible: boolean; type: 'notes'; title: string; placeholder: string; initial: string; multiline: boolean;
  }>({
    visible: false, type: 'notes', title: '', placeholder: '', initial: '', multiline: false,
  });
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [boardText, setBoardText] = useState('');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // implementation of speech-to-text
  useSpeechRecognitionEvent('result', (event: any) => {
    const best = event.results?.[0];
    if (!best) return;
    if (event.isFinal) {
      setTranscript((prev) => (prev ? prev + ' ' + best.transcript : best.transcript));
      setInterimText('');
    } else {
      setInterimText(best.transcript);
    }
    scrollRef.current?.scrollToEnd({ animated: true });
  });

  useSpeechRecognitionEvent('error', (event: any) => {
    if (event.error === 'no-speech') {
      if (isRecording) {
        ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true,
          continuous: false,
        });
      }
      return;
    }
    console.warn('Speech recognition error:', event.error, event.message);
  });

  useSpeechRecognitionEvent('end', () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
    }
  });

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
    ExpoSpeechRecognitionModule.stop();
    setIsRecording(false);
    setStoppedAt(seconds);
    setInterimText('');
    setShowSaveModal(true);
  };

  // start speech-to-text
  const handleStart = async () => {
    if (!isSpeechRecognitionSupported) {
      Alert.alert(
        'Feature Unavailable',
        'Live transcription requires custom native speech recognition APIs, which are not available in standard Expo Go or Web. Please build and run a Development Build (npx expo run:ios or run:android) to use this feature.'
      );
      return;
    }
    const { status } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Microphone Permission Required',
        'Please allow microphone access in Settings to use live transcription.',
      );
      return;
    }
    setSeconds(0);
    setTranscript('');
    setInterimText('');
    setIsRecording(true);
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',
      interimResults: true,
      continuous: false,
    });
  };

  const handleSave = async (title: string) => {
    const fullTranscript = [transcript, interimText].filter(Boolean).join(' ');
    const combinedNotes = manualNotes ? (boardText ? `${boardText}\n\nManual Notes:\n${manualNotes}` : manualNotes) : boardText;

    const meeting = {
      id: generateId(),
      title,
      date: friendlyDate(),
      duration: formatDuration(stoppedAt),
      durationSeconds: stoppedAt,
      participants: participantNames.length,
      participantNames,
      notes: fullTranscript,
      createdAt: Date.now(),
      boardText: combinedNotes,
      imageUris,
    };
    const ok = await saveMeeting(meeting);

    setShowSaveModal(false);
    setSeconds(0);
    setTranscript('');
    setInterimText('');
    setBoardText('');
    setImageUris([]);
    if (ok) {
      router.push('/(tabs)/history');
    }
  };

  const handleDiscard = () => {
    setShowSaveModal(false);
    setSeconds(0);
    setTranscript('');
    setInterimText('');
    setBoardText('');
    setImageUris([]);
    setParticipantNames([]);
    setManualNotes('');
  };

  const handleOpenParticipants = () => {
    setShowParticipantsModal(true);
  };

  const handleOpenNotes = () => {
    setInputConfig({
      visible: true, type: 'notes',
      title: 'Add Notes',
      placeholder: 'Write down meeting agenda or key points...',
      initial: manualNotes,
      multiline: true,
    });
  };

  const handleSaveNotes = (val: string) => {
    setManualNotes(val);
    setInputConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleAddBoard = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessingOcr(true);
        const imageUri = result.assets[0].uri;
        setImageUris((prev) => [...prev, imageUri]);

        // implementation of image recognition
        const ocrResult = await Tesseract.recognize(imageUri, 'eng', {
          errorHandler: (e) => console.log(e)
        });

        setBoardText((prev) => (prev ? prev + '\n\n' + ocrResult.data.text : ocrResult.data.text));
        Alert.alert('OCR Success', 'Text extracted from whiteboard!');
      }
    } catch (e) {
      console.error('OCR Error', e);
      Alert.alert('OCR Failed', 'Could not extract text from image.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const accent = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].card;
  const borderColor = Colors[colorScheme].border;

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
                <View style={[styles.liveDot, { backgroundColor: Colors[colorScheme].danger }]} />
                <ThemedText style={[styles.liveLabel, { color: Colors[colorScheme].danger }]}>LIVE</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.controlsCol}>
            <ThemedText style={[styles.statusText, { color: Colors[colorScheme].textMuted }]}>
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
                style={[styles.recordButton, { backgroundColor: Colors[colorScheme].danger }]}
                onPress={handleStop}
                activeOpacity={0.85}
              >
                <ThemedText style={styles.recordButtonText}>⏹  Stop</ThemedText>
              </TouchableOpacity>
            )}
            {!isSpeechRecognitionSupported && !isRecording && (
              <ThemedText style={{ color: Colors[colorScheme].warning, fontSize: 11, marginTop: 4 }}>
                ⚠️ Needs Development Build
              </ThemedText>
            )}
          </View>
        </View>

        {isRecording ? (
          <View style={[styles.transcriptCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.transcriptHeader}>
              <View style={[styles.liveDot, { backgroundColor: Colors[colorScheme].danger }]} />
              <ThemedText style={[styles.transcriptTitle, { color: Colors[colorScheme].textMuted }]}>
                LIVE TRANSCRIPT
              </ThemedText>
            </View>
            <ScrollView
              ref={scrollRef}
              style={styles.transcriptScroll}
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={false}
            >
              {!transcript && !interimText ? (
                <ThemedText style={[styles.transcriptPlaceholder, { color: Colors[colorScheme].textMuted }]}>
                  Listening… speak and your words will appear here.
                </ThemedText>
              ) : (
                <ThemedText style={[styles.transcriptText, { color: Colors[colorScheme].text }]}>
                  {transcript}
                  {interimText ? (
                    <ThemedText style={[styles.transcriptInterim, { color: Colors[colorScheme].icon }]}>
                      {transcript ? ' ' : ''}{interimText}
                    </ThemedText>
                  ) : null}
                </ThemedText>
              )}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.quickActions}>
            <TouchableOpacity style={[styles.quickBtn, { borderColor: Colors[colorScheme].border }]} onPress={handleOpenParticipants}>
              <ThemedText style={{ fontSize: 20 }}>👥</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].textMuted }]}>
                {participantNames.length > 0 ? `${participantNames.length} Added` : 'Add Participants'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickBtn, { borderColor: Colors[colorScheme].border }]}
              onPress={handleAddBoard}
              disabled={isProcessingOcr}
            >
              <ThemedText style={{ fontSize: 20 }}>{isProcessingOcr ? '⏳' : '🪧'}</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].textMuted }]}>
                {isProcessingOcr ? 'Processing...' : 'Add Board'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { borderColor: Colors[colorScheme].border }]} onPress={handleOpenNotes}>
              <ThemedText style={{ fontSize: 20 }}>📝</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].textMuted }]}>
                {manualNotes ? 'Notes Added' : 'Add Notes'}
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
      <InputModal
        visible={inputConfig.visible}
        title={inputConfig.title}
        placeholder={inputConfig.placeholder}
        initialValue={inputConfig.initial}
        colorScheme={colorScheme}
        multiline={inputConfig.multiline}
        onSave={handleSaveNotes}
        onDiscard={() => setInputConfig(prev => ({ ...prev, visible: false }))}
      />
      <ParticipantsModal
        visible={showParticipantsModal}
        initialParticipants={participantNames}
        colorScheme={colorScheme}
        onSave={(names) => {
          setParticipantNames(names);
          setShowParticipantsModal(false);
        }}
        onDiscard={() => setShowParticipantsModal(false)}
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
  transcriptText: { fontSize: 15, lineHeight: 24 },
  transcriptInterim: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', opacity: 0.6 },
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
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 4,
  },
});

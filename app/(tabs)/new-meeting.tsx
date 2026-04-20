import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Tesseract from 'tesseract.js';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
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
  const isDark = colorScheme === 'dark';
  const tint = Colors[colorScheme].tint;
  const cardBg = isDark ? '#1e2022' : '#ffffff';
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
          <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#444' : '#ddd' }]} />
          <ThemedText style={styles.sheetTitle}>{title}</ThemedText>
          <View style={[styles.inputWrapper, { borderColor: isDark ? '#333' : '#ddd', backgroundColor: isDark ? '#28292b' : '#f5f5f7' }, multiline && { flex: 1 }]}>
            <TextInput
              style={[styles.titleInput, { color: isDark ? '#fff' : '#111' }, multiline && { flex: 1, textAlignVertical: 'top' }]}
              placeholder={placeholder}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={value}
              onChangeText={setValue}
              multiline={multiline}
              returnKeyType={multiline ? 'default' : 'done'}
              onSubmitEditing={multiline ? undefined : () => { Keyboard.dismiss(); onSave(value); }}
              autoFocus
            />
          </View>
          <View style={styles.sheetButtons}>
            <TouchableOpacity style={[styles.discardBtn, { borderColor: isDark ? '#444' : '#ddd' }]} onPress={onDiscard} activeOpacity={0.75}>
              <ThemedText style={[styles.discardLabel, { color: Colors[colorScheme].icon }]}>Cancel</ThemedText>
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

export default function NewMeetingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { saveMeeting } = useMeetings();

  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [stoppedAt, setStoppedAt] = useState(0);
  const [participantNames, setParticipantNames] = useState<string[]>([]);
  const [manualNotes, setManualNotes] = useState('');
  const [inputConfig, setInputConfig] = useState<{
    visible: boolean; type: 'participants' | 'notes'; title: string; placeholder: string; initial: string; multiline: boolean;
  }>({
    visible: false, type: 'notes', title: '', placeholder: '', initial: '', multiline: false,
  });
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [boardText, setBoardText] = useState('');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [minutes, setMinutes] = useState('');
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useSpeechRecognitionEvent('result', (event) => {
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

  useSpeechRecognitionEvent('error', (event) => {
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

  const handleStart = async () => {
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
      boardText: manualNotes ? (boardText ? `${boardText}\n\nManual Notes:\n${manualNotes}` : manualNotes) : boardText,
      minutes,
    };
    const ok = await saveMeeting(meeting);
    setShowSaveModal(false);
    setSeconds(0);
    setTranscript('');
    setInterimText('');
    setBoardText('');
    setMinutes('');
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
    setMinutes('');
    setParticipantNames([]);
    setManualNotes('');
  };

  const handleOpenParticipants = () => {
    setInputConfig({
      visible: true, type: 'participants',
      title: 'Add Participants',
      placeholder: 'Alice, Bob, Charlie...',
      initial: participantNames.join(', '),
      multiline: false,
    });
  };

  const handleOpenNotes = () => {
    setInputConfig({
      visible: true, type: 'notes',
      title: 'Add Notes',
      placeholder: 'Jot down meeting agenda or key points...',
      initial: manualNotes,
      multiline: true,
    });
  };

  const handleSaveInput = (val: string) => {
    if (inputConfig.type === 'participants') {
      const names = val.split(',').map((n) => n.trim()).filter(Boolean);
      setParticipantNames(names);
    } else {
      setManualNotes(val);
    }
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

  const handleGenerateMinutes = async () => {
    const fullTranscript = [transcript, interimText].filter(Boolean).join(' ');
    if (!fullTranscript && !boardText) {
       Alert.alert('No content', 'Please record a meeting or add a whiteboard first.');
       return;
    }
    
    setIsGeneratingMinutes(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        Alert.alert('Missing API Key', 'Please set EXPO_PUBLIC_GEMINI_API_KEY in your environment to use AI Summary.');
        setIsGeneratingMinutes(false);
        return;
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const combinedNotes = manualNotes ? (boardText ? `${boardText}\n\nManual Notes:\n${manualNotes}` : manualNotes) : boardText;
      const prompt = `You are an AI meeting assistant. Generate a concise meeting summary from the following content.\n\nTranscript:\n${fullTranscript || 'No transcript.'}\n\nNotes & Whiteboard:\n${combinedNotes || 'No notes or whiteboard text.'}\n\nOutput only the final summary in Markdown format without conversational filler.`;
      
      const result = await model.generateContent(prompt);
      setMinutes(result.response.text());
      Alert.alert('Success', 'Summary generated successfully!');
    } catch(e) {
      console.error('Gemini Error', e);
      Alert.alert('AI Error', 'Could not generate summary. Make sure your API key is valid.');
    } finally {
      setIsGeneratingMinutes(false);
    }
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
              ref={scrollRef}
              style={styles.transcriptScroll}
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={false}
            >
              {!transcript && !interimText ? (
                <ThemedText style={[styles.transcriptPlaceholder, { color: Colors[colorScheme].icon }]}>
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
            <TouchableOpacity style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]} onPress={handleOpenParticipants}>
              <ThemedText style={{ fontSize: 20 }}>👥</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                {participantNames.length > 0 ? `${participantNames.length} Added` : 'Add Participants'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]}
              onPress={handleAddBoard}
              disabled={isProcessingOcr}
            >
              <ThemedText style={{ fontSize: 20 }}>{isProcessingOcr ? '⏳' : '🪧'}</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                {isProcessingOcr ? 'Processing...' : 'Add Board'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]}
              onPress={handleGenerateMinutes}
              disabled={isGeneratingMinutes}
            >
              <ThemedText style={{ fontSize: 20 }}>{isGeneratingMinutes ? '⏳' : '✨'}</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
                {isGeneratingMinutes ? 'Generating...' : 'Gen Summary'}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, { borderColor: Colors[colorScheme].icon + '44' }]} onPress={handleOpenNotes}>
              <ThemedText style={{ fontSize: 20 }}>📝</ThemedText>
              <ThemedText style={[styles.quickBtnLabel, { color: Colors[colorScheme].icon }]}>
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
        onSave={handleSaveInput}
        onDiscard={() => setInputConfig(prev => ({ ...prev, visible: false }))}
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
});

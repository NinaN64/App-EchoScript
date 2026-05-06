import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Tesseract from 'tesseract.js';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMeetings } from '@/hooks/use-meetings';

export default function EditMeetingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const { getMeeting, updateMeeting, loading } = useMeetings();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [minutes, setMinutes] = useState('');
  const [boardText, setBoardText] = useState('');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);

  useEffect(() => {
    if (!loading && id) {
      const meeting = getMeeting(id);
      if (meeting) {
        setTitle(meeting.title || '');
        setNotes(meeting.notes || '');
        setMinutes(meeting.minutes || '');
        setBoardText(meeting.boardText || '');
      } else {
        router.back();
      }
    }
  }, [id, getMeeting, loading]);

  const handleSave = async () => {
    const meeting = getMeeting(id);
    if (!meeting) return;

    const success = await updateMeeting({
      ...meeting,
      title,
      notes,
      minutes,
      boardText,
    });

    if (success) {
      router.back();
    } else {
      if (Platform.OS === 'web') {
        window.alert('Failed to save meeting.');
      } else {
        Alert.alert('Error', 'Failed to save meeting.');
      }
    }
  };

  const inputBg = isDark ? '#1e2022' : '#f8f9fa';
  const borderColor = isDark ? '#2c2f31' : '#e8ebed';
  const textColor = Colors[colorScheme].text;
  const tint = Colors[colorScheme].tint;

  const handleReadImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setIsProcessingOcr(true);
        const imageUri = result.assets[0].uri;

        const ocrResult = await Tesseract.recognize(imageUri, 'eng', {
           errorHandler: (e) => console.log(e)
        });

        setBoardText((prev) => (prev ? prev + '\n\n' + ocrResult.data.text : ocrResult.data.text));
        if (Platform.OS === 'web') {
          window.alert('Text extracted successfully!');
        } else {
          Alert.alert('OCR Success', 'Text extracted from image!');
        }
      }
    } catch (e) {
      console.error('OCR Error', e);
      if (Platform.OS === 'web') {
        window.alert('Could not extract text from image.');
      } else {
        Alert.alert('OCR Failed', 'Could not extract text from image.');
      }
    } finally {
      setIsProcessingOcr(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.headerButton}>
            <ThemedText style={{ color: tint, fontSize: 17 }}>Cancel</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Edit Meeting</ThemedText>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.7} style={styles.headerButton}>
            <ThemedText style={{ color: tint, fontSize: 17, fontWeight: '600' }}>Save</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>TITLE</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Meeting Title"
              placeholderTextColor={Colors[colorScheme].icon}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>LIVE TRANSCRIPT</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Transcript..."
              placeholderTextColor={Colors[colorScheme].icon}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>AI SUMMARY</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor: '#fef08a', color: textColor, borderWidth: 1.5 }]}
              value={minutes}
              onChangeText={setMinutes}
              placeholder="AI Summary..."
              placeholderTextColor={Colors[colorScheme].icon}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.label}>NOTES</ThemedText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: inputBg, borderColor, color: textColor }]}
              value={boardText}
              onChangeText={setBoardText}
              placeholder="Board Text / Notes..."
              placeholderTextColor={Colors[colorScheme].icon}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={[styles.input, { backgroundColor: inputBg, borderColor, alignItems: 'center', paddingVertical: 16 }]}
              onPress={handleReadImage}
              disabled={isProcessingOcr}
            >
              <ThemedText style={{ color: tint, fontWeight: '600', fontSize: 16 }}>
                {isProcessingOcr ? '⏳ Extracting text...' : '+ Read Text from Image'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#33333333',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scroll: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    color: '#888',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
  },
});

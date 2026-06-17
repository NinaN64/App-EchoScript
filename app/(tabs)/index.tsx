import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [showInfo, setShowInfo] = useState(false);

  const secondaryBg = isDark ? '#1e2022' : '#f0f0f5';
  const secondaryBorder = isDark ? '#2c2f31' : '#dddde3';
  const secondaryText = isDark ? '#e0e0e0' : '#222';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <TouchableOpacity
          style={styles.infoIconButton}
          onPress={() => setShowInfo(true)}
          activeOpacity={0.7}
        >
          <IconSymbol name="info.circle" size={24} color={Colors[colorScheme].icon} />
        </TouchableOpacity>

        <View style={styles.header}>
          <ThemedText type="title" style={styles.appName}>
            EchoScript
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: Colors[colorScheme].icon }]}>
            Your AI meeting assistant
          </ThemedText>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: secondaryBg, borderColor: secondaryBorder },
            ]}
            onPress={() => router.push('/(tabs)/new-meeting')}
            activeOpacity={0.85}
          >
            <ThemedText style={[styles.secondaryLabel, { color: secondaryText }]}>
              Start New Meeting
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: secondaryBg, borderColor: secondaryBorder },
            ]}
            onPress={() => router.push('/(tabs)/history')}
            activeOpacity={0.85}
          >
            <ThemedText style={[styles.secondaryLabel, { color: secondaryText }]}>
              View History
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      <Modal
        visible={showInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBg} 
            activeOpacity={1} 
            onPress={() => setShowInfo(false)} 
          />
          <View style={[styles.infoCardModal, { backgroundColor: Colors[colorScheme].card, borderColor: Colors[colorScheme].border }]}>
            <ThemedText style={styles.modalTitle}>About EchoScript</ThemedText>
            <ThemedText style={[styles.modalDesc, { color: Colors[colorScheme].textMuted }]}>
              EchoScript is your local-first meeting assistant designed to capture, organize, and summarize your meetings.
            </ThemedText>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 300, marginVertical: 16 }}>
              <View style={styles.featureRow}>
                <View style={styles.featureTextCol}>
                  <ThemedText style={styles.featureTitle}>Live Transcription</ThemedText>
                  <ThemedText style={[styles.featureDesc, { color: Colors[colorScheme].textMuted }]}>
                    Transcribe audio in real-time using built-in speech engines.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureTextCol}>
                  <ThemedText style={styles.featureTitle}>Whiteboard OCR</ThemedText>
                  <ThemedText style={[styles.featureDesc, { color: Colors[colorScheme].textMuted }]}>
                    Upload whiteboard photos during or after meetings to extract text dynamically.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureTextCol}>
                  <ThemedText style={styles.featureTitle}>Participants & Notes</ThemedText>
                  <ThemedText style={[styles.featureDesc, { color: Colors[colorScheme].textMuted }]}>
                    Keep track of meeting attendees and take custom manual notes.
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureTextCol}>
                  <ThemedText style={styles.featureTitle}>AI Summary with Ollama</ThemedText>
                  <ThemedText style={[styles.featureDesc, { color: Colors[colorScheme].textMuted }]}>
                    Generate high-quality summaries of transcriptions using local models (e.g., Llama3).
                  </ThemedText>
                </View>
              </View>

              <View style={styles.featureRow}>
                <View style={styles.featureTextCol}>
                  <ThemedText style={styles.featureTitle}>Local Configuration</ThemedText>
                  <ThemedText style={[styles.featureDesc, { color: Colors[colorScheme].textMuted }]}>
                    Fully configure custom Ollama endpoint URLs and local models inside settings.
                  </ThemedText>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: Colors[colorScheme].tint }]}
              onPress={() => setShowInfo(false)}
            >
              <ThemedText style={styles.closeButtonText}>Got it</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 32,
  },
  header: {
    alignItems: 'center',
    gap: 6,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 48,
  },
  subtitle: {
    fontSize: 16,
  },
  buttonGroup: {
    width: '100%',
    gap: 14,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 50,
    borderWidth: 1.5,
    gap: 10,
  },
  secondaryLabel: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoIconButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  infoCardModal: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  featureRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureTextCol: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    borderRadius: 14,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});

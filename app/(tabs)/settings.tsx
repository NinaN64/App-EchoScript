import { StyleSheet, Switch, View, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getOllamaSettings, saveOllamaSettings, fetchAvailableModels } from '@/services/ollama';

type SettingRowProps = {
  icon: string;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  tint: string;
  borderColor: string;
};

function SettingRow({ icon, label, value, toggle, toggleValue, onToggle, tint, borderColor }: SettingRowProps) {
  return (
    <View style={[styles.row, { borderBottomColor: borderColor }]}>
      <View style={[styles.rowIcon, { backgroundColor: tint + '18' }]}>
        <ThemedText style={styles.rowIconText}>{icon}</ThemedText>
      </View>
      <ThemedText style={styles.rowLabel}>{label}</ThemedText>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ true: tint }}
        />
      ) : (
        <ThemedText style={[styles.rowValue, { color: tint }]}>{value}</ThemedText>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const tint = Colors[colorScheme].tint;
  const borderColor = Colors[colorScheme].icon + '22';
  const textColor = Colors[colorScheme].text;
  const inputBg = Colors[colorScheme].background;

  const [notifications, setNotifications] = useState(true);
  const [saveLocally, setSaveLocally] = useState(false);

  const [endpoint, setEndpoint] = useState('http://localhost:11434');
  const [model, setModel] = useState('llama3');
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      const settings = await getOllamaSettings();
      setEndpoint(settings.endpoint);
      setModel(settings.model);
      
      try {
        const available = await fetchAvailableModels(settings.endpoint);
        setModels(available);
      } catch (e) {
        console.log('Could not fetch models on settings screen init', e);
      }
    }
    loadSettings();
  }, []);

  const handleFetchModels = async () => {
    setIsLoadingModels(true);
    try {
      const available = await fetchAvailableModels(endpoint);
      setModels(available);
      await saveOllamaSettings(endpoint, model);
      
      if (available.length > 0) {
        if (!available.includes(model)) {
          setModel(available[0]);
          await saveOllamaSettings(endpoint, available[0]);
        }
      }
      
      if (Platform.OS === 'web') {
        window.alert('Successfully connected to Ollama! Available models loaded.');
      } else {
        Alert.alert('Success', 'Successfully connected to Ollama! Available models loaded.');
      }
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') {
        window.alert('Connection failed. Please check if Ollama is running and CORS is configured.');
      } else {
        Alert.alert('Connection Failed', 'Could not connect to Ollama. Make sure the server is running and accessible.');
      }
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSaveModel = async (selectedModel: string) => {
    setModel(selectedModel);
    await saveOllamaSettings(endpoint, selectedModel);
  };

  const sectionBg = colorScheme === 'dark' ? '#1e2022' : '#f8f9fa';
  const sectionBorder = colorScheme === 'dark' ? '#2c2f31' : '#e8ebed';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.pageTitle}>Settings</ThemedText>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={[styles.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
            <ThemedText style={[styles.sectionHeader, { color: Colors[colorScheme].icon }]}>TRANSCRIPTION</ThemedText>
            <SettingRow icon="🌐" label="Language" value="English" tint={tint} borderColor={borderColor} />
          </View>
          
          <View style={[styles.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
            <ThemedText style={[styles.sectionHeader, { color: Colors[colorScheme].icon }]}>STORAGE</ThemedText>
            <SettingRow icon="💾" label="Save recordings locally" toggle toggleValue={saveLocally} onToggle={setSaveLocally} tint={tint} borderColor={borderColor} />
            <SettingRow icon="☁️" label="Cloud backup" value="iCloud" tint={tint} borderColor="transparent" />
          </View>

          <View style={[styles.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
            <ThemedText style={[styles.sectionHeader, { color: Colors[colorScheme].icon }]}>OLLAMA AI SUMMARIZER</ThemedText>
            
            <View style={styles.settingsContent}>
              <ThemedText style={styles.inputLabel}>OLLAMA URL</ThemedText>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: inputBg, borderColor, color: textColor }]}
                  value={endpoint}
                  onChangeText={(text) => {
                    setEndpoint(text);
                    saveOllamaSettings(text, model);
                  }}
                  placeholder="http://localhost:11434"
                  placeholderTextColor={Colors[colorScheme].textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: tint }]}
                  onPress={handleFetchModels}
                  disabled={isLoadingModels}
                >
                  {isLoadingModels ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.actionButtonText}>Connect</ThemedText>
                  )}
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.inputLabel}>MODEL NAME</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor, marginBottom: 8 }]}
                value={model}
                onChangeText={async (text) => {
                  setModel(text);
                  await saveOllamaSettings(endpoint, text);
                }}
                placeholder="e.g. llama3"
                placeholderTextColor={Colors[colorScheme].textMuted}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <ThemedText style={styles.subLabel}>AVAILABLE LOCAL MODELS:</ThemedText>
              {models.length > 0 ? (
                <View style={styles.pillsContainer}>
                  {models.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.pill,
                        {
                          borderColor: model === m ? tint : borderColor,
                          backgroundColor: model === m ? tint + '18' : 'transparent',
                        },
                      ]}
                      onPress={() => handleSaveModel(m)}
                    >
                      <ThemedText style={[styles.pillText, { color: model === m ? tint : textColor, fontWeight: model === m ? '600' : '400' }]}>
                        {m}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <ThemedText style={[styles.infoText, { color: Colors[colorScheme].textMuted }]}>
                  No models loaded. Connect to Ollama to view model list.
                </ThemedText>
              )}
            </View>
          </View>
          
          <View style={[styles.section, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
            <ThemedText style={[styles.sectionHeader, { color: Colors[colorScheme].icon }]}>NOTIFICATIONS</ThemedText>
            <SettingRow icon="🔔" label="Enable notifications" toggle toggleValue={notifications} onToggle={setNotifications} tint={tint} borderColor="transparent" />
          </View>

          <ThemedText style={[styles.version, { color: Colors[colorScheme].icon }]}>
            EchoScript v1.0.0
          </ThemedText>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 32, fontWeight: '800', paddingTop: 16, marginBottom: 8 },
  scroll: {
    paddingBottom: 40,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconText: { fontSize: 16 },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 14, fontWeight: '500' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 4, marginBottom: 16 },
  
  settingsContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  actionButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: {
    fontSize: 13,
  },
  infoText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
});

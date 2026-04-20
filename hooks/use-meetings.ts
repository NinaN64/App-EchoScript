import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type Meeting = {
  id: string;
  title: string;
  date: string;
  duration: string;
  durationSeconds: number;
  participants: number;
  participantNames: string[];
  notes: string;
  createdAt: number;
  minutes?: string;
  boardText?: string;
};

const STORAGE_KEY = 'echoscript_meetings';

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Meeting[] = JSON.parse(raw);
        parsed.sort((a, b) => b.createdAt - a.createdAt);
        setMeetings(parsed);
      }
    } catch (e) {
      console.error('useMeetings load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveMeeting = useCallback(async (meeting: Meeting) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: Meeting[] = raw ? JSON.parse(raw) : [];
      const next = [meeting, ...existing.filter((m) => m.id !== meeting.id)];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMeetings(next);
      return true;
    } catch (e) {
      console.error('useMeetings saveMeeting error', e);
      return false;
    }
  }, []);

  const deleteMeeting = useCallback(async (id: string) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: Meeting[] = raw ? JSON.parse(raw) : [];
      const next = existing.filter((m) => m.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMeetings(next);
    } catch (e) {
      console.error('useMeetings deleteMeeting error', e);
    }
  }, []);

  const updateMeeting = useCallback(async (updated: Meeting) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const existing: Meeting[] = raw ? JSON.parse(raw) : [];
      const next = existing.map((m) => (m.id === updated.id ? updated : m));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setMeetings(next);
      return true;
    } catch (e) {
      console.error('useMeetings updateMeeting error', e);
      return false;
    }
  }, []);

  const getMeeting = useCallback(
    (id: string) => meetings.find((m) => m.id === id),
    [meetings],
  );

  return { meetings, loading, saveMeeting, deleteMeeting, updateMeeting, getMeeting, reload: load };
}

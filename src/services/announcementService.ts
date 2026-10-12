import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Announcement {
  id: string;
  communityId?: string;
  communityName?: string;
  sentBy: string;
  message: string;
  channel?: string;
  sentAt: string;
  city?: string;
}

function mapRow(row: Record<string, any>): Announcement {
  return {
    id: String(row.id),
    communityId: row.community_id || row.communityId,
    communityName: row.community_name || row.communityName,
    sentBy: row.sent_by || row.sentBy || 'Admin',
    message: row.message || '',
    channel: row.channel || 'all',
    sentAt: row.sent_at || row.sentAt || new Date().toISOString(),
    city: row.city,
  };
}

export async function getAnnouncementsByCommunity(communityId: string): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('community_id', communityId?.trim())
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Supabase Error fetching announcements:', error.message);
      return [];
    }

    return (data || []).map(mapRow);
  } catch (err) {
    console.error('getAnnouncementsByCommunity exception:', err);
    return [];
  }
}

const ANNOUNCEMENTS_STORAGE_KEY = 'mfct_mobile_announcements';

async function updateAnnouncementsCache(items: Announcement[]) {
  try {
    await AsyncStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('sent_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const mapped = data.map(mapRow);
      await updateAnnouncementsCache(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('getAllAnnouncements exception:', err);
  }

  // Fallback to AsyncStorage cache
  try {
    const cached = await AsyncStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return [];
}

export async function createAnnouncement(payload: {
  sentBy: string;
  message: string;
  city?: string;
  communityId?: string;
  communityName?: string;
  channel?: string;
}): Promise<Announcement | null> {
  try {
    const newRecord = {
      sent_by: payload.sentBy,
      message: payload.message,
      city: payload.city,
      community_id: payload.communityId,
      community_name: payload.communityName,
      channel: payload.channel || 'all',
      sent_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('announcements')
      .insert([newRecord])
      .select()
      .single();

    if (error) {
      console.error('Supabase Error creating announcement, saving locally:', error.message);
      const localAnnouncement: Announcement = {
        id: `local-ann-${Date.now()}`,
        sentBy: payload.sentBy,
        message: payload.message,
        city: payload.city,
        communityId: payload.communityId,
        communityName: payload.communityName,
        channel: payload.channel || 'all',
        sentAt: new Date().toISOString(),
      };
      try {
        const cached = await AsyncStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
        const list = cached ? JSON.parse(cached) : [];
        await updateAnnouncementsCache([localAnnouncement, ...list]);
      } catch { }
      return localAnnouncement;
    }

    const created = mapRow(data);
    try {
      const cached = await AsyncStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
      const list = cached ? JSON.parse(cached) : [];
      await updateAnnouncementsCache([created, ...list]);
    } catch { }
    return created;
  } catch (err) {
    console.error('createAnnouncement exception:', err);
    return null;
  }
}

import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DistrictMeeting {
  id: string;
  title: string;
  agenda: string;
  date: string;
  time: string;
  venue: string;
  chairperson: string;
  recordedBy: string;
  attendeesCount: number;
  status: 'pending' | 'upcoming' | 'completed' | 'cancelled';
  minutes?: string;
  resolutions?: string[];
  district?: string;
}

const STORAGE_KEY = 'mfct_mobile_district_meetings';

function mapDbRowToMeeting(row: any): DistrictMeeting {
  let resolutions: string[] = [];
  if (Array.isArray(row.resolutions)) {
    resolutions = row.resolutions;
  } else if (typeof row.resolutions === 'string') {
    try {
      resolutions = JSON.parse(row.resolutions);
    } catch {
      resolutions = row.resolutions.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return {
    id: String(row.id),
    title: row.title || '',
    agenda: row.agenda || '',
    date: row.date || '',
    time: row.time || '11:00 AM - 01:00 PM',
    venue: row.venue || '',
    chairperson: row.chairperson || 'District President',
    recordedBy: row.recorded_by || row.recordedBy || 'District Secretary',
    attendeesCount: Number(row.attendees_count || row.attendeesCount) || 10,
    status: row.status || 'upcoming',
    district: row.district || '',
    minutes: row.minutes || undefined,
    resolutions,
  };
}

async function updateLocalCache(meetings: DistrictMeeting[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
  } catch { }
}

const CANDIDATE_MEETING_TABLES = ['district_meetings', 'meeting', 'meetings'];
const activeSchema = process.env.EXPO_PUBLIC_SUPABASE_SCHEMA || 'dev';
const SCHEMAS_TO_TRY = activeSchema === 'public' ? ['public', 'dev'] : ['dev', 'public'];

/**
 * Fetch meetings from Supabase with AsyncStorage cache fallback.
 * Returns clean [] if no meetings exist.
 */
export async function getMeetings(district?: string): Promise<DistrictMeeting[]> {
  for (const schema of SCHEMAS_TO_TRY) {
    try {
      const client = schema === 'public' ? supabase.schema('public') : supabase.schema('dev');
      for (const table of CANDIDATE_MEETING_TABLES) {
        try {
          let query = client
            .from(table)
            .select('*')
            .order('date', { ascending: false });

          if (district && district !== 'All Districts') {
            query = query.ilike('district', `%${district}%`);
          }

          const { data, error } = await query;

          if (!error && data && data.length > 0) {
            const mapped = data.map(mapDbRowToMeeting);
            await updateLocalCache(mapped);
            return mapped;
          }
        } catch { }
      }
    } catch (e) {
      console.warn(`getMeetings (${schema} schema) error:`, e);
    }
  }

  // Fallback to AsyncStorage cache
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (!district || district === 'All Districts') return parsed;
        const cleanDist = district.replace(/district/gi, '').trim().toLowerCase();
        return parsed.filter((m: DistrictMeeting) => {
          const mDist = (m.district || '').replace(/district/gi, '').trim().toLowerCase();
          return !cleanDist || mDist === cleanDist || mDist.includes(cleanDist) || cleanDist.includes(mDist);
        });
      }
    }
  } catch { }

  return [];
}

/**
 * Create a new meeting in Supabase; falls back to AsyncStorage-only on error
 */
export async function createMeeting(meetingData: Omit<DistrictMeeting, 'id'>): Promise<DistrictMeeting> {
  const record = {
    title: meetingData.title,
    agenda: meetingData.agenda,
    date: meetingData.date,
    time: meetingData.time,
    venue: meetingData.venue,
    chairperson: meetingData.chairperson,
    recorded_by: meetingData.recordedBy,
    attendees_count: meetingData.attendeesCount,
    status: meetingData.status,
    district: meetingData.district,
    minutes: meetingData.minutes,
    resolutions: meetingData.resolutions,
  };

  for (const schema of SCHEMAS_TO_TRY) {
    try {
      const client = schema === 'public' ? supabase.schema('public') : supabase.schema('dev');
      for (const table of CANDIDATE_MEETING_TABLES) {
        try {
          const { data, error } = await client
            .from(table)
            .insert([record])
            .select()
            .single();

          if (!error && data) {
            const created = mapDbRowToMeeting(data);
            try {
              const cached = await AsyncStorage.getItem(STORAGE_KEY);
              const list: DistrictMeeting[] = cached ? JSON.parse(cached) : [];
              await updateLocalCache([created, ...list.filter(m => m.id !== created.id)]);
            } catch { }
            return created;
          }
        } catch { }
      }
    } catch (e) {
      console.warn(`createMeeting (${schema} schema) error:`, e);
    }
  }

  // Supabase unreachable - save locally so data is not lost
  console.warn('Could not insert meeting into Supabase, saving to AsyncStorage only.');
  const local: DistrictMeeting = { id: `local-${Date.now()}`, ...meetingData };
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    const list: DistrictMeeting[] = cached ? JSON.parse(cached) : [];
    await updateLocalCache([local, ...list]);
  } catch { }
  return local;
}

/**
 * Approve a pending meeting - sets status to 'upcoming'
 */
export async function approveMeeting(id: string): Promise<DistrictMeeting> {
  for (const schema of SCHEMAS_TO_TRY) {
    try {
      const client = schema === 'public' ? supabase.schema('public') : supabase.schema('dev');
      for (const table of CANDIDATE_MEETING_TABLES) {
        try {
          const { data, error } = await client
            .from(table)
            .update({ status: 'upcoming' })
            .eq('id', id)
            .select()
            .single();

          if (!error && data) {
            const updated = mapDbRowToMeeting(data);
            try {
              const cached = await AsyncStorage.getItem(STORAGE_KEY);
              const list: DistrictMeeting[] = cached ? JSON.parse(cached) : [];
              await updateLocalCache(list.map(m => m.id === updated.id ? updated : m));
            } catch { }
            return updated;
          }
        } catch { }
      }
    } catch (e) {
      console.warn(`approveMeeting (${schema} schema) error:`, e);
    }
  }

  // Fallback: update locally only
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEY);
    const list: DistrictMeeting[] = cached ? JSON.parse(cached) : [];
    const updated = list.map(m => m.id === id ? { ...m, status: 'upcoming' as const } : m);
    await updateLocalCache(updated);
    const found = updated.find(m => m.id === id);
    if (found) return found;
  } catch { }

  throw new Error('Failed to approve meeting');
}

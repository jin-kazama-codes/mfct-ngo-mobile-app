import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  appointedDate: string;
}

export interface DistrictTeamUnit {
  id: string;
  unitName: string;
  unitType: 'block' | 'city';
  tehsilOrZone: string;
  district: string;
  presidentName: string;
  presidentPhone: string;
  secretaryName: string;
  secretaryPhone: string;
  coordinatorName?: string;
  coordinatorPhone?: string;
  formedDate: string;
  activeVolunteersCount: number;
  status: 'active' | 'in_formation' | 'pending';
  objectives: string;
  members: TeamMember[];
}

export const STORAGE_KEY = 'mfct_mobile_district_teams';

const CANDIDATE_TABLES = ['district_teams', 'teams', 'team_units', 'district_team_units'];
const activeSchema = process.env.EXPO_PUBLIC_SUPABASE_SCHEMA || 'dev';
const SCHEMAS_TO_TRY = activeSchema === 'public' ? ['public', 'dev'] : ['dev', 'public'];

function mapDbRowToTeam(row: any): DistrictTeamUnit {
  let members: TeamMember[] = [];
  if (Array.isArray(row.members)) {
    members = row.members;
  } else if (typeof row.members === 'string') {
    try {
      members = JSON.parse(row.members);
    } catch {
      members = [];
    }
  }

  return {
    id: String(row.id),
    unitName: row.unit_name || row.unitName || '',
    unitType: (row.unit_type || row.unitType || 'block') as 'block' | 'city',
    tehsilOrZone: row.tehsil_or_zone || row.tehsilOrZone || '',
    district: row.district || '',
    presidentName: row.president_name || row.presidentName || row.head_name || row.HeadName || '',
    presidentPhone: row.president_phone || row.presidentPhone || row.head_phone || row.HeadPhone || '',
    secretaryName: row.secretary_name || row.secretaryName || '',
    secretaryPhone: row.secretary_phone || row.secretaryPhone || '',
    coordinatorName: row.coordinator_name || row.coordinatorName || '',
    coordinatorPhone: row.coordinator_phone || row.coordinatorPhone || '',
    formedDate: row.formed_date || row.formedDate || new Date().toISOString().split('T')[0],
    activeVolunteersCount: Number(row.active_volunteers_count ?? row.activeVolunteersCount ?? members.length),
    status: (row.status || 'pending') as 'active' | 'in_formation' | 'pending',
    objectives: row.objectives || '',
    members,
  };
}

export async function getTeams(district?: string): Promise<DistrictTeamUnit[]> {
  for (const schema of SCHEMAS_TO_TRY) {
    try {
      const client = schema === 'public' ? supabase.schema('public') : supabase.schema('dev');
      for (const table of CANDIDATE_TABLES) {
        try {
          let query = client.from(table).select('*').order('created_at', { ascending: false });
          if (district && district !== 'All Districts') {
            query = query.ilike('district', `%${district}%`);
          }

          const { data, error } = await query;
          if (!error && data && data.length > 0) {
            const mapped = data.map(mapDbRowToTeam);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
            return mapped;
          }
        } catch { }
      }
    } catch { }
  }

  // Fallback to local AsyncStorage cache created by actual user actions
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        if (!district || district === 'All Districts') return parsed;
        const cleanDist = district.replace(/district/gi, '').trim().toLowerCase();
        return parsed.filter(t => {
          const tDist = (t.district || '').replace(/district/gi, '').trim().toLowerCase();
          return !cleanDist || tDist === cleanDist || tDist.includes(cleanDist) || cleanDist.includes(tDist);
        });
      }
    }
  } catch (err) {
    console.warn('getTeams local cache read error:', err);
  }

  // No dummy teams: return clean empty list
  return [];
}

export async function createTeam(teamData: Omit<DistrictTeamUnit, 'id'>): Promise<DistrictTeamUnit> {
  const newId = `team_${Date.now()}`;
  const team: DistrictTeamUnit = {
    ...teamData,
    id: newId,
  };

  const payload: Record<string, any> = {
    id: newId,
    unit_name: team.unitName,
    unit_type: team.unitType,
    tehsil_or_zone: team.tehsilOrZone,
    district: team.district,
    president_name: team.presidentName,
    president_phone: team.presidentPhone,
    secretary_name: team.secretaryName,
    secretary_phone: team.secretaryPhone,
    coordinator_name: team.coordinatorName || null,
    coordinator_phone: team.coordinatorPhone || null,
    formed_date: team.formedDate,
    active_volunteers_count: team.activeVolunteersCount,
    status: team.status,
    objectives: team.objectives,
    members: JSON.stringify(team.members),
  };

  // Attempt insert in Supabase
  for (const schema of SCHEMAS_TO_TRY) {
    try {
      const client = schema === 'public' ? supabase.schema('public') : supabase.schema('dev');
      for (const table of CANDIDATE_TABLES) {
        try {
          const { error } = await client.from(table).insert([payload]);
          if (!error) break;
        } catch { }
      }
    } catch { }
  }

  // Update local cache
  try {
    const current = await getTeams();
    const updated = [team, ...current.filter(t => t.id !== newId)];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { }

  return team;
}

export async function updateTeam(id: string, updates: Partial<DistrictTeamUnit>): Promise<void> {
  // Update Supabase
  const payload: Record<string, any> = {};
  if (updates.unitName !== undefined) payload.unit_name = updates.unitName;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.presidentName !== undefined) payload.president_name = updates.presidentName;
  if (updates.presidentPhone !== undefined) payload.president_phone = updates.presidentPhone;
  if (updates.secretaryName !== undefined) payload.secretary_name = updates.secretaryName;
  if (updates.secretaryPhone !== undefined) payload.secretary_phone = updates.secretaryPhone;
  if (updates.objectives !== undefined) payload.objectives = updates.objectives;
  if (updates.members !== undefined) payload.members = JSON.stringify(updates.members);

  for (const schema of SCHEMAS_TO_TRY) {
    try {
      const client = schema === 'public' ? supabase.schema('public') : supabase.schema('dev');
      for (const table of CANDIDATE_TABLES) {
        try {
          const { error } = await client.from(table).update(payload).eq('id', id);
          if (!error) break;
        } catch { }
      }
    } catch { }
  }

  // Update local cache
  try {
    const current = await getTeams();
    const updated = current.map(t => (t.id === id ? { ...t, ...updates } : t));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { }
}

export async function saveTeams(teams: DistrictTeamUnit[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch (err) {
    console.warn('saveTeams error:', err);
  }
}

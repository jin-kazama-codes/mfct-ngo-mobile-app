import { supabase } from '../lib/supabase';
import { Community } from '../types';

function mapRow(row: Record<string, unknown>): Community {
  return {
    id: row.id as string,
    name: (row.name as string) || '',
    city: (row.city as string) || '',
    state: (row.state as string) || '',
    adminName: (row.adminName || row.admin_name) as string,
    adminRoleTitle: (row.adminRoleTitle || row.admin_role_title) as string,
    avatar: (row.avatar as string) || '',
    totalMembers: Number(row.totalMembers ?? row.total_members ?? 0),
    activeCampaigns: Number(row.activeCampaigns ?? row.active_campaigns ?? 0),
    totalRaisedINR: Number(row.totalRaisedINR ?? row.total_raised_inr ?? 0),
    healthScore: Number(row.healthScore ?? row.health_score ?? 95),
    verifiedStatus: ((row.verifiedStatus || row.verified_status) as Community['verifiedStatus']) || 'Verified',
    description: (row.description as string) || '',
    establishedYear: Number(row.establishedYear ?? row.established_year ?? 2020),
    coverImage: (row.coverImage || row.cover_image) as string,
  };
}

export async function getCommunities(): Promise<Community[]> {
  try {
    const { data, error } = await supabase
      .from('communities')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.error('getCommunities error:', err);
    return [];
  }
}

export async function getCommunityById(id: string): Promise<Community | null> {
  try {
    const { data, error } = await supabase.from('communities').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapRow(data);
  } catch {
    return null;
  }
}

export async function createCommunity(community: Omit<Community, 'id'>): Promise<Community> {
  const payload = {
    id: `comm_${Date.now()}`,
    name: community.name,
    city: community.city,
    state: community.state || 'UP',
    admin_name: community.adminName || 'Community Admin',
    admin_role_title: community.adminRoleTitle || 'Community Administrator',
    avatar: community.avatar || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=200&q=80',
    total_members: 1,
    active_campaigns: 0,
    total_raised_inr: 0,
    health_score: 100,
    verified_status: 'Verified',
    description: community.description || '',
    established_year: community.establishedYear || 2024,
    cover_image: community.coverImage || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
  };
  const { data, error } = await supabase.from('communities').insert(payload).select().single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateCommunity(id: string, updates: Partial<Community>): Promise<Community> {
  const payload: Record<string, any> = {
    name: updates.name,
    city: updates.city,
    state: updates.state,
    admin_name: updates.adminName,
    admin_role_title: updates.adminRoleTitle,
    avatar: updates.avatar,
    total_members: updates.totalMembers,
    active_campaigns: updates.activeCampaigns,
    total_raised_inr: updates.totalRaisedINR,
    health_score: updates.healthScore,
    verified_status: updates.verifiedStatus,
    description: updates.description,
    established_year: updates.establishedYear,
    cover_image: updates.coverImage,
  };
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  const { data, error } = await supabase
    .from('communities')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function deleteCommunity(id: string): Promise<void> {
  const { error } = await supabase.from('communities').delete().eq('id', id);
  if (error) throw error;
}


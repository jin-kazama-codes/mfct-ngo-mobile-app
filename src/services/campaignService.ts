import { supabase } from '../lib/supabase';
import { Campaign, DonationCategory } from '../types';

function mapRow(row: Record<string, unknown>): Campaign {
  const rawMainImage = (row.mainImage || row.main_image || '') as string;
  const splitImages = rawMainImage ? rawMainImage.split(',') : [];

  return {
    id: (row.id as string) || `camp_${Date.now()}`,
    title: (row.title as string) || '',
    category: (row.category as DonationCategory) || 'Medical',
    communityId: (row.communityId || row.community_id) as string,
    communityName: (row.communityName || row.community_name) as string,
    city: (row.city as string) || '',
    beneficiaryName: (row.beneficiaryName || row.beneficiary_name) as string,
    beneficiaryRelation: (row.beneficiaryRelation || row.beneficiary_relation) as string,
    goalINR: Number(row.goalINR ?? row.goal_inr ?? 100000),
    raisedINR: Number(row.raisedINR ?? row.raised_inr ?? 0),
    donorsCount: Number(row.donorsCount ?? row.donors_count ?? 0),
    daysLeft: Number(row.daysLeft ?? row.days_left ?? 30),
    isVerified: Boolean(row.isVerified ?? row.is_verified ?? true),
    isZakatEligible: Boolean(row.isZakatEligible ?? row.is_zakat_eligible ?? false),
    isSadqaEligible: Boolean(row.isSadqaEligible ?? row.is_sadqa_eligible ?? row.is_sadaqah_eligible ?? false),
    isFitrahEligible: Boolean(row.isFitrahEligible ?? row.is_fitrah_eligible ?? row.is_fitra_eligible ?? false),
    isUrgent: Boolean(row.isUrgent ?? row.is_urgent ?? false),
    mainImage: splitImages[0] || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    galleryImages: splitImages.slice(1) || [],
    story: (row.story as string) || '',
    documents: ((row.documents ?? []) as Campaign['documents']) || [],
    createdDate: (row.createdDate || row.created_date) as string,
    createdBy: (row.createdBy || row.created_by) as string,
    status: row.status === 'approved' ? 'active' : row.status === 'pending' ? 'pending_approval' : (row.status as Campaign['status']) || 'active',
  };
}

function mapEmergencyRow(row: any): Campaign {
  const rawMainImage = (row.mainImage || row.main_image || '') as string;
  const splitImages = rawMainImage ? String(rawMainImage).split(',') : [];

  return {
    id: row.id?.startsWith('emergency_') ? row.id : `emergency_${row.id}`,
    title: row.title || row.description?.slice(0, 50) || `Emergency: ${row.aid_category || 'Relief'}`,
    category: 'Emergency Relief' as DonationCategory,
    communityId: row.community_id || 'comm_bareilly_hq',
    communityName: row.community_name || 'Bareilly Central Care Society (Headquarters)',
    city: row.city || 'Bareilly',
    beneficiaryName: row.member_name || row.beneficiary_name || 'Beneficiary',
    beneficiaryRelation: 'Self',
    goalINR: Number(row.estimated_amount_inr || row.goal_inr || row.goalINR || 50000),
    raisedINR: Number(row.raised_inr || row.raisedINR || 0),
    donorsCount: Number(row.donors_count || row.donorsCount || 0),
    daysLeft: Number(row.days_left || row.daysLeft || 7),
    isVerified: true,
    isZakatEligible: true,
    isUrgent: true,
    mainImage: splitImages[0] || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    galleryImages: splitImages.slice(1) || [],
    story: row.description || row.story || '',
    documents: [],
    createdBy: row.member_id || row.created_by || '',
    createdDate: row.created_at || row.created_date || new Date().toISOString(),
    status: 'active' as Campaign['status'],
  };
}

export async function getCampaigns(filters?: {
  category?: string;
  city?: string;
  zakatOnly?: boolean;
  status?: string;
  communityId?: string;
}): Promise<Campaign[]> {
  try {
    let query = supabase.from('campaigns').select('*');

    if (filters?.category && filters.category !== 'all' && filters.category !== 'All') {
      if (filters.category === 'Zakat') {
        query = query.eq('is_zakat_eligible', true);
      } else {
        query = query.eq('category', filters.category);
      }
    }
    if (filters?.city && filters.city !== 'All') {
      query = query.eq('city', filters.city);
    }
    if (filters?.zakatOnly) {
      query = query.eq('is_zakat_eligible', true);
    }
    if (filters?.communityId) {
      query = query.eq('community_id', filters.communityId);
    }

    if (filters?.status && filters.status !== 'all') {
      if (filters.status === 'active') {
        query = query.or('status.eq.active,status.eq.approved');
      } else {
        query = query.eq('status', filters.status);
      }
    }

    const { data, error } = await query;
    if (error) {
      console.warn('getCampaigns error, trying fallback without filters:', error);
      const { data: fbData, error: fbError } = await supabase.from('campaigns').select('*');
      if (fbError) throw fbError;
      return (fbData ?? []).map(mapRow);
    }
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.error('getCampaigns error:', err);
    return [];
  }
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  try {
    if (id.startsWith('emergency_')) {
      const cleanId = id.replace('emergency_', '');
      const { data } = await supabase.from('emergency_aid_requests').select('*').eq('id', cleanId).single();
      if (data) return mapEmergencyRow(data);
    }
    const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapRow(data);
  } catch {
    return null;
  }
}

export async function getEmergencyCampaigns(): Promise<Campaign[]> {
  try {
    const { data, error } = await supabase
      .from('emergency_aid_requests')
      .select('*');
    if (error || !data) return [];

    return data
      .filter((row: any) => row.status === 'approved' || row.status === 'active' || !row.status)
      .map(mapEmergencyRow);
  } catch (err) {
    console.warn('getEmergencyCampaigns warning:', err);
    return [];
  }
}

export async function createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
  const payload = {
    id: `camp_${Date.now()}`,
    title: campaign.title,
    category: campaign.category,
    community_id: campaign.communityId || 'comm_bareilly_hq',
    community_name: campaign.communityName || 'Bareilly Central Care Society (Headquarters)',
    city: campaign.city || 'Bareilly',
    beneficiary_name: campaign.beneficiaryName || 'Community Beneficiary',
    beneficiary_relation: campaign.beneficiaryRelation || 'Self',
    goal_inr: Number(campaign.goalINR || 100000),
    raised_inr: Number(campaign.raisedINR || 0),
    donors_count: 0,
    days_left: Number(campaign.daysLeft || 30),
    is_verified: true,
    is_zakat_eligible: Boolean(campaign.isZakatEligible),
    is_sadqa_eligible: Boolean(campaign.isSadqaEligible),
    is_fitrah_eligible: Boolean(campaign.isFitrahEligible),
    is_urgent: Boolean(campaign.isUrgent),
    main_image: [campaign.mainImage, ...(campaign.galleryImages || [])].filter(Boolean).join(',') || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    documents: campaign.documents || [],
    story: campaign.story || '',
    created_date: new Date().toISOString(),
    status: campaign.status === 'active' ? 'approved' : (campaign.status || 'approved'),
  };
  const { data, error } = await supabase.from('campaigns').insert(payload).select().single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateCampaign(
  id: string,
  updateData: Partial<Campaign>
): Promise<Campaign> {
  const payload: any = {};
  if (updateData.title !== undefined) payload.title = updateData.title;
  if (updateData.category !== undefined) payload.category = updateData.category;
  if (updateData.communityId !== undefined) payload.community_id = updateData.communityId;
  if (updateData.communityName !== undefined) payload.community_name = updateData.communityName;
  if (updateData.city !== undefined) payload.city = updateData.city;
  if (updateData.beneficiaryName !== undefined) payload.beneficiary_name = updateData.beneficiaryName;
  if (updateData.beneficiaryRelation !== undefined) payload.beneficiary_relation = updateData.beneficiaryRelation;
  if (updateData.goalINR !== undefined) payload.goal_inr = updateData.goalINR;
  if (updateData.isZakatEligible !== undefined) payload.is_zakat_eligible = updateData.isZakatEligible;
  if (updateData.isSadqaEligible !== undefined) payload.is_sadqa_eligible = updateData.isSadqaEligible;
  if (updateData.isFitrahEligible !== undefined) payload.is_fitrah_eligible = updateData.isFitrahEligible;
  if (updateData.isUrgent !== undefined) payload.is_urgent = updateData.isUrgent;
  if (updateData.mainImage !== undefined) {
    const allImages = [updateData.mainImage, ...(updateData.galleryImages || [])].filter(Boolean);
    payload.main_image = allImages.join(',');
  }
  if (updateData.story !== undefined) payload.story = updateData.story;
  if (updateData.documents !== undefined) payload.documents = updateData.documents;
  if (updateData.status !== undefined) {
    payload.status = updateData.status === 'active' ? 'approved' : updateData.status;
  }

  const { data, error } = await supabase
    .from('campaigns')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateCampaignStatus(
  id: string,
  status: string,
  isVerified: boolean
): Promise<Campaign> {
  const dbStatus = status === 'active' ? 'approved' : status;
  const { data, error } = await supabase
    .from('campaigns')
    .update({ status: dbStatus, is_verified: isVerified })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteCampaign(id: string): Promise<void> {
  const { error } = await supabase.from('campaigns').delete().eq('id', id);
  if (error) throw error;
}


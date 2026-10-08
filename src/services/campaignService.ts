import { supabase } from '../lib/supabase';
import { Campaign, DonationCategory } from '../types';

const NUMBER_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];

function formatImagesToJsonb(urls: unknown): Record<string, string> {
  let list: string[] = [];
  if (Array.isArray(urls)) {
    list = urls.map(String).map(s => s.trim()).filter(Boolean);
  } else if (urls && typeof urls === 'object') {
    list = Object.values(urls as Record<string, unknown>).map(String).map(s => s.trim()).filter(Boolean);
  } else if (typeof urls === 'string' && urls.trim()) {
    list = urls.split(',').map(s => s.trim()).filter(Boolean);
  }
  const obj: Record<string, string> = {};
  list.forEach((url, index) => {
    const key = index < NUMBER_WORDS.length ? `${NUMBER_WORDS[index]}_image` : `image_${index + 1}`;
    obj[key] = url;
  });
  return obj;
}

function parseImages(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof raw === 'object') {
    return Object.values(raw as Record<string, unknown>).map(String).map(s => s.trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return parseImages(parsed);
      } catch {
        return trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    return trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

export function calculateDaysLeft(row: Record<string, unknown>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Dynamic calculation from end_date or endDate
  const endDateVal = (row.end_date || row.endDate) as string | undefined;
  if (endDateVal) {
    const end = new Date(endDateVal);
    if (!isNaN(end.getTime())) {
      end.setHours(0, 0, 0, 0);
      const diffMs = end.getTime() - today.getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  // 2. Dynamic calculation from created_date / created_at + static days
  const createdDateVal = (row.created_at || row.created_date || row.createdDate) as string | undefined;
  const staticDays = Number(row.days_left ?? row.daysLeft);
  if (createdDateVal && !isNaN(staticDays) && staticDays > 0) {
    const created = new Date(createdDateVal);
    if (!isNaN(created.getTime())) {
      const end = new Date(created);
      end.setDate(end.getDate() + staticDays);
      end.setHours(0, 0, 0, 0);
      const diffMs = end.getTime() - today.getTime();
      return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  // 3. Fallback to static number if present and valid
  if (!isNaN(staticDays) && staticDays >= 0) {
    return staticDays;
  }

  return 30;
}

function mapRow(row: Record<string, unknown>): Campaign {
  const images = parseImages(row.mainImage || row.main_image);
  const gallery = parseImages(row.galleryImages || row.gallery_images);
  const allImages = Array.from(new Set([...images, ...gallery]));

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
    daysLeft: calculateDaysLeft(row),
    endDate: (row.end_date || row.endDate) as string | undefined,
    end_date: (row.end_date || row.endDate) as string | undefined,
    isVerified: Boolean(row.isVerified ?? row.is_verified ?? true),
    isZakatEligible: Boolean(row.isZakatEligible ?? row.is_zakat_eligible ?? false),
    isSadqaEligible: Boolean(row.isSadqaEligible ?? row.is_sadqa_eligible ?? row.is_sadaqah_eligible ?? false),
    isFitrahEligible: Boolean(row.isFitrahEligible ?? row.is_fitrah_eligible ?? row.is_fitra_eligible ?? false),
    isUrgent: Boolean(row.isUrgent ?? row.is_urgent ?? false),
    mainImage: allImages[0] || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    galleryImages: allImages.slice(1) || [],
    story: (row.story as string) || '',
    documents: ((row.documents ?? []) as Campaign['documents']) || [],
    createdDate: (row.createdDate || row.created_date) as string,
    createdBy: (row.createdBy || row.created_by) as string,
    status: row.status === 'approved' ? 'active' : row.status === 'pending' ? 'pending_approval' : (row.status as Campaign['status']) || 'active',
  };
}

function mapEmergencyRow(row: any): Campaign {
  const images = parseImages(row.mainImage || row.main_image);
  const allImages = Array.from(new Set(images));

  return {
    id: row.id?.startsWith('emergency_') ? row.id : `emergency_${row.id}`,
    title: row.title || row.description?.slice(0, 50) || `Emergency: ${row.aid_category || 'Relief'}`,
    category: 'Emergency Relief' as DonationCategory,
    communityId: row.community_id || undefined,
    communityName: row.community_name || 'MFCT Trust',
    city: row.city || '',
    beneficiaryName: row.member_name || row.beneficiary_name || 'Beneficiary',
    beneficiaryRelation: 'Self',
    goalINR: Number(row.estimated_amount_inr || row.goal_inr || row.goalINR || 50000),
    raisedINR: Number(row.raised_inr || row.raisedINR || 0),
    donorsCount: Number(row.donors_count || row.donorsCount || 0),
    daysLeft: calculateDaysLeft({
      ...row,
      days_left: row.days_left || row.daysLeft || 7,
      created_at: row.created_at || row.created_date,
    }),
    endDate: (row.end_date || row.endDate) as string | undefined,
    end_date: (row.end_date || row.endDate) as string | undefined,
    isVerified: true,
    isZakatEligible: true,
    isUrgent: true,
    mainImage: allImages[0] || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    galleryImages: allImages.slice(1) || [],
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
  const allImages = [campaign.mainImage, ...(campaign.galleryImages || [])].filter(Boolean);
  const jsonbImages = formatImagesToJsonb(allImages.length > 0 ? allImages : ['https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80']);

  const initialDays = Number(campaign.daysLeft || 30);
  const endDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + initialDays);
    return d.toISOString().split('T')[0];
  })();

  const payload = {
    id: `camp_${Date.now()}`,
    title: campaign.title,
    category: campaign.category,
    community_id: campaign.communityId || null,
    community_name: campaign.communityName || 'MFCT Trust',
    city: campaign.city || '',
    beneficiary_name: campaign.beneficiaryName || 'Community Beneficiary',
    beneficiary_relation: campaign.beneficiaryRelation || 'Self',
    goal_inr: Number(campaign.goalINR || 100000),
    raised_inr: Number(campaign.raisedINR || 0),
    donors_count: 0,
    days_left: initialDays,
    end_date: endDate,
    is_verified: true,
    is_zakat_eligible: Boolean(campaign.isZakatEligible),
    is_sadqa_eligible: Boolean(campaign.isSadqaEligible),
    is_fitrah_eligible: Boolean(campaign.isFitrahEligible),
    is_urgent: Boolean(campaign.isUrgent),
    main_image: jsonbImages,
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
  if (updateData.daysLeft !== undefined || (updateData as any).days_left !== undefined) {
    const days = Number(updateData.daysLeft ?? (updateData as any).days_left) || 30;
    payload.days_left = days;
    const d = new Date();
    d.setDate(d.getDate() + days);
    payload.end_date = d.toISOString().split('T')[0];
  }
  if (updateData.isZakatEligible !== undefined) payload.is_zakat_eligible = updateData.isZakatEligible;
  if (updateData.isSadqaEligible !== undefined) payload.is_sadqa_eligible = updateData.isSadqaEligible;
  if (updateData.isFitrahEligible !== undefined) payload.is_fitrah_eligible = updateData.isFitrahEligible;
  if (updateData.isUrgent !== undefined) payload.is_urgent = updateData.isUrgent;
  if (updateData.mainImage !== undefined || updateData.galleryImages !== undefined) {
    const allImages = [updateData.mainImage, ...(updateData.galleryImages || [])].filter(Boolean);
    payload.main_image = formatImagesToJsonb(allImages);
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


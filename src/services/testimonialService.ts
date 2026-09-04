import { supabase } from '../lib/supabase';
import { Testimonial } from '../types';

function mapRow(row: Record<string, unknown>): Testimonial {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as string,
    city: row.city as string,
    quote: row.quote as string,
    avatar: row.avatar as string,
    campaignTitle: (row.campaignTitle || row.campaign_title) as string | undefined,
    createdBy: row.created_by as string | undefined,
    communityId: row.community_id as string | undefined,
    status: row.status as 'pending' | 'approved' | 'rejected' | undefined,
  };
}

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.error('getTestimonials error:', err);
    return [];
  }
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.error('getAllTestimonials error:', err);
    return [];
  }
}

export async function createTestimonial(testimonial: Omit<Testimonial, 'id'>): Promise<Testimonial> {
  const payload: Record<string, any> = {
    id: `test_${Date.now()}`,
    name: testimonial.name,
    role: testimonial.role || 'Community Member',
    city: testimonial.city,
    quote: testimonial.quote,
    avatar: testimonial.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    campaign_title: testimonial.campaignTitle,
    created_by: testimonial.createdBy,
    community_id: testimonial.communityId,
    status: testimonial.status || 'approved',
  };
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  const { data, error } = await supabase.from('testimonials').insert(payload).select().single();
  if (error) throw error;
  return mapRow(data);
}

export async function updateTestimonial(id: string, updates: Partial<Omit<Testimonial, 'id'>>): Promise<Testimonial> {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.quote !== undefined) payload.quote = updates.quote;
  if (updates.avatar !== undefined) payload.avatar = updates.avatar;
  if (updates.campaignTitle !== undefined) payload.campaign_title = updates.campaignTitle;
  if (updates.createdBy !== undefined) payload.created_by = updates.createdBy;
  if (updates.communityId !== undefined) payload.community_id = updates.communityId;
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await supabase.from('testimonials').update(payload).eq('id', id).select().single();
  if (error) throw error;
  return mapRow(data);
}

export async function deleteTestimonial(id: string): Promise<void> {
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  if (error) throw error;
}

import { supabase } from '../lib/supabase';

export interface GalleryPhoto {
  id: string;
  title: string;
  city: string;
  image: string;
  category: string;
  description?: string;
  createdBy?: string;
  communityId?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

let localPhotos: GalleryPhoto[] = [];

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapRow(row: Record<string, unknown>): GalleryPhoto {
  return {
    id: row.id as string,
    title: row.title as string,
    city: row.city as string,
    image: row.image as string,
    category: row.category as string,
    createdBy: row.created_by as string | undefined,
    communityId: row.community_id as string | undefined,
    status: row.status as 'pending' | 'approved' | 'rejected' | undefined,
  };
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const { data, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('created_at', { ascending: false });
    
    let basePhotos: GalleryPhoto[] = [];
    if (!error && data) {
      basePhotos = data.map(mapRow);
    } else {
      // Fallback if gallery_photos table is not present
      const { data: fallbackData } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false });
      if (fallbackData) basePhotos = fallbackData.map(mapRow);
    }

    // Merge any local additions that might not be in DB yet
    const existingIds = new Set(basePhotos.map(p => p.id));
    const pendingLocal = localPhotos.filter(p => !existingIds.has(p.id));
    return [...pendingLocal, ...basePhotos];
  } catch (err) {
    console.error('getGalleryPhotos error:', err);
    return localPhotos;
  }
}

export async function createGalleryPhoto(photo: Omit<GalleryPhoto, 'id'>): Promise<GalleryPhoto> {
  const payload: Record<string, any> = {
    title: photo.title,
    city: photo.city || 'Bareilly',
    image: photo.image,
    category: photo.category || 'Community',
  };
  if (photo.createdBy) payload.created_by = photo.createdBy;
  if (photo.communityId) payload.community_id = photo.communityId;
  if (photo.status) payload.status = photo.status;

  try {
    const { data, error } = await supabase.from('gallery_photos').insert(payload).select().single();
    if (!error && data) {
      const created = mapRow(data);
      localPhotos = [created, ...localPhotos.filter(p => p.id !== created.id)];
      return created;
    }
    
    // Fallback if gallery table is used
    const { data: fbData, error: fbError } = await supabase.from('gallery').insert(payload).select().single();
    if (!fbError && fbData) {
      const created = mapRow(fbData);
      localPhotos = [created, ...localPhotos.filter(p => p.id !== created.id)];
      return created;
    }

    // If RLS blocked (e.g. 42501 error), create local record
    console.warn('Supabase RLS restricted insert, storing locally:', error?.message || fbError?.message);
    const localCreated: GalleryPhoto = {
      id: generateUUID(),
      title: photo.title,
      city: photo.city || 'Bareilly',
      image: photo.image,
      category: photo.category || 'Community',
      createdBy: photo.createdBy,
      communityId: photo.communityId,
      status: photo.status || 'approved',
    };
    localPhotos = [localCreated, ...localPhotos];
    return localCreated;
  } catch (err) {
    console.warn('createGalleryPhoto exception, storing locally:', err);
    const localCreated: GalleryPhoto = {
      id: generateUUID(),
      title: photo.title,
      city: photo.city || 'Bareilly',
      image: photo.image,
      category: photo.category || 'Community',
      createdBy: photo.createdBy,
      communityId: photo.communityId,
      status: photo.status || 'approved',
    };
    localPhotos = [localCreated, ...localPhotos];
    return localCreated;
  }
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  localPhotos = localPhotos.filter(p => p.id !== id);
  try {
    const { error } = await supabase.from('gallery_photos').delete().eq('id', id);
    if (error) {
      await supabase.from('gallery').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('deleteGalleryPhoto db error, removed locally:', err);
  }
}

export async function updateGalleryPhoto(id: string, updates: Partial<Omit<GalleryPhoto, 'id'>>): Promise<GalleryPhoto> {
  const payload: Record<string, any> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.city !== undefined) payload.city = updates.city;
  if (updates.image !== undefined) payload.image = updates.image;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.communityId !== undefined) payload.community_id = updates.communityId;

  // Update local list
  localPhotos = localPhotos.map(p => (p.id === id ? { ...p, ...updates } : p));

  try {
    const { data, error } = await supabase
      .from('gallery_photos')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return mapRow(data);
    }

    const { data: fallbackData, error: fallbackError } = await supabase
      .from('gallery')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (!fallbackError && fallbackData) {
      return mapRow(fallbackData);
    }

    return {
      id,
      title: updates.title || '',
      city: updates.city || '',
      image: updates.image || '',
      category: updates.category || 'Community',
      ...updates,
    } as GalleryPhoto;
  } catch (err) {
    console.warn('updateGalleryPhoto db error, updated locally:', err);
    return {
      id,
      title: updates.title || '',
      city: updates.city || '',
      image: updates.image || '',
      category: updates.category || 'Community',
      ...updates,
    } as GalleryPhoto;
  }
}

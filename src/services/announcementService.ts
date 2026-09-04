import { supabase } from '../lib/supabase';

export interface Announcement {
  id: string;
  communityId: string;
  communityName: string;
  sentBy: string;
  message: string;
  channel: string;
  sentAt: string;
}

function mapRow(row: Record<string, any>): Announcement {
  return {
    id: row.id,
    communityId: row.community_id,
    communityName: row.community_name,
    sentBy: row.sent_by,
    message: row.message,
    channel: row.channel,
    sentAt: row.sent_at,
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
      console.error('Supabase Error fetching announcements:', error.message, error.details, error.hint);
      return [];
    }
    
    console.log('Fetched announcements for', communityId, ':', data);
    return (data || []).map(mapRow);
  } catch (err) {
    console.error('getAnnouncementsByCommunity exception:', err);
    return [];
  }
}

import { supabase } from '../lib/supabase';
import { CommunityStory, DonationCategory } from '../types';

function mapRow(row: Record<string, unknown>): CommunityStory {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as DonationCategory,
    location: row.location as string,
    date: row.date as string,
    image: row.image as string,
    summary: row.summary as string,
    impactMetric: row.impact_metric as string,
  };
}

export async function getCommunityStories(): Promise<CommunityStory[]> {
  const { data, error } = await supabase
    .from('community_stories')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

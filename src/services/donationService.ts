import { supabase } from '../lib/supabase';
import { Donation, DonationCategory, UserRole } from '../types';

function mapRow(row: Record<string, unknown>): Donation {
  return {
    id: (row.id as string) || `don_${Date.now()}`,
    transactionId: (row.transactionId || row.transaction_id) as string,
    utrNumber: (row.utrNumber || row.utr_number) as string,
    donorName: (row.donorName || row.donor_name) as string,
    donorId: (row.donorId || row.donor_id) as string,
    donorRole: (row.donorRole || row.donor_role) as UserRole,
    campaignId: (row.campaignId || row.campaign_id) as string,
    campaignTitle: (row.campaignTitle || row.campaign_title) as string,
    communityName: (row.communityName || row.community_name) as string,
    amountINR: Number(row.amountINR ?? row.amount_inr ?? 0),
    category: (row.category as DonationCategory) || 'General',
    isOutsideCommunity: Boolean(row.isOutsideCommunity ?? row.is_outside_community ?? false),
    paymentMethod: ((row.paymentMethod || row.payment_method) as Donation['paymentMethod']) || 'UPI',
    paymentScreenshotUrl: (row.paymentScreenshotUrl || row.payment_screenshot_url) as string | undefined,
    status: ((row.status as Donation['status']) || 'verified'),
    date: (row.date as string) || '',
    receiptNumber: (row.receiptNumber || row.receipt_number) as string,
  };
}

export async function getDonations(donorId?: string): Promise<Donation[]> {
  try {
    let query = supabase.from('donations').select('*').order('date', { ascending: false });
    if (donorId) query = query.eq('donor_id', donorId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.warn('getDonations warning:', err);
    return [];
  }
}

export async function getRecentDonations(limit = 10): Promise<Donation[]> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (err) {
    console.warn('getRecentDonations warning:', err);
    return [];
  }
}

export async function createDonation(donation: Omit<Donation, 'id'>): Promise<Donation> {
  const payload = {
    id: `don_${Date.now()}`,
    transaction_id: donation.transactionId || `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
    utr_number: donation.utrNumber,
    donor_name: donation.donorName || 'Generous Member',
    donor_id: donation.donorId || 'anonymous',
    donor_role: donation.donorRole || 'member',
    campaign_id: donation.campaignId,
    campaign_title: donation.campaignTitle,
    community_name: donation.communityName || 'Bareilly Central Care Society (Headquarters)',
    amount_inr: Number(donation.amountINR || 0),
    category: donation.category || 'General',
    is_outside_community: Boolean(donation.isOutsideCommunity),
    payment_method: donation.paymentMethod || 'UPI',
    payment_screenshot_url: donation.paymentScreenshotUrl,
    status: donation.status || 'pending_verification',
    date: donation.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    receipt_number: donation.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`,
  };

  try {
    const { data, error } = await supabase.from('donations').insert(payload).select().single();
    if (error) {
      console.warn('Supabase donation insert error:', error);
      return {
        id: payload.id,
        ...donation,
        transactionId: payload.transaction_id,
        receiptNumber: payload.receipt_number,
        date: payload.date,
        status: payload.status as Donation['status'],
      };
    }
    return mapRow(data);
  } catch (err) {
    console.warn('createDonation error:', err);
    return {
      id: payload.id,
      ...donation,
      transactionId: payload.transaction_id,
      receiptNumber: payload.receipt_number,
      date: payload.date,
      status: payload.status as Donation['status'],
    };
  }
}

export async function updateCampaignRaised(campaignId: string, addedAmount: number): Promise<void> {
  try {
    if (campaignId.startsWith('emergency_')) {
      const cleanId = campaignId.replace('emergency_', '');
      const { data } = await supabase.from('emergency_aid_requests').select('raised_inr').eq('id', cleanId).single();
      if (data) {
        await supabase.from('emergency_aid_requests').update({
          raised_inr: (data.raised_inr || 0) + addedAmount,
        }).eq('id', cleanId);
      }
      return;
    }

    const { data: camp } = await supabase.from('campaigns').select('raised_inr, donors_count').eq('id', campaignId).single();
    if (camp) {
      await supabase.from('campaigns').update({
        raised_inr: (camp.raised_inr || 0) + addedAmount,
        donors_count: (camp.donors_count || 0) + 1,
      }).eq('id', campaignId);
    }
  } catch (err) {
    console.warn('Error updating campaign raised amount:', err);
  }
}

export async function updateDonationStatus(
  id: string,
  status: Donation['status']
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.warn('updateDonationStatus error:', error);
      throw error;
    }

    if (status === 'verified' && data && data.length > 0) {
      const row = data[0];
      const campId = (row.campaign_id || row.campaignId) as string | undefined;
      const amount = Number(row.amount_inr ?? row.amountINR ?? 0);
      if (campId && amount > 0) {
        await updateCampaignRaised(campId, amount);
      }
    }
  } catch (err) {
    console.warn('updateDonationStatus exception:', err);
    throw err;
  }
}

import { supabase, supabaseAdmin } from '../lib/supabase';
import {
  getDonationTimestamp,
  parseMonthlyBreakdown,
  sortDonationsByLatest,
} from '../lib/monthlyPaymentUtils';
import {
  Donation,
  DonationCategory,
  MonthlyPaymentBreakdownItem,
  UserRole,
  WakalahInformation,
} from '../types';

export { getDonationTimestamp, sortDonationsByLatest };

function parseWakalahInfo(val: unknown): WakalahInformation[] | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) return val as WakalahInformation[];
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed as WakalahInformation[];
      if (parsed && typeof parsed === 'object') return [parsed as WakalahInformation];
    } catch {
      return undefined;
    }
  }
  if (typeof val === 'object') return [val as WakalahInformation];
  return undefined;
}

function extractMissingColumn(error: { message?: string } | null | undefined): string | null {
  const msg = error?.message || '';
  const match =
    msg.match(/Could not find the '([^']+)' column/) ||
    msg.match(/column "([^"]+)" of relation/) ||
    msg.match(/column '([^']+)'/);
  return match ? match[1] : null;
}

function mapRow(row: Record<string, unknown>): Donation {
  const breakdownArray = parseMonthlyBreakdown(
    row.monthlyBreakdown ?? row.monthly_breakdown
  );

  return {
    id: (row.id as string) || `don_${Date.now()}`,
    transactionId: (row.transactionId || row.transaction_id) as string,
    utrNumber: (row.utrNumber || row.utr_number) as string,
    donorName: (row.donorName || row.donor_name) as string,
    donorId: (row.donorId || row.donor_id || 'anonymous') as string,
    donorRole: (row.donorRole || row.donor_role) as UserRole,
    campaignId: (row.campaignId || row.campaign_id || 'general') as string,
    campaignTitle: (row.campaignTitle || row.campaign_title) as string,
    communityName: (row.communityName || row.community_name) as string,
    amountINR: Number(row.amountINR ?? row.amount_inr ?? 0),
    category: (row.category as DonationCategory) || 'General',
    isOutsideCommunity: Boolean(row.isOutsideCommunity ?? row.is_outside_community ?? false),
    paymentMethod: ((row.paymentMethod || row.payment_method) as Donation['paymentMethod']) || 'UPI',
    payment_method: ((row.payment_method || row.paymentMethod) as string) || 'UPI',
    paymentScreenshotUrl: (row.paymentScreenshotUrl || row.payment_screenshot_url) as string | undefined,
    status: ((row.status as Donation['status']) || 'verified'),
    date: (row.date as string) || '',
    created_at: (row.created_at as string) || undefined,
    receiptNumber: (row.receiptNumber || row.receipt_number) as string,
    district: (row.district as string) || undefined,
    wakalahInformation: parseWakalahInfo(row.wakalahInformation ?? row.wakalah_information),
    paymentType: (row.paymentType || row.payment_type) as string | undefined,
    payment_type: (row.payment_type || row.paymentType) as string | undefined,
    femaleMemberId: (row.femaleMemberId || row.female_member_id) as string | undefined,
    female_member_id: (row.female_member_id || row.femaleMemberId) as string | undefined,
    femaleMemberName: (row.femaleMemberName || row.female_member_name) as string | undefined,
    female_member_name: (row.female_member_name || row.femaleMemberName) as string | undefined,
    billingMonth: (row.billingMonth || row.billing_month) as string | undefined,
    billing_month: (row.billing_month || row.billingMonth) as string | undefined,
    monthlyBreakdown: breakdownArray,
    monthly_breakdown: breakdownArray,
  };
}

export async function getDonations(donorId?: string): Promise<Donation[]> {
  try {
    let query = supabase.from('donations').select('*').order('date', { ascending: false });
    if (donorId) query = query.eq('donor_id', donorId);
    const { data, error } = await query;
    if (error) throw error;
    return sortDonationsByLatest((data ?? []).map(mapRow));
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
      .limit(Math.max(limit * 3, 50));
    if (error) throw error;
    return sortDonationsByLatest((data ?? []).map(mapRow)).slice(0, limit);
  } catch (err) {
    console.warn('getRecentDonations warning:', err);
    return [];
  }
}

export interface CreateDonationInput extends Omit<Donation, 'id'> {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export async function createDonation(donation: CreateDonationInput): Promise<Donation> {
  if (!donation.donorName.trim()) {
    throw new Error('Donor name is required');
  }
  if (!Number.isFinite(donation.amountINR) || donation.amountINR <= 0) {
    throw new Error('Donation amount must be greater than zero');
  }
  const trimmedUtr = donation.utrNumber?.trim() || '';
  const isRazorpayPaymentId = /^pay_[A-Za-z0-9]+$/.test(trimmedUtr) || Boolean(donation.razorpayPaymentId);
  if (trimmedUtr && !isRazorpayPaymentId && !/^\d{12}$/.test(trimmedUtr)) {
    throw new Error('If provided, a valid 12-digit UTR is required');
  }
  if (donation.paymentScreenshotUrl && donation.paymentScreenshotUrl.trim() && !donation.paymentScreenshotUrl.trim().startsWith('http')) {
    throw new Error('Payment screenshot must be a valid URL');
  }

  // Idempotency guard for verified Razorpay retries
  if (isRazorpayPaymentId && trimmedUtr) {
    const { data: existing } = await supabase
      .from('donations')
      .select('*')
      .eq('utr_number', trimmedUtr)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return mapRow(existing);
    }
  }

  const campaignId = (!donation.campaignId || donation.campaignId === 'general') ? null : donation.campaignId;
  const donorId = (!donation.donorId || donation.donorId === 'anonymous') ? null : donation.donorId;
  const breakdown = donation.monthlyBreakdown ?? donation.monthly_breakdown;
  const isVerifiedRazorpay = Boolean(donation.razorpayPaymentId && donation.razorpayOrderId && donation.razorpaySignature);

  const payload: Record<string, any> = {
    id: `don_${Date.now()}`,
    transaction_id: donation.razorpayOrderId || donation.transactionId || `TXN${Math.floor(100000000 + Math.random() * 900000000)}`,
    utr_number: donation.razorpayPaymentId || trimmedUtr || null,
    donor_name: donation.donorName.trim(),
    donor_id: donorId,
    donor_role: donation.donorRole || 'member',
    campaign_id: campaignId,
    campaign_title: donation.campaignTitle || 'General Fund',
    community_name: donation.communityName || 'Mohammad Faeem Charitable Trust (MFCT)',
    amount_inr: Number(donation.amountINR || 0),
    category: donation.category || 'General',
    is_outside_community: Boolean(donation.isOutsideCommunity),
    payment_method: donation.paymentMethod || 'UPI',
    payment_screenshot_url: donation.paymentScreenshotUrl || null,
    status: isVerifiedRazorpay ? 'verified' : (donation.status || 'pending_verification'),
    date: donation.date || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    receipt_number: donation.receiptNumber || `RCP-${Date.now().toString().slice(-6)}`,
    district: donation.district || null,
    wakalahInformation: donation.wakalahInformation
      ? JSON.stringify(donation.wakalahInformation)
      : null,
  };

  const pType = donation.paymentType || donation.payment_type;
  if (pType) payload.payment_type = pType;
  const fId = donation.femaleMemberId || donation.female_member_id;
  if (fId) payload.female_member_id = fId;
  const fName = donation.femaleMemberName || donation.female_member_name;
  if (fName) payload.female_member_name = fName;
  const bMonth = donation.billingMonth || donation.billing_month;
  if (bMonth) payload.billing_month = bMonth;
  if (breakdown && breakdown.length > 0) {
    payload.monthly_breakdown = JSON.stringify(breakdown);
  }

  try {
    const currentPayload = { ...payload };
    let data: any = null;
    let error: any = null;

    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await supabase.from('donations').insert(currentPayload).select().single();
      data = res.data;
      error = res.error;
      if (!error) break;

      console.warn(`Supabase donation insert attempt ${attempt + 1}:`, error.message);

      const missingCol = extractMissingColumn(error);
      if (missingCol && currentPayload[missingCol] !== undefined) {
        delete currentPayload[missingCol];
        continue;
      }

      if (
        currentPayload.campaign_id !== null &&
        (error.message?.includes('donations_campaign_id_fkey') || error.message?.includes('campaign_id'))
      ) {
        currentPayload.campaign_id = null;
        continue;
      }

      if (
        currentPayload.donor_id !== null &&
        (error.message?.includes('donations_donor_id_fkey') || error.message?.includes('donor_id'))
      ) {
        currentPayload.donor_id = null;
        continue;
      }

      if (
        currentPayload.utr_number === null &&
        (error.message?.includes('utr_number') || error.message?.includes('null value in column "utr_number"'))
      ) {
        currentPayload.utr_number = '';
        continue;
      }

      break;
    }

    if (error) {
      console.error('Failed to insert donation after retries:', error);
      throw error;
    }

    if (isVerifiedRazorpay && donation.campaignId && donation.campaignId !== 'general') {
      await updateCampaignRaised(donation.campaignId, Number(donation.amountINR || 0));
    }

    return mapRow(data);
  } catch (err) {
    console.warn('createDonation error:', err);
    throw err;
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

async function syncMonthlyFeeSnapshot(row: Record<string, unknown>): Promise<void> {
  try {
    const client = supabaseAdmin || supabase;
    const pType = ((row.payment_type || row.paymentType || '') as string).trim();
    const breakdown: MonthlyPaymentBreakdownItem[] | undefined = parseMonthlyBreakdown(
      row.monthly_breakdown ?? row.monthlyBreakdown
    );
    const title = ((row.campaign_title || row.campaignTitle || '') as string).toLowerCase();

    const isMonthly =
      pType === 'member_monthly' ||
      pType === 'female_monthly' ||
      pType === 'combined_monthly' ||
      Boolean(breakdown) ||
      title.startsWith('monthly fee');

    if (!isMonthly) return;

    const rawDate = (row.date as string) || '';
    const parsedDate = rawDate ? new Date(rawDate) : null;
    const paymentIsoDate =
      parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();
    const utr = ((row.utr_number || row.utrNumber || '') as string).trim();
    const donorId = ((row.donor_id || row.donorId || '') as string).trim();
    const totalAmount = Number(row.amount_inr ?? row.amountINR ?? 0);

    const includesPrimary = breakdown
      ? breakdown.some((b) => b.targetType === 'primary')
      : pType === 'member_monthly' ||
        pType === 'combined_monthly' ||
        (!pType && (title.includes('primary') || title.includes('self')));

    if (includesPrimary && donorId && donorId !== 'anonymous') {
      const primaryItem = breakdown?.find((b) => b.targetType === 'primary');
      const primaryAmt = primaryItem ? Number(primaryItem.amountINR || 100) : totalAmount || 100;
      const userUpdate: Record<string, unknown> = {
        monthly_payment: 'yes',
        monthly_payment_date: paymentIsoDate,
        monthly_payment_amount: primaryAmt,
      };
      for (let i = 0; i < 4; i++) {
        const { error: uErr } = await client.from('users').update(userUpdate).eq('id', donorId);
        if (!uErr) break;
        const missing = extractMissingColumn(uErr);
        if (missing && userUpdate[missing] !== undefined) {
          delete userUpdate[missing];
          continue;
        }
        break;
      }
    }

    const femaleTargets: Array<{ id: string; amount: number }> = [];
    if (breakdown) {
      for (const b of breakdown) {
        if (b.targetType === 'female' && b.targetId) {
          femaleTargets.push({ id: b.targetId, amount: Number(b.amountINR || 50) });
        }
      }
    } else {
      const rawFemaleIds = ((row.female_member_id || row.femaleMemberId || '') as string)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const splitAmt =
        rawFemaleIds.length > 0 && totalAmount > 0 ? Math.round(totalAmount / rawFemaleIds.length) : 50;
      for (const fid of rawFemaleIds) {
        femaleTargets.push({ id: fid, amount: splitAmt });
      }
    }

    for (const target of femaleTargets) {
      const femalePayload: Record<string, unknown> = {
        monthly_payment: 'yes',
        monthly_payment_date: paymentIsoDate,
        monthly_payment_amount: target.amount,
        last_monthly_utr: utr || null,
      };

      const tryUpdateFemale = async (dbClient: any) => {
        const p = { ...femalePayload };
        for (let i = 0; i < 4; i++) {
          const { error: fErr } = await dbClient
            .from('member_female_family')
            .update(p)
            .eq('id', target.id);
          if (!fErr) return true;
          const missing = extractMissingColumn(fErr);
          if (missing && p[missing] !== undefined) {
            delete p[missing];
            continue;
          }
          return false;
        }
        return false;
      };

      const ok = await tryUpdateFemale(client);
      if (!ok && typeof (client as any).schema === 'function') {
        try {
          await tryUpdateFemale((client as any).schema('public'));
        } catch {}
      }
    }
  } catch (err) {
    console.warn('syncMonthlyFeeSnapshot warning:', err);
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
      await syncMonthlyFeeSnapshot(row);
    }
  } catch (err) {
    console.warn('updateDonationStatus exception:', err);
    throw err;
  }
}

import { supabase } from '../lib/supabase';
import { MemberNominee, MemberBankDetails } from '../types';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://faeem-charitable-trust.vercel.app';

// ─── MEMBER NOMINEE SERVICE (MOBILE DIRECT API / DB) ──────────────────────────

export async function getMemberNominees(userId: string): Promise<MemberNominee[]> {
  const { data, error } = await supabase
    .from('member_nominees')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!error && data) {
    return data as MemberNominee[];
  }

  // Fallback to Next.js API route if Supabase direct client encounters network constraint
  try {
    const res = await fetch(`${API_BASE_URL}/api/member-nominee?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data as MemberNominee[];
      }
    }
  } catch { }

  if (error) throw error;
  return [];
}

export async function saveMemberNominee(
  data: Omit<MemberNominee, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<MemberNominee> {
  const payload: any = {
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (data.id && /^\d+$/.test(String(data.id))) {
    payload.id = Number(data.id);
  } else {
    delete payload.id;
  }

  const { data: inserted, error } = await supabase
    .from('member_nominees')
    .insert(payload)
    .select()
    .single();

  if (!error && inserted) {
    return inserted as MemberNominee;
  }

  // Fallback to API route
  try {
    const res = await fetch(`${API_BASE_URL}/api/member-nominee`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as MemberNominee;
    }
  } catch { }

  if (error) throw new Error(error.message || 'Failed to save nominee');
  return payload as MemberNominee;
}

export async function updateMemberNominee(
  id: string,
  updates: Partial<MemberNominee>
): Promise<MemberNominee> {
  const payload = { ...updates, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('member_nominees')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (!error && data) {
    return data as MemberNominee;
  }

  // Fallback to API route
  try {
    const res = await fetch(`${API_BASE_URL}/api/member-nominee`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as MemberNominee;
    }
  } catch { }

  if (error) throw new Error(error.message || 'Failed to update nominee');
  return { id, ...updates } as MemberNominee;
}

export async function deleteMemberNominee(id: string): Promise<void> {
  const { error } = await supabase
    .from('member_nominees')
    .delete()
    .eq('id', id);

  if (error) {
    // Try API route fallback
    try {
      const res = await fetch(`${API_BASE_URL}/api/member-nominee?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) return;
    } catch { }
    throw new Error(error.message || 'Failed to delete nominee');
  }
}

// ─── MEMBER BANK DETAILS SERVICE (MOBILE DIRECT API / DB) ──────────────────────

export async function getMemberBankDetails(userId: string): Promise<MemberBankDetails[]> {
  const { data, error } = await supabase
    .from('member_bank_details')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });

  if (!error && data) {
    return data as MemberBankDetails[];
  }

  // Fallback to API route
  try {
    const res = await fetch(`${API_BASE_URL}/api/member-bank-details?userId=${encodeURIComponent(userId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data as MemberBankDetails[];
      }
    }
  } catch { }

  if (error) throw error;
  return [];
}

export async function saveMemberBankDetails(
  data: Omit<MemberBankDetails, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<MemberBankDetails> {
  const payload: any = {
    ...data,
    ifsc_code: data.ifsc_code.trim().toUpperCase(),
    is_primary: data.is_primary ?? true,
    created_at: new Date().toISOString(),
  };

  if (data.id && /^\d+$/.test(String(data.id))) {
    payload.id = Number(data.id);
  } else {
    delete payload.id;
  }

  // If marked primary, unset other accounts for same user
  if (payload.is_primary && data.user_id) {
    try {
      await supabase
        .from('member_bank_details')
        .update({ is_primary: false })
        .eq('user_id', data.user_id);
    } catch { }
  }

  const { data: inserted, error } = await supabase
    .from('member_bank_details')
    .insert(payload)
    .select()
    .single();

  if (!error && inserted) {
    return inserted as MemberBankDetails;
  }

  // Fallback to API route
  try {
    const res = await fetch(`${API_BASE_URL}/api/member-bank-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as MemberBankDetails;
    }
  } catch { }

  if (error) throw new Error(error.message || 'Failed to save member bank details');
  return payload as MemberBankDetails;
}

export async function updateMemberBankDetails(
  id: string,
  updates: Partial<MemberBankDetails>
): Promise<MemberBankDetails> {
  const payload = {
    ...updates,
    ifsc_code: updates.ifsc_code ? updates.ifsc_code.trim().toUpperCase() : undefined,
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from('member_bank_details')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error && error.code === '22007') {
    const { updated_at: _, ...payloadWithoutUpdatedAt } = payload;
    const retry = await supabase
      .from('member_bank_details')
      .update(payloadWithoutUpdatedAt)
      .eq('id', id)
      .select()
      .single();
    if (!retry.error) {
      data = retry.data;
      error = null;
    }
  }

  if (!error && data) {
    return data as MemberBankDetails;
  }

  // Fallback to API route
  try {
    const res = await fetch(`${API_BASE_URL}/api/member-bank-details`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const json = await res.json();
    if (json.success && json.data) {
      return json.data as MemberBankDetails;
    }
  } catch { }

  if (error) throw new Error(error.message || 'Failed to update member bank details');
  return { id, ...updates } as MemberBankDetails;
}

export async function deleteMemberBankDetails(id: string): Promise<void> {
  const { error } = await supabase
    .from('member_bank_details')
    .delete()
    .eq('id', id);

  if (error) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/member-bank-details?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) return;
    } catch { }
    throw new Error(error.message || 'Failed to delete member bank details');
  }
}

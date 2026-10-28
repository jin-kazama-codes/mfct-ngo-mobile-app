import { supabase, supabaseAdmin } from '../lib/supabase';
import { MemberNominee, MemberBankDetails, FemaleFamilyMember } from '../types';

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

// ─── FEMALE FAMILY MEMBER SERVICE (MOBILE DIRECT API / DB) ───────────────────

export async function getFemaleFamilyMembers(userId?: string): Promise<FemaleFamilyMember[]> {
  const client = supabaseAdmin || supabase;
  let results: FemaleFamilyMember[] = [];

  // 1. Try query from current schema (dev or configured)
  try {
    let query = client
      .from('member_female_family')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      results = data as FemaleFamilyMember[];
    }
  } catch (e) {
    console.warn('[getFemaleFamilyMembers] primary schema query error:', e);
  }

  // 2. Also check public schema if empty or to ensure sync across environments
  if (results.length === 0) {
    try {
      const pubClient = typeof client.schema === 'function' ? client.schema('public') : supabase;
      let pubQuery = pubClient
        .from('member_female_family')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        pubQuery = pubQuery.eq('user_id', userId);
      }

      const { data: pubData, error: pubError } = await pubQuery;
      if (!pubError && Array.isArray(pubData) && pubData.length > 0) {
        results = pubData as FemaleFamilyMember[];
      }
    } catch {}
  }

  if (results.length > 0) {
    return results;
  }

  // 3. Fallback to Next.js API route
  try {
    const url = userId
      ? `${API_BASE_URL}/api/female-members?userId=${encodeURIComponent(userId)}`
      : `${API_BASE_URL}/api/female-members`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data as FemaleFamilyMember[];
      }
    }
  } catch { }

  return results;
}

export async function saveFemaleFamilyMember(
  data: Omit<FemaleFamilyMember, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): Promise<FemaleFamilyMember> {
  const payload: any = {
    ...data,
    fee_amount: data.fee_amount || 50,
    status: data.status || 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (data.id && /^\d+$/.test(String(data.id))) {
    payload.id = Number(data.id);
  } else {
    delete payload.id;
  }

  const client = supabaseAdmin || supabase;
  let lastError: any = null;

  // 1. First try with primary client (dev schema)
  try {
    const { data: inserted, error } = await client
      .from('member_female_family')
      .insert(payload)
      .select()
      .single();

    if (!error && inserted) {
      return inserted as FemaleFamilyMember;
    }
    if (error) lastError = error;
  } catch (err: any) {
    lastError = err;
  }

  // 2. Try with public schema directly (fallback)
  try {
    const pubClient = typeof client.schema === 'function' ? client.schema('public') : supabase;
    const { data: pubInserted, error: pubErr } = await pubClient
      .from('member_female_family')
      .insert(payload)
      .select()
      .single();

    if (!pubErr && pubInserted) {
      return pubInserted as FemaleFamilyMember;
    }
    if (pubErr) lastError = pubErr;
  } catch (err: any) {
    lastError = err;
  }

  // 3. Fallback to API route
  try {
    const res = await fetch(`${API_BASE_URL}/api/female-members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as FemaleFamilyMember;
      }
      if (json.error) {
        throw new Error(json.error);
      }
    }
  } catch (apiErr: any) {
    if (apiErr.message) {
      throw apiErr;
    }
  }

  if (lastError) throw new Error(lastError.message || 'Failed to save female family member');
  return payload as FemaleFamilyMember;
}

export async function updateFemaleFamilyMember(
  id: string,
  updates: Partial<FemaleFamilyMember>
): Promise<FemaleFamilyMember> {
  const payload = { ...updates, updated_at: new Date().toISOString() };
  const client = supabaseAdmin || supabase;
  let lastError: any = null;

  try {
    const { data, error } = await client
      .from('member_female_family')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      return data as FemaleFamilyMember;
    }
    if (error) lastError = error;
  } catch (err: any) {
    lastError = err;
  }

  // Public schema fallback
  try {
    const pubClient = typeof client.schema === 'function' ? client.schema('public') : supabase;
    const { data: pubData, error: pubErr } = await pubClient
      .from('member_female_family')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (!pubErr && pubData) {
      return pubData as FemaleFamilyMember;
    }
    if (pubErr) lastError = pubErr;
  } catch (err: any) {
    lastError = err;
  }

  // Fallback to API route
  try {
    const res = await fetch(`${API_BASE_URL}/api/female-members`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data as FemaleFamilyMember;
      }
    }
  } catch { }

  if (lastError) throw new Error(lastError.message || 'Failed to update female member');
  return { id, ...updates } as FemaleFamilyMember;
}

export async function deleteFemaleFamilyMember(id: string): Promise<void> {
  const client = supabaseAdmin || supabase;
  let deleted = false;

  try {
    const { error } = await client
      .from('member_female_family')
      .delete()
      .eq('id', id);
    if (!error) deleted = true;
  } catch {}

  if (!deleted) {
    try {
      const pubClient = typeof client.schema === 'function' ? client.schema('public') : supabase;
      const { error: pubErr } = await pubClient
        .from('member_female_family')
        .delete()
        .eq('id', id);
      if (!pubErr) deleted = true;
    } catch {}
  }

  if (!deleted) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/female-members?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) deleted = true;
    } catch { }
  }

  if (!deleted) {
    throw new Error('Failed to delete female family member');
  }
}


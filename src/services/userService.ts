import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { verifyPassword, hashPassword } from '../lib/auth';

function mapRow(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    phone: row.phone as string,
    role: (row.role as string)?.replace(' ', '_') as UserRole,
    avatar: row.avatar as string,
    communityId: row.community_id as string,
    communityName: row.community_name as string,
    membershipId: row.membership_id as string,
    isVerified: row.is_verified as boolean,
    joinDate: row.join_date as string,
    city: row.city as string,
    state: row.state as string,
    address: (row.address || row.adderess || row.full_address) as string | undefined,
    passwordHash: (row.password || row.password_hash || row.passwordHash) as string | undefined,
    aadhaarFrontUrl: (row.aadhaar_front_url || row.aadhaarFrontUrl) as string | undefined,
    aadhaarBackUrl: (row.aadhaar_back_url || row.aadhaarBackUrl) as string | undefined,
    paymentMethod: row.payment_method as string,
    paymentUtr: row.payment_utr as string,
    paymentScreenshotUrl: row.payment_screenshot_url as string,
    religion: (row.religion || row.dharam) as string | undefined,
    isMalikENisab: (row.is_malik_e_nisab ?? row.isMalikENisab) as boolean | undefined,
    helpType: (row.help_type || row.helpType) as string | undefined,
    helpDetails: (row.help_details || row.helpDetails) as string | undefined,
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('email', email.trim().toLowerCase()).single();
  if (error || !data) return null;
  return mapRow(data);
}

export async function getUserByPhone(phone: string): Promise<User | null> {
  const clean = phone.trim().replace(/[^\d]/g, '');
  if (!clean) return null;

  // 1. Try exact match
  const { data: exact } = await supabase.from('users').select('*').eq('phone', phone.trim());
  if (exact && exact.length > 0) return mapRow(exact[0]);

  // 2. Try match by clean digits or last 10 digits
  const { data: allUsers } = await supabase.from('users').select('*');
  if (allUsers) {
    const match = allUsers.find((u: any) => {
      if (!u.phone) return false;
      const uClean = String(u.phone).replace(/[^\d]/g, '');
      return uClean === clean || uClean.endsWith(clean.slice(-10)) || clean.endsWith(uClean.slice(-10));
    });
    if (match) return mapRow(match);
  }

  return null;
}

export async function getUsers(communityId?: string): Promise<User[]> {
  let query = supabase.from('users').select('*').order('created_at', { ascending: false });
  if (communityId) query = query.eq('community_id', communityId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getUnverifiedUsers(communityId?: string): Promise<User[]> {
  let query = supabase.from('users').select('*').eq('is_verified', false).order('created_at', { ascending: false });
  if (communityId) query = query.eq('community_id', communityId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function authenticateUser(
  identifier: string,
  plainPassword: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const cleanId = identifier.trim();
    const cleanPass = plainPassword.trim();

    let user = cleanId.includes('@')
      ? await getUserByEmail(cleanId)
      : await getUserByPhone(cleanId);

    // Fallback search if initial lookup produced no user
    if (!user) {
      if (cleanId.includes('@')) {
        user = await getUserByPhone(cleanId);
      } else {
        user = await getUserByEmail(cleanId);
      }
    }

    if (!user) {
      return { success: false, error: 'User account not found. Please check your phone number or email.' };
    }
    if (user.passwordHash) {
      const isValid = await verifyPassword(cleanPass, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Incorrect password. Please check your password and try again.' };
      }
    }
    return { success: true, user };
  } catch (err) {
    console.error('authenticateUser error:', err);
    return { success: false, error: 'Authentication failed. Please try again.' };
  }
}

export async function createUser(user: User & { kycDocumentUrl?: string; aadhaarFrontUrl?: string; aadhaarBackUrl?: string }): Promise<User> {
  const passwordHash = user.passwordHash
    ? user.passwordHash
    : await hashPassword('Member@123');

  const city = user.city || 'Bareilly';
  const payload: Record<string, unknown> = {
    id: user.id || `usr_${Date.now()}`,
    name: user.name,
    email: user.email?.trim().toLowerCase() || `${user.phone}@mfct.org`,
    phone: user.phone.trim(),
    role: user.role || 'member',
    avatar: user.avatar || null,
    community_id: user.communityId || 'comm_bareilly_hq',
    community_name: user.communityName || 'Bareilly Central Care Society (Headquarters)',
    membership_id: user.membershipId || `SS-${city.substring(0, 3).toUpperCase()}-2024-${Math.floor(1000 + Math.random() * 9000)}`,
    is_verified: user.isVerified ?? false,
    join_date: user.joinDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    city: city,
    state: user.state || 'UP',
    password: passwordHash,
    aadhaar_front_url: user.aadhaarFrontUrl || null,
    aadhaar_back_url: user.aadhaarBackUrl || null,
    payment_method: user.paymentMethod || null,
    payment_utr: user.paymentUtr || null,
    payment_screenshot_url: user.paymentScreenshotUrl || null,
    adderess: user.address || null,
    religion: user.religion || null,
    is_malik_e_nisab: user.isMalikENisab !== undefined ? user.isMalikENisab : null,
    help_type: user.helpType || null,
    help_details: user.helpDetails || null,
  };

  let currentPayload = { ...payload };
  let insertResult = null;
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.from('users').insert(currentPayload).select().single();
    if (!error && data) {
      insertResult = data;
      break;
    }

    lastError = error;
    console.warn(`createUser insert attempt ${attempt + 1}:`, error?.message);

    const match = error?.message?.match(/column "([^"]+)" of relation "users" does not exist/);
    if (match && match[1]) {
      const missingCol = match[1];
      delete currentPayload[missingCol];
      if (missingCol === 'adderess' && user.address) {
        currentPayload['address'] = user.address;
      }
      continue;
    }

    if (currentPayload['adderess'] !== undefined) {
      delete currentPayload['adderess'];
      if (user.address) currentPayload['address'] = user.address;
      continue;
    }

    break;
  }

  if (!insertResult) {
    if (lastError) throw lastError;
    throw new Error('Failed to create user');
  }

  return mapRow(insertResult);
}

export async function updateUser(
  id: string,
  updates: Partial<User> & { password?: string; plainPassword?: string }
): Promise<User> {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.email !== undefined) payload.email = updates.email.trim().toLowerCase();
  if (updates.phone !== undefined) payload.phone = updates.phone.trim();
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.city !== undefined) payload.city = updates.city.trim();
  if (updates.state !== undefined) payload.state = updates.state.trim();
  if (updates.avatar !== undefined) payload.avatar = updates.avatar;
  if (updates.communityId !== undefined) payload.community_id = updates.communityId;
  if (updates.communityName !== undefined) payload.community_name = updates.communityName;
  if (updates.documentUrl !== undefined) payload.document_url = updates.documentUrl;
  if (updates.paymentUtr !== undefined) payload.payment_utr = updates.paymentUtr;
  if (updates.paymentScreenshotUrl !== undefined) payload.payment_screenshot_url = updates.paymentScreenshotUrl;
  if (updates.isVerified !== undefined) payload.is_verified = updates.isVerified;
  if (updates.religion !== undefined) payload.religion = updates.religion;
  if (updates.isMalikENisab !== undefined) payload.is_malik_e_nisab = updates.isMalikENisab;
  if (updates.helpType !== undefined) payload.help_type = updates.helpType;
  if (updates.helpDetails !== undefined) payload.help_details = updates.helpDetails;

  if (updates.password || updates.plainPassword) {
    const p = updates.password || updates.plainPassword;
    payload.password = await hashPassword(p!);
  } else if (updates.passwordHash !== undefined) {
    payload.password = updates.passwordHash;
  }

  // Use .select() without mandatory .single() to prevent PGRST116 coerce errors
  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) {
    console.error('updateUser error:', error);
    throw error;
  }

  if (data && data.length > 0) {
    return mapRow(data[0]);
  }

  const fresh = await getUserById(id);
  if (fresh) return fresh;

  return { id, ...updates } as User;
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

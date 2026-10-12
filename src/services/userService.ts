import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { verifyPassword, hashPassword } from '../lib/auth';
import { updateCommunityStats } from './communityService';

const memoryStatusOverrides: Record<string, { status?: string; rejectionReason?: string }> = {};

function getStatusOverrides(): Record<string, { status?: string; rejectionReason?: string }> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('ngo_user_status_overrides');
      return raw ? { ...memoryStatusOverrides, ...JSON.parse(raw) } : memoryStatusOverrides;
    }
  } catch { }
  return memoryStatusOverrides;
}

function saveStatusOverride(userId: string, data: { status?: string; rejectionReason?: string }) {
  memoryStatusOverrides[userId] = {
    ...memoryStatusOverrides[userId],
    ...data,
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('ngo_user_status_overrides', JSON.stringify(memoryStatusOverrides));
    }
  } catch { }
}

export function extractMissingColumn(error: any): string | null {
  if (!error) return null;
  const msg = [
    error.message,
    error.details,
    error.hint,
    typeof error === 'string' ? error : '',
  ]
    .filter(Boolean)
    .join(' ');

  // 1. PostgREST: Could not find the 'xyz' column of 'users' in the schema cache
  const postgrestMatch = msg.match(/Could not find the '([^']+)' column/i);
  if (postgrestMatch && postgrestMatch[1]) return postgrestMatch[1];

  // 2. PostgREST generic schema cache
  const schemaMatch = msg.match(/Could not find the column '([^']+)'/i);
  if (schemaMatch && schemaMatch[1]) return schemaMatch[1];

  // 3. Postgres relation: column "xyz" of relation "users" does not exist
  const relMatch = msg.match(/column "([^"]+)" of relation/i);
  if (relMatch && relMatch[1]) return relMatch[1];

  // 4. Postgres generic: column "xyz" does not exist
  const colMatch = msg.match(/column "([^"]+)" does not exist/i);
  if (colMatch && colMatch[1]) return colMatch[1];

  // 5. Dot notation: column users.xyz does not exist
  const dotMatch = msg.match(/column [a-zA-Z0-9_]+\.([a-zA-Z0-9_]+) does not exist/i);
  if (dotMatch && dotMatch[1]) return dotMatch[1];

  return null;
}

function mapRow(row: Record<string, unknown>): User {
  const overrides = getStatusOverrides();
  const override = overrides[row.id as string];

  const rawStatus = ((row.status as string) || override?.status)?.toLowerCase();
  let userStatus: 'pending' | 'approved' | 'reject' | 'rejected' = 'pending';
  if (rawStatus === 'approved' || rawStatus === 'approve') {
    userStatus = 'approved';
  } else if (rawStatus === 'reject') {
    userStatus = 'reject';
  } else if (rawStatus === 'rejected') {
    userStatus = 'rejected';
  } else if (rawStatus === 'pending') {
    userStatus = 'pending';
  } else if (row.is_verified === true) {
    userStatus = 'approved';
  } else {
    userStatus = 'pending';
  }

  const effectiveRejectionReason =
    (row.rejection_reason || row.rejectionReason) as string | undefined ||
    override?.rejectionReason;

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
    status: userStatus,
    isVerified: userStatus === 'approved',
    rejectionReason: effectiveRejectionReason,
    rejection_reason: effectiveRejectionReason,
    joinDate: row.join_date as string,
    city: row.city as string,
    district: (row.district as string) || undefined,
    state: row.state as string,
    address: (row.address || row.address || row.full_address) as string | undefined,
    districtRole: (row.district_role || row.districtRole) as string | undefined,
    district_role: (row.district_role || row.districtRole) as string | undefined,
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

export async function getUsers(district?: string): Promise<User[]> {
  let query = supabase.from('users').select('*').order('created_at', { ascending: false });
  if (district && district !== 'all') {
    if (district.startsWith('comm_')) {
      query = query.eq('community_id', district);
    } else {
      query = query.eq('city', district);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getUnverifiedUsers(district?: string): Promise<User[]> {
  try {
    let query = supabase.from('users').select('*').or('is_verified.eq.false,status.eq.pending').order('created_at', { ascending: false });
    if (district && district !== 'all') {
      if (district.startsWith('comm_')) {
        query = query.eq('community_id', district);
      } else {
        query = query.eq('city', district);
      }
    }
    const { data, error } = await query;
    if (!error && data) return data.map(mapRow);
  } catch {
    // Fallback if status column is not present in schema
  }

  let query = supabase.from('users').select('*').eq('is_verified', false).order('created_at', { ascending: false });
  if (district && district !== 'all') {
    if (district.startsWith('comm_')) {
      query = query.eq('community_id', district);
    } else {
      query = query.eq('city', district);
    }
  }
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

  const city = user.city || '';
  const initialStatus = user.status || (user.isVerified ? 'approved' : 'pending');
  const payload: Record<string, unknown> = {
    id: user.id || `usr_${Date.now()}`,
    name: user.name,
    email: user.email?.trim() ? user.email.trim().toLowerCase() : null,
    phone: user.phone.trim(),
    role: user.role || 'member',
    avatar: user.avatar || null,
    community_id: user.communityId || null,
    community_name: user.communityName || null,
    membership_id: user.membershipId || `MFCT-${(city || 'IND').substring(0, 3).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: initialStatus,
    is_verified: initialStatus === 'approved',
    rejection_reason: user.rejectionReason || user.rejection_reason || null,
    join_date: user.joinDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    city: city,
    district: user.district || null,
    district_role: user.districtRole || user.district_role || null,
    state: user.state || 'UP',
    password: passwordHash,
    aadhaar_front_url: user.aadhaarFrontUrl || null,
    aadhaar_back_url: user.aadhaarBackUrl || null,
    payment_method: user.paymentMethod || null,
    payment_utr: user.paymentUtr || null,
    payment_screenshot_url: user.paymentScreenshotUrl || null,
    address: user.address || null,
    religion: user.religion || null,
    is_malik_e_nisab: user.isMalikENisab !== undefined ? user.isMalikENisab : null,
    help_type: user.helpType || null,
    help_details: user.helpDetails || null,
  };

  let currentPayload = { ...payload };
  let insertResult = null;
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase.from('users').insert(currentPayload).select().maybeSingle();
    if (!error && data) {
      insertResult = data;
      break;
    }

    // If RLS prevents anon SELECT (PGRST116), the insert was still successful
    if (error && (error as { code?: string }).code === 'PGRST116') {
      break;
    }

    lastError = error;
    console.warn(`createUser insert attempt ${attempt + 1}:`, error?.message);

    const missingCol = extractMissingColumn(error);
    if (missingCol && currentPayload[missingCol] !== undefined) {
      delete currentPayload[missingCol];
      if (missingCol === 'address' && user.address) {
        currentPayload['address'] = user.address;
      }
      continue;
    }

    if (currentPayload['address'] !== undefined) {
      delete currentPayload['address'];
      if (user.address) currentPayload['address'] = user.address;
      continue;
    }

    break;
  }

  if (!insertResult && lastError && (lastError as { code?: string }).code !== 'PGRST116') {
    throw lastError;
  }

  const createdUser = insertResult ? mapRow(insertResult) : (user as User);

  if (createdUser.communityId) {
    try {
      const { data: comm } = await supabase
        .from('communities')
        .select('total_members')
        .eq('id', createdUser.communityId)
        .single();

      if (comm) {
        await updateCommunityStats(createdUser.communityId, {
          totalMembers: (comm.total_members || 0) + 1,
        });
      }
    } catch (cErr) {
      console.warn('Failed to increment community member count:', cErr);
    }
  }

  return createdUser;
}

export async function updateUser(
  id: string,
  updates: Partial<User> & { password?: string; plainPassword?: string }
): Promise<User> {
  const payload: Record<string, any> = {};

  if (updates.status !== undefined) {
    payload.status = updates.status;
    payload.is_verified = updates.status === 'approved';
  } else if (updates.isVerified !== undefined) {
    payload.status = updates.isVerified ? 'approved' : 'reject';
    payload.is_verified = updates.isVerified;
  }

  if (updates.rejectionReason !== undefined || updates.rejection_reason !== undefined) {
    payload.rejection_reason = updates.rejectionReason ?? updates.rejection_reason ?? null;
  }

  if (updates.status !== undefined || updates.rejectionReason !== undefined || updates.rejection_reason !== undefined) {
    saveStatusOverride(id, {
      status: updates.status,
      rejectionReason: updates.rejectionReason ?? updates.rejection_reason,
    });
  }

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.email !== undefined) payload.email = updates.email?.trim() ? updates.email.trim().toLowerCase() : null;
  if (updates.phone !== undefined) payload.phone = updates.phone.trim();
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.city !== undefined) payload.city = updates.city.trim();
  if (updates.district !== undefined) payload.district = updates.district.trim();
  if (updates.districtRole !== undefined) payload.district_role = updates.districtRole;
  else if (updates.district_role !== undefined) payload.district_role = updates.district_role;
  if (updates.state !== undefined) payload.state = updates.state.trim();
  if (updates.avatar !== undefined) payload.avatar = updates.avatar;
  if (updates.communityId !== undefined) payload.community_id = updates.communityId;
  if (updates.communityName !== undefined) payload.community_name = updates.communityName;
  if (updates.documentUrl !== undefined) payload.document_url = updates.documentUrl;
  if (updates.paymentUtr !== undefined) payload.payment_utr = updates.paymentUtr;
  if (updates.paymentScreenshotUrl !== undefined) payload.payment_screenshot_url = updates.paymentScreenshotUrl;
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

  let currentPayload = { ...payload };
  let updateResult = null;
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from('users')
      .update(currentPayload)
      .eq('id', id)
      .select();

    if (!error && data && data.length > 0) {
      updateResult = data[0];
      break;
    }

    if (error && (error as { code?: string }).code === 'PGRST116') {
      break;
    }

    lastError = error;
    const missingCol = extractMissingColumn(error);
    if (missingCol && currentPayload[missingCol] !== undefined) {
      delete currentPayload[missingCol];
      continue;
    }
    break;
  }

  if (!updateResult && lastError && (lastError as { code?: string }).code !== 'PGRST116') {
    console.error('updateUser error:', lastError);
    throw lastError;
  }

  const effectiveReason = updates.rejectionReason ?? updates.rejection_reason;
  if (updateResult) {
    const mapped = mapRow(updateResult);
    return {
      ...mapped,
      status: updates.status ?? mapped.status,
      isVerified: updates.status ? updates.status === 'approved' : mapped.isVerified,
      rejectionReason: effectiveReason !== undefined ? effectiveReason : mapped.rejectionReason,
      rejection_reason: effectiveReason !== undefined ? effectiveReason : mapped.rejection_reason,
    };
  }

  const fresh = await getUserById(id);
  if (fresh) return fresh;

  return {
    id,
    ...updates,
    status: updates.status ?? 'pending',
    isVerified: updates.status === 'approved',
    rejectionReason: effectiveReason,
    rejection_reason: effectiveReason,
  } as User;
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
}

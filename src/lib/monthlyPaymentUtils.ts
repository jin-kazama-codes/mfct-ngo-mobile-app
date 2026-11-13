import { Donation, FemaleFamilyMember, MonthlyPaymentBreakdownItem, User } from '../types';

export const PRIMARY_MONTHLY_FEE_INR = 100;
export const FEMALE_MONTHLY_FEE_INR = 50;

export function isMonthlyOptedIn(val: unknown): boolean {
  if (val === true) return true;
  if (typeof val === 'string') return val.trim().toLowerCase() === 'yes';
  return false;
}

export type MonthlyEntityStatus =
  | 'paid'
  | 'pending_verification'
  | 'due'
  | 'kyc_pending'
  | 'rejected'
  | 'not_opted_in';

export interface PrimaryMonthlyStatus {
  status: 'paid' | 'pending_verification' | 'due' | 'not_opted_in';
  isOptedIn: boolean;
  latestDate: Date | null;
  latestAmount: number;
  latestUtr: string;
  latestDonation: Donation | null;
  paidLastMonth: boolean;
  lastMonthDate: Date | null;
  lastMonthAmount: number;
}

export interface FemaleMemberMonthlyStatus {
  member: FemaleFamilyMember;
  status: MonthlyEntityStatus;
  isOptedIn: boolean;
  latestDate: Date | null;
  latestAmount: number;
  latestUtr: string;
  latestDonation: Donation | null;
}

export interface MonthlySummary {
  currentMonthKey: string;
  lastMonthKey: string;
  primary: PrimaryMonthlyStatus;
  femaleStatuses: FemaleMemberMonthlyStatus[];
  femaleTotalCount: number;
  femaleOptedInCount: number;
  femaleApprovedCount: number;
  femalePaidCount: number;
  femalePendingCount: number;
  femaleDueCount: number;
  totalEligibleCount: number;
  totalPaidCount: number;
  totalPendingCount: number;
  totalDueCount: number;
  dueTargetIds: string[];
  suggestedDueAmount: number;
}

const EN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const HI_MONTHS = [
  'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
  'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर',
];
const UR_MONTHS = [
  'جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
  'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر',
];

export function getMonthName(monthIdx: number, language: string): string {
  const idx = ((monthIdx % 12) + 12) % 12;
  if (language === 'hi') return HI_MONTHS[idx];
  if (language === 'ur') return UR_MONTHS[idx];
  return EN_MONTHS[idx];
}

export function getBillingMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getPreviousBillingMonthKey(date: Date = new Date()): string {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getBillingMonthKey(prev);
}

export function formatBillingMonthLabel(monthKey: string, language: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec((monthKey || '').trim());
  if (!match) return monthKey;
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  if (monthIdx < 0 || monthIdx > 11) return monthKey;
  return `${getMonthName(monthIdx, language)} ${year}`;
}

export function formatShortDate(date: Date | null, language: string): string {
  if (!date || isNaN(date.getTime())) return '';
  return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getDonationTimestamp(d: Donation | Record<string, unknown>): number {
  const dateStr = (d.date || (d as { created_at?: string }).created_at) as string | undefined;
  if (dateStr) {
    const t = new Date(dateStr).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  const idStr = String(d.id || '');
  const match13 = idStr.match(/don_(\d{13})/);
  if (match13) return parseInt(match13[1], 10);
  const match10 = idStr.match(/don_(\d{10})/);
  if (match10) return parseInt(match10[1], 10) * 1000;
  return 0;
}

export function sortDonationsByLatest(donations: Donation[]): Donation[] {
  return [...donations].sort((a, b) => getDonationTimestamp(b) - getDonationTimestamp(a));
}

export function parseMonthlyBreakdown(val: unknown): MonthlyPaymentBreakdownItem[] | undefined {
  if (!val) return undefined;
  let arr: unknown = val;
  if (typeof val === 'string') {
    try {
      arr = JSON.parse(val);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(arr)) return undefined;
  const items = arr.filter(
    (item): item is MonthlyPaymentBreakdownItem =>
      Boolean(item) &&
      typeof item === 'object' &&
      ((item as MonthlyPaymentBreakdownItem).targetType === 'primary' ||
        (item as MonthlyPaymentBreakdownItem).targetType === 'female')
  );
  return items.length > 0 ? items : undefined;
}

export function getDonationBillingMonth(d: Donation): string | null {
  const explicit = (d.billingMonth || d.billing_month || '').trim();
  if (/^\d{4}-\d{2}$/.test(explicit)) return explicit;
  const ts = getDonationTimestamp(d);
  if (ts > 0) return getBillingMonthKey(new Date(ts));
  return null;
}

function getDonationDateObj(d: Donation): Date | null {
  const ts = getDonationTimestamp(d);
  return ts > 0 ? new Date(ts) : null;
}

function parseDateSafe(raw: unknown): Date | null {
  if (!raw || typeof raw !== 'string') return null;
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function isMonthlyFeeRecord(d: Donation): boolean {
  const pType = (d.paymentType || d.payment_type || '').trim();
  if (pType === 'member_monthly' || pType === 'female_monthly' || pType === 'combined_monthly') {
    return true;
  }
  if (parseMonthlyBreakdown(d.monthlyBreakdown ?? d.monthly_breakdown)) {
    return true;
  }
  if (!pType && (d.campaignTitle || '').toLowerCase().startsWith('monthly fee')) {
    return true;
  }
  return false;
}

function matchesPrimaryMonthly(d: Donation): boolean {
  if (d.status === 'rejected') return false;
  const breakdown = parseMonthlyBreakdown(d.monthlyBreakdown ?? d.monthly_breakdown);
  if (breakdown) {
    return breakdown.some((b) => b.targetType === 'primary');
  }
  const pType = (d.paymentType || d.payment_type || '').trim();
  if (pType === 'member_monthly' || pType === 'combined_monthly') {
    return true;
  }
  if (pType === 'female_monthly' || pType === 'donation') {
    return false;
  }
  const title = (d.campaignTitle || '').toLowerCase();
  if (title.startsWith('monthly fee')) {
    return title.includes('primary') || title.includes('self');
  }
  return false;
}

function getPrimaryBreakdownAmount(d: Donation): number {
  const breakdown = parseMonthlyBreakdown(d.monthlyBreakdown ?? d.monthly_breakdown);
  if (breakdown) {
    const item = breakdown.find((b) => b.targetType === 'primary');
    if (item && Number(item.amountINR) > 0) return Number(item.amountINR);
  }
  return Number(d.amountINR || 0);
}

function matchesFemaleMemberMonthly(d: Donation, member: FemaleFamilyMember): boolean {
  if (d.status === 'rejected') return false;
  if (d.donorId && member.user_id && d.donorId !== 'anonymous' && d.donorId !== member.user_id) {
    return false;
  }
  const breakdown = parseMonthlyBreakdown(d.monthlyBreakdown ?? d.monthly_breakdown);
  if (breakdown) {
    return breakdown.some((b) => b.targetType === 'female' && b.targetId === member.id);
  }
  const fId = (d.femaleMemberId || d.female_member_id || '').trim();
  if (fId) {
    return fId.split(',').map((s) => s.trim()).includes(member.id);
  }
  const pType = (d.paymentType || d.payment_type || '').trim();
  if (pType === 'member_monthly' || pType === 'donation') {
    return false;
  }
  const title = (d.campaignTitle || '').toLowerCase();
  if (title.startsWith('monthly fee') && member.name) {
    return title.includes(member.name.trim().toLowerCase());
  }
  return false;
}

function getFemaleBreakdownAmount(d: Donation, memberId: string): number {
  const breakdown = parseMonthlyBreakdown(d.monthlyBreakdown ?? d.monthly_breakdown);
  if (breakdown) {
    const item = breakdown.find((b) => b.targetType === 'female' && b.targetId === memberId);
    if (item && Number(item.amountINR) > 0) return Number(item.amountINR);
  }
  return Number(d.amountINR || 0);
}

export function getPrimaryMonthlyStatus(
  user: User,
  donations: Donation[],
  now: Date = new Date()
): PrimaryMonthlyStatus {
  const isOptedIn = isMonthlyOptedIn(user.monthly_payment ?? user.monthlyPayment);
  const currentMonthKey = getBillingMonthKey(now);
  const lastMonthKey = getPreviousBillingMonthKey(now);

  const userDonations = sortDonationsByLatest(
    donations.filter(
      (d) => (!d.donorId || d.donorId === user.id || d.donorId === 'anonymous') && matchesPrimaryMonthly(d)
    )
  );

  const currentMonthVerified = userDonations.find(
    (d) => d.status === 'verified' && getDonationBillingMonth(d) === currentMonthKey
  );
  const currentMonthPending = userDonations.find(
    (d) =>
      (d.status === 'pending_verification' || (d.status as string) === 'pending') &&
      getDonationBillingMonth(d) === currentMonthKey
  );

  const userFieldDate = parseDateSafe(user.monthly_payment_date || user.monthlyPaymentDate);
  const userFieldMonthKey = userFieldDate ? getBillingMonthKey(userFieldDate) : null;
  const userFieldPaidThisMonth = userFieldMonthKey === currentMonthKey;

  let status: PrimaryMonthlyStatus['status'] = isOptedIn ? 'due' : 'not_opted_in';
  if (isOptedIn) {
    if (currentMonthVerified || userFieldPaidThisMonth) {
      status = 'paid';
    } else if (currentMonthPending) {
      status = 'pending_verification';
    }
  }

  const latestDonation = currentMonthVerified || currentMonthPending || userDonations[0] || null;
  let latestDate = latestDonation ? getDonationDateObj(latestDonation) : null;
  let latestAmount = latestDonation ? getPrimaryBreakdownAmount(latestDonation) : 0;
  const latestUtr = latestDonation?.utrNumber || '';

  if ((!latestDate || (userFieldDate && userFieldDate.getTime() > latestDate.getTime())) && userFieldDate) {
    latestDate = userFieldDate;
    latestAmount = Number(user.monthly_payment_amount || user.monthlyPaymentAmount || latestAmount || 0);
  }

  const lastMonthDonation = userDonations.find((d) => getDonationBillingMonth(d) === lastMonthKey) || null;
  const paidLastMonth = Boolean(lastMonthDonation || userFieldMonthKey === lastMonthKey);
  const lastMonthDate = lastMonthDonation
    ? getDonationDateObj(lastMonthDonation)
    : userFieldMonthKey === lastMonthKey
      ? userFieldDate
      : null;
  const lastMonthAmount = lastMonthDonation
    ? getPrimaryBreakdownAmount(lastMonthDonation)
    : userFieldMonthKey === lastMonthKey
      ? Number(user.monthly_payment_amount || user.monthlyPaymentAmount || 0)
      : 0;

  return {
    status,
    isOptedIn,
    latestDate,
    latestAmount,
    latestUtr,
    latestDonation,
    paidLastMonth,
    lastMonthDate,
    lastMonthAmount,
  };
}

export function getFemaleMemberMonthlyStatus(
  member: FemaleFamilyMember,
  donations: Donation[],
  now: Date = new Date()
): FemaleMemberMonthlyStatus {
  const memberOptedIn = isMonthlyOptedIn(member.monthly_payment);

  if (member.status === 'rejected') {
    return {
      member,
      status: 'rejected',
      isOptedIn: false,
      latestDate: null,
      latestAmount: 0,
      latestUtr: '',
      latestDonation: null,
    };
  }
  if (!memberOptedIn) {
    return {
      member,
      status: 'not_opted_in',
      isOptedIn: false,
      latestDate: null,
      latestAmount: 0,
      latestUtr: '',
      latestDonation: null,
    };
  }
  if (member.status !== 'approved') {
    return {
      member,
      status: 'kyc_pending',
      isOptedIn: true,
      latestDate: null,
      latestAmount: 0,
      latestUtr: '',
      latestDonation: null,
    };
  }

  const currentMonthKey = getBillingMonthKey(now);
  const matchingDonations = sortDonationsByLatest(
    donations.filter((d) => matchesFemaleMemberMonthly(d, member))
  );

  const currentMonthVerified = matchingDonations.find(
    (d) => d.status === 'verified' && getDonationBillingMonth(d) === currentMonthKey
  );
  const currentMonthPending = matchingDonations.find(
    (d) =>
      (d.status === 'pending_verification' || (d.status as string) === 'pending') &&
      getDonationBillingMonth(d) === currentMonthKey
  );

  const memberFieldDate = parseDateSafe(member.monthly_payment_date);
  const memberFieldMonthKey = memberFieldDate ? getBillingMonthKey(memberFieldDate) : null;
  const memberFieldPaidThisMonth = memberFieldMonthKey === currentMonthKey;

  let status: MonthlyEntityStatus = 'due';
  if (currentMonthVerified || memberFieldPaidThisMonth) {
    status = 'paid';
  } else if (currentMonthPending) {
    status = 'pending_verification';
  }

  const latestDonation = currentMonthVerified || currentMonthPending || matchingDonations[0] || null;
  let latestDate = latestDonation ? getDonationDateObj(latestDonation) : null;
  let latestAmount = latestDonation ? getFemaleBreakdownAmount(latestDonation, member.id) : 0;
  let latestUtr = latestDonation?.utrNumber || '';

  if ((!latestDate || (memberFieldDate && memberFieldDate.getTime() > latestDate.getTime())) && memberFieldDate) {
    latestDate = memberFieldDate;
    latestAmount = Number(member.monthly_payment_amount || latestAmount || 0);
    latestUtr = member.last_monthly_utr || latestUtr;
  }

  return {
    member,
    status,
    isOptedIn: true,
    latestDate,
    latestAmount,
    latestUtr,
    latestDonation,
  };
}

export function getMonthlySummary(
  user: User,
  femaleMembers: FemaleFamilyMember[],
  donations: Donation[],
  now: Date = new Date()
): MonthlySummary {
  const currentMonthKey = getBillingMonthKey(now);
  const lastMonthKey = getPreviousBillingMonthKey(now);

  const primary = getPrimaryMonthlyStatus(user, donations, now);
  const userFemaleMembers = femaleMembers.filter((m) => !m.user_id || m.user_id === user.id);
  const femaleStatuses = userFemaleMembers.map((m) => getFemaleMemberMonthlyStatus(m, donations, now));

  const optedInFemales = femaleStatuses.filter((fs) => fs.isOptedIn);
  const approvedOptedInFemales = optedInFemales.filter(
    (fs) => fs.status !== 'kyc_pending' && fs.status !== 'rejected' && fs.status !== 'not_opted_in'
  );
  const femalePaidCount = approvedOptedInFemales.filter((fs) => fs.status === 'paid').length;
  const femalePendingCount = approvedOptedInFemales.filter((fs) => fs.status === 'pending_verification').length;
  const femaleDueCount = approvedOptedInFemales.filter((fs) => fs.status === 'due').length;

  const totalEligibleCount = (primary.isOptedIn ? 1 : 0) + approvedOptedInFemales.length;
  const totalPaidCount = (primary.isOptedIn && primary.status === 'paid' ? 1 : 0) + femalePaidCount;
  const totalPendingCount =
    (primary.isOptedIn && primary.status === 'pending_verification' ? 1 : 0) + femalePendingCount;
  const totalDueCount = (primary.isOptedIn && primary.status === 'due' ? 1 : 0) + femaleDueCount;

  const dueTargetIds: string[] = [];
  let suggestedDueAmount = 0;

  if (primary.isOptedIn && primary.status === 'due') {
    dueTargetIds.push('primary');
    suggestedDueAmount += PRIMARY_MONTHLY_FEE_INR;
  }
  for (const fs of approvedOptedInFemales) {
    if (fs.status === 'due') {
      dueTargetIds.push(fs.member.id);
      suggestedDueAmount += FEMALE_MONTHLY_FEE_INR;
    }
  }

  return {
    currentMonthKey,
    lastMonthKey,
    primary,
    femaleStatuses,
    femaleTotalCount: userFemaleMembers.length,
    femaleOptedInCount: optedInFemales.length,
    femaleApprovedCount: approvedOptedInFemales.length,
    femalePaidCount,
    femalePendingCount,
    femaleDueCount,
    totalEligibleCount,
    totalPaidCount,
    totalPendingCount,
    totalDueCount,
    dueTargetIds,
    suggestedDueAmount,
  };
}


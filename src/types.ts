export type UserRole =
  | 'super_admin'
  | 'community_admin'
  | 'executive_admin'
  | 'member'
  | 'premium_donor';

export type DonationCategory =
  | 'General'
  | 'Sadakah'
  | 'Zakat'
  | 'Fitrah'
  | 'Medical'
  | 'Education'
  | 'Marriage'
  | 'Janazah'
  | 'Masjid'
  | 'Madarsa'
  | 'Emergency Relief'
  | 'Food'
  | 'Shelter'
  | 'Disability Support'
  | 'Widow Support'
  | 'Orphan Support'
  | 'Community';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone: string;
  city: string;
  state: string;
  role: UserRole;
  avatar: string;
  communityId: string;
  communityName: string;
  membershipId: string;
  isVerified: boolean;
  joinDate: string;
  passwordHash?: string;
  documentUrl?: string;
  paymentMethod?: string;
  paymentUtr?: string;
  paymentScreenshotUrl?: string;
  familiesHelped?: number;
}

export interface Community {
  id: string;
  name: string;
  city: string;
  state: string;
  adminName: string;
  adminRoleTitle: string; // e.g. "Community Administrator"
  avatar: string;
  totalMembers: number;
  activeCampaigns: number;
  totalRaisedINR: number;
  healthScore: number; // 0 - 100
  verifiedStatus: 'Verified' | 'Pending' | 'Flagged';
  description: string;
  establishedYear: number;
  coverImage: string;
}

export interface Campaign {
  id: string;
  title: string;
  category: DonationCategory;
  communityId: string;
  communityName: string;
  city: string;
  beneficiaryName: string;
  beneficiaryRelation: string;
  goalINR: number;
  raisedINR: number;
  donorsCount: number;
  daysLeft: number;
  isVerified: boolean;
  isZakatEligible: boolean;
  isUrgent: boolean;
  mainImage: string;
  galleryImages?: string[];
  story: string;
  documents: { title: string; url: string; verifiedBy: string }[];
  createdDate: string;
  createdBy: string;
  status: 'active' | 'pending' | 'completed' | 'rejected' | 'pending_approval';
}

export interface Donation {
  id: string;
  transactionId: string;
  utrNumber: string;
  donorName: string;
  donorId: string;
  donorRole: UserRole;
  campaignId: string;
  campaignTitle: string;
  communityName: string;
  amountINR: number;
  category: DonationCategory;
  isOutsideCommunity: boolean;
  paymentMethod: 'UPI' | 'Bank Transfer' | 'QR Code' | 'Card';
  paymentScreenshotUrl?: string;
  status: 'verified' | 'pending_verification' | 'rejected';
  date: string;
  receiptNumber: string;
}

export interface PendingVerificationItem {
  id: string;
  type: 'kyc' | 'campaign' | 'payment_utr' | 'dispute';
  title: string;
  submittedBy: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  details: string;
  documentUrl?: string;
  amountINR?: number;
  utr?: string;
  paymentMethod?: string;
  paymentScreenshotUrl?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  role: UserRole;
  details: string;
  ipAddress: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  city: string;
  quote: string;
  avatar: string;
  campaignTitle?: string;
  amountReceivedINR?: number;
  videoThumbnail?: string;
  createdBy?: string;
  communityId?: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface CommunityStory {
  id: string;
  title: string;
  category: DonationCategory;
  location: string;
  date: string;
  image: string;
  summary: string;
  impactMetric: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
}

export interface AccountDetails {
  id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  upi_id: string;
  qr_code_url?: string;
  created_at?: string;
  updated_at?: string;
}

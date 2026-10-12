import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Modal,
    TextInput,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';
import { getUsers, updateUser, deleteUser } from '../../../src/services/userService';
import { useAppState } from '../../../src/context/AppStateProvider';
import { User } from '../../../src/types';
import {
    ShieldCheck,
    UserCheck,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Eye,
    Check,
    X,
    XCircle,
    FileText,
    CreditCard,
    Building2,
    MapPin,
    Mail,
    Phone,
    Clock,
    ExternalLink,
    RefreshCw,
    Search,
    Trash2,
    UserX,
    Image as ImageIcon,
    ZoomIn,
    Award,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { getLanguageCode, translateCity, translateState, translateCommunityName } from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';
import { KycCardSkeleton } from '../../../src/components/SkeletonLoader';

interface ToastInfo {
    message: string;
    type: 'success' | 'error' | 'info';
}

type VerificationFilter = 'pending' | 'approved' | 'rejected' | 'all';

const DISTRICT_LIST = ['All', 'Bareilly', 'Pilibhit', 'Shahjahanpur', 'Budaun', 'Rampur', 'Moradabad', 'Aligarh', 'Lucknow'];

export default function KycApprovalScreen() {
    const { currentRole, activeUser } = useAppState();
    const { colorScheme } = useColorScheme();
    const { t, i18n } = useTranslation();
    const lang = getLanguageCode(i18n.language);
    const isDark = colorScheme === 'dark';

    const tr = (hi: string, ur: string, en: string) => {
        if (lang === 'hi') return hi;
        if (lang === 'ur') return ur;
        return en;
    };

    const rawRole = ((activeUser?.role || currentRole || '') as string).toLowerCase();
    const rawDistRole = (
        activeUser?.district_role ||
        activeUser?.districtRole ||
        rawRole
    ).toLowerCase().trim().replace(/\s+/g, '_');

    const isSuperOrExecutive =
        currentRole === 'super_admin' ||
        currentRole === 'executive_admin' ||
        rawRole === 'super_admin' ||
        rawRole === 'executive_admin';

    const isDistrictCoordinator =
        currentRole === 'district_coordinator' ||
        rawDistRole === 'district_coordinator' ||
        rawDistRole.includes('coordinator');

    const isCommunityAdmin = rawRole.includes('community');

    // Authorized admins who can perform KYC approvals, rejections, and terminations
    const canPerformKycAction = isSuperOrExecutive || isDistrictCoordinator || isCommunityAdmin || (rawRole !== 'member' && rawRole !== 'donor');

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);

    // Filter tab state
    const [activeFilter, setActiveFilter] = useState<VerificationFilter>('pending');

    // Search query state
    const [searchQuery, setSearchQuery] = useState('');

    // District filter state
    const [selectedDistrict, setSelectedDistrict] = useState<string>('All');

    // Detail Modal state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    // Image Zoom Modal state
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Rejection Modal state (Mandatory reason)
    const [rejectModalUser, setRejectModalUser] = useState<User | null>(null);
    const [rejectionReasonInput, setRejectionReasonInput] = useState('');
    const [rejectionReasonError, setRejectionReasonError] = useState('');

    // Account Termination Modal state
    const [terminateModalUser, setTerminateModalUser] = useState<User | null>(null);
    const [terminationReasonInput, setTerminationReasonInput] = useState('');
    const [terminationReasonError, setTerminationReasonError] = useState('');
    const [terminating, setTerminating] = useState(false);

    // Toast Notification state
    const [toast, setToast] = useState<ToastInfo | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 3500);
    };

    const loadData = async (showLoader = true) => {
        if (showLoader) setLoading(true);
        try {
            const data = await getUsers();
            let filtered = data;
            const rawRole = (activeUser?.role || currentRole || '') as string;
            const isCommAdmin = rawRole.toLowerCase().includes('community');
            if (isCommAdmin && (activeUser?.communityId || activeUser?.communityName)) {
                filtered = data.filter(u =>
                    (activeUser.communityId && u.communityId === activeUser.communityId) ||
                    (activeUser.communityName && u.communityName?.toLowerCase() === activeUser.communityName.toLowerCase())
                );
            }
            setUsers(filtered);
        } catch (err: any) {
            console.error('KycApprovalScreen load error:', err);
            showToast(err?.message || 'Failed to load KYC verification list.', 'error');
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentRole, activeUser]);

    // Normalize user status: 'pending' | 'approved' | 'rejected'
    const getUserStatus = (u: User): 'pending' | 'approved' | 'rejected' => {
        if (u.status === 'approved') return 'approved';
        if (u.status === 'reject' || u.status === 'rejected') return 'rejected';
        if (u.status === 'pending') return 'pending';
        return u.isVerified ? 'approved' : 'pending';
    };

    // Helper to send branded email notification via Resend on KYC Status change
    const sendKycEmailNotice = async (targetUser: User, status: 'approved' | 'rejected', reason?: string) => {
        if (!targetUser.email) return;
        try {
            const resendApiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
            const emailFrom = process.env.EXPO_PUBLIC_EMAIL_FROM || 'MFCT Portal <info@mfcttrust.com>';
            const isApproved = status === 'approved';

            const subject = isApproved
                ? 'Congratulations! Your MFCT Membership KYC Has Been Approved'
                : 'Action Required: Update on Your MFCT Membership KYC Verification';

            const html = isApproved
                ? `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <h2 style="color: #0f3322; margin: 0 0 8px;">MFCT Portal</h2>
                    <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">Mohammad Faeem Charitable Trust</p>

                    <div style="background: #ecfdf5; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 18px; margin-bottom: 16px;">
                      <div style="display: inline-block; background: #10b981; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">
                        KYC Verified & Approved
                      </div>
                      <h3 style="color: #065f46; font-size: 16px; margin: 0 0 6px; font-weight: 800;">
                        Welcome, ${targetUser.name || 'Member'}!
                      </h3>
                      <p style="color: #047857; font-size: 13px; margin: 0; line-height: 1.5;">
                        Your membership KYC documents and identity verification have been <strong>approved</strong> by the administrator.
                      </p>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 16px;">
                      <p style="color: #334155; font-size: 13px; font-weight: 700; margin: 0 0 6px;">Your account is now fully active:</p>
                      <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
                        You can now view and download your official Digital Member ID Card and access all trust services and community campaigns in the mobile app.
                      </p>
                    </div>

                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      Thank you for being a part of Mohammad Faeem Charitable Trust.<br/>
                      Support desk: info@mfcttrust.com
                    </p>
                  </div>
                `
                : `
                  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
                    <h2 style="color: #0f3322; margin: 0 0 8px;">MFCT Portal</h2>
                    <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">Mohammad Faeem Charitable Trust</p>

                    <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 12px; padding: 18px; margin-bottom: 16px;">
                      <div style="display: inline-block; background: #e11d48; color: #ffffff; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px;">
                        Action Required
                      </div>
                      <h3 style="color: #be123c; font-size: 16px; margin: 0 0 6px; font-weight: 800;">
                        KYC Verification Notice
                      </h3>
                      <p style="color: #334155; font-size: 13px; margin: 0; line-height: 1.5;">
                        Dear <strong>${targetUser.name || 'Member'}</strong>,<br/>
                        Your membership KYC verification could not be approved at this time.
                      </p>
                    </div>

                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 16px;">
                      <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px;">Reason for Rejection:</p>
                      <p style="color: #be123c; font-size: 13px; font-weight: 700; margin: 0;">"${reason || 'Identity documents are blurred, mismatched, or incomplete.'}"</p>
                    </div>

                    <p style="color: #1e3a8a; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
                      Please open the MFCT Mobile App or Portal, go to your Profile, and re-upload clear Aadhaar card front/back images or provide correct payment details.
                    </p>

                    <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                      For help, contact Mohammad Faeem Charitable Trust at info@mfcttrust.com.
                    </p>
                  </div>
                `;

            fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey.trim()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: emailFrom,
                    to: targetUser.email.trim().toLowerCase(),
                    subject,
                    html,
                }),
            }).catch(e => console.warn(`[Mobile Resend ${status} KYC Email Error]:`, e));
        } catch (emailErr) {
            console.warn(`[Mobile Resend ${status} KYC Email Exception]:`, emailErr);
        }
    };

    // Handle KYC Approval
    const handleApprove = async (user: User) => {
        setProcessingId(user.id);
        setProcessingAction('approve');
        try {
            await updateUser(user.id, {
                status: 'approved',
                rejectionReason: '',
            });

            // Send approval email notice to user
            sendKycEmailNotice(user, 'approved');

            setUsers(prev =>
                prev.map(u =>
                    u.id === user.id
                        ? { ...u, status: 'approved', isVerified: true, rejectionReason: undefined, rejection_reason: undefined }
                        : u
                )
            );

            showToast(`KYC Approved successfully for ${user.name}!`, 'success');

            if (selectedUser?.id === user.id) {
                setSelectedUser(prev =>
                    prev ? { ...prev, status: 'approved', isVerified: true, rejectionReason: undefined, rejection_reason: undefined } : null
                );
            }
        } catch (err: any) {
            console.error('Approve KYC error:', err);
            showToast(err?.message || 'Failed to approve KYC.', 'error');
        } finally {
            setProcessingId(null);
            setProcessingAction(null);
        }
    };

    // Open Rejection Dialog
    const openRejectModal = (user: User) => {
        setRejectModalUser(user);
        setRejectionReasonInput(user.rejectionReason || user.rejection_reason || '');
        setRejectionReasonError('');
    };

    // Confirm Rejection with Mandatory Reason
    const handleConfirmReject = async () => {
        if (!rejectModalUser) return;
        const trimmedReason = rejectionReasonInput.trim();
        if (!trimmedReason) {
            setRejectionReasonError(
                t('admin.rejection_reason_required', 'Rejection reason is mandatory. Please specify a reason.')
            );
            return;
        }

        const user = rejectModalUser;
        setProcessingId(user.id);
        setProcessingAction('reject');
        try {
            await updateUser(user.id, {
                status: 'reject',
                rejectionReason: trimmedReason,
            });

            // Send rejection email notice to user with reason
            sendKycEmailNotice(user, 'rejected', trimmedReason);

            setUsers(prev =>
                prev.map(u =>
                    u.id === user.id
                        ? { ...u, status: 'reject', isVerified: false, rejectionReason: trimmedReason, rejection_reason: trimmedReason }
                        : u
                )
            );

            showToast(`KYC rejected for ${user.name}. Reason recorded.`, 'info');

            if (selectedUser?.id === user.id) {
                setSelectedUser(prev =>
                    prev ? { ...prev, status: 'reject', isVerified: false, rejectionReason: trimmedReason, rejection_reason: trimmedReason } : null
                );
            }

            setRejectModalUser(null);
            setRejectionReasonInput('');
            setRejectionReasonError('');
        } catch (err: any) {
            console.error('Reject KYC error:', err);
            showToast(err?.message || 'Failed to reject KYC.', 'error');
        } finally {
            setProcessingId(null);
            setProcessingAction(null);
        }
    };

    // Open Termination Dialog
    const openTerminateModal = (user: User) => {
        setTerminateModalUser(user);
        setTerminationReasonInput('');
        setTerminationReasonError('');
    };

    // Confirm Account Termination & Permanent Deletion
    const handleConfirmTerminate = async () => {
        if (!terminateModalUser) return;
        const reason = terminationReasonInput.trim();
        if (!reason) {
            setTerminationReasonError(
                tr(
                  'कृपया खाता समाप्त करने का कारण अवश्य दर्ज करें।',
                  'براہ کرم اکاؤنٹ ختم کرنے کی وجہ درج کریں۔',
                  'Termination reason is mandatory. Please specify a reason.'
                )
            );
            return;
        }

        const targetUser = terminateModalUser;
        setTerminating(true);
        try {
            // 1. Send termination notice email via Resend if email is available
            if (targetUser.email) {
                try {
                    const resendApiKey = process.env.EXPO_PUBLIC_RESEND_API_KEY || '';
                    const emailFrom = process.env.EXPO_PUBLIC_EMAIL_FROM || 'MFCT Portal <info@mfcttrust.com>';

                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${resendApiKey.trim()}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: emailFrom,
                            to: targetUser.email.trim().toLowerCase(),
                            subject: 'Important Notice: Your MFCT Membership Account Status',
                            html: `
                              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px;">
                                <h2 style="color: #0f3322; margin: 0 0 8px;">MFCT Portal</h2>
                                <p style="color: #64748b; font-size: 13px; margin: 0 0 16px;">Mohammad Faeem Charitable Trust</p>

                                <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                                  <h3 style="color: #be123c; margin: 0 0 6px; font-size: 15px;">Account Status Notice</h3>
                                  <p style="color: #334155; font-size: 13px; margin: 0; line-height: 1.5;">
                                    Dear <strong>${targetUser.name || 'Member'}</strong>,<br/>
                                    Your membership account has been <strong>terminated</strong> by the administrator.
                                  </p>
                                </div>

                                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 16px;">
                                  <p style="color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 0 0 4px;">Reason for Termination:</p>
                                  <p style="color: #0f172a; font-size: 13px; font-weight: 600; margin: 0;">"${reason}"</p>
                                </div>

                                <p style="color: #059669; font-size: 13px; line-height: 1.5; margin: 0 0 16px;">
                                  Your previous registration data has been cleared from our database. You are welcome to submit a fresh registration with correct details anytime.
                                </p>
                              </div>
                            `,
                        }),
                    });
                } catch (emailErr) {
                    console.warn('Termination notice email dispatch failed:', emailErr);
                }
            }

            // 2. Delete user row from database
            await deleteUser(targetUser.id);

            // 3. Remove user from local list
            setUsers(prev => prev.filter(u => u.id !== targetUser.id));

            if (selectedUser?.id === targetUser.id) {
                setSelectedUser(null);
            }

            showToast(`Account terminated and deleted for ${targetUser.name}.`, 'info');
            setTerminateModalUser(null);
            setTerminationReasonInput('');
            setTerminationReasonError('');
        } catch (err: any) {
            console.error('Terminate user error:', err);
            showToast(err?.message || 'Failed to terminate account.', 'error');
        } finally {
            setTerminating(false);
        }
    };

    const pendingUsers = users.filter(u => getUserStatus(u) === 'pending');
    const approvedUsers = users.filter(u => getUserStatus(u) === 'approved');
    const rejectedUsers = users.filter(u => getUserStatus(u) === 'rejected');

    // Filter by tab + search + district
    const filteredUsers = users.filter(u => {
        const st = getUserStatus(u);
        const matchesTab =
            activeFilter === 'pending' ? st === 'pending' :
            activeFilter === 'approved' ? st === 'approved' :
            activeFilter === 'rejected' ? st === 'rejected' : true;

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch =
            !q ||
            u.name?.toLowerCase().includes(q) ||
            u.phone?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.city?.toLowerCase().includes(q) ||
            u.district?.toLowerCase().includes(q) ||
            u.paymentUtr?.toLowerCase().includes(q) ||
            u.membershipId?.toLowerCase().includes(q);

        const dist = selectedDistrict.toLowerCase();
        const matchesDistrict =
            selectedDistrict === 'All' ||
            (u.district && u.district.toLowerCase().includes(dist)) ||
            (u.city && u.city.toLowerCase().includes(dist));

        return matchesTab && matchesSearch && matchesDistrict;
    });

    const theme = {
        bg: isDark ? '#090d16' : '#f8fafc',
        cardBg: isDark ? '#1e293b' : '#ffffff',
        cardBorder: isDark ? '#334155' : '#e2e8f0',
        textMain: isDark ? '#f8fafc' : '#0f172a',
        textSub: isDark ? '#94a3b8' : '#64748b',
        chipIdle: isDark ? '#131d2e' : '#f1f5f9',
        modalBg: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)',
    };

    return (
        <View style={[s.screen, { backgroundColor: theme.bg }]}>
            {/* Toast Notification */}
            {toast && (
                <View
                    style={[
                        s.toastContainer,
                        toast.type === 'success'
                            ? s.toastSuccess
                            : toast.type === 'error'
                                ? s.toastError
                                : s.toastInfo,
                    ]}
                >
                    {toast.type === 'success' && <CheckCircle2 color="#fff" size={18} />}
                    {toast.type === 'error' && <AlertCircle color="#fff" size={18} />}
                    {toast.type === 'info' && <Sparkles color="#fff" size={18} />}
                    <Text style={s.toastText}>{toast.message}</Text>
                </View>
            )}

            <ScrollView
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header Strip with Refresh */}
                <View style={s.headerWrap}>
                    <View style={s.headerIconBox}>
                        <ShieldCheck color="#8b5cf6" size={24} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.headerTitle, { color: theme.textMain }]}>
                            {t('admin.kyc_management', 'KYC Verification')}
                        </Text>
                        <Text style={[s.headerSub, { color: theme.textSub }]}>
                            {t('admin.kyc_management_sub', 'Review, approve, reject or terminate member records')}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[s.refreshBtn, { backgroundColor: theme.chipIdle }]}
                        onPress={() => loadData(true)}
                    >
                        <RefreshCw color={theme.textSub} size={16} />
                    </TouchableOpacity>
                </View>

                {/* Overview Stats Cards (Tap to filter) */}
                <View style={s.statsRow}>
                    <TouchableOpacity
                        style={[
                            s.statCard,
                            { backgroundColor: '#f59e0b', opacity: activeFilter === 'pending' ? 1 : 0.85 },
                        ]}
                        onPress={() => setActiveFilter('pending')}
                    >
                        <Clock color="#fff" size={20} />
                        <Text style={s.statCount}>{loading ? '—' : pendingUsers.length}</Text>
                        <Text style={s.statLabel}>{t('admin.kyc_pending', 'Pending')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            s.statCard,
                            { backgroundColor: '#10b981', opacity: activeFilter === 'approved' ? 1 : 0.85 },
                        ]}
                        onPress={() => setActiveFilter('approved')}
                    >
                        <CheckCircle2 color="#fff" size={20} />
                        <Text style={s.statCount}>{loading ? '—' : approvedUsers.length}</Text>
                        <Text style={s.statLabel}>{t('admin.kyc_approved', 'Approved')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            s.statCard,
                            { backgroundColor: '#ef4444', opacity: activeFilter === 'rejected' ? 1 : 0.85 },
                        ]}
                        onPress={() => setActiveFilter('rejected')}
                    >
                        <XCircle color="#fff" size={20} />
                        <Text style={s.statCount}>{loading ? '—' : rejectedUsers.length}</Text>
                        <Text style={s.statLabel}>{t('admin.kyc_rejected', 'Rejected')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View style={s.filterTabRow}>
                    {(['pending', 'approved', 'rejected', 'all'] as VerificationFilter[]).map(filterKey => {
                        const isActive = activeFilter === filterKey;
                        const label = loading
                            ? (filterKey === 'pending'
                                ? 'Pending (—)'
                                : filterKey === 'approved'
                                    ? 'Approved (—)'
                                    : filterKey === 'rejected'
                                        ? 'Rejected (—)'
                                        : 'All (—)')
                            : (filterKey === 'pending'
                                ? `Pending (${pendingUsers.length})`
                                : filterKey === 'approved'
                                    ? `Approved (${approvedUsers.length})`
                                    : filterKey === 'rejected'
                                        ? `Rejected (${rejectedUsers.length})`
                                        : `All (${users.length})`);

                        const activeColor =
                            filterKey === 'pending'
                                ? '#f59e0b'
                                : filterKey === 'approved'
                                    ? '#10b981'
                                    : filterKey === 'rejected'
                                        ? '#ef4444'
                                        : '#6366f1';

                        return (
                            <TouchableOpacity
                                key={filterKey}
                                style={[
                                    s.filterTab,
                                    {
                                        backgroundColor: isActive ? (isDark ? '#1e293b' : '#ffffff') : 'transparent',
                                        borderColor: isActive ? activeColor : theme.cardBorder,
                                    },
                                ]}
                                onPress={() => setActiveFilter(filterKey)}
                            >
                                <Text
                                    style={[
                                        s.filterTabText,
                                        { color: isActive ? activeColor : theme.textSub },
                                    ]}
                                >
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* 1. Search Bar */}
                <View style={[s.searchBarWrap, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                    <Search color={theme.textSub} size={16} />
                    <TextInput
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder={tr('नाम, फोन, ईमेल, UTR या शहर से खोजें...', 'تلاش کریں...', 'Search by name, phone, email, UTR, city...')}
                        placeholderTextColor="#94a3b8"
                        style={[s.searchInput, { color: theme.textMain }]}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={s.searchClearBtn}>
                            <X color={theme.textSub} size={14} />
                        </TouchableOpacity>
                    ) : null}
                </View>

                {/* 2. District Filter Scroll */}
                <View style={{ marginBottom: 14 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                        {DISTRICT_LIST.map((dist) => {
                            const isDistActive = selectedDistrict === dist;
                            return (
                                <TouchableOpacity
                                    key={dist}
                                    onPress={() => setSelectedDistrict(dist)}
                                    style={[
                                        s.districtChip,
                                        {
                                            backgroundColor: isDistActive ? '#10b981' : theme.chipIdle,
                                            borderColor: isDistActive ? '#10b981' : theme.cardBorder,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            s.districtChipText,
                                            { color: isDistActive ? '#fff' : theme.textSub },
                                        ]}
                                    >
                                        {dist === 'All' ? tr('सभी जिले', 'تمام اضلاع', 'All Districts') : dist}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* List Header */}
                <View style={s.sectionHeader}>
                    <Text style={[s.sectionTitle, { color: theme.textMain }]}>
                        {loading
                            ? (activeFilter === 'pending'
                                ? 'Pending KYC Queue'
                                : activeFilter === 'approved'
                                    ? 'Approved Members'
                                    : activeFilter === 'rejected'
                                        ? 'Rejected Members'
                                        : 'All Members')
                            : (activeFilter === 'pending'
                                ? `Pending KYC Queue (${filteredUsers.length})`
                                : activeFilter === 'approved'
                                    ? `Approved Members (${filteredUsers.length})`
                                    : activeFilter === 'rejected'
                                        ? `Rejected Members (${filteredUsers.length})`
                                        : `All Members (${filteredUsers.length})`)}
                    </Text>
                    {activeFilter === 'pending' && filteredUsers.length > 0 && !loading && (
                        <View style={s.urgentBadge}>
                            <Text style={s.urgentBadgeText}>Needs Review</Text>
                        </View>
                    )}
                </View>

                {loading ? (
                    <View style={{ gap: 4 }}>
                        <KycCardSkeleton isDark={isDark} />
                        <KycCardSkeleton isDark={isDark} />
                        <KycCardSkeleton isDark={isDark} />
                        <KycCardSkeleton isDark={isDark} />
                    </View>
                ) : filteredUsers.length === 0 ? (
                    <View style={[s.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                        <View style={s.emptyIconCircle}>
                            <CheckCircle2 color="#10b981" size={32} />
                        </View>
                        <Text style={[s.emptyTitle, { color: theme.textMain }]}>No members found</Text>
                        <Text style={[s.emptySub, { color: theme.textSub }]}>
                            {searchQuery
                                ? `No member records matched "${searchQuery}". Try a different keyword.`
                                : activeFilter === 'pending'
                                    ? 'There are currently no users waiting for KYC approval. All member profiles are verified.'
                                    : activeFilter === 'rejected'
                                        ? 'No rejected member applications.'
                                        : 'No members in this filter category.'}
                        </Text>
                    </View>
                ) : (
                    filteredUsers.map(user => {
                        const isProcessing = processingId === user.id;
                        const userStatus = getUserStatus(user);
                        const isApproved = userStatus === 'approved';
                        const isRejected = userStatus === 'rejected';
                        const isPending = userStatus === 'pending';
                        const reasonText = user.rejectionReason || user.rejection_reason;

                        return (
                            <View
                                key={user.id}
                                style={[
                                    s.userCard,
                                    {
                                        backgroundColor: theme.cardBg,
                                        borderColor: isApproved
                                            ? '#10b98135'
                                            : isRejected
                                                ? '#ef444435'
                                                : '#f59e0b40',
                                    },
                                ]}
                            >
                                {/* Card Top Strip */}
                                <View style={s.cardTopRow}>
                                    <View
                                        style={[
                                            s.badgeWrap,
                                            {
                                                backgroundColor: isApproved
                                                    ? '#10b98118'
                                                    : isRejected
                                                        ? '#ef444418'
                                                        : '#f59e0b18',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                s.userKycBadgeText,
                                                {
                                                    color: isApproved
                                                        ? '#10b981'
                                                        : isRejected
                                                            ? '#ef4444'
                                                            : '#f59e0b',
                                                },
                                            ]}
                                        >
                                            {isApproved
                                                ? 'KYC VERIFIED'
                                                : isRejected
                                                    ? 'REJECTED'
                                                    : 'PENDING KYC'}
                                        </Text>
                                    </View>
                                    <View style={s.dateRow}>
                                        <Clock color={theme.textSub} size={12} />
                                        <Text style={[s.dateText, { color: theme.textSub }]}>
                                            {user.joinDate || 'Recent'}
                                        </Text>
                                    </View>
                                </View>

                                {/* User Info Row */}
                                <View style={s.userInfoRow}>
                                    {user.avatar ? (
                                        <Image source={{ uri: user.avatar }} style={s.userAvatar} />
                                    ) : (
                                        <View
                                            style={[
                                                s.avatarFallback,
                                                {
                                                    backgroundColor: isApproved
                                                        ? '#10b98120'
                                                        : isRejected
                                                            ? '#ef444420'
                                                            : isDark
                                                                ? '#334155'
                                                                : '#fef3c7',
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    s.avatarInitial,
                                                    {
                                                        color: isApproved
                                                            ? '#10b981'
                                                            : isRejected
                                                                ? '#ef4444'
                                                                : '#f59e0b',
                                                    },
                                                ]}
                                            >
                                                {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </Text>
                                        </View>
                                    )}

                                    <View style={{ flex: 1 }}>
                                        <DynamicText
                                            text={user.name}
                                            style={[s.userName, { color: theme.textMain }]}
                                            numberOfLines={1}
                                        />
                                        <Text style={[s.userContact, { color: theme.textSub }]}>
                                            {user.phone} {user.email ? `• ${user.email}` : ''}
                                        </Text>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                            <DynamicText
                                                text={user.city || ''}
                                                style={[s.userLocation, { color: theme.textSub }]}
                                            />
                                            <Text style={[s.userLocation, { color: theme.textSub }]}>, </Text>
                                            <DynamicText
                                                text={user.state || 'UP'}
                                                style={[s.userLocation, { color: theme.textSub }]}
                                            />
                                            <Text style={[s.userLocation, { color: theme.textSub }]}> • </Text>
                                            <DynamicText
                                                text={user.communityName || 'MFCT Community'}
                                                style={[s.userLocation, { color: theme.textSub }]}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Document Badges */}
                                <View style={s.attachmentRow}>
                                    {(user.aadhaarFrontUrl || user.documentUrl) ? (
                                        <TouchableOpacity
                                            style={s.docBadge}
                                            onPress={() => setPreviewImage({
                                                url: user.aadhaarFrontUrl || user.documentUrl!,
                                                title: `${user.name} - Aadhaar Document`
                                            })}
                                        >
                                            <FileText color="#10b981" size={12} />
                                            <Text style={s.docBadgeText}>ID Proof Attached 🔍</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={s.docBadgeMissing}>
                                            <FileText color="#94a3b8" size={12} />
                                            <Text style={s.docBadgeMissingText}>No ID Uploaded</Text>
                                        </View>
                                    )}

                                    {user.paymentScreenshotUrl && (
                                        <TouchableOpacity
                                            style={s.docBadge}
                                            onPress={() => setPreviewImage({
                                                url: user.paymentScreenshotUrl!,
                                                title: `${user.name} - Payment Receipt`
                                            })}
                                        >
                                            <CreditCard color="#0284c7" size={12} />
                                            <Text style={[s.docBadgeText, { color: '#0284c7' }]}>Payment Proof 🔍</Text>
                                        </TouchableOpacity>
                                    )}

                                    {user.paymentUtr ? (
                                        <View style={s.docBadge}>
                                            <Text style={s.utrText}>UTR: {user.paymentUtr}</Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* Rejection Reason Banner if Rejected */}
                                {isRejected && reasonText ? (
                                    <View style={s.rejectReasonBox}>
                                        <AlertCircle color="#ef4444" size={14} style={{ marginTop: 1 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.rejectReasonLabel}>Rejection Reason:</Text>
                                            <Text style={s.rejectReasonText}>{reasonText}</Text>
                                        </View>
                                    </View>
                                ) : null}

                                {/* Action Buttons */}
                                <View style={[s.cardActionsContainer, { borderTopColor: theme.cardBorder }]}>
                                    {/* Row 1: Administrative Actions (View Details & Terminate) */}
                                    <View style={s.cardActionsRow}>
                                        <TouchableOpacity
                                            style={[s.viewDetailsBtn, { backgroundColor: theme.chipIdle, borderColor: theme.cardBorder }]}
                                            onPress={() => setSelectedUser(user)}
                                        >
                                            <Eye color={theme.textSub} size={14} />
                                            <Text style={[s.viewDetailsText, { color: theme.textMain }]}>
                                                {t('btn.viewDetails', 'View Details')}
                                            </Text>
                                        </TouchableOpacity>

                                        {canPerformKycAction && (
                                            <TouchableOpacity
                                                style={s.terminateBtn}
                                                onPress={() => openTerminateModal(user)}
                                                disabled={isProcessing || terminating}
                                            >
                                                <Trash2 color="#ef4444" size={13} />
                                                <Text style={s.terminateBtnText}>{tr('खाता हटाएं', 'ختم', 'Terminate')}</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Row 2: Primary Decision Actions (Approve / Reject) */}
                                    {canPerformKycAction && (
                                        <View style={s.cardActionsRow}>
                                            {isApproved && (
                                                <TouchableOpacity
                                                    style={[s.declineBtn, { flex: 1 }]}
                                                    onPress={() => openRejectModal(user)}
                                                    disabled={isProcessing || terminating}
                                                >
                                                    <X color="#ef4444" size={14} />
                                                    <Text style={s.declineBtnText}>{tr('सत्यापन हटाएं', 'منسوخ کریں', 'Revoke Approval')}</Text>
                                                </TouchableOpacity>
                                            )}

                                            {isRejected && (
                                                <>
                                                    <TouchableOpacity
                                                        style={[s.declineBtn, { flex: 1 }]}
                                                        onPress={() => openRejectModal(user)}
                                                        disabled={isProcessing || terminating}
                                                    >
                                                        <Text style={s.declineBtnText}>{tr('कारण बदलें', 'وجہ تبدیل', 'Edit Reason')}</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[s.approveBtn, { flex: 1.3 }]}
                                                        onPress={() => handleApprove(user)}
                                                        disabled={isProcessing || terminating}
                                                    >
                                                        {isProcessing && processingAction === 'approve' ? (
                                                            <ActivityIndicator color="#fff" size="small" />
                                                        ) : (
                                                            <>
                                                                <Check color="#fff" size={15} />
                                                                <Text style={s.approveBtnText}>{tr('पुनः स्वीकृत', 'دوبارہ منظور', 'Re-Approve')}</Text>
                                                            </>
                                                        )}
                                                    </TouchableOpacity>
                                                </>
                                            )}

                                            {isPending && (
                                                <>
                                                    <TouchableOpacity
                                                        style={[s.declineBtn, { flex: 1 }]}
                                                        onPress={() => openRejectModal(user)}
                                                        disabled={isProcessing || terminating}
                                                    >
                                                        <X color="#ef4444" size={14} />
                                                        <Text style={s.declineBtnText}>{t('btn.reject', 'Reject')}</Text>
                                                    </TouchableOpacity>

                                                    <TouchableOpacity
                                                        style={[s.approveBtn, { flex: 1.3 }]}
                                                        onPress={() => handleApprove(user)}
                                                        disabled={isProcessing || terminating}
                                                    >
                                                        {isProcessing && processingAction === 'approve' ? (
                                                            <ActivityIndicator color="#fff" size="small" />
                                                        ) : (
                                                            <>
                                                                <Check color="#fff" size={15} />
                                                                <Text style={s.approveBtnText}>{t('btn.approve', 'Approve KYC')}</Text>
                                                            </>
                                                        )}
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>

            {/* User KYC Detail Modal */}
            {selectedUser && (
                <Modal
                    visible={!!selectedUser}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setSelectedUser(null)}
                >
                    <View style={[s.modalBackdrop, { backgroundColor: theme.modalBg }]}>
                        <View style={[s.modalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                            {/* Modal Header */}
                            <View style={[s.modalHeader, { borderBottomColor: theme.cardBorder }]}>
                                <View>
                                    <Text style={[s.modalTitle, { color: theme.textMain }]}>KYC Details</Text>
                                    <Text style={[s.modalSubTitle, { color: theme.textSub }]}>
                                        User verification files & details
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setSelectedUser(null)}
                                    style={[s.modalCloseBtn, { backgroundColor: theme.chipIdle }]}
                                >
                                    <X color={theme.textSub} size={18} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                                {/* Profile info in modal */}
                                <View style={s.modalProfileRow}>
                                    {selectedUser.avatar ? (
                                        <Image source={{ uri: selectedUser.avatar }} style={s.modalAvatar} />
                                    ) : (
                                        <View style={[s.avatarFallback, { backgroundColor: '#10b98120' }]}>
                                            <Text style={[s.avatarInitial, { color: '#10b981' }]}>
                                                {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <DynamicText
                                            text={selectedUser.name}
                                            style={[s.modalUserName, { color: theme.textMain }]}
                                        />
                                        <Text style={[s.modalUserMeta, { color: theme.textSub }]}>
                                            Role: {selectedUser.role?.replace(/_/g, ' ').toUpperCase() || 'MEMBER'}
                                        </Text>
                                        <Text style={[s.modalUserMeta, { color: theme.textSub }]}>
                                            ID: {selectedUser.membershipId || selectedUser.id.slice(0, 8)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Status badge in detail modal */}
                                {(() => {
                                    const modalStatus = getUserStatus(selectedUser);
                                    const isApp = modalStatus === 'approved';
                                    const isRej = modalStatus === 'rejected';
                                    const rText = selectedUser.rejectionReason || selectedUser.rejection_reason;

                                    return (
                                        <View style={{ marginBottom: 14 }}>
                                            <View
                                                style={[
                                                    s.badgeWrap,
                                                    {
                                                        alignSelf: 'flex-start',
                                                        backgroundColor: isApp
                                                            ? '#10b98120'
                                                            : isRej
                                                                ? '#ef444420'
                                                                : '#f59e0b20',
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        s.userKycBadgeText,
                                                        { color: isApp ? '#10b981' : isRej ? '#ef4444' : '#f59e0b' },
                                                    ]}
                                                >
                                                    {isApp
                                                        ? 'STATUS: APPROVED'
                                                        : isRej
                                                            ? 'STATUS: REJECTED'
                                                            : 'STATUS: PENDING KYC'}
                                                </Text>
                                            </View>

                                            {isRej && rText ? (
                                                <View style={[s.rejectReasonBox, { marginTop: 8 }]}>
                                                    <AlertCircle color="#ef4444" size={14} style={{ marginTop: 1 }} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={s.rejectReasonLabel}>Rejection Reason:</Text>
                                                        <Text style={s.rejectReasonText}>{rText}</Text>
                                                    </View>
                                                </View>
                                            ) : null}
                                        </View>
                                    );
                                })()}

                                {/* Details List */}
                                <View style={[s.modalInfoBox, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                                    <View style={s.modalInfoItem}>
                                        <Mail color="#10b981" size={14} />
                                        <Text style={[s.modalInfoText, { color: theme.textMain }]}>
                                            {selectedUser.email || 'No email provided'}
                                        </Text>
                                    </View>
                                    <View style={s.modalInfoItem}>
                                        <Phone color="#10b981" size={14} />
                                        <Text style={[s.modalInfoText, { color: theme.textMain }]}>
                                            {selectedUser.phone || 'No phone provided'}
                                        </Text>
                                    </View>
                                    <View style={s.modalInfoItem}>
                                        <Building2 color="#10b981" size={14} />
                                        <DynamicText
                                            text={selectedUser.communityName || 'MFCT Community'}
                                            style={[s.modalInfoText, { color: theme.textMain }]}
                                        />
                                    </View>
                                    <View style={s.modalInfoItem}>
                                        <MapPin color="#10b981" size={14} />
                                        <View style={{ flexDirection: 'row' }}>
                                            <DynamicText
                                                text={selectedUser.city || ''}
                                                style={[s.modalInfoText, { color: theme.textMain }]}
                                            />
                                            <Text style={[s.modalInfoText, { color: theme.textMain }]}>, </Text>
                                            <DynamicText
                                                text={selectedUser.state || 'UP'}
                                                style={[s.modalInfoText, { color: theme.textMain }]}
                                            />
                                        </View>
                                    </View>

                                    {selectedUser.address ? (
                                        <View style={s.modalInfoItem}>
                                            <Text style={[s.modalInfoText, { color: theme.textSub }]}>
                                                Address: {selectedUser.address}
                                            </Text>
                                        </View>
                                    ) : null}

                                    {selectedUser.paymentUtr ? (
                                        <View style={s.modalInfoItem}>
                                            <CreditCard color="#10b981" size={14} />
                                            <Text style={[s.modalInfoText, { color: theme.textMain }]}>
                                                UTR: {selectedUser.paymentUtr}
                                            </Text>
                                        </View>
                                    ) : null}

                                    {selectedUser.religion ? (
                                        <View style={s.modalInfoItem}>
                                            <Sparkles color="#10b981" size={14} />
                                            <Text style={[s.modalInfoText, { color: theme.textMain }]}>
                                                Religion: {selectedUser.religion} {selectedUser.isMalikENisab ? '(Malik-e-Nisab)' : ''}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* Document Image Previews with Tap to Zoom */}
                                <Text style={[s.modalSectionLabel, { color: theme.textMain }]}>
                                    Uploaded ID Proof / Aadhaar Front (Tap to zoom)
                                </Text>
                                {(selectedUser.aadhaarFrontUrl || selectedUser.documentUrl) ? (
                                    <TouchableOpacity
                                        activeOpacity={0.85}
                                        onPress={() => setPreviewImage({
                                            url: selectedUser.aadhaarFrontUrl || selectedUser.documentUrl!,
                                            title: `${selectedUser.name} - Aadhaar Front`
                                        })}
                                        style={[s.imagePreviewWrap, { borderColor: theme.cardBorder }]}
                                    >
                                        <Image
                                            source={{ uri: selectedUser.aadhaarFrontUrl || selectedUser.documentUrl }}
                                            style={s.docPreviewImg}
                                            resizeMode="contain"
                                        />
                                        <View style={s.zoomHintBadge}>
                                            <ZoomIn color="#fff" size={12} />
                                            <Text style={s.zoomHintText}>Tap to Zoom</Text>
                                        </View>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[s.noDocBox, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                                        <FileText color={theme.textSub} size={28} />
                                        <Text style={[s.noDocText, { color: theme.textSub }]}>
                                            No ID document attached
                                        </Text>
                                    </View>
                                )}

                                {/* Aadhaar Back if present */}
                                {selectedUser.aadhaarBackUrl ? (
                                    <>
                                        <Text style={[s.modalSectionLabel, { color: theme.textMain, marginTop: 14 }]}>
                                            Aadhaar Back Side (Tap to zoom)
                                        </Text>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => setPreviewImage({
                                                url: selectedUser.aadhaarBackUrl!,
                                                title: `${selectedUser.name} - Aadhaar Back`
                                            })}
                                            style={[s.imagePreviewWrap, { borderColor: theme.cardBorder }]}
                                        >
                                            <Image
                                                source={{ uri: selectedUser.aadhaarBackUrl }}
                                                style={s.docPreviewImg}
                                                resizeMode="contain"
                                            />
                                            <View style={s.zoomHintBadge}>
                                                <ZoomIn color="#fff" size={12} />
                                                <Text style={s.zoomHintText}>Tap to Zoom</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </>
                                ) : null}

                                {/* Payment Screenshot Preview with Tap to Zoom */}
                                {selectedUser.paymentScreenshotUrl ? (
                                    <>
                                        <Text style={[s.modalSectionLabel, { color: theme.textMain, marginTop: 14 }]}>
                                            Payment Receipt / Screenshot (Tap to zoom)
                                        </Text>
                                        <TouchableOpacity
                                            activeOpacity={0.85}
                                            onPress={() => setPreviewImage({
                                                url: selectedUser.paymentScreenshotUrl!,
                                                title: `${selectedUser.name} - Payment Screenshot`
                                            })}
                                            style={[s.imagePreviewWrap, { borderColor: theme.cardBorder }]}
                                        >
                                            <Image
                                                source={{ uri: selectedUser.paymentScreenshotUrl }}
                                                style={s.docPreviewImg}
                                                resizeMode="contain"
                                            />
                                            <View style={s.zoomHintBadge}>
                                                <ZoomIn color="#fff" size={12} />
                                                <Text style={s.zoomHintText}>Tap to Zoom</Text>
                                            </View>
                                        </TouchableOpacity>
                                    </>
                                ) : null}
                            </ScrollView>

                            {/* Modal Actions */}
                            <View style={[s.modalFooter, { borderTopColor: theme.cardBorder }]}>
                                {/* Row 1: Decision Action Buttons */}
                                {(() => {
                                    const modalStatus = getUserStatus(selectedUser);
                                    const isApp = modalStatus === 'approved';
                                    const isRej = modalStatus === 'rejected';

                                    if (isApp) {
                                        return (
                                            <View style={s.modalBtnRow}>
                                                <TouchableOpacity
                                                    style={[s.modalDeclineBtn, { flex: 1 }]}
                                                    onPress={() => openRejectModal(selectedUser)}
                                                    disabled={processingId === selectedUser.id || terminating}
                                                >
                                                    <X color="#ef4444" size={15} />
                                                    <Text style={s.modalDeclineText}>
                                                        {tr('सत्यापन हटाएं (कारण आवश्यक)', 'منسوخ کریں', 'Revoke Approval (Reason Required)')}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    }

                                    if (isRej) {
                                        return (
                                            <View style={s.modalBtnRow}>
                                                <TouchableOpacity
                                                    style={[s.modalDeclineBtn, { flex: 1 }]}
                                                    onPress={() => openRejectModal(selectedUser)}
                                                    disabled={processingId === selectedUser.id || terminating}
                                                >
                                                    <Text style={s.modalDeclineText}>{tr('कारण संपादित करें', 'وجہ تبدیل کریں', 'Edit Reason')}</Text>
                                                </TouchableOpacity>

                                                <TouchableOpacity
                                                    style={[s.modalApproveBtn, { flex: 1.3 }]}
                                                    onPress={() => handleApprove(selectedUser)}
                                                    disabled={processingId === selectedUser.id || terminating}
                                                >
                                                    {processingId === selectedUser.id && processingAction === 'approve' ? (
                                                        <ActivityIndicator color="#fff" size="small" />
                                                    ) : (
                                                        <>
                                                            <Check color="#fff" size={16} />
                                                            <Text style={s.modalApproveText}>{tr('पुनः स्वीकृत करें', 'دوبارہ منظور کریں', 'Re-Approve')}</Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    }

                                    return (
                                        <View style={s.modalBtnRow}>
                                            <TouchableOpacity
                                                style={[s.modalDeclineBtn, { flex: 1 }]}
                                                onPress={() => openRejectModal(selectedUser)}
                                                disabled={processingId === selectedUser.id || terminating}
                                            >
                                                <X color="#ef4444" size={15} />
                                                <Text style={s.modalDeclineText}>{t('btn.reject', 'Reject')}</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[s.modalApproveBtn, { flex: 1.3 }]}
                                                onPress={() => handleApprove(selectedUser)}
                                                disabled={processingId === selectedUser.id || terminating}
                                            >
                                                {processingId === selectedUser.id && processingAction === 'approve' ? (
                                                    <ActivityIndicator color="#fff" size="small" />
                                                ) : (
                                                    <>
                                                        <Check color="#fff" size={16} />
                                                        <Text style={s.modalApproveText}>{t('btn.approve', 'Approve KYC')}</Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })()}

                                {/* Row 2: Close and Terminate */}
                                <View style={s.modalSecondaryRow}>
                                    <TouchableOpacity
                                        style={[s.modalCloseActionBtn, { backgroundColor: theme.chipIdle, borderColor: theme.cardBorder }]}
                                        onPress={() => setSelectedUser(null)}
                                    >
                                        <Text style={[s.modalCloseActionText, { color: theme.textMain }]}>{t('btn.close', 'Close')}</Text>
                                    </TouchableOpacity>

                                    {canPerformKycAction && (
                                        <TouchableOpacity
                                            style={s.modalTerminateBtn}
                                            onPress={() => openTerminateModal(selectedUser)}
                                            disabled={terminating}
                                        >
                                            <Trash2 color="#ef4444" size={13} />
                                            <Text style={s.modalTerminateText}>{tr('खाता समाप्त करें', 'اکاؤنٹ ختم کریں', 'Terminate Account')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Mandatory Rejection Reason Dialog */}
            {rejectModalUser && (
                <Modal
                    visible={!!rejectModalUser}
                    transparent
                    animationType="fade"
                    onRequestClose={() => {
                        if (!processingId) setRejectModalUser(null);
                    }}
                >
                    <View style={[s.modalBackdrop, { backgroundColor: theme.modalBg, justifyContent: 'center', padding: 20 }]}>
                        <View style={[s.rejectModalCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                            <View style={s.rejectModalHeader}>
                                <View style={s.rejectIconCircle}>
                                    <XCircle color="#ef4444" size={22} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.modalTitle, { color: theme.textMain }]}>
                                        {t('admin.reject_modal_title', 'Reason for KYC Rejection')}
                                    </Text>
                                    <Text style={[s.modalSubTitle, { color: theme.textSub }]} numberOfLines={1}>
                                        {rejectModalUser.name} ({rejectModalUser.phone || rejectModalUser.id.slice(0, 8)})
                                    </Text>
                                </View>
                            </View>

                            <Text style={[s.rejectSuggestLabel, { color: theme.textSub }]}>
                                {t('admin.select_quick_reason', 'Select quick reason or write below:')}
                            </Text>

                            {/* Suggestion Chips */}
                            <View style={s.suggestChipsRow}>
                                {[
                                    'Aadhaar document is blurred / unreadable',
                                    'Name does not match Aadhaar details',
                                    'Invalid or duplicate Aadhaar number',
                                    'Address mismatch in uploaded proof',
                                    'Profile photo not clear',
                                ].map(reason => (
                                    <TouchableOpacity
                                        key={reason}
                                        style={[
                                            s.suggestChip,
                                            {
                                                backgroundColor:
                                                    rejectionReasonInput === reason
                                                        ? (isDark ? '#451a1a' : '#fef2f2')
                                                        : theme.chipIdle,
                                                borderColor:
                                                    rejectionReasonInput === reason
                                                        ? '#ef4444'
                                                        : theme.cardBorder,
                                            },
                                        ]}
                                        onPress={() => {
                                            setRejectionReasonInput(reason);
                                            setRejectionReasonError('');
                                        }}
                                    >
                                        <Text
                                            style={[
                                                s.suggestChipText,
                                                {
                                                    color:
                                                        rejectionReasonInput === reason
                                                            ? '#ef4444'
                                                            : theme.textSub,
                                                },
                                            ]}
                                        >
                                            {reason}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={[
                                    s.rejectionInput,
                                    {
                                        backgroundColor: isDark ? '#131d2e' : '#f8fafc',
                                        borderColor: rejectionReasonError ? '#ef4444' : theme.cardBorder,
                                        color: theme.textMain,
                                    },
                                ]}
                                placeholder="Please specify why KYC is being rejected (Mandatory)..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                value={rejectionReasonInput}
                                onChangeText={text => {
                                    setRejectionReasonInput(text);
                                    if (text.trim()) setRejectionReasonError('');
                                }}
                            />

                            {rejectionReasonError ? (
                                <Text style={s.rejectionErrorText}>{rejectionReasonError}</Text>
                            ) : null}

                            <View style={s.rejectModalBtnRow}>
                                <TouchableOpacity
                                    style={[s.rejectCancelBtn, { backgroundColor: theme.chipIdle }]}
                                    onPress={() => {
                                        if (!processingId) setRejectModalUser(null);
                                    }}
                                    disabled={!!processingId}
                                >
                                    <Text style={[s.rejectCancelBtnText, { color: theme.textMain }]}>
                                        {t('btn.cancel', 'Cancel')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={s.rejectConfirmBtn}
                                    onPress={handleConfirmReject}
                                    disabled={processingId === rejectModalUser.id}
                                >
                                    {processingId === rejectModalUser.id ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={s.rejectConfirmBtnText}>
                                            {t('btn.confirm_reject', 'Confirm Rejection')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Account Termination Confirmation Modal */}
            {terminateModalUser && (
                <Modal
                    visible={!!terminateModalUser}
                    transparent
                    animationType="fade"
                    onRequestClose={() => {
                        if (!terminating) setTerminateModalUser(null);
                    }}
                >
                    <View style={[s.modalBackdrop, { backgroundColor: theme.modalBg, justifyContent: 'center', padding: 20 }]}>
                        <View style={[s.rejectModalCard, { backgroundColor: theme.cardBg, borderColor: '#f43f5e50' }]}>
                            <View style={s.rejectModalHeader}>
                                <View style={[s.rejectIconCircle, { backgroundColor: '#ef444420' }]}>
                                    <UserX color="#ef4444" size={22} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[s.modalTitle, { color: '#ef4444' }]}>
                                        {tr('खाता समाप्त करें', 'اکاؤنٹ ختم کریں', 'Terminate Member Account')}
                                    </Text>
                                    <Text style={[s.modalSubTitle, { color: theme.textSub }]} numberOfLines={1}>
                                        {terminateModalUser.name} ({terminateModalUser.phone || terminateModalUser.id.slice(0, 8)})
                                    </Text>
                                </View>
                            </View>

                            <View style={{ backgroundColor: '#fef3c730', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#f59e0b40', marginBottom: 12 }}>
                                <Text style={{ fontSize: 11, color: '#d97706', lineHeight: 16 }}>
                                    {tr(
                                        '⚠️ इस खाते को समाप्त करने पर इसका डेटा डेटाबेस से स्थायी रूप से हटा दिया जाएगा। सदस्य कारण सहित ईमेल प्राप्त करेगा और पुनः नया पंजीकरण कर सकेगा।',
                                        '⚠️ اس اکاؤنٹ کو ختم کرنے سے اس کا ڈیٹا ہمیشہ کے لیے حذف کر دیا جائے گا۔ صارف دوبارہ رجسٹر کر سکے گا۔',
                                        '⚠️ Terminating will permanently delete this account from the database. The member will receive a notice email and can register a fresh account.'
                                    )}
                                </Text>
                            </View>

                            <Text style={[s.rejectSuggestLabel, { color: theme.textSub }]}>
                                {tr('त्वरित कारण चुनें या नीचे लिखें:', 'وجہ منتخب کریں:', 'Select quick reason or write below:')}
                            </Text>

                            {/* Suggestion Chips */}
                            <View style={s.suggestChipsRow}>
                                {[
                                    'Invalid / blurred Aadhaar documents',
                                    'Duplicate registration account',
                                    'Incorrect or mismatched member details',
                                    'Requested fresh registration by member',
                                ].map(reason => (
                                    <TouchableOpacity
                                        key={reason}
                                        style={[
                                            s.suggestChip,
                                            {
                                                backgroundColor:
                                                    terminationReasonInput === reason
                                                        ? (isDark ? '#451a1a' : '#fef2f2')
                                                        : theme.chipIdle,
                                                borderColor:
                                                    terminationReasonInput === reason
                                                        ? '#ef4444'
                                                        : theme.cardBorder,
                                            },
                                        ]}
                                        onPress={() => {
                                            setTerminationReasonInput(reason);
                                            setTerminationReasonError('');
                                        }}
                                    >
                                        <Text
                                            style={[
                                                s.suggestChipText,
                                                {
                                                    color:
                                                        terminationReasonInput === reason
                                                            ? '#ef4444'
                                                            : theme.textSub,
                                                },
                                            ]}
                                        >
                                            {reason}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                style={[
                                    s.rejectionInput,
                                    {
                                        backgroundColor: isDark ? '#131d2e' : '#f8fafc',
                                        borderColor: terminationReasonError ? '#ef4444' : theme.cardBorder,
                                        color: theme.textMain,
                                    },
                                ]}
                                placeholder={tr('समाप्त करने का कारण (अनिवार्य)...', 'ختم کرنے کی وجہ (لازمی)...', 'Reason for terminating this account (Mandatory)...')}
                                placeholderTextColor="#94a3b8"
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                value={terminationReasonInput}
                                onChangeText={text => {
                                    setTerminationReasonInput(text);
                                    if (text.trim()) setTerminationReasonError('');
                                }}
                            />

                            {terminationReasonError ? (
                                <Text style={s.rejectionErrorText}>{terminationReasonError}</Text>
                            ) : null}

                            <View style={s.rejectModalBtnRow}>
                                <TouchableOpacity
                                    style={[s.rejectCancelBtn, { backgroundColor: theme.chipIdle }]}
                                    onPress={() => {
                                        if (!terminating) setTerminateModalUser(null);
                                    }}
                                    disabled={terminating}
                                >
                                    <Text style={[s.rejectCancelBtnText, { color: theme.textMain }]}>
                                        {t('btn.cancel', 'Cancel')}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[s.rejectConfirmBtn, { backgroundColor: '#ef4444' }]}
                                    onPress={handleConfirmTerminate}
                                    disabled={terminating}
                                >
                                    {terminating ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <Text style={s.rejectConfirmBtnText}>
                                            {tr('खाता हटाएं', 'اکاؤنٹ حذف کریں', 'Terminate & Delete')}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Image Zoom Preview Modal */}
            {previewImage && (
                <Modal
                    visible={!!previewImage}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setPreviewImage(null)}
                >
                    <View style={s.imageZoomBackdrop}>
                        <View style={s.imageZoomHeader}>
                            <Text style={s.imageZoomTitle} numberOfLines={1}>{previewImage.title}</Text>
                            <TouchableOpacity onPress={() => setPreviewImage(null)} style={s.imageZoomCloseBtn}>
                                <X color="#fff" size={20} />
                            </TouchableOpacity>
                        </View>
                        <Image
                            source={{ uri: previewImage.url }}
                            style={s.imageZoomImage}
                            resizeMode="contain"
                        />
                    </View>
                </Modal>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    screen: { flex: 1 },
    centerLoading: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 13,
        fontWeight: '600',
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    headerIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#8b5cf620',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    headerSub: {
        fontSize: 12,
        marginTop: 1,
    },
    refreshBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 14,
    },
    statCount: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '800',
        marginTop: 6,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    filterTabRow: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 12,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 7,
        paddingHorizontal: 6,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterTabText: {
        fontSize: 10.5,
        fontWeight: '700',
    },
    searchBarWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 10,
        height: 42,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 12,
        fontWeight: '500',
        paddingVertical: 0,
    },
    searchClearBtn: {
        padding: 4,
    },
    districtChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    districtChipText: {
        fontSize: 11,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    urgentBadge: {
        backgroundColor: '#ef444420',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    urgentBadgeText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '700',
    },
    emptyCard: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#10b98115',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },
    emptySub: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    userCard: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 14,
        marginBottom: 12,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    badgeWrap: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    userKycBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
        fontWeight: '500',
    },
    userInfoRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    userAvatar: {
        width: 48,
        height: 48,
        borderRadius: 14,
    },
    avatarFallback: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 18,
        fontWeight: '800',
    },
    userName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    userContact: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 2,
    },
    userLocation: {
        fontSize: 11,
        fontWeight: '500',
    },
    attachmentRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 10,
    },
    docBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#10b98115',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    docBadgeText: {
        color: '#10b981',
        fontSize: 10.5,
        fontWeight: '700',
    },
    docBadgeMissing: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#94a3b815',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    docBadgeMissingText: {
        color: '#94a3b8',
        fontSize: 10.5,
        fontWeight: '600',
    },
    utrText: {
        color: '#6366f1',
        fontSize: 10.5,
        fontWeight: '700',
    },
    rejectReasonBox: {
        flexDirection: 'row',
        gap: 6,
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#ef444415',
        marginBottom: 10,
    },
    rejectReasonLabel: {
        color: '#ef4444',
        fontSize: 10.5,
        fontWeight: '700',
    },
    rejectReasonText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '500',
        marginTop: 1,
    },
    cardActionsContainer: {
        paddingTop: 12,
        borderTopWidth: 1,
        gap: 8,
    },
    cardActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    viewDetailsBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    viewDetailsText: {
        fontSize: 11.5,
        fontWeight: '700',
    },
    terminateBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ef444435',
        backgroundColor: '#ef444412',
    },
    terminateBtnText: {
        color: '#ef4444',
        fontSize: 11.5,
        fontWeight: '700',
    },
    declineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: '#ef444415',
        borderWidth: 1,
        borderColor: '#ef444435',
    },
    declineBtnText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
    },
    approveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2,
    },
    approveBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalCard: {
        maxHeight: '90%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalSubTitle: {
        fontSize: 11,
        marginTop: 2,
    },
    modalCloseBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalBody: {
        padding: 16,
    },
    modalProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    modalAvatar: {
        width: 52,
        height: 52,
        borderRadius: 16,
    },
    modalUserName: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalUserMeta: {
        fontSize: 11,
        marginTop: 1,
    },
    modalInfoBox: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 12,
        gap: 8,
        marginBottom: 16,
    },
    modalInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalInfoText: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalSectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
    },
    imagePreviewWrap: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        position: 'relative',
        height: 180,
        backgroundColor: '#000',
    },
    docPreviewImg: {
        width: '100%',
        height: '100%',
    },
    zoomHintBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.65)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    zoomHintText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
    },
    noDocBox: {
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    noDocText: {
        fontSize: 12,
        fontWeight: '500',
    },
    modalFooter: {
        padding: 16,
        borderTopWidth: 1,
        gap: 10,
    },
    modalBtnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: '100%',
    },
    modalSecondaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
    },
    modalCloseActionBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    modalCloseActionText: {
        fontSize: 12,
        fontWeight: '700',
    },
    modalTerminateBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#ef444415',
        borderWidth: 1,
        borderColor: '#ef444435',
    },
    modalTerminateText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: '700',
    },
    modalDeclineBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 11,
        borderRadius: 10,
        backgroundColor: '#ef444415',
        borderWidth: 1,
        borderColor: '#ef444435',
    },
    modalDeclineText: {
        color: '#ef4444',
        fontSize: 12.5,
        fontWeight: '700',
    },
    modalApproveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 11,
        borderRadius: 10,
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 2,
    },
    modalApproveText: {
        color: '#fff',
        fontSize: 12.5,
        fontWeight: '700',
    },
    rejectModalCard: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
        width: '100%',
        maxWidth: 420,
    },
    rejectModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    rejectIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ef444420',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectSuggestLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 8,
    },
    suggestChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
    },
    suggestChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
    },
    suggestChipText: {
        fontSize: 11,
        fontWeight: '600',
    },
    rejectionInput: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        fontSize: 12,
        minHeight: 85,
    },
    rejectionErrorText: {
        color: '#ef4444',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 6,
    },
    rejectModalBtnRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    rejectCancelBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectCancelBtnText: {
        fontSize: 12,
        fontWeight: '700',
    },
    rejectConfirmBtn: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 10,
        backgroundColor: '#ef4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rejectConfirmBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    imageZoomBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageZoomHeader: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    imageZoomTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
        marginRight: 10,
    },
    imageZoomCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageZoomImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height * 0.75,
    },
    toastContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 36,
        left: 16,
        right: 16,
        zIndex: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    toastSuccess: { backgroundColor: '#059669' },
    toastError: { backgroundColor: '#dc2626' },
    toastInfo: { backgroundColor: '#0284c7' },
    toastText: { color: '#fff', fontSize: 13, fontWeight: '700', flex: 1 },
});

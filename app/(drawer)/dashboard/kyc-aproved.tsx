import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Modal,
    StyleSheet,
    Dimensions,
    Platform,
} from 'react-native';
import { getUsers, updateUser } from '../../../src/services/userService';
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
    FileText,
    CreditCard,
    Building2,
    MapPin,
    Mail,
    Phone,
    Clock,
    ExternalLink,
    RefreshCw,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useTranslation } from 'react-i18next';
import { getLanguageCode, translateCity, translateState, translateCommunityName } from '../../../src/lib/translateEntity';
import { DynamicText } from '../../../src/components/DynamicText';

interface ToastInfo {
    message: string;
    type: 'success' | 'error' | 'info';
}

export default function KycApprovalScreen() {
    const { currentRole, activeUser } = useAppState();
    const { colorScheme } = useColorScheme();
    const { t, i18n } = useTranslation();
    const lang = getLanguageCode(i18n.language);
    const isDark = colorScheme === 'dark';

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [processingAction, setProcessingAction] = useState<'approve' | 'reject' | null>(null);

    // Detail Modal state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

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

    // Handle KYC Action (Approve / Reject)
    const handleAction = async (user: User, approve: boolean) => {
        setProcessingId(user.id);
        setProcessingAction(approve ? 'approve' : 'reject');
        try {
            await updateUser(user.id, { isVerified: approve });

            setUsers(prev =>
                prev.map(u => (u.id === user.id ? { ...u, isVerified: approve } : u))
            );

            if (approve) {
                showToast(`KYC Approved successfully for ${user.name}!`, 'success');
            } else {
                showToast(`KYC status marked as Pending for ${user.name}.`, 'info');
            }

            if (selectedUser?.id === user.id) {
                setSelectedUser(prev => prev ? { ...prev, isVerified: approve } : null);
            }
        } catch (err: any) {
            console.error('KYC Action error:', err);
            showToast(err?.message || 'Failed to update KYC status.', 'error');
        } finally {
            setProcessingId(null);
            setProcessingAction(null);
        }
    };

    const pendingUsers = users.filter(u => !u.isVerified);
    const verifiedUsers = users.filter(u => u.isVerified);

    const theme = {
        bg: isDark ? '#090d16' : '#f8fafc',
        cardBg: isDark ? '#1e293b' : '#ffffff',
        cardBorder: isDark ? '#334155' : '#e2e8f0',
        textMain: isDark ? '#f8fafc' : '#0f172a',
        textSub: isDark ? '#94a3b8' : '#64748b',
        chipIdle: isDark ? '#131d2e' : '#f1f5f9',
        modalBg: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)',
    };

    if (loading) {
        return (
            <View style={[s.screen, s.centerLoading, { backgroundColor: theme.bg }]}>
                <ActivityIndicator color="#10b981" size="large" />
                <Text style={[s.loadingText, { color: theme.textSub }]}>Loading verification queue...</Text>
            </View>
        );
    }

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
            >

                {/* Overview Stats Row */}
                <View style={s.statsRow}>
                    <View style={[s.statCard, { backgroundColor: '#f59e0b' }]}>
                        <ShieldCheck color="#fff" size={22} />
                        <Text style={s.statCount}>{pendingUsers.length}</Text>
                        <Text style={s.statLabel}>{t('admin.kyc_subtitle', 'Pending Queue')}</Text>
                    </View>

                    <View style={[s.statCard, { backgroundColor: '#10b981' }]}>
                        <UserCheck color="#fff" size={22} />
                        <Text style={s.statCount}>{verifiedUsers.length}</Text>
                        <Text style={s.statLabel}>{t('admin.statActiveMembers', 'Verified Members')}</Text>
                    </View>
                </View>

                {/* Pending Verification Section */}
                <View style={s.sectionHeader}>
                    <Text style={[s.sectionTitle, { color: theme.textMain }]}>
                        {t('admin.kyc_title', 'Pending KYC Queue')} ({pendingUsers.length})
                    </Text>
                    {pendingUsers.length > 0 && (
                        <View style={s.urgentBadge}>
                            <Text style={s.urgentBadgeText}>{t('admin.kyc_subtitle', 'Needs Review')}</Text>
                        </View>
                    )}
                </View>

                {pendingUsers.length === 0 ? (
                    <View style={[s.emptyCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                        <View style={s.emptyIconCircle}>
                            <CheckCircle2 color="#10b981" size={32} />
                        </View>
                        <Text style={[s.emptyTitle, { color: theme.textMain }]}>{t('admin.all_caught_up', 'All Caught Up!')}</Text>
                        <Text style={[s.emptySub, { color: theme.textSub }]}>
                            {t('admin.no_pending_kyc', 'There are currently no users waiting for KYC approval. All member profiles are verified.')}
                        </Text>
                    </View>
                ) : (
                    pendingUsers.map(user => {
                        const isProcessing = processingId === user.id;
                        const userCity = translateCity(user.city || 'Bareilly', lang);
                        const userState = translateState(user.state || 'UP', lang);
                        const userComm = translateCommunityName(user.communityName || 'Bareilly Central Care Society (Headquarters)', lang);

                        return (
                            <View
                                key={user.id}
                                style={[
                                    s.userCard,
                                    { backgroundColor: theme.cardBg, borderColor: '#f59e0b40' },
                                ]}
                            >
                                {/* Card Top Strip */}
                                <View style={s.cardTopRow}>
                                    <View style={s.badgeWrap}>
                                        <Text style={s.userKycBadgeText}>USER KYC</Text>
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
                                        <View style={[s.avatarFallback, { backgroundColor: isDark ? '#334155' : '#fef3c7' }]}>
                                            <Text style={[s.avatarInitial, { color: '#f59e0b' }]}>
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
                                                text={user.city || 'Bareilly'}
                                                style={[s.userLocation, { color: theme.textSub }]}
                                            />
                                            <Text style={[s.userLocation, { color: theme.textSub }]}>, </Text>
                                            <DynamicText
                                                text={user.state || 'UP'}
                                                style={[s.userLocation, { color: theme.textSub }]}
                                            />
                                            <Text style={[s.userLocation, { color: theme.textSub }]}> • </Text>
                                            <DynamicText
                                                text={user.communityName || 'Bareilly Central Care Society (Headquarters)'}
                                                style={[s.userLocation, { color: theme.textSub }]}
                                            />
                                        </View>
                                    </View>
                                </View>

                                {/* Document Badges */}
                                <View style={s.attachmentRow}>
                                    {user.documentUrl ? (
                                        <View style={s.docBadge}>
                                            <FileText color="#10b981" size={12} />
                                            <Text style={s.docBadgeText}>ID Proof Attached</Text>
                                        </View>
                                    ) : (
                                        <View style={s.docBadgeMissing}>
                                            <FileText color="#94a3b8" size={12} />
                                            <Text style={s.docBadgeMissingText}>No ID Uploaded</Text>
                                        </View>
                                    )}

                                    {user.paymentScreenshotUrl && (
                                        <View style={s.docBadge}>
                                            <CreditCard color="#0284c7" size={12} />
                                            <Text style={[s.docBadgeText, { color: '#0284c7' }]}>Payment Receipt</Text>
                                        </View>
                                    )}

                                    {user.paymentUtr ? (
                                        <View style={s.docBadge}>
                                            <Text style={s.utrText}>UTR: {user.paymentUtr}</Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* Action Buttons */}
                                <View style={[s.cardActions, { borderTopColor: theme.cardBorder }]}>
                                    <TouchableOpacity
                                        style={[s.viewDetailsBtn, { backgroundColor: theme.chipIdle }]}
                                        onPress={() => setSelectedUser(user)}
                                    >
                                        <Eye color={theme.textSub} size={14} />
                                        <Text style={[s.viewDetailsText, { color: theme.textMain }]}>{t('btn.viewDetails', 'View Details')}</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={s.approveBtn}
                                        onPress={() => handleAction(user, true)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing && processingAction === 'approve' ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Check color="#fff" size={14} />
                                                <Text style={s.approveBtnText}>{t('btn.approve', 'Approve')}</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    })
                )}

                {/* Verified Members Section */}
                <View style={[s.sectionHeader, { marginTop: 24 }]}>
                    <Text style={[s.sectionTitle, { color: theme.textMain }]}>
                        {t('admin.statActiveMembers', 'Verified Members')} ({verifiedUsers.length})
                    </Text>
                </View>

                {verifiedUsers.slice(0, 15).map(user => (
                    <View
                        key={user.id}
                        style={[
                            s.verifiedCard,
                            { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
                        ]}
                    >
                        <View style={s.verifiedCardLeft}>
                            {user.avatar ? (
                                <Image source={{ uri: user.avatar }} style={s.verifiedAvatar} />
                            ) : (
                                <View style={[s.verifiedAvatarFallback, { backgroundColor: '#10b98120' }]}>
                                    <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>
                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                    </Text>
                                </View>
                            )}

                            <View style={{ flex: 1 }}>
                                <DynamicText
                                    text={user.name}
                                    style={[s.verifiedName, { color: theme.textMain }]}
                                    numberOfLines={1}
                                />
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={[s.verifiedSub, { color: theme.textSub }]}>
                                        ID: {user.membershipId || user.id.slice(0, 8)}{' • '}
                                    </Text>
                                    <DynamicText
                                        text={user.city || 'Bareilly'}
                                        style={[s.verifiedSub, { color: theme.textSub }]}
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => handleAction(user, false)}
                            style={s.verifiedTag}
                            disabled={processingId === user.id}
                        >
                            <CheckCircle2 color="#10b981" size={12} />
                            <Text style={s.verifiedTagText}>KYC Verified</Text>
                        </TouchableOpacity>
                    </View>
                ))}
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
                                    <Text style={[s.modalSubTitle, { color: theme.textSub }]}>User verification files & details</Text>
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
                                            ID: {selectedUser.membershipId || 'N/A'}
                                        </Text>
                                    </View>
                                </View>

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
                                            text={selectedUser.communityName || 'Bareilly Central Care Society'}
                                            style={[s.modalInfoText, { color: theme.textMain }]}
                                        />
                                    </View>
                                    <View style={s.modalInfoItem}>
                                        <MapPin color="#10b981" size={14} />
                                        <View style={{ flexDirection: 'row' }}>
                                            <DynamicText
                                                text={selectedUser.city || 'Bareilly'}
                                                style={[s.modalInfoText, { color: theme.textMain }]}
                                            />
                                            <Text style={[s.modalInfoText, { color: theme.textMain }]}>, </Text>
                                            <DynamicText
                                                text={selectedUser.state || 'UP'}
                                                style={[s.modalInfoText, { color: theme.textMain }]}
                                            />
                                        </View>
                                    </View>
                                    {selectedUser.paymentUtr ? (
                                        <View style={s.modalInfoItem}>
                                            <CreditCard color="#10b981" size={14} />
                                            <Text style={[s.modalInfoText, { color: theme.textMain }]}>
                                                UTR: {selectedUser.paymentUtr}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>

                                {/* Document Image Previews */}
                                <Text style={[s.modalSectionLabel, { color: theme.textMain }]}>Uploaded ID Proof / Aadhaar</Text>
                                {selectedUser.documentUrl ? (
                                    <View style={[s.imagePreviewWrap, { borderColor: theme.cardBorder }]}>
                                        <Image
                                            source={{ uri: selectedUser.documentUrl }}
                                            style={s.docPreviewImg}
                                            resizeMode="contain"
                                        />
                                    </View>
                                ) : (
                                    <View style={[s.noDocBox, { backgroundColor: isDark ? '#131d2e' : '#f8fafc', borderColor: theme.cardBorder }]}>
                                        <FileText color={theme.textSub} size={28} />
                                        <Text style={[s.noDocText, { color: theme.textSub }]}>No ID document attached</Text>
                                    </View>
                                )}

                                {/* Payment Screenshot Preview */}
                                {selectedUser.paymentScreenshotUrl ? (
                                    <>
                                        <Text style={[s.modalSectionLabel, { color: theme.textMain, marginTop: 14 }]}>
                                            Payment Receipt / Screenshot
                                        </Text>
                                        <View style={[s.imagePreviewWrap, { borderColor: theme.cardBorder }]}>
                                            <Image
                                                source={{ uri: selectedUser.paymentScreenshotUrl }}
                                                style={s.docPreviewImg}
                                                resizeMode="contain"
                                            />
                                        </View>
                                    </>
                                ) : null}
                            </ScrollView>

                            {/* Modal Actions */}
                            <View style={[s.modalFooter, { borderTopColor: theme.cardBorder }]}>
                                {selectedUser.isVerified ? (
                                    <TouchableOpacity
                                        style={s.modalDeclineBtn}
                                        onPress={() => handleAction(selectedUser, false)}
                                        disabled={processingId === selectedUser.id}
                                    >
                                        <Text style={s.modalDeclineText}>Revoke Verification</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        style={s.modalApproveBtn}
                                        onPress={() => handleAction(selectedUser, true)}
                                        disabled={processingId === selectedUser.id}
                                    >
                                        {processingId === selectedUser.id ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Check color="#fff" size={16} />
                                                <Text style={s.modalApproveText}>Approve KYC</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
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
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 18,
    },
    statCount: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '800',
        marginTop: 8,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
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
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#10b98115',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    emptySub: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
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
        backgroundColor: '#10b98115',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#10b98130',
    },
    userKycBadgeText: {
        color: '#10b981',
        fontSize: 10,
        fontWeight: '800',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dateText: {
        fontSize: 11,
    },
    userInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarFallback: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 17,
        fontWeight: '800',
    },
    userName: {
        fontSize: 14,
        fontWeight: '700',
    },
    userContact: {
        fontSize: 12,
        marginTop: 1,
    },
    userLocation: {
        fontSize: 11,
        marginTop: 2,
    },
    attachmentRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 12,
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
        fontSize: 11,
        fontWeight: '600',
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
        fontSize: 11,
        fontWeight: '500',
    },
    utrText: {
        color: '#8b5cf6',
        fontSize: 11,
        fontWeight: '600',
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    viewDetailsBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    viewDetailsText: {
        fontSize: 12,
        fontWeight: '600',
    },
    approveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#10b981',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    approveBtnText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '700',
    },
    verifiedCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 8,
    },
    verifiedCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
        marginRight: 8,
    },
    verifiedAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    verifiedAvatarFallback: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifiedName: {
        fontSize: 13,
        fontWeight: '700',
    },
    verifiedSub: {
        fontSize: 11,
        marginTop: 1,
    },
    verifiedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#10b98115',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#10b98130',
    },
    verifiedTagText: {
        color: '#10b981',
        fontSize: 11,
        fontWeight: '700',
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalCard: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        maxHeight: Dimensions.get('window').height * 0.85,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    modalSubTitle: {
        fontSize: 12,
        marginTop: 1,
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
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    modalUserName: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalUserMeta: {
        fontSize: 12,
        marginTop: 1,
    },
    modalInfoBox: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 12,
        gap: 8,
        marginBottom: 14,
    },
    modalInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalInfoText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    modalSectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    imagePreviewWrap: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        backgroundColor: '#000',
        height: 220,
    },
    docPreviewImg: {
        width: '100%',
        height: '100%',
    },
    noDocBox: {
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
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
    },
    modalApproveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#10b981',
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalApproveText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '700',
    },
    modalDeclineBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#ef444415',
        borderWidth: 1,
        borderColor: '#ef444430',
    },
    modalDeclineText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '700',
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

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
    Sparkles,
    CheckCircle2,
    ShieldCheck,
    Building2,
} from 'lucide-react-native';

const zahidPhoto = require('../../assets/images/Mr Mohammad Zahid.jpeg');
const amreenPhoto = require('../../assets/images/Mrs. Amreen.jpeg');

const C = {
    darkGreen: '#091f15',
    midGreen: '#0e2a1d',
    deepGreen: '#0d281a',
    richGreen: '#1a4230',
    gold: '#c8a84b',
    goldLight: 'rgba(200,168,75,0.7)',
    goldBg: 'rgba(200,168,75,0.12)',
    goldBorder: 'rgba(200,168,75,0.4)',
    goldDark: '#a0832e',
    white: '#ffffff',
    textMuted: '#64748b',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
    border: 'rgba(26,60,44,0.12)',
};

export const AboutUs: React.FC = () => {
    const { t } = useTranslation();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [amreenContainerWidth, setAmreenContainerWidth] = React.useState<number>(290);

    return (
        <View style={[styles.container, isDark && { backgroundColor: '#0b1320' }]}>
            {/* ── Section Header ── */}
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTag}>
                    <Sparkles size={13} color={C.gold} />
                    <Text style={[styles.sectionTagText, isDark && { color: C.gold }]}>
                        {t('about.founders_section_title')}
                    </Text>
                </View>
                <Text style={[styles.sectionTitle, isDark && { color: '#ffffff' }]}>
                    {t('about.founders_section_title')}
                </Text>
                <Text style={[styles.sectionSubtitle, isDark && { color: '#94a3b8' }]}>
                    {t('about.founders_section_subtitle')}
                </Text>
            </View>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* Founder 1: Er. Mohammad Zahid (Founder & Chairman)               */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: 'rgba(200, 168, 75, 0.3)' }]}>
                {/* Card Header Tag */}
                <View style={[styles.cardHeader, { backgroundColor: '#0a2217' }]}>
                    <View style={styles.headerLeft}>
                        <Text style={{ fontSize: 14 }}>🔷</Text>
                        <Text style={styles.headerRoleText} numberOfLines={1}>
                            {t('about.zahid_role')}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {/* Portrait & Profile */}
                    <View style={styles.portraitSection}>
                        <View style={styles.imageContainer}>
                            <Image
                                source={zahidPhoto}
                                style={styles.portraitImage}
                                resizeMode="cover"
                            />
                            {/* Overlay Gradient simulation */}
                            <View style={styles.imageGradientOverlay} />

                            {/* Floating bottom badge */}
                            <View style={styles.bottomBadge}>
                                <ShieldCheck size={14} color="#34d399" />
                                <Text style={styles.bottomBadgeText}>
                                    {t('about.zahid_role_title', 'Founder & Chairman, MFCT')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={[styles.founderName, isDark && { color: '#ffffff' }]}>
                                {t('about.zahid_title')}
                            </Text>
                            <Text style={[styles.founderRole, isDark && { color: C.gold }]}>
                                {t('about.zahid_role_title')}
                            </Text>
                            <View style={[styles.orgBadge, isDark && { backgroundColor: '#0a2318' }]}>
                                <Building2 size={13} color="#b45309" />
                                <Text style={[styles.orgBadgeText, isDark && { color: '#94a3b8' }]}>
                                    {t('about.trust_name_full', 'Mohammad Faeem Charitable Trust (MFCT)')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Message Content */}
                    <View style={[styles.messageContent, isDark && { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
                        {/* Quote Highlight Box */}
                        <View style={[styles.quoteBox, isDark && { backgroundColor: 'rgba(200, 168, 75, 0.08)', borderColor: 'rgba(200, 168, 75, 0.3)' }]}>
                            <Text style={styles.quoteDecorativeMark}>“</Text>
                            <Text style={[styles.quoteText, isDark && { color: '#e2e8f0' }]}>
                                {t('about.zahid_quote')}
                            </Text>
                        </View>

                        {/* Paragraph 1 */}
                        <Text style={[styles.paragraph, isDark && { color: '#cbd5e1' }]}>
                            {t('about.zahid_p1')}
                        </Text>

                        {/* Paragraph 2 */}
                        <Text style={[styles.paragraph, isDark && { color: '#cbd5e1' }]}>
                            {t('about.zahid_p2')}
                        </Text>

                        {/* Member Appeal Callout Box */}
                        <View style={[styles.calloutBox, isDark && { backgroundColor: '#0a2318', borderTopColor: 'rgba(200, 168, 75, 0.25)', borderRightColor: 'rgba(200, 168, 75, 0.25)', borderBottomColor: 'rgba(200, 168, 75, 0.25)' }]}>
                            <View style={styles.calloutLabelRow}>
                                <Sparkles size={12} color="#b45309" />
                                <Text style={[styles.calloutLabel, isDark && { color: '#fbbf24' }]}>
                                    {t('about.zahid_callout_label')}
                                </Text>
                            </View>
                            <Text style={[styles.calloutQuote, isDark && { color: '#ffffff' }]}>
                                {t('about.zahid_callout_quote')}
                            </Text>
                        </View>

                        {/* Paragraph 3 */}
                        <Text style={[styles.paragraph, isDark && { color: '#cbd5e1' }]}>
                            {t('about.zahid_p3')}
                        </Text>

                        {/* Paragraph 4 */}
                        <Text style={[styles.paragraph, styles.paragraphBold, isDark && { color: '#f8fafc' }]}>
                            {t('about.zahid_p4')}
                        </Text>

                        {/* Founder Sign-off */}
                        <View style={[styles.signOff, isDark && { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
                            <Text style={[styles.signOffName, isDark && { color: '#ffffff' }]}>
                                - {t('about.zahid_title')}
                            </Text>
                            <Text style={[styles.signOffRole, isDark && { color: '#94a3b8' }]}>
                                {t('about.zahid_role_title')}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* Founder 2: Mrs. Amreen Idrisi (Co-Founder & Secretary–Treasurer) */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            <View style={[styles.card, isDark && { backgroundColor: '#1e293b', borderColor: 'rgba(200, 168, 75, 0.3)' }]}>
                {/* Card Header Tag */}
                <View style={[styles.cardHeader, { backgroundColor: '#133c2a' }]}>
                    <View style={styles.headerLeft}>
                        <Text style={{ fontSize: 14 }}>🔶</Text>
                        <Text style={styles.headerRoleText} numberOfLines={1}>
                            {t('about.amreen_role')}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    {/* Portrait & Profile */}
                    <View style={styles.portraitSection}>
                        <View
                            style={styles.imageContainer}
                            onLayout={(e) => {
                                const w = e.nativeEvent.layout.width;
                                if (w > 0 && Math.abs(w - amreenContainerWidth) > 1) {
                                    setAmreenContainerWidth(w);
                                }
                            }}
                        >
                            <Image
                                source={amreenPhoto}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: amreenContainerWidth,
                                    height: amreenContainerWidth * 1.5,
                                }}
                                resizeMode="cover"
                            />
                            <View style={styles.imageGradientOverlay} />

                            {/* Floating bottom badge */}
                            <View style={styles.bottomBadge}>
                                <ShieldCheck size={14} color="#fbbf24" />
                                <Text style={styles.bottomBadgeText}>
                                    {t('about.amreen_role_short', 'Co-Founder & Secretary - Treasurer')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.profileInfo}>
                            <Text style={[styles.founderName, isDark && { color: '#ffffff' }]}>
                                {t('about.amreen_title', 'Mrs. Amreen Idrisi')}
                            </Text>
                            <Text style={[styles.founderRole, isDark && { color: C.gold }]}>
                                {t('about.amreen_role_title', 'Co-Founder & Secretary - Treasurer, MFCT')}
                            </Text>
                            <View style={[styles.orgBadge, isDark && { backgroundColor: '#0a2318' }]}>
                                <Building2 size={13} color="#b45309" />
                                <Text style={[styles.orgBadgeText, isDark && { color: '#94a3b8' }]}>
                                    {t('about.trust_name_full', 'Mohammad Faeem Charitable Trust (MFCT)')}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Message Content */}
                    <View style={[styles.messageContent, isDark && { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
                        {/* Quote Highlight Box */}
                        <View style={[styles.quoteBox, isDark && { backgroundColor: 'rgba(200, 168, 75, 0.08)', borderColor: 'rgba(200, 168, 75, 0.3)' }]}>
                            <Text style={styles.quoteDecorativeMark}>“</Text>
                            <Text style={[styles.quoteText, isDark && { color: '#e2e8f0' }]}>
                                {t('about.amreen_quote')}
                            </Text>
                        </View>

                        {/* Paragraph 1 */}
                        <Text style={[styles.paragraph, isDark && { color: '#cbd5e1' }]}>
                            {t('about.amreen_p1')}
                        </Text>

                        {/* Paragraph 2 */}
                        <Text style={[styles.paragraph, isDark && { color: '#cbd5e1' }]}>
                            {t('about.amreen_p2')}
                        </Text>

                        {/* Paragraph 3 */}
                        <Text style={[styles.paragraph, isDark && { color: '#cbd5e1' }]}>
                            {t('about.amreen_p3')}
                        </Text>

                        {/* Paragraph 4 */}
                        <Text style={[styles.paragraph, isDark && { color: '#cbd5e1' }]}>
                            {t('about.amreen_p4')}
                        </Text>

                        {/* Mutual Stand Callout Box */}
                        <View style={[styles.calloutBox, isDark && { backgroundColor: '#0a2318', borderTopColor: 'rgba(200, 168, 75, 0.25)', borderRightColor: 'rgba(200, 168, 75, 0.25)', borderBottomColor: 'rgba(200, 168, 75, 0.25)' }]}>
                            <Text style={[styles.calloutQuote, isDark && { color: '#ffffff' }]}>
                                {t('about.amreen_callout_quote')}
                            </Text>
                        </View>

                        {/* Paragraph 5 */}
                        <Text style={[styles.paragraph, styles.paragraphBold, isDark && { color: '#f8fafc' }]}>
                            {t('about.amreen_p5')}
                        </Text>

                        {/* Founder Sign-off */}
                        <View style={[styles.signOff, isDark && { borderTopColor: 'rgba(255,255,255,0.08)' }]}>
                            <Text style={[styles.signOffName, isDark && { color: '#ffffff' }]}>
                                - {t('about.amreen_title', 'Mrs. Amreen Idrisi')}
                            </Text>
                            <Text style={[styles.signOffRole, isDark && { color: '#94a3b8' }]}>
                                {t('about.amreen_role_title', 'Co-Founder & Secretary - Treasurer, MFCT')}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 28,
        backgroundColor: '#f8faf9',
    },
    sectionHeader: {
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    sectionTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        backgroundColor: C.goldBg,
        borderWidth: 1,
        borderColor: C.goldBorder,
        marginBottom: 8,
    },
    sectionTagText: {
        fontSize: 11,
        fontWeight: '800',
        color: C.richGreen,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: C.slate900,
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: C.textMuted,
        textAlign: 'center',
        lineHeight: 19,
        maxWidth: 340,
    },
    card: {
        backgroundColor: C.white,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: C.goldBorder,
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#0f291e',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 3,
    },
    cardHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(200, 168, 75, 0.3)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        marginRight: 8,
    },
    headerRoleText: {
        color: '#f0c868',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        flexShrink: 1,
    },
    founderPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 14,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.4)',
    },
    founderPillText: {
        color: '#fde68a',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    cardBody: {
        padding: 16,
    },
    portraitSection: {
        alignItems: 'center',
        marginBottom: 18,
    },
    imageContainer: {
        width: '100%',
        maxWidth: 290,
        aspectRatio: 4 / 5,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: C.gold,
        backgroundColor: '#0f172a',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 4,
    },
    portraitImage: {
        width: '100%',
        height: '100%',
    },
    imageGradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    topBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.4)',
    },
    topBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '800',
    },
    bottomBadge: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    bottomBadgeText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 14,
        gap: 4,
    },
    founderName: {
        fontSize: 20,
        fontWeight: '900',
        color: C.slate900,
        letterSpacing: -0.3,
    },
    founderRole: {
        fontSize: 13,
        fontWeight: '800',
        color: C.richGreen,
    },
    orgBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
        backgroundColor: '#f1f5f9',
        marginTop: 4,
    },
    orgBadgeText: {
        fontSize: 11,
        color: '#475569',
        fontWeight: '600',
    },
    messageContent: {
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        paddingTop: 16,
    },
    quoteBox: {
        backgroundColor: 'rgba(200, 168, 75, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(200, 168, 75, 0.45)',
        borderRadius: 16,
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
    },
    quoteDecorativeMark: {
        position: 'absolute',
        right: 8,
        bottom: -15,
        fontSize: 58,
        fontFamily: 'serif',
        color: 'rgba(200, 168, 75, 0.25)',
        lineHeight: 60,
    },
    quoteText: {
        fontSize: 14,
        fontWeight: '800',
        fontStyle: 'italic',
        color: C.darkGreen,
        lineHeight: 21,
    },
    paragraph: {
        fontSize: 13,
        color: C.slate700,
        lineHeight: 20,
        fontWeight: '400',
    },
    paragraphBold: {
        fontWeight: '700',
        color: C.slate900,
    },
    calloutBox: {
        backgroundColor: '#fcf8ee',
        borderLeftWidth: 4,
        borderLeftColor: C.gold,
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderTopColor: '#ebdcb2',
        borderRightColor: '#ebdcb2',
        borderBottomColor: '#ebdcb2',
        borderRadius: 14,
        padding: 14,
        gap: 4,
        marginVertical: 4,
    },
    calloutLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    calloutLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#78350f',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    calloutQuote: {
        fontSize: 14,
        fontWeight: '900',
        color: '#0f3322',
        lineHeight: 20,
    },
    signOff: {
        marginTop: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
    },
    signOffName: {
        fontSize: 15,
        fontWeight: '900',
        color: C.slate900,
    },
    signOffRole: {
        fontSize: 11,
        color: C.textMuted,
        fontWeight: '600',
        marginTop: 1,
    },
});

export default AboutUs;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getCampaignById } from '../../src/services/campaignService';
import { Campaign } from '../../src/types';
import {
  getLanguageCode,
  translateCategory,
  translateCity,
  translateCommunityName,
  translateCampaignTitle,
  translateCampaignStory,
  translateRole,
  translateAdminName,
} from '../../src/lib/translateEntity';
import { useDynamicTranslatedText } from '../../src/lib/autoTranslate';
import {
  ArrowLeft,
  Share2,
  ShieldCheck,
  Sparkles,
  Flame,
  Clock,
  Users,
  Building2,
  Heart,
  FileText,
  CheckCircle2,
  MapPin,
  Lock,
} from 'lucide-react-native';

export default function CampaignDetailsScreen() {
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  const displayTitle = useDynamicTranslatedText(
    campaign ? translateCampaignTitle(campaign.title, lang) : '',
    lang
  );
  const displayStory = useDynamicTranslatedText(
    campaign ? translateCampaignStory(campaign.story, lang) : '',
    lang
  );
  const displayBeneficiaryName = useDynamicTranslatedText(
    campaign ? campaign.beneficiaryName || '' : '',
    lang
  );

  useEffect(() => {
    async function loadCampaign() {
      if (!params.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getCampaignById(params.id);
        setCampaign(data);
      } catch (err) {
        console.warn('Error fetching campaign details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCampaign();
  }, [params.id]);

  const handleShare = async () => {
    if (!campaign) return;
    try {
      await Share.share({
        message: `Support "${campaign.title}" on MFCT - Muslim Family Care Trust: Goal ₹${campaign.goalINR?.toLocaleString('en-IN')}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDonate = () => {
    if (!campaign) return;
    router.push({
      pathname: '/(stacks)/donation',
      params: {
        campaignId: campaign.id,
        initialCategory: campaign.category,
      },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!campaign) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-slate-950 items-center justify-center p-6">
        <Text className="text-base text-slate-700 dark:text-slate-300 font-semibold mb-4">
          Campaign not found
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-emerald-600 px-5 py-2.5 rounded-xl"
        >
          <Text className="text-white font-bold text-xs">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const percentRaised = Math.min(100, Math.round((campaign.raisedINR / campaign.goalINR) * 100)) || 0;
  const displayCat = translateCategory(campaign.category, lang);
  const displayComm = translateCommunityName(campaign.communityName, lang);
  const displayCity = translateCity(campaign.city, lang);
  const displayRelation = translateRole(campaign.beneficiaryRelation, lang);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      {/* Header bar */}
      <View className="pt-12 pb-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          <ArrowLeft color="#334155" size={20} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          className="flex-1 text-center mx-3 font-bold text-sm text-slate-900 dark:text-white"
        >
          {displayCat}
        </Text>
        <TouchableOpacity
          onPress={handleShare}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
        >
          <Share2 color="#334155" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Image & Badges */}
        <View className="relative">
          <Image
            source={{ uri: campaign.mainImage }}
            className="w-full h-64"
            resizeMode="cover"
          />
          <View className="absolute top-3 left-3 flex-row flex-wrap gap-1.5">
            <View className="bg-white/90 dark:bg-slate-900/90 px-2.5 py-1 rounded-md shadow-sm">
              <Text className="text-slate-900 dark:text-white font-extrabold text-[10px] uppercase">
                {displayCat}
              </Text>
            </View>
            {campaign.isZakatEligible && (
              <View className="bg-amber-500 px-2.5 py-1 rounded-md flex-row items-center shadow-sm">
                <Sparkles color="#ffffff" size={10} />
                <Text className="text-white font-bold text-[10px] ml-1">{translateCategory('Zakat', lang)}</Text>
              </View>
            )}
            {campaign.isSadqaEligible && (
              <View className="bg-teal-600 px-2.5 py-1 rounded-md flex-row items-center shadow-sm">
                <Heart color="#ffffff" size={10} />
                <Text className="text-white font-bold text-[10px] ml-1">{translateCategory('Sadqa', lang)}</Text>
              </View>
            )}
            {campaign.isFitrahEligible && (
              <View className="bg-amber-600 px-2.5 py-1 rounded-md flex-row items-center shadow-sm">
                <Sparkles color="#ffffff" size={10} />
                <Text className="text-white font-bold text-[10px] ml-1">{translateCategory('Fitra', lang)}</Text>
              </View>
            )}
            {campaign.isUrgent && (
              <View className="bg-red-600 px-2.5 py-1 rounded-md flex-row items-center shadow-sm">
                <Flame color="#ffffff" size={10} />
                <Text className="text-white font-bold text-[10px] ml-1">{translateCategory('Urgent', lang)}</Text>
              </View>
            )}
            {campaign.isVerified && (
              <View className="bg-emerald-700 px-2.5 py-1 rounded-md flex-row items-center shadow-sm">
                <ShieldCheck color="#ffffff" size={10} />
                <Text className="text-white font-bold text-[10px] ml-1">{t('campaign_details.verified_aid', 'Verified Aid')}</Text>
              </View>
            )}
          </View>
        </View>

        <View className="p-4 space-y-4">
          {/* Location & Title */}
          <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <View className="flex-row items-center mb-1.5">
              <Building2 color="#059669" size={14} />
              <Text className="text-emerald-700 dark:text-emerald-400 font-bold text-xs ml-1.5">
                {displayComm} • {displayCity}
              </Text>
            </View>

            <Text className="text-lg font-black text-slate-900 dark:text-white leading-6 mb-3">
              {displayTitle || campaign.title}
            </Text>

            {/* Financial Progress */}
            <View className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-baseline mb-2">
                <View>
                  <Text className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{campaign.raisedINR?.toLocaleString('en-IN')}
                  </Text>
                  <Text className="text-[11px] text-slate-400">
                    {t('campaign_details.raised_of', 'raised of')} ₹{campaign.goalINR?.toLocaleString('en-IN')} {t('campaign_details.goal', 'goal')}
                  </Text>
                </View>
                <Text className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {percentRaised}%
                </Text>
              </View>

              {/* Progress bar */}
              <View className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mb-3 overflow-hidden">
                <View
                  className="bg-emerald-500 h-2.5 rounded-full"
                  style={{ width: `${percentRaised}%` }}
                />
              </View>

              <View className="flex-row justify-between items-center text-xs text-slate-600 dark:text-slate-400">
                <View className="flex-row items-center">
                  <Users color="#64748b" size={14} />
                  <Text className="text-xs text-slate-600 dark:text-slate-400 ml-1.5 font-semibold">
                    {campaign.donorsCount} {t('campaign_details.supporters', 'Supporters')}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Clock color="#eab308" size={14} />
                  <Text className="text-xs text-amber-600 dark:text-amber-400 ml-1.5 font-semibold">
                    {campaign.daysLeft} {t('campaigns.days_left', 'Days Left')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Beneficiary Background & Story */}
          <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <Text className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              {t('campaign_details.beneficiary_story', 'Beneficiary Background & Story')}
            </Text>

            <View className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 mb-3">
              <Text className="font-extrabold text-xs text-slate-900 dark:text-white">
                {t('campaign_details.beneficiary', 'Beneficiary')}: {displayBeneficiaryName || campaign.beneficiaryName}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {t('campaign_details.relationship', 'Relationship / Role')}: {displayRelation}
              </Text>
            </View>

            <Text className="text-xs text-slate-700 dark:text-slate-300 leading-5">
              {displayStory || campaign.story || t('campaign_details.no_story', 'No extended story provided for this campaign.')}
            </Text>
          </View>

          {/* Attached Medical Documents & Estimates */}
          {campaign.documents && campaign.documents.length > 0 && (
            <View className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t('campaign_details.verified_docs', 'Verified Medical Estimates & Docs')} ({campaign.documents.length})
                </Text>
                <View className="bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    {t('campaign_details.audit_verified', 'Audit Verified')}
                  </Text>
                </View>
              </View>

              <View className="space-y-2.5">
                {campaign.documents.map((doc, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60"
                  >
                    <Image
                      source={{ uri: doc.url }}
                      style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#e2e8f0' }}
                      resizeMode="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="font-bold text-xs text-slate-900 dark:text-white" numberOfLines={1}>
                        {doc.title}
                      </Text>
                      <Text className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {(doc as any).size || 'Attached Scan'} • {t('campaign_details.verified_by', 'Verified by')} {translateAdminName(doc.verifiedBy, lang) || 'HQ Admin'}
                      </Text>
                    </View>
                    <CheckCircle2 color="#059669" size={16} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Transparency & Verification Guarantee */}
          <View className="bg-slate-900 dark:bg-slate-900 p-4 rounded-2xl border border-emerald-800/60 shadow-sm space-y-2.5">
            <View className="flex-row items-center">
              <ShieldCheck color="#34d399" size={18} />
              <Text className="text-white font-bold text-xs ml-2">
                100% Verified Community Escrow
              </Text>
            </View>

            <View className="flex-row items-center">
              <CheckCircle2 color="#34d399" size={14} />
              <Text className="text-slate-300 text-[11px] ml-2">
                Funds disbursed directly to hospitals / institutions
              </Text>
            </View>

            <View className="flex-row items-center">
              <CheckCircle2 color="#34d399" size={14} />
              <Text className="text-slate-300 text-[11px] ml-2">
                0% Platform Deductions • Tax & Zakat Compliant
              </Text>
            </View>

            <View className="flex-row items-center">
              <CheckCircle2 color="#34d399" size={14} />
              <Text className="text-slate-300 text-[11px] ml-2">
                Live UTR payment tracking & Digital receipts
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Donate CTA */}
      <View className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex-row gap-3">
        <TouchableOpacity
          onPress={handleShare}
          className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center"
        >
          <Share2 color="#475569" size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDonate}
          className="flex-1 bg-emerald-600 py-3.5 rounded-xl items-center justify-center flex-row shadow-md"
        >
          <Heart color="#ffffff" size={16} fill="#ffffff" />
          <Text className="text-white font-black text-sm ml-2">{t('home.donate_now', 'Donate Now')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import {
  X,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { User } from '../types';
import { updateUser } from '../services/userService';
import { verifyPassword } from '../lib/auth';
import { getLanguageCode } from '../lib/translateEntity';
import { useAppState } from '../context/AppStateProvider';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  user?: User | null;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  user,
}) => {
  const { colorScheme } = useColorScheme();
  const { t, i18n } = useTranslation();
  const lang = getLanguageCode(i18n.language);
  const isDark = colorScheme === 'dark';
  const { activeUser } = useAppState();

  const currentUser = user || activeUser;

  const tr = (hi: string, ur: string, en: string) => {
    if (lang === 'hi') return hi;
    if (lang === 'ur') return ur;
    return en;
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!visible || !currentUser) return null;

  const handleSubmit = async () => {
    setErrorMsg('');

    if (currentUser.passwordHash && !currentPassword) {
      setErrorMsg(tr('कृपया वर्तमान पासवर्ड दर्ज करें।', 'براہ کرم موجودہ پاس ورڈ درج کریں۔', 'Please enter current password.'));
      return;
    }

    if (!newPassword) {
      setErrorMsg(tr('कृपया नया पासवर्ड दर्ज करें।', 'براہ کرم نیا پاس ورڈ درج کریں۔', 'Please enter new password.'));
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg(tr('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।', 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔', 'Password must be at least 6 characters.'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(tr('नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।', 'پاس ورڈ مماثل نہیں ہے۔', 'New password and confirmation do not match.'));
      return;
    }

    setSubmitting(true);
    try {
      if (currentUser.passwordHash) {
        const isValid = await verifyPassword(currentPassword, currentUser.passwordHash);
        if (!isValid) {
          setErrorMsg(tr('वर्तमान पासवर्ड गलत है।', 'موجودہ پاس ورڈ غلط ہے۔', 'Current password is incorrect.'));
          setSubmitting(false);
          return;
        }

        if (currentPassword === newPassword) {
          setErrorMsg(tr('नया पासवर्ड वर्तमान से अलग होना चाहिए।', 'نیا پاس ورڈ مختلف ہونا چاہیے۔', 'New password cannot be the same as current password.'));
          setSubmitting(false);
          return;
        }
      }

      await updateUser(currentUser.id, {
        password: newPassword,
      });

      Alert.alert(
        tr('सफलता', 'کامیابی', 'Success'),
        tr('पासवर्ड सफलतापूर्वक बदल दिया गया है!', 'پاس ورڈ کامیابی سے تبدیل کر دیا گیا ہے!', 'Password has been updated successfully!'),
        [
          {
            text: 'OK',
            onPress: () => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      console.error('Mobile change password error:', err);
      setErrorMsg(err?.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.65)' }]}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.iconCircle}>
                <KeyRound color="#10b981" size={18} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {tr('पासवर्ड बदलें', 'پاس ورڈ تبدیل کریں', 'Change Password')}
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                  {currentUser.email || currentUser.phone || currentUser.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={isDark ? '#94a3b8' : '#64748b'} size={18} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.modalBody}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertCircle color="#ef4444" size={14} />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {currentUser.passwordHash && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                  {tr('वर्तमान पासवर्ड *', 'موجودہ پاس ورڈ *', 'Current Password *')}
                </Text>
                <View style={[styles.passwordWrap, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1' }]}>
                  <TextInput
                    style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                    secureTextEntry={!showCurrent}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder={tr('वर्तमान पासवर्ड', 'موجودہ پاس ورڈ', 'Current password')}
                    placeholderTextColor="#94a3b8"
                  />
                  <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                    {showCurrent ? <EyeOff color="#94a3b8" size={16} /> : <Eye color="#94a3b8" size={16} />}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                {tr('नया पासवर्ड *', 'نیا پاس ورڈ *', 'New Password *')}
              </Text>
              <View style={[styles.passwordWrap, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={tr('कम से कम 6 अक्षर', 'کم از کم 6 حروف', 'Min 6 characters')}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff color="#94a3b8" size={16} /> : <Eye color="#94a3b8" size={16} />}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>
                {tr('नए पासवर्ड की पुष्टि करें *', 'نئے پاس ورڈ کی تصدیق کریں *', 'Confirm New Password *')}
              </Text>
              <View style={[styles.passwordWrap, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1' }]}>
                <TextInput
                  style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                  secureTextEntry={!showConfirm}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={tr('नया पासवर्ड पुनः दर्ज करें', 'نیا پاس ورڈ دوبارہ درج کریں', 'Re-enter new password')}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff color="#94a3b8" size={16} /> : <Eye color="#94a3b8" size={16} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={[styles.cancelBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  {tr('रद्द करें', 'منسوخ کریں', 'Cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Lock color="#ffffff" size={14} />
                    <Text style={styles.submitBtnText}>
                      {tr('पासवर्ड अपडेट करें', 'پاس ورڈ اپ ڈیٹ کریں', 'Update')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#10b98120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

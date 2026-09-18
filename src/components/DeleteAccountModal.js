import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DeleteAccountModal = ({ visible, onClose }) => {
  const { colors, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const { logout } = useAuth();

  const [inputVal, setInputVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [agreed, setAgreed] = useState(false);

  const resetState = () => {
    setInputVal('');
    setLoading(false);
    setErrorMessage('');
    setAgreed(false);
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  const isConfirmed = agreed && inputVal.trim().length > 0;

  const handleDelete = async () => {
    if (!isConfirmed || loading) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const trimmed = inputVal.trim();
      await api.delete('/users/me', {
        data: {
          password: trimmed
        }
      });

      setLoading(false);
      resetState();
      onClose();

      Alert.alert(
        t('settings.deleteAccountSuccessTitle', 'Account Deleted'),
        t('settings.deleteAccountSuccessBody', 'Your account and all associated personal data have been permanently erased.'),
        [
          {
            text: 'OK',
            onPress: () => {
              logout();
            }
          }
        ]
      );
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || err.message || t('profile.incorrectPassword', 'Failed to delete account. Please verify your credentials.');
      setErrorMessage(msg);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose} 
        />
        
        <View style={[
          styles.modalCard, 
          { 
            backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
            borderColor: isDarkMode ? '#334155' : '#E2E8F0'
          }
        ]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Warning Icon Badge (Square, no border radius) */}
            <View style={[
              styles.iconBox,
              { 
                backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                borderColor: isDarkMode ? '#7F1D1D' : '#FCA5A5'
              }
            ]}>
              <MaterialCommunityIcons name="alert-octagon-outline" size={32} color="#EF4444" />
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
              {t('settings.deleteAccountConfirmTitle', 'Delete Account Permanently?')}
            </Text>

            {/* Subtitle / Disclosures */}
            <Text style={[styles.description, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
              {t(
                'settings.deleteAccountConfirmBody',
                'Warning: This action is permanent and cannot be undone. All your profile information, job postings, booking history, chat messages, and wallet balance will be permanently erased.'
              )}
            </Text>

            {/* Bullet Disclosures (Square, no border radius) */}
            <View style={[
              styles.bulletCard, 
              { 
                backgroundColor: isDarkMode ? '#0F172A' : '#FEF2F2', 
                borderColor: isDarkMode ? '#7F1D1D' : '#FCA5A5' 
              }
            ]}>
              <View style={styles.bulletRow}>
                <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" />
                <Text style={[styles.bulletText, { color: isDarkMode ? '#FCA5A5' : '#991B1B' }]}>
                  {language === 'fr' ? 'Profil public, notes et avis effacés' : 'Public profile, reviews & ratings erased'}
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" />
                <Text style={[styles.bulletText, { color: isDarkMode ? '#FCA5A5' : '#991B1B' }]}>
                  {language === 'fr' ? 'Historique des missions et des réservations supprimé' : 'All job posts and booking history removed'}
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" />
                <Text style={[styles.bulletText, { color: isDarkMode ? '#FCA5A5' : '#991B1B' }]}>
                  {language === 'fr' ? 'Conversations et messages définitivement détruits' : 'All chat messages and conversations destroyed'}
                </Text>
              </View>
              <View style={styles.bulletRow}>
                <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" />
                <Text style={[styles.bulletText, { color: isDarkMode ? '#FCA5A5' : '#991B1B' }]}>
                  {language === 'fr' ? 'Solde du portefeuille et pièces Fixam perdus' : 'Wallet balance and Fixam coins forfeited'}
                </Text>
              </View>
            </View>

            {/* Checkbox Acknowledgment */}
            <TouchableOpacity 
              style={styles.ackRow} 
              activeOpacity={0.8}
              onPress={() => setAgreed(!agreed)}
            >
              <MaterialCommunityIcons 
                name={agreed ? 'checkbox-marked' : 'checkbox-blank-outline'} 
                size={22} 
                color={agreed ? '#EF4444' : (isDarkMode ? '#64748B' : '#94A3B8')} 
              />
              <Text style={[styles.ackText, { color: isDarkMode ? '#CBD5E1' : '#334155' }]}>
                {language === 'fr' 
                  ? 'Je comprends que cette action est définitive et irréversible.' 
                  : 'I understand that this action is permanent and cannot be recovered.'}
              </Text>
            </TouchableOpacity>

            {/* Input Prompt */}
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#E2E8F0' : '#1E293B' }]}>
              {t('settings.deleteAccountConfirmPrompt', language === 'fr'
                ? 'Entrez votre mot de passe pour confirmer :'
                : 'Enter your password to confirm:')}
            </Text>

            <View style={[
              styles.inputWrap, 
              { 
                backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                borderColor: errorMessage ? '#EF4444' : (isDarkMode ? '#334155' : '#CBD5E1') 
              }
            ]}>
              <TextInput
                style={[styles.input, { color: isDarkMode ? '#FFF' : '#000' }]}
                value={inputVal}
                onChangeText={(text) => {
                  setInputVal(text);
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder={t('settings.enterYourPassword', language === 'fr' ? 'Mot de passe' : 'Enter your password')}
                placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <MaterialCommunityIcons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={isDarkMode ? '#94A3B8' : '#64748B'} 
                />
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorBanner}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Action Buttons - Full width vertical stack, zero border radius */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.deleteBtn,
                  (!isConfirmed || loading) && styles.deleteBtnDisabled
                ]}
                onPress={handleDelete}
                disabled={!isConfirmed || loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.deleteBtnContent}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.deleteBtnText}>
                      {t('settings.confirmDeleteButton', language === 'fr' ? 'Supprimer le compte' : 'Delete Account')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { 
                    backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
                    borderColor: isDarkMode ? '#334155' : '#CBD5E1'
                  }
                ]}
                onPress={handleClose}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelBtnText, { color: isDarkMode ? '#94A3B8' : '#475569' }]}>
                  {t('common.cancel', 'Cancel')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 0,
    borderWidth: 1,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
  },
  scrollContent: {
    padding: 22,
    alignItems: 'center',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
  },
  bulletCard: {
    width: '100%',
    borderRadius: 0,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bulletText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    width: '100%',
    marginBottom: 16,
    paddingVertical: 4,
  },
  ackText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  inputLabel: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 0,
    paddingHorizontal: 14,
    height: 48,
    width: '100%',
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  errorBanner: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    marginTop: 12,
  },
  deleteBtn: {
    width: '100%',
    height: 48,
    borderRadius: 0,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  deleteBtnDisabled: {
    opacity: 0.45,
  },
  deleteBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  cancelBtn: {
    width: '100%',
    height: 46,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DeleteAccountModal;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';

const VerificationRequiredModal = ({ visible, onClose, message, isProvider = false }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation();

  const handleVerify = () => {
    onClose();
    // Navigate using a slight timeout to ensure modal closes before navigation
    setTimeout(() => {
      navigation.navigate('Verification');
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="shield-alert-outline" size={40} color="#EF4444" />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            {t('verification.required')}
          </Text>
          
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message || t('verification.requiredMessage')}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.verifyButton, { backgroundColor: colors.accent }]} 
              onPress={handleVerify}
            >
              <Text style={styles.verifyText}>
                {t('verification.verifyNow')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.cancelButton, { borderColor: colors.border }]} 
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>
                {t('common.cancel', 'Cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 0,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 0,
    backgroundColor: '#F1F5F9',
  },
  verifyButton: {
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
  },
  verifyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default VerificationRequiredModal;

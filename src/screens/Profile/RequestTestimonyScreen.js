import React, { useState, useEffect } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { Alert, ActivityIndicator, StyleSheet, View, Text, TextInput, TouchableOpacity, Modal, FlatList, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const RequestTestimonyScreen = ({ navigation }) => {
  const { isDarkMode, colors } = useTheme();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setFetching(true);
        const response = await api.get('/bookings/mine?role=PROVIDER');
        if (response.data?.success) {
          const list = response.data.data || [];
          const unreviewed = list.filter(booking => {
            if (booking.status !== 'COMPLETED') return false;
            // Filter out bookings where client has already left a review
            const clientReviews = (booking.reviews || []).filter(r => r.reviewerId === booking.clientId);
            return clientReviews.length === 0;
          });
          setBookings(unreviewed);
        }
      } catch (err) {
        console.log('Error fetching bookings:', err);
      } finally {
        setFetching(false);
      }
    };
    fetchBookings();
  }, []);

  const handleSubmit = async () => {
    if (!selectedBooking) {
      Alert.alert(t('common.error', 'Error'), t('profileDetail.selectClient', 'Select Client'));
      return;
    }
    if (!topic.trim()) {
      Alert.alert(t('common.error', 'Error'), t('profileDetail.topic', 'Topic'));
      return;
    }

    try {
      setLoading(true);
      await api.post(`/bookings/${selectedBooking.id}/request-review`, {
        topic: topic.trim(),
        description: description.trim(),
      });

      Alert.alert(
        t('profileDetail.testimonySuccessTitle', 'Request Sent!'),
        t('profileDetail.testimonySuccessBody', 'A review request has been sent to the client.'),
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.log('Error requesting review:', error);
      Alert.alert(t('common.error', 'Error'), error.response?.data?.message || t('errors.apiFallback', 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const selectBookingItem = (item) => {
    setSelectedBooking(item);
    setModalVisible(false);
    if (!topic) {
      setTopic(item.title || '');
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { borderColor: colors.border }]}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('profileDetail.requestTestimonyTitle', 'Request Testimony')}</Text>
          <View style={{ width: 42 }} />
        </View>

        {fetching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {t('profileDetail.requestTestimonyHelp', "Select a client you've worked with and fill in the details to request an endorsement on your profile.")}
            </Text>

            <Text style={[styles.label, { color: colors.text }]}>{t('profileDetail.selectClient', 'Select Client')}</Text>
            <TouchableOpacity 
              style={[styles.dropdown, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={{ color: selectedBooking ? colors.text : colors.placeholder, fontSize: 15, fontWeight: '600', flex: 1 }}>
                {selectedBooking 
                  ? `${selectedBooking.client?.fullName || 'Client'} - ${selectedBooking.title || 'Service'}`
                  : t('profileDetail.selectClient', 'Select Client')
                }
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textSecondary} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: colors.text }]}>{t('profileDetail.topic', 'Topic')}</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              value={topic}
              onChangeText={setTopic}
              placeholder={t('profileDetail.topicPlaceholder', 'e.g., General Feedback, Plumbing Work, etc.')}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t('profileDetail.roleDescription', 'Description')}</Text>
            <TextInput
              style={[styles.textarea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('profileDetail.roleDescription', 'Description')}
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity 
              disabled={loading} 
              onPress={handleSubmit} 
              style={[styles.submitBtn, { backgroundColor: colors.accent, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : (
                <>
                  <Text style={styles.submitText}>{t('profileDetail.sendRequest', 'Send Request')}</Text>
                  <MaterialCommunityIcons name="send" size={18} color="#FFF" />
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profileDetail.selectClient', 'Select Client')}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {bookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={colors.textSecondary} />
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    {t('profileDetail.noEligibleClients', 'No completed clients found without reviews.')}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={bookings}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.bookingItem, { borderBottomColor: colors.border }]}
                      onPress={() => selectBookingItem(item)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.clientName, { color: colors.text }]}>{item.client?.fullName || 'Client'}</Text>
                        <Text style={[styles.bookingTitle, { color: colors.textSecondary }]}>{item.title || 'Service'}</Text>
                        {item.completedAt && (
                          <Text style={[styles.bookingDate, { color: colors.placeholder }]}>
                            {new Date(item.completedAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 42, height: 42, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  content: { padding: 22 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 26 },
  label: { fontSize: 13, fontWeight: '900', marginBottom: 10, textTransform: 'uppercase' },
  dropdown: { height: 56, borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  input: { height: 56, borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, marginBottom: 20, fontWeight: '600' },
  textarea: { minHeight: 140, borderRadius: 8, borderWidth: 1, padding: 16, fontSize: 15, marginBottom: 24, fontWeight: '600' },
  submitBtn: { height: 56, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxHeight: '80%', borderRadius: 16, borderWidth: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 15, textAlign: 'center' },
  bookingItem: { paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  clientName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  bookingTitle: { fontSize: 14, fontWeight: '600' },
  bookingDate: { fontSize: 12, marginTop: 4 }
});

export default RequestTestimonyScreen;

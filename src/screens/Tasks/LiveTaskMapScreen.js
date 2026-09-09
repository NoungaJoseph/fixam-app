import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  Platform, Linking, Dimensions, Animated, Easing, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TealSafeAreaView from '../../components/Common/TealSafeAreaView';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const LiveTaskMapScreen = ({ navigation, route }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const initialTask = route.params?.task || {};
  const [task, setTask] = useState(initialTask);
  const [copied, setCopied] = useState(false);

  // Radar Pulse Animation
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Fetch updated task details to ensure we have latest provider/client info, phone number and coords
  useEffect(() => {
    const taskId = initialTask.id || route.params?.taskId;
    if (!taskId) return;

    const isBooking = Boolean(initialTask.isBooking || initialTask.bookingDate);
    const endpoint = isBooking ? `/bookings/check?id=${taskId}` : `/jobs/${taskId}`;

    api.get(endpoint)
      .then((res) => {
        if (res.data?.data) {
          setTask((prev) => ({ ...prev, ...res.data.data }));
        }
      })
      .catch(() => {});
  }, [initialTask.id, route.params?.taskId]);

  const lat = task.latitude != null ? Number(task.latitude) : null;
  const lng = task.longitude != null ? Number(task.longitude) : null;
  const hasCoords = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  const isProviderViewing = user?.role === 'PROVIDER';


  const openInGoogleMaps = () => {
    if (hasCoords) {
      const q = `${lat},${lng}`;
      const url =
        Platform.OS === 'ios'
          ? `http://maps.apple.com/?ll=${q}&q=${encodeURIComponent(task.location || task.title || 'Task Location')}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
      Linking.openURL(url);
      return;
    }
    const addr = encodeURIComponent(task.location || task.address || task.title || '');
    if (addr) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`);
    } else {
      Alert.alert(t('common.error', 'Error'), t('jobs.locationUnavailable', 'Location details unavailable.'));
    }
  };


  const handleCopyAddress = async () => {
    const addr = task.location || task.address || '';
    if (addr) {
      await Clipboard.setStringAsync(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const pageTitle = isProviderViewing 
    ? t('jobs.trackClient', 'Track Client') 
    : t('jobs.trackProvider', 'Track Provider');

  const taskStatus = String(task.status || 'IN_PROGRESS').toUpperCase();
  const currentStep = taskStatus === 'COMPLETED' ? 3 : taskStatus === 'IN_PROGRESS' ? 2 : 1;

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 0.25, 0],
  });

  return (
    <TealSafeAreaView style={styles.root} edges={['top']}>
      {/* ── Top Header ────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity 
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{pageTitle}</Text>
          <View style={styles.liveTagContainer}>
            <View style={styles.livePillDot} />
            <Text style={styles.liveTagText}>{t('jobs.liveLocationActive', 'Live Location Active')}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.mapActionBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]} 
          onPress={openInGoogleMaps}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="google-maps" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 40, 50) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Visual Radar & Simulated Map Preview ────────────────────── */}
        <View style={[styles.mapCard, { backgroundColor: isDarkMode ? '#0F172A' : '#E6F4F1', borderColor: colors.border }]}>
          {/* Subtle Grid Lines for Map Simulation */}
          <View style={styles.mapGridOverlay}>
            <View style={[styles.gridRoadH, { top: '35%', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
            <View style={[styles.gridRoadH, { top: '65%', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
            <View style={[styles.gridRoadV, { left: '30%', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
            <View style={[styles.gridRoadV, { left: '70%', borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
          </View>

          {/* Radar Waves Animation */}
          <View style={styles.radarContainer}>
            <Animated.View 
              style={[
                styles.radarPulseRing, 
                { 
                  borderColor: colors.accent,
                  transform: [{ scale: pulseScale }],
                  opacity: pulseOpacity,
                }
              ]} 
            />
            <View style={[styles.radarCenterPin, { backgroundColor: colors.accent }]}>
              <MaterialCommunityIcons 
                name={isProviderViewing ? "account-location" : "account-hard-hat"} 
                size={28} 
                color="#FFFFFF" 
              />
            </View>
          </View>

          {/* Floating Status Pill on Map */}
          <View style={[styles.floatingStatusPill, { backgroundColor: isDarkMode ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.95)', borderColor: colors.border }]}>
            <View style={styles.radarLiveDot} />
            <Text style={[styles.floatingStatusText, { color: colors.text }]}>
              {taskStatus === 'COMPLETED' 
                ? t('jobs.serviceCompleted', 'Service Completed') 
                : taskStatus === 'IN_PROGRESS' 
                  ? t('jobs.inProgress', 'Work In Progress') 
                  : t('jobs.enRoute', 'En Route to Destination')}
            </Text>
          </View>

          {/* Coordinates or GPS Chip */}
          <View style={styles.gpsChip}>
            <MaterialCommunityIcons name="crosshairs-gps" size={12} color="#0D9488" />
            <Text style={styles.gpsChipText}>
              {hasCoords ? `${lat.toFixed(4)}°, ${lng.toFixed(4)}°` : t('jobs.gpsGeocoded', 'GPS Coordinates Linked')}
            </Text>
          </View>
        </View>


        {/* ── Destination / Service Location Card ───────────────────── */}
        <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.locIconWrap, { backgroundColor: colors.accent + '20' }]}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.locSectionTitle, { color: colors.text }]}>
                {t('jobs.serviceLocation', 'Destination Location')}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.copyBtn, { borderColor: colors.border }]}
              onPress={handleCopyAddress}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={copied ? "check" : "content-copy"} 
                size={14} 
                color={copied ? '#10B981' : colors.textSecondary} 
              />
              <Text style={[styles.copyBtnText, { color: copied ? '#10B981' : colors.textSecondary }]}>
                {copied ? t('common.copied', 'Copied') : t('jobs.copyAddress', 'Copy')}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.taskTitleText, { color: colors.text }]}>
            {task.title || t('jobs.taskDetails', 'Scheduled Service')}
          </Text>

          <Text style={[styles.taskAddressText, { color: colors.textSecondary }]}>
            {task.location || task.address || t('jobs.locationShared', 'Location confirmed with client.')}
          </Text>
        </View>

        {/* ── Live Service Progress Timeline ────────────────────────── */}
        <View style={[styles.timelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.timelineTitle, { color: colors.text }]}>
            {t('jobs.serviceProgress', 'Service Progress')}
          </Text>

          <View style={styles.stepsContainer}>
            {/* Step 1: Confirmed */}
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: '#10B981' }]}>
                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepName, { color: colors.text }]}>{t('jobs.stepConfirmed', 'Task Accepted')}</Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{t('jobs.stepConfirmedSub', 'Provider assigned to task')}</Text>
              </View>
            </View>

            <View style={[styles.stepDivider, { backgroundColor: currentStep >= 2 ? '#10B981' : colors.border }]} />

            {/* Step 2: En Route */}
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: currentStep >= 2 ? colors.accent : colors.border }]}>
                {currentStep >= 2 ? (
                  <MaterialCommunityIcons name="navigation" size={14} color="#FFF" />
                ) : (
                  <View style={[styles.dotInner, { backgroundColor: colors.placeholder }]} />
                )}
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepName, { color: colors.text }]}>{t('jobs.enRoute', 'En Route')}</Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{t('jobs.stepEnRouteSub', 'Heading towards task location')}</Text>
              </View>
            </View>

            <View style={[styles.stepDivider, { backgroundColor: currentStep >= 3 ? '#10B981' : colors.border }]} />

            {/* Step 3: Arrived / Work Done */}
            <View style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: currentStep >= 3 ? '#10B981' : colors.border }]}>
                {currentStep >= 3 ? (
                  <MaterialCommunityIcons name="check" size={14} color="#FFF" />
                ) : (
                  <View style={[styles.dotInner, { backgroundColor: colors.placeholder }]} />
                )}
              </View>
              <View style={styles.stepInfo}>
                <Text style={[styles.stepName, { color: colors.text }]}>{t('jobs.arrivedAtSite', 'Arrived at Destination')}</Text>
                <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>{t('jobs.stepArrivedSub', 'On-site service execution')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Primary Action: Open in External Maps ──────────────────── */}
        <TouchableOpacity 
          style={[styles.primaryNavBtn, { backgroundColor: colors.accent }]}
          onPress={openInGoogleMaps}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="navigation-variant" size={22} color="#FFFFFF" />
          <Text style={styles.primaryNavBtnText}>
            {Platform.OS === 'ios' ? t('jobs.openInAppleMaps', 'Open in Apple Maps') : t('jobs.openInMaps', 'Open in Google Maps')}
          </Text>
        </TouchableOpacity>

        {/* ── Safety Assurance Footer ───────────────────────────────── */}
        <View style={[styles.safetyBanner, { backgroundColor: isDarkMode ? 'rgba(13,148,136,0.08)' : '#F0FDFA', borderColor: colors.accent + '30' }]}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.accent} style={{ marginTop: 2 }} />
          <Text style={[styles.safetyBannerText, { color: colors.textSecondary }]}>
            {t('jobs.safetyAssurance', 'Fixam Live Protection: Real-time coordination and dedicated support for your service peace of mind.')}
          </Text>
        </View>
      </ScrollView>
    </TealSafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },
  liveTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  livePillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mapActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  mapCard: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  mapGridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridRoadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
  },
  gridRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  radarContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarPulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
  },
  radarCenterPin: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  floatingStatusPill: {
    position: 'absolute',
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    elevation: 3,
  },
  radarLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  floatingStatusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  gpsChip: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13,148,136,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  gpsChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#0D9488',
    letterSpacing: 0.3,
  },
  contactCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '900',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  contactRoleSub: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 3,
  },
  jobsDoneText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  contactQuickBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  contactQuickBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  locationCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 16,
  },
  locIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskTitleText: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 4,
  },
  taskAddressText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  timelineCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 18,
    marginBottom: 20,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  stepsContainer: {
    paddingLeft: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepInfo: {
    flex: 1,
  },
  stepName: {
    fontSize: 14,
    fontWeight: '800',
  },
  stepDesc: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  stepDivider: {
    width: 2,
    height: 22,
    marginLeft: 12,
    marginVertical: 4,
  },
  primaryNavBtn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#0D9488',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 16,
  },
  primaryNavBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  safetyBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
});

export default LiveTaskMapScreen;

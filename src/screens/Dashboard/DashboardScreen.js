import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, StatusBar, TextInput, ActivityIndicator, Alert, Modal, Platform, Share, ActionSheetIOS } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import i18n from '../../i18n';
import UserAvatar from '../../components/UserAvatar';

const DashboardScreen = ({ navigation }) => {
  const { user, updateProfile, uploadFile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [, forceUpdate] = useState(0);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSkillPicker, setShowSkillPicker] = useState(false);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.providerProfile?.bio || '',
    skills: user?.providerProfile?.skills || [],
    rate: user?.providerProfile?.rate?.toString() || '',
    serviceArea: user?.providerProfile?.serviceArea || '',
    experienceLevel: user?.providerProfile?.experienceLevel || '',
    portfolioTitle: user?.providerProfile?.portfolio?.[0]?.title || '',
    portfolioDescription: user?.providerProfile?.portfolio?.[0]?.description || '',
    portfolioImageUrl: user?.providerProfile?.portfolio?.[0]?.imageUrl || '',
    certificateTitle: user?.providerProfile?.certificates?.[0]?.title || '',
    certificateIssuer: user?.providerProfile?.certificates?.[0]?.issuer || '',
    certificateYear: user?.providerProfile?.certificates?.[0]?.year || '',
    certificateImageUrl: user?.providerProfile?.certificates?.[0]?.imageUrl || '',
    dob: user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
    password: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.providerProfile?.bio || '',
        skills: user.providerProfile?.skills || [],
        rate: user.providerProfile?.rate?.toString() || '',
        serviceArea: user.providerProfile?.serviceArea || '',
        experienceLevel: user.providerProfile?.experienceLevel || '',
        portfolioTitle: user.providerProfile?.portfolio?.[0]?.title || '',
        portfolioDescription: user.providerProfile?.portfolio?.[0]?.description || '',
        portfolioImageUrl: user.providerProfile?.portfolio?.[0]?.imageUrl || '',
        certificateTitle: user.providerProfile?.certificates?.[0]?.title || '',
        certificateIssuer: user.providerProfile?.certificates?.[0]?.issuer || '',
        certificateYear: user.providerProfile?.certificates?.[0]?.year || '',
        certificateImageUrl: user.providerProfile?.certificates?.[0]?.imageUrl || '',
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : '',
        password: '',
      });
    }
  }, [user]);

  useEffect(() => {
    const handler = () => forceUpdate((value) => value + 1);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [1, 1],
        quality: 0.6,
      });

      if (!result.canceled) {
        uploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert(t('profileDetail.permissionError'), t('profileDetail.galleryPermission'));
    }
  };

  const uploadAvatar = async (uri) => {
    setLoading(true);
    try {
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1].toLowerCase() : 'jpg';
      const type = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type,
      });
      formData.append('type', 'avatar');

      const res = await uploadFile(formData, '/upload/profile');
      await updateProfile({ avatar: res.url });
      Alert.alert(t('common.success'), t('profileDetail.pictureUpdated'));
    } catch (error) {
      console.log('Upload error:', error);
      Alert.alert(t('profileDetail.uploadFailed'), t('profileDetail.imageUploadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (form.fullName !== user.fullName || form.password) {
      const msg = [];
      if (form.fullName !== user.fullName) msg.push(t('profileDetail.nameField'));
      if (form.password) msg.push(t('profileDetail.passwordField'));

      const confirm = await new Promise(resolve => {
        Alert.alert(
          t('profileDetail.profileChange'),
          t('profileDetail.profileChangeBody', { fields: msg.join(` ${t('common.and') || 'and'} `) }),
          [
            { text: t('common.cancel'), onPress: () => resolve(false), style: "cancel" },
            { text: t('common.continue'), onPress: () => resolve(true) }
          ]
        );
      });
      if (!confirm) return;
    }

    setLoading(true);
    try {
      const updates = {
        fullName: form.fullName,
        email: form.email,
        bio: form.bio,
        skills: form.skills,
        rate: parseFloat(form.rate) || 0,
        serviceArea: form.serviceArea,
        experienceLevel: form.experienceLevel,
        portfolio: form.portfolioTitle || form.portfolioDescription || form.portfolioImageUrl ? [{
          title: form.portfolioTitle,
          description: form.portfolioDescription,
          imageUrl: form.portfolioImageUrl
        }] : [],
        certificates: form.certificateTitle || form.certificateIssuer || form.certificateImageUrl ? [{
          title: form.certificateTitle,
          issuer: form.certificateIssuer,
          year: form.certificateYear,
          imageUrl: form.certificateImageUrl
        }] : [],
        dob: form.dob
      };
      if (form.password) updates.password = form.password;

      await updateProfile(updates);
      setEditing(false);
      Alert.alert(t('common.success'), t('profileDetail.profileUpdated'));
    } catch (error) {
      Alert.alert(t('common.error'), error.response?.data?.message || t('profileDetail.profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const isProviderMode = user?.providerProfile?.profileMode === 'WORK';

  const switchToProvider = () => {
    Alert.alert(
      t('profileDetail.becomeProvider'),
      t('profileDetail.becomeProviderBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profileDetail.switchToProvider'),
          onPress: async () => {
            try {
              await updateProfile({ profileMode: 'WORK' });
              const isProfileIncomplete = !user?.providerProfile?.bio || (user?.providerProfile?.skills || []).length === 0;
              if (isProfileIncomplete) {
                Alert.alert(
                  t('profileDetail.welcomeWorkMode'),
                  t('profileDetail.welcomeWorkModeBody'),
                  [
                    { text: t('common.later') },
                    { text: t('profileDetail.completeProfile'), onPress: () => navigation.navigate('ProviderProfileSectionEdit', { section: 'about' }) }
                  ]
                );
              } else {
                Alert.alert(t('common.done'), t('profileDetail.providerModeDone'));
              }
            } catch (error) {
              Alert.alert(t('profileDetail.couldNotSwitch'), error.response?.data?.message || t('common.tryAgain'));
            }
          }
        }
      ]
    );
  };

  const switchToClient = () => {
    Alert.alert(
      t('profileDetail.switchToClientMode'),
      t('profileDetail.switchToClientBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profileDetail.switchToClient'),
          onPress: async () => {
            try {
              await updateProfile({ profileMode: 'PERSONAL' });
              Alert.alert(t('common.done'), t('profileDetail.clientModeDone'));
            } catch (error) {
              Alert.alert(t('profileDetail.couldNotSwitch'), error.response?.data?.message || t('common.tryAgain'));
            }
          }
        }
      ]
    );
  };

  const toggleSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const inputStyle = { backgroundColor: colors.card, borderColor: colors.border, color: colors.text };



  if (isProviderMode && !editing) {
    const portfolio = user.providerProfile?.portfolio || [];
    const certificates = user.providerProfile?.certificates || [];
    const skills = user.providerProfile?.skills || [];
    const rate = user.providerProfile?.rate ? `${Number(user.providerProfile.rate).toLocaleString()} XAF/hr` : t('profileDetail.rateNotSet');
    const employmentHistory = user.providerProfile?.employmentHistory || [];

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={[styles.freelancerHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.freelancerHeaderTitle, { color: colors.text }]}>{t('profileDetail.professionalDashboard')}</Text>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: colors.accent + '15', borderRadius: 21 }]}
            onPress={switchToClient}
          >
            <MaterialCommunityIcons name="account-convert" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.freelancerScroll}>
          <View style={[styles.integrationPanel, { backgroundColor: isDarkMode ? '#2B2B2B' : '#F3F8F2', borderColor: colors.border }]}>
            <TouchableOpacity style={styles.panelClose}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.integrationTitle, { color: colors.text }]}>{t('profileDetail.profileIntegrations')}</Text>
            <Text style={[styles.integrationBody, { color: colors.textSecondary }]}>
              {t('profileDetail.profileIntegrationsBody')}
            </Text>
            <TouchableOpacity style={[styles.integrationButton, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]} onPress={() => navigation.navigate('ProviderProfileSectionEdit', { section: 'links' })}>
              <Text style={[styles.integrationButtonText, { color: colors.text }]}>{t('profileDetail.viewLinkedAccounts')}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.identityBlock, { borderBottomColor: colors.border }]}>
            <View style={styles.profilePhotoWrap}>
              <UserAvatar uri={user?.avatar} name={user?.fullName} size={94} style={styles.profilePhoto} />
              <View style={styles.onlineDot} />
              <TouchableOpacity style={[styles.photoEdit, { backgroundColor: colors.background, borderColor: colors.accent }]} onPress={handleImagePick}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameLine}>
                <Text style={[styles.freelancerName, { color: colors.text }]}>{user?.fullName || t('settings.yourName')}</Text>
              </View>
              <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{user.providerProfile?.serviceArea || t('profileDetail.serviceAreaNotSet')}</Text>
              <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{t('profileDetail.localTimeAvailable')}</Text>
            </View>
            <TouchableOpacity onPress={async () => {
              try {
                const url = `https://fixam.app/profile/${user?.id}`;
                await Share.share({
                  title: 'My Fixam profile',
                  message: `View my Fixam profile: ${url}`,
                  ...(Platform.OS === 'ios' ? { url } : {}),
                });
              } catch (e) {
                /* dismissed */
              }
            }}>
              <MaterialCommunityIcons name="share-variant-outline" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ProfileModeDropdown colors={colors} user={user} isProviderMode={isProviderMode} switchToClient={switchToClient} switchToProvider={switchToProvider} navigation={navigation} />

          <Section colors={colors} title={form.experienceLevel || t('profileDetail.professionalProfile')} actionIcon="pencil-outline" onAction={() => navigation.navigate('ProviderProfileSectionEdit', { section: 'about' })}>
            <Text style={[styles.rateText, { color: colors.text }]}>{rate}</Text>
            <Text style={[styles.bioText, { color: colors.text }]} numberOfLines={6}>
              {user.providerProfile?.bio || t('profileDetail.bioPrompt')}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('ProviderProfileSectionEdit', { section: 'about' })}>
              <Text style={[styles.moreText, { color: colors.accent }]}>{t('home.more')}</Text>
            </TouchableOpacity>
          </Section>

          <Section colors={colors} title={t('profileDetail.portfolio')} actionIcon="plus-circle-outline" onAction={() => navigation.navigate('ProviderProfileEditItem', { type: 'project' })}>
            {portfolio.length === 0 ? (
              <EmptyProfileBlock icon="image-plus" title={t('profileDetail.showcaseWork')} action={t('profileDetail.addProject')} colors={colors} onActionPress={() => navigation.navigate('ProviderProfileEditItem', { type: 'project' })} />
            ) : (
              <View style={styles.portfolioGrid}>
                {portfolio.map((item, index) => (
                  <View key={`${item.title}-${index}`} style={styles.portfolioItem}>
                    {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.portfolioPreview} /> : <View style={[styles.portfolioPreview, { backgroundColor: colors.border }]} />}
                    <Text style={[styles.portfolioItemTitle, { color: colors.accent }]}>{item.title || t('profileDetail.project')}</Text>
                  </View>
                ))}
              </View>
            )}
          </Section>

          <Section colors={colors} title={t('profileDetail.workHistory')}>
            <Text style={[styles.mutedLarge, { color: colors.textSecondary }]}>{t('profileDetail.noItems')}</Text>
          </Section>

          <Section colors={colors} title={t('profileDetail.skills')} actionIcon="pencil-outline" onAction={() => navigation.navigate('ProviderProfileSectionEdit', { section: 'skills' })}>
            <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{t('profileDetail.selfReported')}</Text>
            <View style={styles.profileChips}>
              {skills.length === 0 ? (
                <Text style={[styles.mutedLarge, { color: colors.textSecondary }]}>{t('profileDetail.noSkillsAdded')}</Text>
              ) : skills.map(skill => (
                <View key={skill} style={[styles.profileChip, { backgroundColor: isDarkMode ? '#303030' : '#EEF2F7' }]}>
                  <Text style={[styles.profileChipText, { color: colors.text }]}>{skill}</Text>
                </View>
              ))}
            </View>
          </Section>

          <Section colors={colors} title={t('profileDetail.certifications')} actionIcon="plus-circle-outline" onAction={() => navigation.navigate('ProviderProfileEditItem', { type: 'certificate' })}>
            {certificates.length === 0 ? (
              <EmptyProfileBlock icon="trophy-outline" title={t('profileDetail.certificationsHelp')} action={t('profileDetail.addCertification')} colors={colors} onActionPress={() => navigation.navigate('ProviderProfileEditItem', { type: 'certificate' })} />
            ) : certificates.map((cert, index) => (
              <View key={`${cert.title}-${index}`} style={styles.profileLineItem}>
                <Text style={[styles.lineItemTitle, { color: colors.text }]}>{cert.title || t('profileDetail.certificate')}</Text>
                <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{cert.issuer || t('profileDetail.issuer')}{cert.year ? ` | ${cert.year}` : ''}</Text>
              </View>
            ))}
          </Section>

          <Section colors={colors} title={t('profileDetail.employmentHistory')} actionIcon="plus-circle-outline" onAction={() => navigation.navigate('ProviderProfileEditItem', { type: 'employment' })}>
            {employmentHistory.length === 0 ? (
              <>
                <Text style={[styles.lineItemTitle, { color: colors.text }]}>{t('profileDetail.addPastWork')}</Text>
                <Text style={[styles.bioText, { color: colors.textSecondary }]}>{t('profileDetail.describeWork')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ProviderProfileEditItem', { type: 'employment' })}>
                  <Text style={[styles.moreText, { color: colors.accent }]}>{t('profileDetail.addEmployment')}</Text>
                </TouchableOpacity>
              </>
            ) : employmentHistory.map((item, index) => (
              <View key={`${item.title}-${index}`} style={styles.profileLineItem}>
                <Text style={[styles.lineItemTitle, { color: colors.text }]}>{item.title || t('profileDetail.employment')}</Text>
                <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{item.company || t('profileDetail.company')}{item.period ? ` | ${item.period}` : ''}</Text>
                {item.description ? <Text style={[styles.bioText, { color: colors.textSecondary }]}>{item.description}</Text> : null}
              </View>
            ))}
          </Section>

          <Section colors={colors} title={t('profileDetail.testimonials')} actionIcon="plus-circle-outline" onAction={() => navigation.navigate('Feedback', { testimonialPreset: true })}>
            <EmptyProfileBlock icon="comment-quote-outline" title={t('profileDetail.endorsements')} action={t('profileDetail.requestTestimonial')} colors={colors} onActionPress={() => navigation.navigate('Feedback', { testimonialPreset: true })} />
          </Section>

          <Section colors={colors} title={t('profileDetail.linkedAccounts')} actionIcon="pencil-outline" onAction={() => navigation.navigate('ProviderProfileSectionEdit', { section: 'links' })}>
            {['LinkedIn', 'Facebook', 'Instagram', 'TikTok'].map((name) => (
              <View key={name} style={[styles.socialRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.lineItemTitle, { color: colors.text }]}>{name}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ProviderProfileSectionEdit', { section: 'links' })}>
                  <Text style={[styles.moreText, { color: colors.accent }]}>{user.providerProfile?.socialLinks?.[name.toLowerCase()] ? t('profileDetail.editLink') : t('profileDetail.linkProfile')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Section>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!isProviderMode && !editing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        <View style={[styles.freelancerHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.freelancerHeaderTitle, { color: colors.text }]}>{t('profileDetail.personalProfile')}</Text>
          {user?.role === 'PROVIDER' && (
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.accent + '15', borderRadius: 21 }]}
              onPress={switchToProvider}
            >
              <MaterialCommunityIcons name="account-convert" size={24} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.freelancerScroll}>
          <View style={[styles.identityBlock, { borderBottomColor: colors.border }]}>
            <View style={styles.profilePhotoWrap}>
              <UserAvatar uri={user?.avatar} name={user?.fullName} size={94} style={styles.profilePhoto} />
              <TouchableOpacity style={[styles.photoEdit, { backgroundColor: colors.background, borderColor: colors.accent }]} onPress={handleImagePick}>
                <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameLine}>
                <Text style={[styles.freelancerName, { color: colors.text }]}>{user?.fullName || t('common.client')}</Text>
              </View>
              <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{user?.email || user?.phone || t('profileDetail.contactNotAdded')}</Text>
              <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{t('profileDetail.personalAccount')}</Text>
            </View>
          </View>

          <Section colors={colors} title={t('profileDetail.profileOverview')} actionIcon="pencil-outline" onAction={() => setEditing(true)}>
            <Text style={[styles.bioText, { color: colors.text }]}>
              {user?.bio || t('profileDetail.personalProfileHelp')}
            </Text>
          </Section>

          {user?.role === 'PROVIDER' && (
            <ProfileModeDropdown colors={colors} user={user} isProviderMode={isProviderMode} switchToClient={switchToClient} switchToProvider={switchToProvider} navigation={navigation} defaultMode="PERSONAL" />
          )}

          <Section colors={colors} title={t('profileDetail.trustVerification')}>
            <View style={styles.profileLineItem}>
              <Text style={[styles.lineItemTitle, { color: colors.text }]}>{t('profileDetail.phone')}</Text>
              <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{user?.phone || t('profileDetail.notAdded')}</Text>
            </View>
            <View style={styles.profileLineItem}>
              <Text style={[styles.lineItemTitle, { color: colors.text }]}>{t('profileDetail.email')}</Text>
              <Text style={[styles.profileMeta, { color: colors.textSecondary }]}>{user?.email || t('profileDetail.notAdded')}</Text>
            </View>
          </Section>

          <Section colors={colors} title={t('profileDetail.postedTasks')}>
            <Text style={[styles.mutedLarge, { color: colors.textSecondary }]}>{t('profileDetail.postedTasksHelp')}</Text>
          </Section>

          <Section colors={colors} title={t('profileDetail.reviewsRatings')}>
            <EmptyProfileBlock icon="star-outline" title={t('profileDetail.realReviewsHelp')} action={t('profileDetail.noReviewsYet')} colors={colors} />
          </Section>

          <Section colors={colors} title={t('profileDetail.accountPreferences')}>
            <View style={styles.profileChips}>
              <View style={[styles.profileChip, { backgroundColor: isDarkMode ? '#303030' : '#EEF2F7' }]}>
                <Text style={[styles.profileChipText, { color: colors.text }]}>{t('profileDetail.localProviders')}</Text>
              </View>
              <View style={[styles.profileChip, { backgroundColor: isDarkMode ? '#303030' : '#EEF2F7' }]}>
                <Text style={[styles.profileChipText, { color: colors.text }]}>{t('profileDetail.secureChat')}</Text>
              </View>
              <View style={[styles.profileChip, { backgroundColor: isDarkMode ? '#303030' : '#EEF2F7' }]}>
                <Text style={[styles.profileChipText, { color: colors.text }]}>{t('profileDetail.taskTracking')}</Text>
              </View>
            </View>
          </Section>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.card }]}>
            <UserAvatar uri={user?.avatar} name={user?.fullName} size={94} />
            <TouchableOpacity
              style={[styles.editAvatarBtn, { backgroundColor: colors.accent }]}
              onPress={handleImagePick}
              disabled={loading}
            >
              {loading ? <ActivityIndicator size="small" color="#FFF" /> : <MaterialCommunityIcons name="camera" size={16} color="#FFF" />}
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.pendingName ? t('profileDetail.pendingName', { name: user.pendingName }) : user?.fullName || t('common.user')}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email || user?.phone}</Text>

          <TouchableOpacity
            style={[styles.editProfileBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => editing ? save() : setEditing(true)}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color={colors.text} /> : (
              <Text style={[styles.editProfileText, { color: colors.text }]}>{editing ? t('common.save') : t('profile.editProfile')}</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <ProfileField label={t('profileDetail.fullName')} value={form.fullName} onChangeText={(v) => setForm({ ...form, fullName: v })} editable={editing} style={inputStyle} colors={colors} />
          <ProfileField label={t('profileDetail.email')} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} editable={editing} style={inputStyle} colors={colors} />
          <ProfileField label={t('profileDetail.dateOfBirth')} value={form.dob} onChangeText={(v) => setForm({ ...form, dob: v })} editable={editing} style={inputStyle} colors={colors} placeholder="1995-01-01" />

          {editing && (
            <ProfileField label={t('profileDetail.newPasswordOptional')} value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} editable={editing} style={inputStyle} colors={colors} secureTextEntry />
          )}

          <ProfileField label={t('profileDetail.phone')} value={form.phone} editable={false} style={[inputStyle, { opacity: 0.5 }]} colors={colors} />

          {user?.role === 'PROVIDER' && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('profileDetail.professionalProfile')}</Text>
              <ProfileField label={t('profileDetail.bio')} value={form.bio} onChangeText={(v) => setForm({ ...form, bio: v })} editable={editing} style={inputStyle} colors={colors} multiline />
              <ProfileField label={t('profileDetail.serviceArea')} value={form.serviceArea} onChangeText={(v) => setForm({ ...form, serviceArea: v })} editable={editing} style={inputStyle} colors={colors} placeholder={t('profileDetail.serviceAreaPlaceholder')} />
              <ProfileField label={t('profileDetail.experienceLevel')} value={form.experienceLevel} onChangeText={(v) => setForm({ ...form, experienceLevel: v })} editable={editing} style={inputStyle} colors={colors} placeholder={t('profileDetail.experienceLevelPlaceholder')} />

              <View style={styles.fieldWrap}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('profileDetail.skills')}</Text>
                <View style={styles.skillsContainer}>
                  {form.skills.map(skill => (
                    <View key={skill} style={[styles.skillChip, { backgroundColor: colors.accent }]}>
                      <Text style={styles.skillChipText}>{skill}</Text>
                      {editing && (
                        <TouchableOpacity onPress={() => toggleSkill(skill)}>
                          <MaterialCommunityIcons name="close-circle" size={16} color="#FFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                  {editing && (
                    <TouchableOpacity
                      style={[styles.addSkillBtn, { borderColor: colors.accent }]}
                      onPress={() => setShowSkillPicker(true)}
                    >
                      <MaterialCommunityIcons name="plus" size={18} color={colors.accent} />
                      <Text style={{ color: colors.accent, fontWeight: '700' }}>{t('profileDetail.addSkill')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <ProfileField label={t('profileDetail.hourlyRate')} value={form.rate} onChangeText={(v) => setForm({ ...form, rate: v })} editable={editing} style={inputStyle} colors={colors} keyboardType="numeric" />

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('profileDetail.previousWork')}</Text>
              <ProfileField label={t('profileDetail.projectTitle')} value={form.portfolioTitle} onChangeText={(v) => setForm({ ...form, portfolioTitle: v })} editable={editing} style={inputStyle} colors={colors} />
              <ProfileField label={t('profileDetail.projectDescription')} value={form.portfolioDescription} onChangeText={(v) => setForm({ ...form, portfolioDescription: v })} editable={editing} style={inputStyle} colors={colors} multiline />
              <ProfileField label={t('profileDetail.projectImageUrl')} value={form.portfolioImageUrl} onChangeText={(v) => setForm({ ...form, portfolioImageUrl: v })} editable={editing} style={inputStyle} colors={colors} />

              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{t('profileDetail.certificate')}</Text>
              <ProfileField label={t('profileDetail.certificateName')} value={form.certificateTitle} onChangeText={(v) => setForm({ ...form, certificateTitle: v })} editable={editing} style={inputStyle} colors={colors} />
              <ProfileField label={t('profileDetail.issuer')} value={form.certificateIssuer} onChangeText={(v) => setForm({ ...form, certificateIssuer: v })} editable={editing} style={inputStyle} colors={colors} />
              <ProfileField label={t('profileDetail.year')} value={form.certificateYear} onChangeText={(v) => setForm({ ...form, certificateYear: v })} editable={editing} style={inputStyle} colors={colors} keyboardType="numeric" />
              <ProfileField label={t('profileDetail.certificateImageUrl')} value={form.certificateImageUrl} onChangeText={(v) => setForm({ ...form, certificateImageUrl: v })} editable={editing} style={inputStyle} colors={colors} />
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Simple Skill Picker Modal */}
      <Modal visible={showSkillPicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('profileDetail.chooseSkills')}</Text>
              <TouchableOpacity onPress={() => setShowSkillPicker(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {[
                'Plumbing', 'Electrical', 'Carpentry', 'Painting', 'Masonry',
                'AC Repair', 'Cleaning', 'Gardening', 'Tutoring', 'Handyman'
              ].map(skill => {
                const isSelected = form.skills.includes(skill);
                return (
                  <TouchableOpacity
                    key={skill}
                    style={[styles.pickerItem, { backgroundColor: isSelected ? colors.accent : colors.background, borderColor: colors.border }]}
                    onPress={() => toggleSkill(skill)}
                  >
                    <Text style={{ color: isSelected ? '#FFF' : colors.text, fontWeight: '700' }}>{skill}</Text>
                    {isSelected && <MaterialCommunityIcons name="check" size={18} color="#FFF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalDoneBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowSkillPicker(false)}
            >
              <Text style={styles.modalDoneText}>{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ProfileField = ({ label, value, onChangeText, editable, style, colors, multiline, ...props }) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
    <TextInput
      style={[styles.input, multiline && styles.textarea, style, !editable && { opacity: 0.72 }]}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      placeholder={label}
      placeholderTextColor={colors.placeholder}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...props}
    />
  </View>
);

const ProfileModeDropdown = ({ colors, isProviderMode, switchToClient, switchToProvider, navigation }) => {
  const { t } = useLanguage();
  return (
    <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
      <View style={styles.profileSectionHeader}>
        <Text style={[styles.profileSectionTitle, { color: colors.text }]}>{t('profileDetail.accountMode')}</Text>
      </View>

      <TouchableOpacity
        style={[styles.dropdownFake, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={isProviderMode ? switchToClient : switchToProvider}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.modeIconCircle, { backgroundColor: colors.accent + '15' }]}>
            <MaterialCommunityIcons
              name={isProviderMode ? "briefcase" : "account"}
              size={22}
              color={colors.accent}
            />
          </View>
          <View>
            <Text style={[styles.dropdownLabel, { color: colors.text }]}>
              {isProviderMode ? t('profileDetail.providerMode') : t('profileDetail.clientMode')}
            </Text>
            <Text style={[styles.dropdownSubtext, { color: colors.textSecondary }]}>
              {isProviderMode ? t('profileDetail.switchToPersonalBrowsing') : t('profileDetail.switchToWorkProfile')}
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.placeholder} />
      </TouchableOpacity>

      {isProviderMode && (
        <TouchableOpacity onPress={() => navigation.navigate('ProviderProfileSectionEdit', { section: 'mode' })} style={{ marginTop: 15 }}>
          <Text style={[styles.linkMuted, { color: colors.textSecondary }]}>{t('profileDetail.advancedProfileSettings')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const Section = ({ title, children, colors, actionIcon, onAction }) => (
  <View style={[styles.profileSection, { borderBottomColor: colors.border }]}>
    <View style={styles.profileSectionHeader}>
      <Text style={[styles.profileSectionTitle, { color: colors.text }]}>{title}</Text>
      {actionIcon ? (
        <TouchableOpacity style={[styles.roundAction, { borderColor: colors.accent }]} onPress={onAction}>
          <MaterialCommunityIcons name={actionIcon} size={22} color={colors.accent} />
        </TouchableOpacity>
      ) : null}
    </View>
    {children}
  </View>
);

const EmptyProfileBlock = ({ icon, title, action, colors, onActionPress }) => (
  <View style={styles.emptyProfileBlock}>
    <MaterialCommunityIcons name={icon} size={74} color={colors.textSecondary} />
    <Text style={[styles.emptyProfileTitle, { color: colors.text }]}>{title}</Text>
    {onActionPress ? (
      <TouchableOpacity onPress={onActionPress} accessibilityRole="link">
        <Text style={[styles.moreText, { color: colors.text, textDecorationLine: 'underline' }]}>{action}</Text>
      </TouchableOpacity>
    ) : (
      <Text style={[styles.moreText, { color: colors.textSecondary }]}>{action}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  freelancerHeader: {
    minHeight: Platform.OS === 'ios' ? 100 : 76,
    paddingTop: Platform.OS === 'ios' ? 48 : (StatusBar.currentHeight || 0),
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  freelancerHeaderTitle: { fontSize: 18, fontWeight: '900' },
  headerIconBtn: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  clientProfileHeader: {
    minHeight: 92,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 18,
    paddingHorizontal: 22,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  clientProfileHeaderTitle: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  clientEditBtn: {
    minWidth: 86,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  clientEditText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  freelancerScroll: { paddingBottom: 100 },
  integrationPanel: { margin: 22, padding: 22, borderRadius: 8, borderWidth: 1 },
  panelClose: { position: 'absolute', top: 14, right: 14, zIndex: 1 },
  integrationTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900', marginRight: 30, marginBottom: 16 },
  integrationBody: { fontSize: 14, lineHeight: 22, marginBottom: 18 },
  integrationButton: { height: 48, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  integrationButtonText: { fontSize: 15, fontWeight: '900' },
  identityBlock: { flexDirection: 'row', gap: 16, alignItems: 'center', paddingHorizontal: 22, paddingVertical: 22, borderBottomWidth: 1 },
  profilePhotoWrap: { width: 94, height: 94, position: 'relative' },
  profilePhoto: { width: 94, height: 94, borderRadius: 47 },
  onlineDot: { position: 'absolute', left: 5, top: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#12A800', borderWidth: 2, borderColor: '#111' },
  photoEdit: { position: 'absolute', right: -1, bottom: -1, width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freelancerName: { fontSize: 22, fontWeight: '900' },
  profileMeta: { fontSize: 15, lineHeight: 23, fontWeight: '600' },
  profileSection: { paddingHorizontal: 22, paddingVertical: 24, borderBottomWidth: 1 },
  profileSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 18, marginBottom: 16 },
  profileSectionTitle: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  roundAction: { width: 42, height: 42, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  dropdownFake: { minHeight: 70, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modeIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  dropdownLabel: { fontSize: 16, fontWeight: '800' },
  dropdownSubtext: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  dropdownText: { fontSize: 16, fontWeight: '700' },
  profileModeRow: { flexDirection: 'row', gap: 10 },
  modeOption: { flex: 1, minHeight: 48, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  modeText: { fontSize: 14, fontWeight: '900', textAlign: 'center' },
  rateText: { fontSize: 18, fontWeight: '900', marginBottom: 14 },
  bioText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
  moreText: { fontSize: 14, fontWeight: '800', textDecorationLine: 'underline', marginTop: 8 },
  linkMuted: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  portfolioGrid: { flexDirection: 'row', gap: 20 },
  portfolioItem: { flex: 1 },
  portfolioPreview: { width: '100%', aspectRatio: 1.2, borderRadius: 8, marginBottom: 12 },
  portfolioItemTitle: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  mutedLarge: { fontSize: 14, fontWeight: '600' },
  profileChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  profileChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  profileChipText: { fontSize: 14, fontWeight: '800' },
  profileLineItem: { marginBottom: 18 },
  lineItemTitle: { fontSize: 16, lineHeight: 22, fontWeight: '900' },
  emptyProfileBlock: { alignItems: 'center', paddingVertical: 22 },
  emptyProfileTitle: { fontSize: 18, lineHeight: 26, fontWeight: '700', textAlign: 'center', marginTop: 18 },
  linkedAccountBox: { borderRadius: 8, padding: 18 },
  socialRow: { paddingVertical: 14, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scrollContent: { paddingBottom: 100 },
  profileHeader: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, padding: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  avatar: { width: '100%', height: '100%', borderRadius: 50 },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  userName: { fontSize: 20, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  userEmail: { fontSize: 14, marginTop: 4 },
  editProfileBtn: { marginTop: 15, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 18, borderWidth: 1 },
  editProfileText: { fontSize: 13, fontWeight: '900' },
  formSection: { paddingHorizontal: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 24, marginBottom: 12, textTransform: 'uppercase' },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '900', marginBottom: 8, textTransform: 'uppercase' },
  input: { minHeight: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 15, fontSize: 15, fontWeight: '700' },
  textarea: { minHeight: 96, paddingTop: 15 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  skillChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  skillChipText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  addSkillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
  modalContent: { borderRadius: 25, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalScroll: { gap: 10 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 15, borderWidth: 1 },
  modalDoneBtn: { height: 54, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  modalDoneText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default DashboardScreen;

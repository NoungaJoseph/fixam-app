import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { getMediaUrl } from '../services/api';
import UserAvatar from '../components/UserAvatar';

export const CustomHeader = ({ navigation, title, colors }) => {
  const { user } = useAuth();
  const { notificationCount } = useAppContext();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const ROOT_SCREENS = ['Dashboard', 'Home', 'My Wallet', 'My Tasks', 'Coin Balance', 'Messages', 'Settings', 'Invite Friends', 'My Stats', 'Reports'];
  const LOCALIZED_ROOT_SCREENS = [
    t('drawer.home'),
    t('drawer.myWallet'),
    t('drawer.coinBalance'),
    t('drawer.inviteFriends'),
    t('drawer.myStats'),
    t('drawer.reports'),
    t('tabs.home'),
    t('tabs.tasks'),
    t('tabs.messages'),
    t('tabs.settings'),
    t('tabs.dashboard'),
  ];
  const routeName = navigation.getState?.()?.routes?.[navigation.getState?.()?.index || 0]?.name;
  const ROOT_ROUTE_NAMES = ['MainTabs', 'Wallet', 'Invitation', 'Stats', 'Reports', 'Settings', 'Messages'];
  const isRootScreen = ROOT_SCREENS.includes(title) || LOCALIZED_ROOT_SCREENS.includes(title) || ROOT_ROUTE_NAMES.includes(routeName);
  const isHome = title === 'Dashboard' || title === 'Home';

  const displayTitle = isHome
    ? t('headers.welcome', { name: user?.fullName ? user.fullName.split(' ')[0] : t('common.user') })
    : title;

  return (
    <View style={[
      styles.header,
      {
        backgroundColor: colors.background,
        borderBottomColor: isRootScreen ? 'transparent' : colors.border,
        borderBottomWidth: isRootScreen ? 0 : 1,
        paddingTop: insets.top + 8,
        height: insets.top + 64,
      }
    ]}>
      <TouchableOpacity
        onPress={() => isRootScreen ? navigation.openDrawer() : navigation.canGoBack() ? navigation.goBack() : navigation.openDrawer()}
        style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <MaterialCommunityIcons
          name={isRootScreen ? 'menu' : 'arrow-left'}
          size={22}
          color={colors.text}
        />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{displayTitle}</Text>

      <View style={styles.rightSlot}>
        {isHome ? (
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.text} />
            {notificationCount > 0 && (
              <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
    </View>
  );
};

export const CustomDrawerContent = (props) => {
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const avatarUri = getMediaUrl(user?.avatar);
  const isProvider = user?.role?.toUpperCase() === 'PROVIDER' && user?.providerProfile?.profileMode !== 'PERSONAL';

  const handleLogout = () => {
    if (logout) logout();
  };

  // Determine active route
  const activeRouteName = props.state?.routeNames[props.state?.index] || 'MainTabs';
  const menuItems = [
    { route: 'MainTabs', label: t('drawer.home'), icon: 'home-outline', color: '#0D9488' },
    { route: 'Wallet', label: isProvider ? t('drawer.coinBalance') : t('drawer.myWallet'), icon: isProvider ? 'database-outline' : 'wallet-outline', color: '#0D9488' },
    { route: 'Invitation', label: t('drawer.inviteFriends'), icon: 'gift-outline', color: '#6366F1' },
    ...(isProvider ? [
      { route: 'Stats', label: t('drawer.myStats'), icon: 'chart-bar', color: '#2563EB' },
      { route: 'Reports', label: t('drawer.reports'), icon: 'file-chart-outline', color: '#F59E0B' },
    ] : []),
  ];

  const renderMenuItem = (item) => {
    const active = activeRouteName === item.route;
    return (
      <TouchableOpacity
        key={item.route}
        style={[
          styles.customMenuItem,
          active ? [styles.activeCapsule, { backgroundColor: isDarkMode ? 'rgba(20,184,166,0.14)' : '#E6F2F2' }] : null
        ]}
        onPress={() => props.navigation.navigate(item.route)}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={item.icon} size={22} color={active ? (isDarkMode ? '#14B8A6' : '#0D9488') : (isDarkMode ? '#9CA3AF' : item.color)} />
        </View>
        <Text
          style={[
            styles.menuLabelText,
            {
              color: active ? (isDarkMode ? '#F9FAFB' : '#0A5F59') : colors.text,
              fontWeight: active ? '800' : '700'
            }
          ]}
        >
          {item.label}
        </Text>
        {!active && (
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} style={{ marginLeft: 'auto' }} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <DrawerContentScrollView
      {...props}
      scrollEnabled={true}
      style={{ backgroundColor: 'transparent' }}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: 'transparent' }}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: isDarkMode ? '#111827' : '#FFF',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        borderRightWidth: 1.5,
        borderRightColor: 'transparent',
        borderTopWidth: 1.5,
        borderTopColor: 'transparent',
        borderBottomWidth: 1.5,
        borderBottomColor: 'transparent',
        overflow: 'hidden'
      }}>
      {/* Profile Header */}
      <View style={[styles.drawerHeader, { backgroundColor: isDarkMode ? '#111827' : '#FFF', paddingTop: insets.top + 20 }]}>
        <View style={styles.drawerAvatarWrap}>
          <UserAvatar
            uri={avatarUri}
            name={user?.fullName || t('common.user')}
            size={76}
            style={[styles.drawerAvatar, { borderColor: isDarkMode ? '#1F2937' : '#FFF' }]}
          />
          <View style={[styles.drawerOnlineDot, { borderColor: isDarkMode ? '#111827' : '#FFF' }]} />
        </View>
        <Text style={[styles.drawerName, { color: colors.text }]}>{user?.fullName || t('common.user')}</Text>
        <Text style={[styles.drawerEmail, { color: isDarkMode ? '#9CA3AF' : '#64748B' }]}>{user?.email || ''}</Text>
      </View>

      {/* Menu Items */}
      <View style={styles.drawerMenuSection}>
        {menuItems.map(renderMenuItem)}

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1F2937' : '#E2E8F0' }]} />

        {/* Dark Mode Toggle */}
        <View style={styles.darkModeRow}>
          <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#0B1120' : '#ECFDF5' }]}>
            <MaterialCommunityIcons name="weather-night" size={22} color={isDarkMode ? '#14B8A6' : '#0D9488'} />
          </View>
          <Text style={[styles.darkModeText, { color: colors.text }]}>{t('drawer.darkMode')}</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#E2E8F0', true: '#0D9488' }}
            thumbColor="#FFF"
            style={{ transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }] }}
          />
        </View>
      </View>

      {/* Bottom Section */}
      <View style={styles.drawerBottom}>
        {/* Invite & Earn Card */}
        <TouchableOpacity
          style={[styles.inviteCard, { backgroundColor: isDarkMode ? '#0B1120' : '#E6F2F2', borderColor: isDarkMode ? '#1F2937' : '#B2DFDB' }]}
          onPress={() => props.navigation.navigate('Invitation')}
          activeOpacity={0.8}
        >
          {/* Gift Box Icon */}
          <View style={[styles.giftIconContainer, { backgroundColor: isDarkMode ? '#111827' : '#FFF' }]}>
            <MaterialCommunityIcons name="gift" size={28} color={isDarkMode ? '#14B8A6' : '#0D9488'} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.inviteTitle, { color: isDarkMode ? '#F9FAFB' : '#0F172A' }]}>{t('drawer.inviteTitle')}</Text>
            <Text style={[styles.inviteSub, { color: isDarkMode ? '#9CA3AF' : '#64748B' }]}>
              {t('drawer.inviteSubtitle', { amount: 1 })}
            </Text>
          </View>
          <View style={[styles.inviteArrowCircle, { backgroundColor: isDarkMode ? 'rgba(20,184,166,0.16)' : '#99F6E4' }]}>
            <MaterialCommunityIcons name="chevron-right" size={16} color={isDarkMode ? '#14B8A6' : '#0D9488'} />
          </View>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: isDarkMode ? 'rgba(239,68,68,0.12)' : '#FEE2E2' }]} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>{t('drawer.logout')}</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={[styles.footerText, { color: isDarkMode ? '#9CA3AF' : '#64748B' }]}>{t('drawer.version')}</Text>
      </View>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  // Header
  header: {
    minHeight: 64,
    paddingHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, position: 'relative' },
  rightSlot: { width: 40, alignItems: 'flex-end' },
  badge: { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#FFF', paddingHorizontal: 2 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },

  // Drawer Header
  drawerHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  drawerAvatarWrap: { 
    position: 'relative', 
    width: 76, 
    height: 76, 
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  drawerAvatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#FFF' },
  drawerAvatarFallback: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  drawerAvatarInitial: { fontSize: 30, fontWeight: '900' },
  drawerOnlineDot: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    backgroundColor: '#22C55E', 
    borderWidth: 3, 
    borderColor: '#FFF', 
    zIndex: 10 
  },
  drawerName: { fontSize: 20, fontWeight: '800', marginBottom: 2, color: '#0F172A' },
  drawerEmail: { fontSize: 13, fontWeight: '500' },

  // Drawer Menu
  drawerMenuSection: { flex: 1, paddingTop: 8 },
  divider: { height: 1, marginHorizontal: 20, marginVertical: 14 },

  // Custom Menu Row
  customMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 16,
  },
  activeCapsule: {
    backgroundColor: '#E6F2F2',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#FFF',
  },
  inactiveIconContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuLabelText: {
    fontSize: 15,
    marginLeft: 14,
  },

  // Dark Mode Row
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  darkModeText: { fontSize: 15, fontWeight: '700', flex: 1, marginLeft: 14 },

  // Bottom Section
  drawerBottom: { 
    paddingHorizontal: 20, 
    paddingBottom: 24, 
    marginTop: 32 
  },

  // Invite Card
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  giftIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inviteTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  inviteSub: { fontSize: 12, lineHeight: 16 },
  inviteArrowCircle: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#99F6E4', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: 8
  },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontWeight: '800', color: '#EF4444' },

  // Footer
  footerText: { fontSize: 12, textAlign: 'center', fontWeight: '500' },
});

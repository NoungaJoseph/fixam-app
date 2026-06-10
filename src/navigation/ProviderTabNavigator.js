import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAppContext } from '../context/AppContext';
import { CustomDrawerContent } from './NavigationComponents';

import ProviderHomeScreen from '../screens/Provider/ProviderHomeScreen';
import FindJobsScreen from '../screens/Provider/FindJobsScreen';
import TaskDetailsScreen from '../screens/Provider/TaskDetailsScreen';
import TaskDiscoveryScreen from '../screens/Provider/TaskDiscoveryScreen';
import MyJobsScreen from '../screens/Provider/MyJobsScreen';
import CoinSystemScreen from '../screens/Provider/CoinSystemScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import StatsScreen from '../screens/Provider/StatsScreen';
import ReportsScreen from '../screens/Provider/ReportsScreen';
import LiveTaskMapScreen from '../screens/Tasks/LiveTaskMapScreen';
import ReviewTaskScreen from '../screens/Tasks/ReviewTaskScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ProviderProfileEditItemScreen from '../screens/Dashboard/ProviderProfileEditItemScreen';
import ProviderProfileSectionEditScreen from '../screens/Dashboard/ProviderProfileSectionEditScreen';
import SettingsScreen from '../screens/Profile/SettingsScreen';
import NotificationsScreen from '../screens/Profile/NotificationsScreen';
import NotificationDetailScreen from '../screens/Profile/NotificationDetailScreen';
import NotificationSettingsScreen from '../screens/Profile/NotificationSettingsScreen';
import PrivacySecurityScreen from '../screens/Profile/PrivacySecurityScreen';
import ProfileLanguageScreen from '../screens/Profile/ProfileLanguageScreen';
import FeedbackScreen from '../screens/Profile/FeedbackScreen';
import VerificationScreen from '../screens/Profile/VerificationScreen';
import DocUploadScreen from '../screens/Profile/DocUploadScreen';
import SelfieScreen from '../screens/Profile/SelfieScreen';
import VerificationSuccessScreen from '../screens/Profile/VerificationSuccessScreen';
import HiddenProfileScreen from '../screens/Profile/HiddenProfileScreen';
import ChangePasswordScreen from '../screens/Profile/ChangePasswordScreen';
import HelpCenterScreen from '../screens/Profile/HelpCenterScreen';
import InvitationScreen from '../screens/Profile/InvitationScreen';

import TopUpScreen from '../screens/Wallet/TopUpScreen';
import TopUpAmountScreen from '../screens/Wallet/TopUpAmountScreen';
import TopUpPaymentScreen from '../screens/Wallet/TopUpPaymentScreen';
import TopUpSuccessScreen from '../screens/Wallet/TopUpSuccessScreen';
import CoinPaymentFormScreen from '../screens/Wallet/CoinPaymentFormScreen';
import CoinPaymentSuccessScreen from '../screens/Wallet/CoinPaymentSuccessScreen';
import CoinPaymentFailedScreen from '../screens/Wallet/CoinPaymentFailedScreen';
import BookingFormScreen from '../screens/Bookings/BookingFormScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={ProviderHomeScreen} />
  </Stack.Navigator>
);

const FindJobsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="FindJobs" component={FindJobsScreen} />
  </Stack.Navigator>
);

const JobsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyJobsMain" component={MyJobsScreen} />
  </Stack.Navigator>
);

const WalletStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CoinSystem" component={CoinSystemScreen} />
    <Stack.Screen name="TopUp" component={TopUpScreen} />
    <Stack.Screen name="TopUpAmount" component={TopUpAmountScreen} />
    <Stack.Screen name="TopUpPayment" component={TopUpPaymentScreen} />
    <Stack.Screen name="TopUpSuccess" component={TopUpSuccessScreen} />
    <Stack.Screen name="CoinPaymentForm" component={CoinPaymentFormScreen} />
    <Stack.Screen name="CoinPaymentSuccess" component={CoinPaymentSuccessScreen} />
    <Stack.Screen name="CoinPaymentFailed" component={CoinPaymentFailedScreen} />
  </Stack.Navigator>
);

const StatsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StatsMain" component={StatsScreen} />
  </Stack.Navigator>
);

const MessagesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatList" component={ChatListScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
  </Stack.Navigator>
);

const HIDE_TAB_ROUTES = [
  'Chat',
  'DocUpload',
  'Selfie',
  'VerificationSuccess',
  'TaskDetails',
  'LiveTaskMap',
  'BookingForm',
  'FindJobs',
  'Notifications',
  'NotificationDetail',
  'NotificationSettings',
  'HelpCenter',
  'UserProfile',
  'ProviderProfileEditItem',
  'ProviderProfileSectionEdit',
  'PrivacySecurity',
  'LanguageSelection',
  'Feedback',
  'Verification',
  'HiddenProfile',
  'ChangePassword',

  'TopUp',
  'TopUpAmount',
  'TopUpPayment',
  'TopUpSuccess',
  'CoinPaymentForm',
  'CoinPaymentSuccess',
  'CoinPaymentFailed',
  'ReviewTask',
];

const BottomTabNavigator = () => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const { unreadCount } = useAppContext();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeName = getFocusedRouteNameFromRoute(route) ?? route.name;
        const hideTabBar = HIDE_TAB_ROUTES.includes(routeName);
        return {
          headerShown: false,
          tabBarActiveTintColor: '#0D9488',
          tabBarInactiveTintColor: isDarkMode ? '#64748B' : '#94A3B8',
          tabBarStyle: {
            display: hideTabBar ? 'none' : 'flex',
            height: (Platform.OS === 'ios' ? 90 : 76) + insets.bottom,
            paddingBottom: (Platform.OS === 'ios' ? 30 : 12) + insets.bottom,
            paddingTop: 8,
            backgroundColor: colors.tabBar,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderWidth: 0,
            borderTopWidth: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 10,
            elevation: 16,
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: '800', marginTop: 2 },
        };
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="My Jobs"
        component={JobsStack}
        options={{
          title: t('tabs.myJobs'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={22} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Find Jobs"
        component={FindJobsStack}
        options={{
          title: t('tabs.findJobs'),
          tabBarIcon: ({ focused }) => (
            <View style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: '#0D9488',
              borderWidth: 3,
              borderColor: isDarkMode ? '#0B1120' : '#FFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -22,
              shadowColor: '#0D9488',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 8,
              transform: [{ scale: focused ? 1.05 : 1 }],
            }}>
              <Ionicons name="search" size={22} color="#FFF" />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          title: t('tabs.messages'),
          tabBarBadge: unreadCount > 0
            ? (unreadCount > 99 ? '99+' : unreadCount)
            : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: 'white',
            fontSize: 10,
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={22} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Settings"
        component={ProfileStack}
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={22} color={color} />
          )
        }}
      />
    </Tab.Navigator>
  );
};

const ProviderTabNavigator = () => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveBackgroundColor: isDarkMode ? '#134E4A' : '#ECFDF5',
        drawerActiveTintColor: '#0D9488',
        drawerInactiveTintColor: colors.text,
        drawerLabelStyle: { fontSize: 15, fontWeight: '700', marginLeft: -6 },
        drawerItemStyle: { borderRadius: 14, marginHorizontal: 8, paddingVertical: 2 },
        drawerStyle: { 
          width: '78%', 
          backgroundColor: isDarkMode ? '#111827' : '#FFFFFF',
          elevation: 18,
          shadowColor: '#000',
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.12,
          shadowRadius: 18,
        },
        drawerContentStyle: { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' },
        overlayColor: 'rgba(255, 255, 255, 0.10)',
        sceneContainerStyle: { backgroundColor: isDarkMode ? '#0B1120' : '#FFF' },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{
          drawerLabel: t('drawer.home'),
          drawerIcon: ({ color }) => <MaterialCommunityIcons name="home-variant-outline" size={24} color={color} />
        }}
      />

      {/* Hidden Global Detail Screens */}
      <Drawer.Screen name="TaskDiscovery" component={TaskDiscoveryScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="UserProfile" component={DashboardScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ProviderProfileEditItem" component={ProviderProfileEditItemScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ProviderProfileSectionEdit" component={ProviderProfileSectionEditScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="PrivacySecurity" component={PrivacySecurityScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="LanguageSelection" component={ProfileLanguageScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Feedback" component={FeedbackScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Verification" component={VerificationScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="DocUpload" component={DocUploadScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Selfie" component={SelfieScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="VerificationSuccess" component={VerificationSuccessScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="HiddenProfile" component={HiddenProfileScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="HelpCenter" component={HelpCenterScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="NotificationDetail" component={NotificationDetailScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="TaskDetails" component={TaskDetailsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="LiveTaskMap" component={LiveTaskMapScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="BookingForm" component={BookingFormScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Chat" component={ChatScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ReviewTask" component={ReviewTaskScreen} options={{ drawerItemStyle: { display: 'none' } }} />

      <Drawer.Screen
        name="Wallet"
        component={WalletStack}
        options={{
          drawerLabel: t('drawer.coinBalance'),
          drawerIcon: ({ color }) => <MaterialCommunityIcons name="database-outline" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Invitation"
        component={InvitationScreen}
        options={{
          drawerLabel: t('drawer.inviteFriends'),
          drawerIcon: ({ color }) => <MaterialCommunityIcons name="gift-outline" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          drawerLabel: t('drawer.myStats'),
          drawerIcon: ({ color }) => <MaterialCommunityIcons name="chart-bar" size={24} color={color} />,
        }}
      />
      <Drawer.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          drawerLabel: t('drawer.reports'),
          drawerIcon: ({ color }) => <MaterialCommunityIcons name="file-chart-outline" size={24} color={color} />,
        }}
      />
    </Drawer.Navigator>
  );
};

export default ProviderTabNavigator;

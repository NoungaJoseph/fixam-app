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

import HomeScreen from '../screens/Home/HomeScreen';
import ProviderListScreen from '../screens/Providers/ProviderListScreen';
import ProviderProfileScreen from '../screens/Providers/ProviderProfileScreen';
import FavoriteProvidersScreen from '../screens/Providers/FavoriteProvidersScreen';
import PopularServicesScreen from '../screens/Providers/PopularServicesScreen';
import PostTaskScreen from '../screens/Tasks/PostTaskScreen';
import TaskSuccessScreen from '../screens/Tasks/TaskSuccessScreen';
import JobStatusScreen from '../screens/Tasks/JobStatusScreen';
import LiveTaskMapScreen from '../screens/Tasks/LiveTaskMapScreen';
import ChatScreen from '../screens/Chat/ChatScreen';
import ChatListScreen from '../screens/Chat/ChatListScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import ProviderProfileEditItemScreen from '../screens/Dashboard/ProviderProfileEditItemScreen';
import ProviderProfileSectionEditScreen from '../screens/Dashboard/ProviderProfileSectionEditScreen';
import WalletScreen from '../screens/Wallet/WalletScreen';
import RatingScreen from '../screens/Profile/RatingScreen';
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
    <Stack.Screen name="HomeMain" component={HomeScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SettingsMain" component={SettingsScreen} />
  </Stack.Navigator>
);

const WalletStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WalletMain" component={TopUpScreen} />
    <Stack.Screen name="TopUp" component={TopUpScreen} />
    <Stack.Screen name="TopUpAmount" component={TopUpAmountScreen} />
    <Stack.Screen name="TopUpPayment" component={TopUpPaymentScreen} />
    <Stack.Screen name="TopUpSuccess" component={TopUpSuccessScreen} />
    <Stack.Screen name="CoinPaymentForm" component={CoinPaymentFormScreen} />
    <Stack.Screen name="CoinPaymentSuccess" component={CoinPaymentSuccessScreen} />
    <Stack.Screen name="CoinPaymentFailed" component={CoinPaymentFailedScreen} />
  </Stack.Navigator>
);

import MyTasksListScreen from '../screens/Tasks/MyTasksListScreen';

const TaskStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyTasksMain" component={MyTasksListScreen} />
    <Stack.Screen name="PostTask" component={PostTaskScreen} initialParams={{ startOnPost: true }} />
  </Stack.Navigator>
);

const MessagesStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatList" component={ChatListScreen} />
  </Stack.Navigator>
);

const HIDE_TAB_ROUTES = [
  'Chat',
  'DocUpload',
  'Selfie',
  'VerificationSuccess',
  'ProviderList',
  'PopularServices',
  'ProviderProfile',
  'TaskDetails',
  'BookingForm',
  'Rating',
  'TopUp',
  'TopUpAmount',
  'TopUpPayment',
  'TopUpSuccess',
  'CoinPaymentForm',
  'CoinPaymentSuccess',
  'CoinPaymentFailed',
  'HelpCenter',
  'UserProfile',
  'ProviderProfileEditItem',
  'ProviderProfileSectionEdit',
  'Notifications',
  'NotificationDetail',
  'NotificationSettings',
  'PrivacySecurity',
  'LanguageSelection',
  'Feedback',
  'Verification',
  'HiddenProfile',
  'ChangePassword',

  'LiveTaskMap',
  'JobStatus',
  'TaskSuccess',
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
        name="My Tasks"
        component={TaskStack}
        options={{
          title: t('tabs.tasks'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "list-circle" : "list-circle-outline"} size={22} color={color} />
          )
        }}
      />
      <Tab.Screen
        name="Create Task"
        component={TaskStack}
        initialParams={{ screen: 'PostTask', params: { startOnPost: true } }}
        options={{
          title: t('tabs.createTask'),
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
              <Ionicons name="add" size={24} color="#FFF" />
            </View>
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Create Task', {
              screen: 'PostTask',
              params: { startOnPost: true, resetKey: Date.now() },
            });
          },
        })}
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

const TabNavigator = () => {
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
          drawerIcon: ({ color }) => (
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="home-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Wallet"
        component={WalletStack}
        options={{
          drawerLabel: t('drawer.myWallet'),
          drawerIcon: ({ color }) => (
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="wallet-outline" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Drawer.Screen
        name="Invitation"
        component={InvitationScreen}
        options={{
          drawerLabel: t('drawer.inviteFriends'),
          drawerIcon: ({ color }) => (
            <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="gift-outline" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Hidden Global Detail Screens */}
      <Drawer.Screen name="ProviderList" component={ProviderListScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ProviderProfile" component={ProviderProfileScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="FavoriteProviders" component={FavoriteProvidersScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="PopularServices" component={PopularServicesScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="BookingForm" component={BookingFormScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Rating" component={RatingScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="UserProfile" component={DashboardScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ProviderProfileEditItem" component={ProviderProfileEditItemScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="ProviderProfileSectionEdit" component={ProviderProfileSectionEditScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="NotificationDetail" component={NotificationDetailScreen} options={{ drawerItemStyle: { display: 'none' } }} />
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
      <Drawer.Screen name="TaskSuccess" component={TaskSuccessScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="JobStatus" component={JobStatusScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="LiveTaskMap" component={LiveTaskMapScreen} options={{ drawerItemStyle: { display: 'none' } }} />
      <Drawer.Screen name="Chat" component={ChatScreen} options={{ drawerItemStyle: { display: 'none' } }} />
    </Drawer.Navigator>
  );
};

export default TabNavigator;

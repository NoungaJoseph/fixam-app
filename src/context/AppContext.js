import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getMediaUrl } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const AppContext = createContext();
const hiddenJobsKey = (userId) => `fixam:hidden-jobs:${userId || 'guest'}`;
const favoriteJobsKey = (userId) => `fixam:favorite-jobs:${userId || 'guest'}`;
const appliedJobsKey = (userId) => `fixam:applied-jobs:${userId || 'guest'}`;
const favoriteProvidersKey = (userId) => `fixam:favorite-providers:${userId || 'guest'}`;

const normalizeUserMedia = (item) => item ? ({
  ...item,
  avatar: getMediaUrl(item.avatar),
  image: getMediaUrl(item.image),
}) : item;

const normalizeProvider = (provider) => provider ? ({
  ...provider,
  user: normalizeUserMedia(provider.user),
  avatar: getMediaUrl(provider.avatar),
  image: getMediaUrl(provider.image),
}) : provider;

const normalizeJob = (job) => job ? ({
  ...job,
  client: typeof job.client === 'object' ? normalizeUserMedia(job.client) : job.client,
  provider: normalizeUserMedia(job.provider),
  photos: Array.isArray(job.photos) ? job.photos.map((photo) => (
    typeof photo === 'string' ? getMediaUrl(photo) : photo
  )) : job.photos,
  assignments: Array.isArray(job.assignments) ? job.assignments.map((assignment) => ({
    ...assignment,
    provider: assignment.provider ? {
      ...assignment.provider,
      user: normalizeUserMedia(assignment.provider.user),
    } : assignment.provider,
  })) : job.assignments,
}) : job;

const normalizeConversation = (conversation) => conversation ? ({
  ...conversation,
  participants: Array.isArray(conversation.participants)
    ? conversation.participants.map(normalizeUserMedia)
    : conversation.participants,
}) : conversation;

export const AppProvider = ({ children }) => {
  const { token, user, updateProfile } = useAuth();
  const { on } = useSocket();
  const [providers, setProviders] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletDetails, setWalletDetails] = useState(null);
  const [hiddenJobIds, setHiddenJobIds] = useState([]);
  const [favoriteJobIds, setFavoriteJobIds] = useState([]);
  const [favoriteProviderIds, setFavoriteProviderIds] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [isProviderOnline, setIsProviderOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const markingNotificationsRef = React.useRef(new Set());

  useEffect(() => {
    if (user?.role?.toUpperCase() === 'PROVIDER') {
      setIsProviderOnline(Boolean(user?.isOnline));
    }

    if (token) {
      fetchAppData();
      fetchNotifications();
    } else {
      fetchProviders();
    }
  }, [token, user?.role]);

  useEffect(() => {
    const loadProviderJobPrefs = async () => {
      if (!user?.id) {
        setHiddenJobIds([]);
        setFavoriteJobIds([]);
        setFavoriteProviderIds([]);
        setAppliedJobIds([]);
        return;
      }

      try {
        const [hidden, favorites, applied, providerFavorites] = await Promise.all([
          AsyncStorage.getItem(hiddenJobsKey(user.id)),
          AsyncStorage.getItem(favoriteJobsKey(user.id)),
          AsyncStorage.getItem(appliedJobsKey(user.id)),
          AsyncStorage.getItem(favoriteProvidersKey(user.id)),
        ]);
        setHiddenJobIds(hidden ? JSON.parse(hidden) : []);
        setFavoriteJobIds(favorites ? JSON.parse(favorites) : []);
        setAppliedJobIds(applied ? JSON.parse(applied) : []);
        setFavoriteProviderIds(providerFavorites ? JSON.parse(providerFavorites) : []);
      } catch (error) {
        console.log('Error loading job preferences:', error.message);
      }
    };

    loadProviderJobPrefs();
  }, [user?.id]);

  useEffect(() => {
    if (token) {
      const offNewMessage = on('message:new', () => {
        fetchConversations();
      });

      const offNewNotification = on('notification:new', (notif) => {
        setNotifications(prev => {
          // Prevent duplicates by checking if notification with same ID already exists
          const exists = prev.some(n => n.id === notif.id);
          if (exists) return prev;

          const sameEvent = prev.some(n =>
            n.data?.type === notif.data?.type &&
            n.data?.transactionId &&
            n.data?.transactionId === notif.data?.transactionId &&
            n.data?.status === notif.data?.status
          );
          return sameEvent ? prev : [notif, ...prev];
        });

        // If it's a VERIFICATION notification, refresh user data from the server
        if (notif.data?.type === 'VERIFICATION') {
          api.get('/users/me')
            .then(res => {
              if (res.data?.data) {
                // Store refreshed user data so next app restore shows updated verification
                AsyncStorage.setItem('authUser', JSON.stringify(res.data.data)).catch(() => {});
                // Trigger a profile update so the UI reflects the change immediately
                updateProfile({}).catch(() => {});
              }
            })
            .catch(() => {});
        }
      });

      const offWalletUpdate = on('wallet:update', ({ balance }) => {
        setWalletBalance(balance);
      });

      const offChatNotification = on('notification:chat', () => {
        fetchConversations();
        fetchNotifications();
      });

      const offJobApproved = on('job:approved', () => {
        fetchAppData();
      });

      const offJobUpdated = on('job:updated', () => {
        fetchAppData();
      });

      const offApplicationCount = on('job:application-count', ({ jobId, applicationCount }) => {
        setJobs(prev => prev.map(job => (
          job.id === jobId
            ? { ...job, assignments: Array.from({ length: applicationCount }, (_, index) => job.assignments?.[index] || { id: `${jobId}-${index}` }) }
            : job
        )));
      });
      const offBookingUpdate = on('booking:update', () => {
        fetchAppData();
      });

      return () => {
        offNewMessage?.();
        offNewNotification?.();
        offWalletUpdate?.();
        offChatNotification?.();
        offJobApproved?.();
        offJobUpdated?.();
        offApplicationCount?.();
        offBookingUpdate?.();
      };
    }
  }, [token, on]);

  const fetchProviders = async () => {
    try {
      const res = await api.get('/providers');
      setProviders((res.data.data || []).map(normalizeProvider));
    } catch (error) {
      console.log('[Providers Fetch Error]:', error.message);
    }
  };

  const fetchAppData = async () => {
    setIsLoading(true);
    try {
      // These routes require authentication
      const jobsEndpoint = user?.role === 'PROVIDER' ? '/jobs/available?limit=10&sortBy=newest' : '/jobs/client';
      const [providersRes, jobsRes, walletRes, chatRes, transRes, bookingsRes] = await Promise.all([
        api.get('/providers').catch(() => ({ data: { data: [] } })),
        api.get(jobsEndpoint).catch(() => ({ data: { data: [] } })),
        api.get('/wallet/balance').catch(() => ({ data: { data: { balance: 0 } } })),
        api.get('/chat/conversations').catch(() => ({ data: { data: [] } })),
        api.get('/wallet/transactions').catch(() => ({ data: { data: [] } })),
        user?.role?.toUpperCase() === 'CLIENT'
          ? api.get('/bookings/mine?role=CLIENT').catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      ]);

      setProviders((providersRes.data.data || []).map(normalizeProvider));
      const bookingJobs = (bookingsRes.data.data || []).map((booking) => normalizeJob({
        id: booking.id,
        clientId: booking.clientId,
        title: booking.notes || 'Scheduled service booking',
        description: booking.notes || 'Scheduled service booking',
        location: booking.location,
        budget: booking.budget,
        budgetMin: booking.budget,
        budgetMax: booking.budget,
        scheduledTime: booking.bookingDate,
        status: booking.status === 'ACCEPTED' ? 'ASSIGNED' : booking.status === 'COMPLETED' ? 'COMPLETED' : booking.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
        approvalStatus: 'APPROVED',
        provider: booking.provider,
        isBooking: true,
        booking,
      }));
      setJobs([...(jobsRes.data.data || []).map(normalizeJob), ...bookingJobs]);
      setWalletBalance(walletRes.data.data?.balance || 0);
      setWalletDetails(walletRes.data.data || null);
      setConversations((chatRes.data.data || []).map(normalizeConversation));
      setTransactions(transRes.data.data || []);
      if (user?.role?.toUpperCase() === 'CLIENT') {
        fetchFavoriteProviders();
      }
    } catch (error) {
      console.log('[AppData Partial Error]:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      const seen = new Set();
      const unique = (res.data.data || []).filter((notif) => {
        const key = notif.data?.transactionId && notif.data?.status
          ? `${notif.data.type}-${notif.data.transactionId}-${notif.data.status}`
          : notif.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return !notif.archivedAt;
      });
      setNotifications(unique);
    } catch (error) {
      console.log('Error fetching notifications:', error);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations((res.data.data || []).map(normalizeConversation));
    } catch (error) {
      console.log('Error refreshing conversations:', error);
    }
  }, []);

  // Calculate unique unread conversations
  const unreadCount = useMemo(() => {
    return conversations.filter(c => c.unreadCount > 0).length;
  }, [conversations]);

  const notificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  const visibleJobs = useMemo(() => {
    const hidden = new Set(hiddenJobIds);
    return jobs.filter((job) => !hidden.has(job.id));
  }, [jobs, hiddenJobIds]);

  const favoriteJobs = useMemo(() => {
    const favorites = new Set(favoriteJobIds);
    return jobs.filter((job) => favorites.has(job.id));
  }, [jobs, favoriteJobIds]);

  const favoriteProviders = useMemo(() => {
    const favorites = new Set(favoriteProviderIds);
    return providers.filter((provider) => favorites.has(provider.id));
  }, [providers, favoriteProviderIds]);

  const fetchFavoriteProviders = async () => {
    if (!token) return [];
    try {
      const res = await api.get('/providers/favorites');
      const list = (res.data.data || []).map(normalizeProvider);
      const ids = list.map((provider) => provider.id);
      setFavoriteProviderIds(ids);
      await AsyncStorage.setItem(favoriteProvidersKey(user?.id), JSON.stringify(ids));
      return list;
    } catch (error) {
      console.log('[Favorite Providers Fetch Error]:', error.message);
      return [];
    }
  };

  const hideJob = async (jobId) => {
    if (!jobId) return;
    const nextHidden = Array.from(new Set([...hiddenJobIds, jobId]));
    const nextFavorites = favoriteJobIds.filter((id) => id !== jobId);
    setHiddenJobIds(nextHidden);
    setFavoriteJobIds(nextFavorites);
    await AsyncStorage.setItem(hiddenJobsKey(user?.id), JSON.stringify(nextHidden));
    await AsyncStorage.setItem(favoriteJobsKey(user?.id), JSON.stringify(nextFavorites));
  };

  const toggleFavoriteJob = async (jobId) => {
    if (!jobId) return;
    const exists = favoriteJobIds.includes(jobId);
    const next = exists ? favoriteJobIds.filter((id) => id !== jobId) : [...favoriteJobIds, jobId];
    setFavoriteJobIds(next);
    await AsyncStorage.setItem(favoriteJobsKey(user?.id), JSON.stringify(next));
  };

  const toggleFavoriteProvider = async (providerId) => {
    if (!providerId) return;
    const exists = favoriteProviderIds.includes(providerId);
    const next = exists
      ? favoriteProviderIds.filter((id) => id !== providerId)
      : [...favoriteProviderIds, providerId];
    setFavoriteProviderIds(next);
    await AsyncStorage.setItem(favoriteProvidersKey(user?.id), JSON.stringify(next));

    if (token) {
      try {
        if (exists) {
          await api.delete(`/providers/${providerId}/favorite`);
        } else {
          await api.post(`/providers/${providerId}/favorite`);
        }
      } catch (error) {
        setFavoriteProviderIds(favoriteProviderIds);
        await AsyncStorage.setItem(favoriteProvidersKey(user?.id), JSON.stringify(favoriteProviderIds));
        throw error;
      }
    }
  };

  const markJobApplied = async (jobId) => {
    if (!jobId) return;
    const next = Array.from(new Set([...appliedJobIds, jobId]));
    setAppliedJobIds(next);
    await AsyncStorage.setItem(appliedJobsKey(user?.id), JSON.stringify(next));
  };

  const postJob = async (newJob) => {
    try {
      const res = await api.post('/jobs', newJob);
      setJobs(prev => [...prev, normalizeJob(res.data.data)]);
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const updateProviderStatus = (status) => {
    setIsProviderOnline(status);
    api.put('/providers/status', { isOnline: status }).catch((error) => {
      console.log('Error updating provider status:', error.message);
      setIsProviderOnline(prev => !prev);
    });
  };

  const buyCoins = (amount) => {
    // This will now be handled by the backend approval, but keeping for local state if needed
    setWalletBalance(prev => prev + amount);
  };

  const markNotificationAsRead = async (id) => {
    if (markingNotificationsRef.current.has(id)) return;
    markingNotificationsRef.current.add(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.log('Error marking notification as read:', error);
    } finally {
      markingNotificationsRef.current.delete(id);
    }
  };

  const archiveNotification = async (id) => {
    try {
      await api.put(`/notifications/${id}/archive`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.log('Error archiving notification:', error);
      throw error;
    }
  };

  const deductCoin = () => {
    if (walletBalance >= 1) {
      setWalletBalance(prev => prev - 1);
      return true;
    }
    return false;
  };

  return (
    <AppContext.Provider value={{ 
      providers, 
      jobs, 
      visibleJobs,
      favoriteJobs,
      favoriteJobIds,
      favoriteProviders,
      favoriteProviderIds,
      appliedJobIds,
      hiddenJobIds,
      conversations,
      notifications,
      unreadCount,
      notificationCount,
      walletBalance, 
      walletDetails,
      transactions,
      isProviderOnline,
      isLoading,
      fetchAppData,
      fetchNotifications,
      fetchConversations,
      markNotificationAsRead,
      archiveNotification,
      postJob, 
      updateProviderStatus,
      buyCoins,
      deductCoin,
      hideJob,
      toggleFavoriteJob,
      toggleFavoriteProvider,
      fetchFavoriteProviders,
      markJobApplied
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);

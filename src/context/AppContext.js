import React, { createContext, useState, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getMediaUrl } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { POPULAR_SERVICE_CATALOG } from '../data/popularServices';

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
  const [myTasksList, setMyTasksList] = useState([]);
  const [myBookingsList, setMyBookingsList] = useState([]);
  const [isProviderOnline, setIsProviderOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [popularCategories, setPopularCategories] = useState(POPULAR_SERVICE_CATALOG);
  const markingNotificationsRef = React.useRef(new Set());
  const lastFetchRef = React.useRef(null);
  const hasLoadedDataRef = React.useRef(false);

  useEffect(() => {
    hasLoadedDataRef.current = hasLoadedData;
  }, [hasLoadedData]);

  useEffect(() => {
    if (user?.role?.toUpperCase() === 'PROVIDER') {
      setIsProviderOnline(Boolean(user?.isOnline));
    }

    if (token) {
      // First try to load cached data for instant UI
      const loadCached = async () => {
        try {
          const cached = await AsyncStorage.getItem(`fixam:dashboard:${user?.id}`);
          if (cached) {
            const data = JSON.parse(cached);
            setProviders(data.providers || []);
            setJobs(data.jobs || []);
            setWalletBalance(data.walletBalance || 0);
            setWalletDetails(data.walletDetails || null);
            setConversations(data.conversations || []);
            setTransactions(data.transactions || []);
            setMyTasksList(data.myTasks || []);
            setMyBookingsList(data.myBookings || []);
            setMyReviews(data.myReviews || []);
            setPopularCategories(data.popularCategories || POPULAR_SERVICE_CATALOG);
            setHasLoadedData(true);
            hasLoadedDataRef.current = true;
            setIsInitialLoad(false);
          }
        } catch (e) {
          console.log('Error loading cache', e);
        }
      };
      loadCached().then(() => {
        fetchAppData(true);
        fetchNotifications();
      });
    } else {
      hasLoadedDataRef.current = false;
      setHasLoadedData(false);
      setIsInitialLoad(true);
      fetchProviders();
    }

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && token) {
        fetchAppData(true);
        fetchNotifications();
        fetchConversations();
      }
    });

    const pollInterval = setInterval(() => {
      if (token) {
        fetchNotifications();
        fetchConversations();
        fetchAppData(false);
      }
    }, 30 * 1000);

    return () => {
      subscription.remove();
      clearInterval(pollInterval);
    };
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
        const type = notif.data?.type || notif.type;
        if (type === 'NEW_MESSAGE' || type === 'MESSAGE') return;

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
        fetchAppData(true);
        fetchNotifications();
      });

      const offJobUpdated = on('job:updated', () => {
        fetchAppData(true);
        fetchNotifications();
      });

      const offApplicationCount = on('job:application-count', ({ jobId, applicationCount }) => {
        setJobs(prev => prev.map(job => (
          job.id === jobId
            ? { ...job, assignments: Array.from({ length: applicationCount }, (_, index) => job.assignments?.[index] || { id: `${jobId}-${index}` }) }
            : job
        )));
      });
      const offBookingUpdate = on('booking:update', () => {
        fetchAppData(true);
        fetchNotifications();
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

  const fetchAppData = async (force = false) => {
    // Debounce: skip if fetched within the last 5 minutes
    const now = Date.now();
    if (!force && lastFetchRef.current && (now - lastFetchRef.current < 300000)) {
      return;
    }

    const shouldShowInitialLoader = !hasLoadedDataRef.current;
    if (shouldShowInitialLoader) {
      setIsInitialLoad(true);
      setIsLoading(true);
    }
    
    try {
      const config = force ? { headers: { 'Cache-Control': 'no-cache' } } : {};
      const res = await api.get('/dashboard', config);
      const data = res.data?.data;
      
      let currentProviders = providers;
      let currentJobs = jobs;
      let currentWalletBalance = walletBalance;
      let currentWalletDetails = walletDetails;
      let currentConversations = conversations;
      let currentTransactions = transactions;
      let nextPopularCategories = popularCategories;

      if (res.status !== 304 && data) {
        currentProviders = (data.providers || []).map(normalizeProvider);
        setProviders(currentProviders);
        
        const bookingJobs = (data.bookings || []).map((booking) => normalizeJob({
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
        currentJobs = [...(data.jobs || []).map(normalizeJob), ...bookingJobs];
        setJobs(currentJobs);
        
        currentWalletBalance = data.wallet?.balance || 0;
        currentWalletDetails = data.wallet || null;
        setWalletBalance(currentWalletBalance);
        setWalletDetails(currentWalletDetails);
        
        currentConversations = (data.conversations || []).map(normalizeConversation);
        setConversations(currentConversations);
        
        currentTransactions = data.transactions || [];
        setTransactions(currentTransactions);
        
        if (data.popularCategories) {
          const countMap = {};
          data.popularCategories.forEach(item => { countMap[item.category] = item._count.category; });
          
          let sorted = [...POPULAR_SERVICE_CATALOG];
          sorted.sort((a, b) => {
            const countA = countMap[a.name] || 0;
            const countB = countMap[b.name] || 0;
            if (countA !== countB) {
              return countB - countA;
            }
            return 0; 
          });
          nextPopularCategories = sorted;
          setPopularCategories(nextPopularCategories);
        }
      }
      
      let nextMyTasks = myTasksList;
      let nextMyBookings = myBookingsList;
      let nextMyReviews = myReviews;

      if (user?.role?.toUpperCase() === 'CLIENT') {
        fetchFavoriteProviders();
        try {
          const config = force ? { headers: { 'Cache-Control': 'no-cache' } } : {};
          const [jobsRes, bookingsRes] = await Promise.allSettled([
            api.get('/jobs/client', config),
            api.get('/bookings/mine?role=CLIENT', config)
          ]);
          nextMyTasks = (jobsRes.status === 'fulfilled' && jobsRes.value.status !== 304 && jobsRes.value.data?.data) ? jobsRes.value.data.data : nextMyTasks;
          nextMyBookings = (bookingsRes.status === 'fulfilled' && bookingsRes.value.status !== 304 && bookingsRes.value.data?.data) ? bookingsRes.value.data.data : nextMyBookings;
          setMyTasksList(nextMyTasks);
          setMyBookingsList(nextMyBookings);
        } catch (e) {
          console.log('[Client Tasks Fetch Error]', e.message);
        }
      } else if (user?.role?.toUpperCase() === 'PROVIDER') {
        try {
          const config = force ? { headers: { 'Cache-Control': 'no-cache' } } : {};
          const [jobsRes, bookingsRes, reviewsRes] = await Promise.allSettled([
            api.get('/jobs/my-jobs', config),
            api.get('/bookings/mine?role=PROVIDER', config),
            api.get(`/reviews/users/${user.id}`, config)
          ]);
          nextMyTasks = (jobsRes.status === 'fulfilled' && jobsRes.value.status !== 304 && jobsRes.value.data?.data) ? jobsRes.value.data.data : nextMyTasks;
          nextMyBookings = (bookingsRes.status === 'fulfilled' && bookingsRes.value.status !== 304 && bookingsRes.value.data?.data) ? bookingsRes.value.data.data : nextMyBookings;
          nextMyReviews = (reviewsRes.status === 'fulfilled' && reviewsRes.value.status !== 304 && reviewsRes.value.data?.data) ? reviewsRes.value.data.data : nextMyReviews;
          
          setMyTasksList(nextMyTasks);
          setMyBookingsList(nextMyBookings);
          setMyReviews(nextMyReviews);
        } catch (e) {
          console.log('[Provider Tasks Fetch Error]', e.message);
        }
      }

      // Cache data
      await AsyncStorage.setItem(`fixam:dashboard:${user?.id}`, JSON.stringify({
        providers: currentProviders,
        jobs: currentJobs,
        walletBalance: currentWalletBalance,
        walletDetails: currentWalletDetails,
        conversations: currentConversations,
        transactions: currentTransactions,
        myTasks: nextMyTasks,
        myBookings: nextMyBookings,
        myReviews: nextMyReviews,
        popularCategories: nextPopularCategories
      }));

      lastFetchRef.current = now;
      setHasLoadedData(true);
      hasLoadedDataRef.current = true;
    } catch (error) {
      console.log('[AppData Fetch Error]:', error.message);
    } finally {
      setIsLoading(false);
      if (shouldShowInitialLoader) {
        setIsInitialLoad(false);
      }
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      const seen = new Set();
      const unique = (res.data.data || []).filter((notif) => {
        const type = notif.data?.type || notif.type;
        if (type === 'NEW_MESSAGE' || type === 'MESSAGE') return false;

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

  const fetchUnreadMessageCount = useCallback(async () => {
    // No-op — unreadCount is derived from conversations (see below).
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations((res.data.data || []).map(normalizeConversation));
    } catch (error) {
      console.log('Error refreshing conversations:', error);
    }
  }, []);

  // unreadCount = number of distinct conversations that have >= 1 unread message.
  // If 3 different people each text you 10 messages -> badge shows 3, not 30.
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
      myReviews,
      appliedJobIds,
      hiddenJobIds,
      myTasksList,
      myBookingsList,
      conversations,
      notifications,
      unreadCount,
      notificationCount,
      walletBalance, 
      walletDetails,
      transactions,
      isProviderOnline,
      popularCategories,
      isLoading,
      isInitialLoad,
      hasLoadedData,
      fetchAppData,
      fetchNotifications,
      fetchConversations,
      fetchUnreadMessageCount,
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

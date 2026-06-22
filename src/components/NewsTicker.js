import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

const NewsTicker = () => {
  const { colors, isDarkMode } = useTheme();
  const { language, t } = useLanguage();
  
  const [tickerItems, setTickerItems] = useState([{
    isNews: false,
    badgeText: t('home.sports.sportsBadge', 'SPORTS'),
    text: t('home.sports.waiting', 'Waiting for match data...')
  }]);
  
  const scrollX = useRef(new Animated.Value(width)).current;
  const [textWidth, setTextWidth] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTicker = async () => {
      try {
        const res = await api.get(`/sports/ticker?lang=${language}`);
        if (isMounted && res.data?.data?.items) {
          const items = res.data.data.items;
          if (items.length === 0) {
            setTickerItems([{
              isNews: false,
              badgeText: t('home.sports.sportsBadge', 'SPORTS'),
              text: t('home.sports.welcome', 'Welcome to Fixam Sports!')
            }]);
            return;
          }

          const processedItems = items.map(item => {
            if (item.type === 'MATCH') {
              const liveStatus = item.status === 'LIVE' ? ` (${t('home.sports.live', 'LIVE')})` : '';
              return {
                id: Math.random().toString(),
                isNews: false,
                badgeText: t('home.sports.sportsBadge', 'SPORTS'),
                text: `⚽ ${item.home} ${item.homeScore} - ${item.awayScore} ${item.away}${liveStatus}`
              };
            } else if (item.type === 'UPCOMING') {
              const time = new Date(item.time).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
              return {
                id: Math.random().toString(),
                isNews: false,
                badgeText: t('home.sports.sportsBadge', 'SPORTS'),
                text: `📅 ${t('home.sports.upcoming', 'Upcoming')}: ${item.home} vs ${item.away} (${time})`
              };
            } else if (item.type === 'NEWS') {
              const prefix = item.prefix || '📰';
              return {
                id: Math.random().toString(),
                isNews: true,
                badgeText: t('home.sports.newsBadge', 'NEWS'),
                text: `${prefix} ${item.title}`
              };
            }
            return null;
          }).filter(Boolean);

          setTickerItems(processedItems);
        }
      } catch (error) {
        console.log('[NewsTicker] Error fetching sports data:', error.message);
      }
    };

    fetchTicker();
    
    const interval = setInterval(fetchTicker, 2 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [language, t]);

  useEffect(() => {
    if (textWidth > 0) {
      scrollX.setValue(width);
      scrollX.stopAnimation();
      
      const distance = width + textWidth;
      const duration = (distance / 40) * 1000;

      Animated.loop(
        Animated.timing(scrollX, {
          toValue: -textWidth,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [textWidth, scrollX, tickerItems]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderBottomColor: colors.border }]}>
      <View style={styles.tickerContainer}>
        <Animated.View style={{ transform: [{ translateX: scrollX }], flexDirection: 'row', position: 'absolute', alignItems: 'center' }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onLayout={(e) => {
              if (Math.abs(e.nativeEvent.layout.width - textWidth) > 10) {
                setTextWidth(e.nativeEvent.layout.width);
              }
            }}
          >
            {tickerItems.map((item, index) => (
              <View key={item.id || index} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 30 }}>
                <View style={[styles.inlineBadge, { backgroundColor: item.isNews ? '#2563EB' : '#E11D48' }]}>
                  <Text style={styles.inlineBadgeText}>{item.badgeText}</Text>
                </View>
                <Text style={[styles.tickerText, { color: colors.text }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderBottomWidth: 0,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  tickerContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  inlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  inlineBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tickerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default NewsTicker;

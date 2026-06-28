import React, { useState, useEffect } from 'react';
import SafeAreaView from '../../components/Common/TealSafeAreaView';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, StatusBar, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';

const TaskDiscoveryScreen = ({ navigation }) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, price_high, price_low, oldest
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchTasks(1);
  }, [sortBy, searchTerm, locationFilter]);

  useEffect(() => {
    setFilteredTasks(tasks);
  }, [tasks]);

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get('/jobs/available', {
        params: {
          page,
          limit: ITEMS_PER_PAGE,
          sortBy,
          search: searchTerm,
          location: locationFilter
        }
      });

      setTasks(response.data.data || []);
      setCurrentPage(response.data.pagination?.page || 1);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.log('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchTasks(newPage);
      setCurrentPage(newPage);
    }
  };

  const handleTaskPress = (task) => {
    navigation.navigate('TaskDetails', { task });
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} min ago`; }
    if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hr${h > 1 ? 's' : ''} ago`; }
    const d = Math.floor(diff / 86400);
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d} days ago`;
    if (d < 30) { const w = Math.floor(d / 7); return `${w} week${w > 1 ? 's' : ''} ago`; }
    const mo = Math.floor(d / 30);
    return `${mo} month${mo > 1 ? 's' : ''} ago`;
  };

  const TaskCard = ({ task }) => (
    <TouchableOpacity
      onPress={() => handleTaskPress(task)}
      style={[
        styles.taskCard,
        { backgroundColor: colors.card, borderColor: colors.border }
      ]}
    >
      <View style={styles.taskHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
          <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
            {task.category}
          </Text>
        </View>
        <View style={[styles.budgetBadge, { backgroundColor: colors.accentSoft }]}>
          <Text style={[styles.budgetText, { color: colors.accent }]}>
            {task.budget} FCFA
          </Text>
        </View>
      </View>

      <Text
        numberOfLines={2}
        style={[styles.taskDescription, { color: colors.textSecondary }]}
      >
        {task.description}
      </Text>

      <View style={styles.taskMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons
            name="map-marker"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {task.location}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={colors.textSecondary}
          />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            {timeAgo(task.createdAt)}
          </Text>
        </View>

        {task.assignments?.length > 0 && (
          <View style={styles.metaItem}>
            <MaterialCommunityIcons
              name="account"
              size={14}
              color={colors.accent}
            />
            <Text style={[styles.metaText, { color: colors.accent }]}>
              {task.assignments.length} bid(s)
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.background, { backgroundColor: colors.background }]}>
      
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Available Tasks</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.filterBtn}>
            <MaterialCommunityIcons name="tune" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search tasks..."
            placeholderTextColor={colors.placeholder}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={[styles.filterSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Location</Text>
              <TextInput
                style={[styles.filterInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="Filter by location..."
                placeholderTextColor={colors.placeholder}
                value={locationFilter}
                onChangeText={setLocationFilter}
              />
            </View>

            <View style={styles.filterItem}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Sort By</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortOptions}>
                {[
                  { label: 'Newest', value: 'newest' },
                  { label: 'Price: High', value: 'price_high' },
                  { label: 'Price: Low', value: 'price_low' },
                  { label: 'Oldest', value: 'oldest' }
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setSortBy(option.value)}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor: sortBy === option.value ? colors.accent : colors.background,
                        borderColor: colors.border
                      }
                    ]}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      { color: sortBy === option.value ? '#FFF' : colors.text }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Tasks List */}
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : filteredTasks.length === 0 ? (
          <View style={styles.centerContent}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={60}
              color={colors.placeholder}
              style={{ marginBottom: 15 }}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>No tasks found</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Try adjusting your filters
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={filteredTasks}
              renderItem={({ item }) => <TaskCard task={item} />}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
            />

            {/* Pagination */}
            <View style={[styles.pagination, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={[
                  styles.pageButton,
                  { 
                    backgroundColor: currentPage === 1 ? colors.border : colors.accent,
                    opacity: currentPage === 1 ? 0.5 : 1
                  }
                ]}
              >
                <MaterialCommunityIcons name="chevron-left" size={20} color="#FFF" />
              </TouchableOpacity>

              <Text style={[styles.pageInfo, { color: colors.text }]}>
                {currentPage} / {totalPages}
              </Text>

              <TouchableOpacity
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={[
                  styles.pageButton,
                  { 
                    backgroundColor: currentPage === totalPages ? colors.border : colors.accent,
                    opacity: currentPage === totalPages ? 0.5 : 1
                  }
                ]}
              >
                <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center'
  },
  filterBtn: {
    padding: 8
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 15
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500'
  },
  filterSection: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1
  },
  filterItem: {
    marginBottom: 12
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  filterInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '500'
  },
  sortOptions: {
    marginTop: 8
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '700'
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20
  },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4
  },
  taskCategory: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  budgetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  budgetText: {
    fontSize: 13,
    fontWeight: '800'
  },
  taskDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12
  },
  taskMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500'
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '500'
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    marginBottom: 20
  },
  pageButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pageInfo: {
    fontSize: 14,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center'
  }
});

export default TaskDiscoveryScreen;

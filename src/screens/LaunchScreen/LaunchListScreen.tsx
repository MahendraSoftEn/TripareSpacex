import React, {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import dayjs from 'dayjs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appColors } from '../../app/theme/colors';
import { formatLastSyncedTime, formatMissionDate } from '../../utils/formatters';
import type { LaunchListScreenProps } from '../../navigation/navigation.types';
import { useMissions } from '../../features/missions/hooks/useMissions';
import type { Mission } from '../../features/missions/types/mission.types';
import {
  useMissionFiltersStore,
  type DateRangeFilter,
} from '../../store/missionFilters.store';

type SortOption = 'name' | 'newest' | 'oldest';

type LaunchListItem =
  | {
      id: string;
      title: string;
      type: 'header';
    }
  | {
      id: string;
      mission: Mission;
      type: 'row';
    };

const SORT_OPTIONS: SortOption[] = ['newest', 'oldest', 'name'];
const DATE_RANGE_OPTIONS: Array<{
  label: string;
  value: DateRangeFilter;
}> = [
  { label: 'Last 30 days', value: 'last-30-days' },
  { label: 'Last year', value: 'last-year' },
  { label: 'All time', value: 'all-time' },
];



export function LaunchListScreen({
  navigation,
}: LaunchListScreenProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const {
    data,
    error,
    isError,
    isFetching,
    isLoading,
    lastSyncedAt,
    refetch,
  } = useMissions();
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const deferredSearchText = useDeferredValue(debouncedSearchText);


 const clearAllFilters = useMissionFiltersStore(s => s.clearAllFilters);
const dateRange = useMissionFiltersStore(s => s.dateRange);
const hasHydratedFilters = useMissionFiltersStore(s => s.hasHydrated);
const launchpads = useMissionFiltersStore(s => s.launchpads);
const rocketTypes = useMissionFiltersStore(s => s.rocketTypes);
const statuses = useMissionFiltersStore(s => s.statuses);

const setDateRange = useMissionFiltersStore(s => s.setDateRange);
const toggleLaunchpad = useMissionFiltersStore(s => s.toggleLaunchpad);
const toggleRocketType = useMissionFiltersStore(s => s.toggleRocketType);
const toggleStatus = useMissionFiltersStore(s => s.toggleStatus);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchText(searchText.trim().toLowerCase());
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  const rocketOptions = useMemo(
    () =>
      Array.from(new Set(data.map(mission => mission.rocketName))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [data],
  );

  const launchpadOptions = useMemo(
    () =>
      Array.from(new Set(data.map(mission => mission.launchpad))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [data],
  );

  const filteredMissions = useMemo(() => {
    const missions = [...data];
    const now = dayjs();

    const byDateRange = missions.filter(mission => {
      if (dateRange === 'all-time') {
        return true;
      }

      const missionDate = dayjs(mission.launchDateUtc);

      if (dateRange === 'last-30-days') {
        return missionDate.isAfter(now.subtract(30, 'day'));
      }

      return missionDate.isAfter(now.subtract(1, 'year'));
    });

    const byStatus =
      statuses.length === 0
        ? byDateRange
        : byDateRange.filter(mission => statuses.includes(mission.status));

    const byRocket =
      rocketTypes.length === 0
        ? byStatus
        : byStatus.filter(mission => rocketTypes.includes(mission.rocketName));

    const byLaunchpad =
      launchpads.length === 0
        ? byRocket
        : byRocket.filter(mission => launchpads.includes(mission.launchpad));

    if (sortBy === 'newest') {
      byLaunchpad.sort(
        (left, right) =>
          new Date(right.launchDateUtc).getTime() -
          new Date(left.launchDateUtc).getTime(),
      );
    } else if (sortBy === 'oldest') {
      byLaunchpad.sort(
        (left, right) =>
          new Date(left.launchDateUtc).getTime() -
          new Date(right.launchDateUtc).getTime(),
      );
    } else {
      byLaunchpad.sort((left, right) =>
        left.missionName.localeCompare(right.missionName),
      );
    }

    if (!deferredSearchText) {
      return byLaunchpad;
    }

    return byLaunchpad.filter(mission =>
      mission.missionName.toLowerCase().includes(deferredSearchText),
    );
  }, [
    data,
    dateRange,
    deferredSearchText,
    launchpads,
    rocketTypes,
    sortBy,
    statuses,
  ]);

  const listItems = useMemo(() => {
    const groupedItems = new Map<string, Mission[]>();
    const orderedKeys: string[] = [];

    filteredMissions.forEach(mission => {
      const groupKey = dayjs(mission.launchDateUtc).format('YYYY-MM');

      if (!groupedItems.has(groupKey)) {
        groupedItems.set(groupKey, []);
        orderedKeys.push(groupKey);
      }

      groupedItems.get(groupKey)?.push(mission);
    });

    if (sortBy === 'oldest') {
      orderedKeys.sort();
    } else if (sortBy === 'newest' || sortBy === 'name') {
      orderedKeys.sort().reverse();
    }

    const items: LaunchListItem[] = [];

    orderedKeys.forEach(groupKey => {
      const missions = groupedItems.get(groupKey);

      if (!missions || missions.length === 0) {
        return;
      }

      items.push({
        id: `header-${groupKey}`,
        title: dayjs(`${groupKey}-01`).format('MMMM YYYY'),
        type: 'header',
      });

      missions.forEach(mission => {
        items.push({
          id: mission.id,
          mission,
          type: 'row',
        });
      });
    });

    return items;
  }, [filteredMissions, sortBy]);

  const stickyHeaderIndices = useMemo(
    () =>
      listItems.reduce<number[]>((indices, item, index) => {
        if (item.type === 'header') {
          indices.push(index);
        }

        return indices;
      }, []),
    [listItems],
  );

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleOpenMission = useCallback(
    (mission: Mission) => {
      navigation.navigate('LaunchDetail', {
        launchId: mission.id,
        launchName: mission.missionName,
      });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<LaunchListItem>) => {
      if (item.type === 'header') {
        return <LaunchSectionHeader title={item.title} />;
      }

      return (
        <LaunchRow mission={item.mission} onPress={handleOpenMission} />
      );
    },
    [handleOpenMission],
  );

  const keyExtractor = useCallback((item: LaunchListItem) => item.id, []);

  const getItemType = useCallback(
    (item: LaunchListItem) => item.type,
    [],
  );

  const activeFilterCount =
    (dateRange === 'all-time' ? 0 : 1) +
    statuses.length +
    rocketTypes.length +
    launchpads.length;

  if ((!hasHydratedFilters || isLoading) && data.length === 0) {
    return (
      <View
        style={[
          styles.stateScreen,
          { paddingBottom: insets.bottom + 24, paddingTop: insets.top + 24 },
        ]}>
        <ActivityIndicator color={appColors.accent} size="large" />
        <Text style={styles.stateTitle}>Loading launches</Text>
        <Text style={styles.stateText}>
          Preparing cached missions and syncing the latest SpaceX schedule.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom, paddingTop: insets.top },
      ]}
      >
      <FlashList
        contentContainerStyle={styles.listContent}
        data={listItems}
        drawDistance={400}
        getItemType={getItemType}
        keyExtractor={keyExtractor}
        ListEmptyComponent={
          <EmptyState hasSearch={Boolean(deferredSearchText)} />
        }
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.eyebrow}>SpaceX Launches</Text>
            <Text style={styles.title}>Launch Manifest</Text>
            <Text style={styles.subtitle}>
              Browse cached and live launch data with fast grouping, search, and
              background sync.
            </Text>

            {isError ? (
              <ErrorBanner
                message={
                  error instanceof Error
                    ? error.message
                    : 'Could not refresh from SpaceX. Showing cached launches.'
                }
              />
            ) : null}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                Last synced: {formatLastSyncedTime(lastSyncedAt)}
              </Text>
              <Text style={styles.metaText}>
                {isFetching ? 'Syncing now' : `${data.length} launches cached`}
              </Text>
            </View>

            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setSearchText}
              placeholder="Search mission name"
              placeholderTextColor={appColors.muted}
              style={styles.searchInput}
              value={searchText}
            />

            <View style={styles.sortRow}>
              {SORT_OPTIONS.map(option => (
                <SortChip
                  isActive={sortBy === option}
                  key={option}
                  label={option}
                  onPress={() => setSortBy(option)}
                />
              ))}
            </View>

            <Pressable
              onPress={() => setIsFilterSheetVisible(true)}
              style={styles.filterTrigger}>
              <Text style={styles.filterTriggerLabel}>Filters</Text>
              <Text style={styles.filterTriggerValue}>
                {activeFilterCount > 0
                  ? `${activeFilterCount} active`
                  : 'All launches'}
              </Text>
            </Pressable>
          </View>
        }
        onRefresh={handleRefresh}
        progressViewOffset={insets.top}
        refreshing={isFetching && !isLoading}
        removeClippedSubviews
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeaderIndices}
      />

      <FilterBottomSheet
        activeFilterCount={activeFilterCount}
        dateRange={dateRange}
        launchpadOptions={launchpadOptions}
        launchpads={launchpads}
        onClearAll={clearAllFilters}
        onClose={() => setIsFilterSheetVisible(false)}
        onSelectDateRange={setDateRange}
        onToggleLaunchpad={toggleLaunchpad}
        onToggleRocketType={toggleRocketType}
        onToggleStatus={toggleStatus}
        rocketOptions={rocketOptions}
        rocketTypes={rocketTypes}
        statuses={statuses}
        visible={isFilterSheetVisible}
      />
    </View>
  );
}



const LaunchSectionHeader = memo(function LaunchSectionHeader({
  title,
}: {
  title: string;
}): React.JSX.Element {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
});

const LaunchRow = memo(function LaunchRow({
  mission,
  onPress,
}: {
  mission: Mission;
  onPress: (mission: Mission) => void;
}): React.JSX.Element {
  return (
    <Pressable onPress={() => onPress(mission)} style={styles.row}>
      <View style={styles.rowHeader}>
        <View style={styles.rowTitleWrap}>
          <Text numberOfLines={1} style={styles.rowTitle}>
            {mission.missionName}
          </Text>
          <Text numberOfLines={1} style={styles.rowSubtitle}>
            {mission.rocketName}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{mission.status}</Text>
        </View>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowMetaLabel}>Launch</Text>
        <Text style={styles.rowMetaValue}>
          {formatMissionDate(mission.launchDateUtc)}
        </Text>
      </View>
      <View style={styles.rowMeta}>
        <Text style={styles.rowMetaLabel}>Pad</Text>
        <Text numberOfLines={1} style={styles.rowMetaValue}>
          {mission.launchpad}
        </Text>
      </View>
    </Pressable>
  );
});

const SortChip = memo(function SortChip({
  isActive,
  label,
  onPress,
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.sortChip, isActive ? styles.sortChipActive : null]}>
      <Text
        style={[
          styles.sortChipText,
          isActive ? styles.sortChipTextActive : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
});

function ErrorBanner({ message }: { message: string }): React.JSX.Element {
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerTitle}>Background sync failed</Text>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

function EmptyState({
  hasSearch,
}: {
  hasSearch: boolean;
}): React.JSX.Element {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.stateTitle}>
        {hasSearch ? 'No matching launches' : 'No launches cached yet'}
      </Text>
      <Text style={styles.stateText}>
        {hasSearch
          ? 'Try a different mission keyword or clear the search input.'
          : 'Pull to refresh once you are online to cache the latest SpaceX launches.'}
      </Text>
    </View>
  );
}

function FilterBottomSheet({
  activeFilterCount,
  dateRange,
  launchpadOptions,
  launchpads,
  onClearAll,
  onClose,
  onSelectDateRange,
  onToggleLaunchpad,
  onToggleRocketType,
  onToggleStatus,
  rocketOptions,
  rocketTypes,
  statuses,
  visible,
}: {
  activeFilterCount: number;
  dateRange: DateRangeFilter;
  launchpadOptions: string[];
  launchpads: string[];
  onClearAll: () => void;
  onClose: () => void;
  onSelectDateRange: (dateRange: DateRangeFilter) => void;
  onToggleLaunchpad: (launchpad: string) => void;
  onToggleRocketType: (rocketType: string) => void;
  onToggleStatus: (status: Mission['status']) => void;
  rocketOptions: string[];
  rocketTypes: string[];
  statuses: Mission['status'][];
  visible: boolean;
}): React.JSX.Element {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}>
      <View style={styles.sheetBackdrop}>
        <Pressable onPress={onClose} style={styles.sheetBackdropPressable} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Filter launches</Text>
              <Text style={styles.sheetSubtitle}>
                {activeFilterCount > 0
                  ? `${activeFilterCount} filters active`
                  : 'Browse all cached launches'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.sheetDoneButton}>
              <Text style={styles.sheetDoneButtonText}>Done</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}>
            <FilterSection title="Date range">
              {DATE_RANGE_OPTIONS.map(option => (
                <FilterChip
                  isSelected={dateRange === option.value}
                  key={option.value}
                  label={option.label}
                  onPress={() => onSelectDateRange(option.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Launch status">
              {(['success', 'failed', 'upcoming'] as const).map(status => (
                <FilterChip
                  isSelected={statuses.includes(status)}
                  key={status}
                  label={capitalizeLabel(status)}
                  onPress={() => onToggleStatus(status)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Rocket type">
              {rocketOptions.length > 0 ? (
                rocketOptions.map(rocketType => (
                  <FilterChip
                    isSelected={rocketTypes.includes(rocketType)}
                    key={rocketType}
                    label={rocketType}
                    onPress={() => onToggleRocketType(rocketType)}
                  />
                ))
              ) : (
                <Text style={styles.sheetEmptyCopy}>No rocket types available.</Text>
              )}
            </FilterSection>

            <FilterSection title="Launchpad">
              {launchpadOptions.length > 0 ? (
                launchpadOptions.map(launchpad => (
                  <FilterChip
                    isSelected={launchpads.includes(launchpad)}
                    key={launchpad}
                    label={launchpad}
                    onPress={() => onToggleLaunchpad(launchpad)}
                  />
                ))
              ) : (
                <Text style={styles.sheetEmptyCopy}>No launchpads available.</Text>
              )}
            </FilterSection>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <Pressable onPress={onClearAll} style={styles.sheetClearButton}>
              <Text style={styles.sheetClearButtonText}>Clear all</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FilterSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}): React.JSX.Element {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      <View style={styles.filterSectionBody}>{children}</View>
    </View>
  );
}

function FilterChip({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        isSelected ? styles.filterChipSelected : null,
      ]}>
      <Text
        style={[
          styles.filterChipText,
          isSelected ? styles.filterChipTextSelected : null,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function capitalizeLabel(label: string): string {
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: appColors.background,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 56,
  },
  errorBanner: {
    backgroundColor: '#45212A',
    borderColor: '#A64B60',
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
    padding: 14,
  },
  errorBannerText: {
    color: '#FFD5DC',
    fontSize: 13,
    lineHeight: 19,
  },
  errorBannerTitle: {
    color: '#FFF3F5',
    fontSize: 14,
    fontWeight: '700',
  },
  eyebrow: {
    color: appColors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  filterChip: {
    borderColor: appColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipSelected: {
    backgroundColor: appColors.accent,
    borderColor: appColors.accent,
  },
  filterChipText: {
    color: appColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextSelected: {
    color: appColors.textPrimary,
  },
  filterSection: {
    gap: 12,
  },
  filterSectionBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterSectionTitle: {
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  filterTrigger: {
    alignItems: 'center',
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterTriggerLabel: {
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  filterTriggerValue: {
    color: appColors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 24,
  },
  listHeader: {
    gap: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metaText: {
    color: appColors.textSecondary,
    flex: 1,
    fontSize: 13,
  },
  row: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 20,
    marginVertical: 6,
    padding: 16,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  rowMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  rowMetaLabel: {
    color: appColors.muted,
    fontSize: 13,
  },
  rowMetaValue: {
    color: appColors.textPrimary,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    paddingLeft: 16,
    textAlign: 'right',
  },
  rowSubtitle: {
    color: appColors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  rowTitle: {
    color: appColors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  rowTitleWrap: {
    flex: 1,
  },
  searchInput: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: appColors.textPrimary,
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeader: {
    backgroundColor: appColors.background,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionHeaderText: {
    color: appColors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sheet: {
    backgroundColor: appColors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 20,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(3, 9, 15, 0.68)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdropPressable: {
    flex: 1,
  },
  sheetClearButton: {
    alignItems: 'center',
    borderColor: appColors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  sheetClearButtonText: {
    color: appColors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sheetContent: {
    gap: 22,
    paddingBottom: 16,
  },
  sheetDoneButton: {
    alignItems: 'center',
    backgroundColor: appColors.accent,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sheetDoneButtonText: {
    color: appColors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  sheetEmptyCopy: {
    color: appColors.textSecondary,
    fontSize: 14,
  },
  sheetFooter: {
    borderTopColor: appColors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: 20,
    paddingTop: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: appColors.border,
    borderRadius: 999,
    height: 5,
    width: 54,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetSubtitle: {
    color: appColors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  sheetTitle: {
    color: appColors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  sortChip: {
    borderColor: appColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortChipActive: {
    backgroundColor: appColors.accent,
    borderColor: appColors.accent,
  },
  sortChipText: {
    color: appColors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  sortChipTextActive: {
    color: appColors.textPrimary,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stateScreen: {
    alignItems: 'center',
    backgroundColor: appColors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stateText: {
    color: appColors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  stateTitle: {
    color: appColors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#143852',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    color: appColors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  subtitle: {
    color: appColors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
  },
});

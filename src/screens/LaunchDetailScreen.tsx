import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { appColors } from '../app/theme/colors';
import { AppScreen } from '../components/AppScreen';
import { useMissions } from '../features/missions/hooks/useMissions';
import type { Mission } from '../features/missions/types/mission.types';
import type { LaunchDetailScreenProps } from '../navigation/navigation.types';
import { formatMissionDate } from '../utils/formatters';

type LaunchDetailTab = 'launchpad' | 'media' | 'overview';

const DETAIL_TABS: Array<{
  label: string;
  value: LaunchDetailTab;
}> = [
  { label: 'Overview', value: 'overview' },
  { label: 'Launchpad', value: 'launchpad' },
  { label: 'Media', value: 'media' },
];

export function LaunchDetailScreen({
  navigation,
  route,
}: LaunchDetailScreenProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const { data } = useMissions();
  const [activeTab, setActiveTab] = useState<LaunchDetailTab>('overview');
  const mission = useMemo(
    () => data.find(item => item.id === route.params.launchId),
    [data, route.params.launchId],
  );
  const isCompact = width < 380;

  if (!mission) {
    return (
      <AppScreen contentContainerStyle={styles.content}>
        <Text style={styles.title}>{route.params.launchName ?? 'Launch Detail'}</Text>
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Launch unavailable offline</Text>
          <Text style={styles.sectionBody}>
            This launch is not in the current cached manifest yet. Return to the
            launch list and refresh once you are online.
          </Text>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <View
        style={[
          styles.hero,
          isCompact ? styles.heroCompact : styles.heroRegular,
        ]}>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>SpaceX Launch</Text>
          <Text style={styles.title}>{mission.missionName}</Text>
          <Text style={styles.heroSubtitle}>{mission.rocketName}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{mission.status}</Text>
            </View>
            <Text style={styles.heroMetaText}>
              {formatMissionDate(mission.launchDateUtc)}
            </Text>
          </View>
        </View>

        {mission.patchImage ? (
          <Image source={{ uri: mission.patchImage }} style={styles.heroPatch} />
        ) : (
          <View style={[styles.heroPatch, styles.heroPatchFallback]}>
            <Text style={styles.heroPatchFallbackText}>SX</Text>
          </View>
        )}
      </View>

      <View style={styles.tabRow}>
        {DETAIL_TABS.map(tab => (
          <Pressable
            key={tab.value}
            onPress={() => setActiveTab(tab.value)}
            style={[
              styles.tabChip,
              activeTab === tab.value ? styles.tabChipActive : null,
            ]}>
            <Text
              style={[
                styles.tabChipText,
                activeTab === tab.value ? styles.tabChipTextActive : null,
              ]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === 'overview' ? (
        <OverviewTab mission={mission} />
      ) : null}

      {activeTab === 'launchpad' ? (
        <LaunchpadTab
          launchpadName={mission.launchpad}
          mission={mission}
          onOpenMap={() =>
            navigation.navigate('Map', {
              launchId: mission.id,
              title: mission.missionName,
            })
          }
        />
      ) : null}

      {activeTab === 'media' ? <MediaTab mission={mission} /> : null}
    </AppScreen>
  );
}

function OverviewTab({ mission }: { mission: Mission }): React.JSX.Element {
  const outcomeLabel =
    mission.status === 'success'
      ? 'Mission completed successfully'
      : mission.status === 'failed'
        ? 'Mission experienced a launch anomaly'
        : 'Mission is still upcoming';

  return (
    <View style={styles.tabContent}>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Mission details</Text>
        <DetailRow label="Launch ID" value={mission.id} />
        <DetailRow label="Launch window" value={formatMissionDate(mission.launchDateUtc)} />
        <DetailRow label="Launchpad" value={mission.launchpad} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Rocket info</Text>
        <DetailRow label="Vehicle" value={mission.rocketName} />
        <DetailRow
          label="Configuration"
          value="Launch manifest cached for offline browsing"
        />
        <DetailRow
          label="Readiness"
          value={
            mission.status === 'upcoming'
              ? 'Awaiting liftoff window'
              : 'Flight record archived'
          }
        />
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Payload</Text>
        <Text style={styles.sectionBody}>
          Payload-level manifest data is not cached in the current offline
          model yet, so this screen keeps the payload section reserved for the
          next API expansion.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Launch outcome</Text>
        <Text style={styles.outcomeHeadline}>{outcomeLabel}</Text>
        <Text style={styles.sectionBody}>
          {mission.status === 'success'
            ? 'Recovery and post-flight details can be layered in once richer mission telemetry is stored locally.'
            : mission.status === 'failed'
              ? 'Use this outcome block to attach failure notes and mission timeline context when expanded API fields are available.'
              : 'This mission remains in the upcoming schedule and will update automatically after the next successful sync.'}
        </Text>
      </View>
    </View>
  );
}

function LaunchpadTab({
  launchpadName,
  mission,
  onOpenMap,
}: {
  launchpadName: string;
  mission: Mission;
  onOpenMap: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.tabContent}>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Launchpad</Text>
        <Text style={styles.launchpadTitle}>{launchpadName}</Text>
        <Text style={styles.sectionBody}>
          The local cache currently stores launchpad identity with each launch,
          which keeps detail browsing fast and reliable even when the network is
          unavailable.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Site readiness</Text>
        <DetailRow label="Mission" value={mission.missionName} />
        <DetailRow label="Rocket" value={mission.rocketName} />
        <DetailRow label="Scheduled for" value={formatMissionDate(mission.launchDateUtc)} />
      </View>

      <Pressable onPress={onOpenMap} style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Open map view</Text>
        <Text style={styles.ctaBody}>
          Jump to the launch map screen to attach coordinates and richer site
          context as the app’s geospatial layer grows.
        </Text>
      </Pressable>
    </View>
  );
}

function MediaTab({ mission }: { mission: Mission }): React.JSX.Element {
  return (
    <View style={styles.tabContent}>
      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Mission patch</Text>
        {mission.patchImage ? (
          <Image source={{ uri: mission.patchImage }} style={styles.mediaPreview} />
        ) : (
          <View style={[styles.mediaPreview, styles.mediaFallback]}>
            <Text style={styles.mediaFallbackText}>No cached media</Text>
          </View>
        )}
        <Text style={styles.sectionBody}>
          Offline media currently focuses on the mission patch so the detail
          experience still feels visual without depending on live web content.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Media library</Text>
        <Text style={styles.sectionBody}>
          Press kits, webcast links, and gallery assets are not part of the
          current local sync yet. This tab is ready for those richer media feeds
          when you expand the SpaceX API model.
        </Text>
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
  },
  ctaBody: {
    color: appColors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  ctaCard: {
    backgroundColor: '#102A3E',
    borderColor: '#214966',
    borderRadius: 22,
    borderWidth: 1,
    gap: 8,
    padding: 20,
  },
  ctaTitle: {
    color: appColors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  detailLabel: {
    color: appColors.muted,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  detailRow: {
    borderBottomColor: appColors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingVertical: 14,
  },
  detailValue: {
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  eyebrow: {
    color: appColors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  hero: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 24,
    borderWidth: 1,
    gap: 18,
    padding: 20,
  },
  heroCompact: {
    alignItems: 'flex-start',
  },
  heroCopy: {
    flex: 1,
    gap: 8,
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  heroMetaText: {
    color: appColors.textSecondary,
    fontSize: 13,
  },
  heroPatch: {
    borderRadius: 20,
    height: 92,
    width: 92,
  },
  heroPatchFallback: {
    alignItems: 'center',
    backgroundColor: '#12314A',
    justifyContent: 'center',
  },
  heroPatchFallbackText: {
    color: appColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  heroRegular: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  heroSubtitle: {
    color: appColors.textSecondary,
    fontSize: 16,
  },
  launchpadTitle: {
    color: appColors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
  },
  mediaFallback: {
    alignItems: 'center',
    backgroundColor: '#12314A',
    justifyContent: 'center',
  },
  mediaFallbackText: {
    color: appColors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  mediaPreview: {
    alignSelf: 'center',
    borderRadius: 24,
    height: 180,
    marginVertical: 6,
    width: 180,
  },
  outcomeHeadline: {
    color: appColors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  panel: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  sectionBody: {
    color: appColors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    marginTop: 8,
  },
  sectionTitle: {
    color: appColors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#143852',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    color: appColors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  tabChip: {
    borderColor: appColors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tabChipActive: {
    backgroundColor: appColors.accent,
    borderColor: appColors.accent,
  },
  tabChipText: {
    color: appColors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabChipTextActive: {
    color: appColors.textPrimary,
  },
  tabContent: {
    gap: 16,
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  title: {
    color: appColors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
  },
});

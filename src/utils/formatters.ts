import dayjs from 'dayjs';

export function formatMissionDate(date: string): string {
  return dayjs(date).format('DD MMM YYYY, HH:mm [UTC]');
}

export function formatLastSyncedTime(date: string | null): string {
  if (!date) {
    return 'Never synced';
  }

  return dayjs(date).format('DD MMM YYYY, HH:mm');
}

import { useTranslation } from 'react-i18next';
import { DatePickerInput } from '@/components/common/DatePickerInput';
import { cn } from '@/lib/utils';

export type AnalyticsFilterType = 'today' | 'monthly' | 'yearly' | 'day' | 'range';

interface AnalyticsDateFilterProps {
  filter: AnalyticsFilterType;
  onFilterChange: (filter: AnalyticsFilterType) => void;
  selectedDay: string;
  onSelectedDayChange: (value: string) => void;
  rangeStart: string;
  rangeEnd: string;
  onRangeStartChange: (value: string) => void;
  onRangeEndChange: (value: string) => void;
}

const TAB_FILTERS: AnalyticsFilterType[] = ['today', 'monthly', 'yearly', 'day', 'range'];

export function AnalyticsDateFilter({
  filter,
  onFilterChange,
  selectedDay,
  onSelectedDayChange,
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
}: AnalyticsDateFilterProps) {
  const { t } = useTranslation();

  const tabLabel = (f: AnalyticsFilterType) => {
    switch (f) {
      case 'today':
        return t('analytics.today', { defaultValue: 'Today' });
      case 'day':
        return t('analytics.pick_day', { defaultValue: 'Day' });
      case 'range':
        return t('analytics.range', { defaultValue: 'Range' });
      default:
        return t(`analytics.${f}`);
    }
  };

  return (
    <div className="animate-fade-in space-y-3">
      <div className="flex gap-1 overflow-x-auto rounded-lg bg-secondary/50 p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TAB_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onFilterChange(f)}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              filter === f
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
            )}
          >
            {tabLabel(f)}
          </button>
        ))}
      </div>

      {filter === 'day' && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            {t('analytics.select_day_hint', { defaultValue: 'Choose a date to view its transactions' })}
          </p>
          <DatePickerInput
            id="analytics-day"
            value={selectedDay}
            onChange={onSelectedDayChange}
            className="h-10"
          />
        </div>
      )}

      {filter === 'range' && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t('analytics.range_start', { defaultValue: 'Start date' })}
            </p>
            <DatePickerInput
              id="analytics-range-start"
              value={rangeStart}
              onChange={onRangeStartChange}
              className="h-10"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t('analytics.range_end', { defaultValue: 'End date' })}
            </p>
            <DatePickerInput
              id="analytics-range-end"
              value={rangeEnd}
              onChange={onRangeEndChange}
              className="h-10"
            />
          </div>
        </div>
      )}
    </div>
  );
}

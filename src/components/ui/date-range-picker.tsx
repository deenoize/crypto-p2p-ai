import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

export interface DateRangePickerProps {
  timeRanges: { label: string; value: string }[];
  value: string | DateRange;
  onChange: (value: string | DateRange) => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  timeRanges,
  value,
  onChange,
}) => {
  const [date, setDate] = React.useState<DateRange | undefined>(
    typeof value === 'object' ? value : undefined
  );

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange(range || '24h');
  };

  return (
    <div className="flex items-center space-x-2">
      {timeRanges.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? 'default' : 'outline'}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </Button>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={typeof value === 'object' ? 'default' : 'outline'}
            className="w-[300px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {typeof value === 'object' ? (
              value.from ? (
                value.to ? (
                  <>
                    {format(value.from, 'LLL dd, y')} -{' '}
                    {format(value.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(value.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}; 
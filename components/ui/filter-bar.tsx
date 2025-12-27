import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Card } from '@/components/ui';
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from 'react-icons/hi2';

export interface FilterOption {
  label: string;
  value: string;
  placeholder?: string;
  options: Array<{ label: string; value: string }>;
  onValueChange: (value: string) => void;
}

export interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: FilterOption[];
  onReset?: () => void;
  showReset?: boolean;
  variant?: 'default' | 'minimal';
  className?: string;
}

export function FilterBar({
  searchPlaceholder = 'Rechercher...',
  searchValue = '',
  onSearchChange,
  filters = [],
  onReset,
  showReset = false,
  variant = 'default',
  className = ''
}: FilterBarProps) {
  const content = (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {onSearchChange && (
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {filters.map((filter, index) => (
        <Select
          key={index}
          value={filter.value}
          onValueChange={filter.onValueChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={filter.placeholder || filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {showReset && onReset && (
        <Button
          variant="outline"
          onClick={onReset}
          className="w-full sm:w-auto"
        >
          <HiOutlineXMark className="size-4 mr-2" />
          Réinitialiser
        </Button>
      )}
    </div>
  );

  if (variant === 'minimal') {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={`p-4 border-0m ${className}`}>
      {content}
    </Card>
  );
}

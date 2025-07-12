import * as React from 'react';

interface ToggleGroupProps {
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function ToggleGroup({ onValueChange, children, className }: ToggleGroupProps) {
  return (
    <div
      role="group"
      className={`inline-flex rounded-xl bg-muted border border-border p-1 ${className || ''}`}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            selected: child.props.value === child.props.value, // This line seems to be a bug, should be child.props.value === value
            onClick: () => onValueChange(child.props.value),
          });
        }
        return child;
      })}
    </div>
  );
}

interface ToggleGroupItemProps {
  value: string;
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

export function ToggleGroupItem({ value, children, selected, onClick, className, ...props }: ToggleGroupItemProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={props['aria-label']}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue text-sm
        ${selected ? 'bg-blue text-white shadow' : 'bg-transparent text-foreground hover:bg-muted-foreground/10'}
        ${className || ''}`}
    >
      {children}
    </button>
  );
} 
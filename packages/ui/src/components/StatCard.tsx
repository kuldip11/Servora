import type { ComponentType  } from 'react';
import { cn } from '../utils/cn';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'violet',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  trend?: { value: number; label: string };
  color?: 'violet' | 'emerald' | 'amber' | 'blue' | 'red';
}) {
  const colors = {
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colors[color])}>
          <Icon aria-hidden="true" className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
      {trend && (
        <p className={cn('text-xs font-medium', trend.value >= 0 ? 'text-success' : 'text-danger')}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}

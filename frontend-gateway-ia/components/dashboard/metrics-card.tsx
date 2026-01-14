import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

export function MetricsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  loading = false,
}: MetricsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium sm:text-sm">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 animate-pulse rounded bg-muted"></div>
            {description && (
              <div className="h-4 w-32 animate-pulse rounded bg-muted"></div>
            )}
          </div>
        ) : (
          <>
            <div className="text-xl font-bold sm:text-2xl">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {trend && (
              <div
                className={`mt-1 flex items-center text-xs ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <span>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="ml-1 text-muted-foreground">vs ayer</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

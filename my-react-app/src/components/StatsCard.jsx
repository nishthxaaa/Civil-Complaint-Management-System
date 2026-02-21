import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export const StatsCard = ({ title, value, icon: Icon, variant = 'default', trend }) => {
  const variantClasses = {
      default: 'bg-card border-border', // White/Default
      success: 'bg-green-50 text-green-900 border-green-100', // Light Green
      warning: 'bg-yellow-50 text-yellow-900 border-yellow-100', // Light Yellow
      danger: 'bg-red-50 text-red-900 border-red-100',
  };

  const iconClasses = {
  default: 'text-primary bg-primary/10',
  success: 'text-green-600 bg-green-100',
  warning: 'text-yellow-600 bg-yellow-100',
  danger: 'text-red-600 bg-red-100',
  };

  return (
    <Card className={cn('transition-all hover:shadow-lg', variantClasses[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn(
                'text-xs mt-2',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : '-'}
                {Math.abs(trend.value)}% from last month
              </p>
            )}
          </div>

          <div className={cn('p-3 rounded-lg bg-background/50', iconClasses[variant])}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * بطاقة الإحصائيات
 * S-ACM Frontend - Clean Tech Dashboard Theme
 */

import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const variantStyles = {
  default: "bg-primary/10 text-primary",
  primary: "bg-primary/10 text-primary",
  success: "bg-green-500/10 text-green-500",
  warning: "bg-yellow-500/10 text-yellow-500",
  info: "bg-blue-500/10 text-blue-500",
  danger: "bg-red-500/10 text-red-500",
} as const;

type Variant = keyof typeof variantStyles;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  variant?: Variant;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  trend,
  description,
  className
}: StatCardProps) {
  return (
    <Card className={cn("card-hover", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-sm",
                trend.isPositive ? "text-emerald-500" : "text-red-500"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-muted-foreground">من الأسبوع الماضي</span>
              </div>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", variantStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


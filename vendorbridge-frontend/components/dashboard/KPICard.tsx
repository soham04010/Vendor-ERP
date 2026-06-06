import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function KPICard({ title, value, icon, description, trend }: KPICardProps) {
  return (
    <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            {icon}
          </div>
        </div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-4 text-xs">
            {trend && (
              <span className={`font-semibold px-1.5 py-0.5 rounded ${
                trend.isPositive 
                  ? 'text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-950/30' 
                  : 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-950/30'
              }`}>
                {trend.value}
              </span>
            )}
            {description && <span className="text-gray-500 dark:text-gray-400">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

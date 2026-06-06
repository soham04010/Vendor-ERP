import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  action: string;
  description: string;
  created_at: string;
  user?: {
    name: string;
  };
  users?: {
    name: string;
  };
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">System Activity Logs</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.length === 0 ? (
            <li className="text-xs text-gray-500 py-4 text-center">No recent activity</li>
          ) : (
            activities.map((act, actIdx) => {
              const userName = act.user?.name || act.users?.name || 'System';
              return (
                <li key={act.id}>
                  <div className="relative pb-8">
                    {actIdx !== activities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center ring-8 ring-white dark:ring-gray-900 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                          {act.action.split('.')[0]?.substring(0, 2) || 'AC'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-gray-900 dark:text-white">
                            <span className="font-semibold">{userName}</span>{' '}
                            {act.description}
                          </p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap text-gray-500">
                          {formatDistanceToNow(new Date(act.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}

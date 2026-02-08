import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotifications(user?.id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">通知中心</h1>
        <button 
          onClick={() => markAllAsRead()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          全部标为已读
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            暂无通知
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id}
              className={clsx(
                "p-4 hover:bg-slate-50 transition-colors cursor-pointer",
                !notification.isRead ? "bg-blue-50/50" : ""
              )}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex justify-between items-start">
                <h3 className={clsx("text-sm font-medium", !notification.isRead ? "text-slate-900" : "text-slate-700")}>
                  {notification.title}
                </h3>
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <div className="pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-800">
            {/* 面包屑或页面标题 */}
            简历跟踪系统
          </h2>
          <div className="flex items-center space-x-4">
            <NotificationBell />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

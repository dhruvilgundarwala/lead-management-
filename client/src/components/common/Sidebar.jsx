import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Users, Mail, Calendar, Settings, PieChart, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';
import useAuthStore from '../../store/authStore';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'AI Search', href: '/app/search', icon: Search },
  { name: 'Leads', href: '/app/leads', icon: Users },
  { name: 'Campaigns', href: '/app/campaigns', icon: Mail },
  { name: 'Follow-ups', href: '/app/follow-ups', icon: Calendar },
  { name: 'History', href: '/app/history', icon: Activity },
  { name: 'Analytics', href: '/app/analytics', icon: PieChart },
];

export const Sidebar = () => {
  const user = useAuthStore(state => state.user);

  return (
    <div className="hidden lg:flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 shrink-0 items-center px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900">AI Lead Finder</span>
        </div>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500',
                      'mr-3 h-5 w-5 flex-shrink-0'
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
          
          {user?.role === 'ADMIN' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors mt-6'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Settings
                    className={cn(
                      isActive ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-500',
                      'mr-3 h-5 w-5 flex-shrink-0'
                    )}
                  />
                  Admin Panel
                </>
              )}
            </NavLink>
          )}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4">
        <NavLink
          to="/app/settings"
          className="group flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-slate-500">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium text-slate-900">{user?.name}</span>
            <span className="truncate text-xs text-slate-500">{user?.email}</span>
          </div>
        </NavLink>
      </div>
    </div>
  );
};

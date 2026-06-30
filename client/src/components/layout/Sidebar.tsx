import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  LogOut,
  Droplets,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.DASHBOARD,
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'BLOOD_BANK_STAFF'],
  },
  {
    label: 'Staff Management',
    path: ROUTES.STAFF,
    icon: <Users className="w-5 h-5" />,
    roles: ['HOSPITAL_ADMIN'],
  },
  {
    label: 'Audit Logs',
    path: ROUTES.AUDIT_LOGS,
    icon: <ClipboardList className="w-5 h-5" />,
    roles: ['HOSPITAL_ADMIN'],
  },
  {
    label: 'Hospital Profile',
    path: ROUTES.PROFILE,
    icon: <Settings className="w-5 h-5" />,
    roles: ['HOSPITAL_ADMIN'],
  },
  {
    label: 'Hospital Approvals',
    path: ROUTES.ADMIN_HOSPITALS,
    icon: <Building2 className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
  },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-slate-900 text-white z-40
        flex flex-col transition-all duration-300 ease-out
        ${collapsed ? 'w-[72px]' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex-shrink-0">
          <Droplets className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight truncate">HemoExchange</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">AI Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            {user.hospital && (
              <p className="text-xs text-blue-400 truncate mt-0.5">
                {user.hospital.name}
              </p>
            )}
          </div>
        )}
        <button
          onClick={signOut}
          className={`
            flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium
            text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all duration-200
          `}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600
          flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>
    </aside>
  );
}

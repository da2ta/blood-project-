import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants';

export function Header() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
      <div className="flex items-center justify-between h-full px-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 border-0 text-sm
              placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500
              transition-all duration-200"
          />
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Notification bell (placeholder for Phase 4) */}
          <button
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-slate-500" />
          </button>

          {/* User avatar */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600
                flex items-center justify-center text-white text-sm font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">
                  {ROLES[user.role as keyof typeof ROLES]}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

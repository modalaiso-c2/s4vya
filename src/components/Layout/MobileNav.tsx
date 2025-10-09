import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Lightbulb, User } from 'lucide-react';

export const MobileNav = () => {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
    { to: '/insights', label: 'Conseils', icon: Lightbulb },
    { to: '/profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-smooth min-w-[70px] ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

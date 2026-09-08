import React, { useState } from 'react';
import {
  Bell,
  LogOut,
  HelpCircle,
  User as UserIcon,
  Shield,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  BookOpen,
  Check,
  Smartphone,
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { db } from '../services/db';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onOpenHelp: () => void;
  onOpenProfile: () => void;
  onNavigateHome: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenHelp,
  onOpenProfile,
  onNavigateHome,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    db.getNotifications(user.id)
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    db.markNotificationAsRead(id);
    setNotifications(db.getNotifications(user.id));
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'administrador':
        return {
          label: 'Administrador',
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Shield,
        };
      case 'profesor':
        return {
          label: 'Profesor',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: BookOpen,
        };
      case 'estudiante':
      default:
        return {
          label: 'Estudiante',
          bg: 'bg-lime-100 text-lime-800 border-lime-200',
          icon: GraduationCap,
        };
    }
  };

  const roleBadge = getRoleBadge(user.role);
  const RoleIcon = roleBadge.icon;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Mobile sidebar toggle + Brand Logo */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              id="btn-sidebar-toggle"
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition"
              aria-label="Abrir menú"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <button
            id="btn-brand-home"
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#188E40] to-[#126830] text-white shadow-md shadow-[#188E40]/20 group-hover:scale-105 transition">
              <img
                src="/clover-icon.svg"
                alt="Clover Hills Emblem"
                className="w-7 h-7 object-contain drop-shadow-sm"
              />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#F39200] border-2 border-white ring-1 ring-[#F39200]/30" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-tight text-slate-900">CLOVER</span>
                <span className="px-1.5 py-0.2 rounded text-[11px] font-black bg-[#F39200] text-white tracking-wide shadow-xs">
                  IA
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase -mt-0.5">
                Clover Hills Educative System
              </span>
            </div>
          </button>
        </div>

        {/* Center: Global Status / PWA Badge */}
        <div className="hidden md:flex items-center gap-2">
          <PWAInstallButton />
        </div>

        {/* Right: User status, Notifications, Help & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-notifications"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 hover:text-[#188E40] hover:bg-slate-100 transition focus:outline-none"
              title="Notificaciones escolares"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#F39200] text-[10px] font-bold text-white shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                id="popover-notifications"
                className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white p-3 shadow-2xl border border-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#188E40]" />
                    <span className="font-bold text-sm text-slate-800">Notificaciones</span>
                  </div>
                  <span className="text-xs text-slate-400">{unreadCount} nuevas</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50 mt-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No tienes notificaciones pendientes
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-xl transition ${
                          notif.read ? 'bg-white opacity-70' : 'bg-[#F8FAF6]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.date}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{notif.message}</p>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif.id)}
                            className="mt-2 flex items-center gap-1 text-[11px] font-medium text-[#188E40] hover:underline"
                          >
                            <Check className="w-3 h-3" />
                            Marcar como leída
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Help Button */}
          <button
            id="btn-help"
            onClick={onOpenHelp}
            className="p-2 rounded-xl text-slate-600 hover:text-[#188E40] hover:bg-slate-100 transition focus:outline-none"
            title="Ayuda y tutorial de CLOVER IA"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* User Profile Pill */}
          <button
            id="btn-user-profile"
            onClick={onOpenProfile}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition focus:outline-none"
            title="Ver mi perfil"
          >
            <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-600" />
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {user.fullName.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
            </div>
          </button>

          {/* Logout Button */}
          <button
            id="btn-logout"
            onClick={onLogout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition focus:outline-none"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};

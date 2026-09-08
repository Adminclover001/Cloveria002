import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, Eye, EyeOff, LogOut } from 'lucide-react';
import { User } from '../types';
import { db, hashPassword } from '../services/db';

interface FirstLoginPasswordChangeModalProps {
  user: User;
  onPasswordChanged: (updatedUser: User) => void;
  onLogout?: () => void;
}

export const FirstLoginPasswordChangeModal: React.FC<FirstLoginPasswordChangeModalProps> = ({
  user,
  onPasswordChanged,
  onLogout,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    if (newPassword === 'Clover2026!' || newPassword === 'CloverHills2026!') {
      setError('No puedes utilizar la contraseña temporal inicial. Elige una nueva contraseña personal.');
      return;
    }

    if (hashPassword(newPassword) === user.passwordHash) {
      setError('La nueva contraseña no puede ser idéntica a tu clave temporal actual.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const success = db.updateUserPassword(user.id, newPassword);
      if (success) {
        const updated = db.getUserById(user.id);
        if (updated) {
          db.setActiveUser(updated);
          onPasswordChanged(updated);
        }
      } else {
        setError('Ocurrió un error al actualizar la contraseña. Intenta nuevamente.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5 text-[#F39200]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Cambio Obligatorio de Contraseña</h3>
            <p className="text-xs text-slate-500">Primer inicio de sesión en Clover Hills</p>
          </div>
        </div>

        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-800 leading-relaxed flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#F39200] shrink-0 mt-0.5" />
          <div>
            Hola <strong>{user.fullName}</strong>. Por políticas de seguridad institucional, debes cambiar tu contraseña temporal antes de acceder a la plataforma escolar.
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Vuelve a escribirla"
                required
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Establecer Contraseña y Continuar</span>
                </>
              )}
            </button>
          </div>

          {onLogout && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-slate-400 hover:text-rose-600 font-medium inline-flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cancelar y cerrar sesión</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

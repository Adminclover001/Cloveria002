import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  GraduationCap,
  BookOpen,
  Shield,
  ArrowRight,
  HelpCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { db, hashPassword } from '../services/db';
import { User as UserType } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleDirectAdminLogin = () => {
    setLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      const adminUser = db.getUsers().find((u) => u.role === 'administrador');
      if (adminUser) {
        db.setActiveUser(adminUser);
        db.addAuditLog({
          userId: adminUser.id,
          userName: adminUser.fullName,
          userRole: adminUser.role,
          action: 'INICIO_SESION_ADMIN',
          details: `Acceso directo como Administrador para configuración inicial de perfil.`,
        });
        setLoading(false);
        onLoginSuccess(adminUser);
      } else {
        setErrorMsg('No se encontró la cuenta de Administrador. Por favor recarga la página.');
        setLoading(false);
      }
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Por favor introduce tu nombre de usuario y contraseña.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const user = db.getUserByUsername(username);

      if (!user) {
        setErrorMsg('Usuario no encontrado en Clover Hills. Verifica tu nombre de usuario.');
        setLoading(false);
        return;
      }

      // Restrict to administrator for now
      if (user.role !== 'administrador') {
        setErrorMsg('Por el momento el acceso está reservado exclusivamente para la cuenta de Administrador.');
        setLoading(false);
        return;
      }

      if (!user.active) {
        setErrorMsg('Esta cuenta ha sido desactivada temporalmente por la dirección escolar.');
        setLoading(false);
        return;
      }

      const inputHash = hashPassword(password);
      if (user.passwordHash !== inputHash) {
        setErrorMsg('Contraseña incorrecta. Por favor intenta de nuevo.');
        setLoading(false);
        return;
      }

      // Record audit log
      db.addAuditLog({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        action: 'INICIO_SESION',
        details: `Inicio de sesión exitoso como Administrador desde el portal escolar.`,
      });

      if (rememberMe) {
        db.setActiveUser(user);
      }

      setLoading(false);
      onLoginSuccess(user);
    }, 350);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF6] flex flex-col justify-between selection:bg-[#F39200]/20 selection:text-[#F39200]">
      {/* Top Header */}
      <header className="w-full py-4 px-6 flex justify-between items-center border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#188E40] flex items-center justify-center text-white shadow-md shadow-[#188E40]/20">
            <img src="/clover-icon.svg" alt="Clover Emblem" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">CLOVER IA</span>
            <span className="hidden sm:inline text-xs text-slate-500 font-medium ml-2">
              • Clover Hills Educative System
            </span>
          </div>
        </div>

        <button
          id="btn-about-clover"
          onClick={() => setShowAboutModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#188E40] hover:text-[#126830] bg-[#188E40]/10 hover:bg-[#188E40]/15 px-3 py-1.5 rounded-full transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F39200]" />
          <span>Conocer CLOVER IA</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/60 border border-slate-100 relative overflow-hidden">
            
            {/* Top Accent Gradient Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#188E40] via-[#96C22E] to-[#F39200]" />

            {/* School Emblem & Title */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#188E40]/10 to-[#96C22E]/20 text-[#188E40] mb-3 shadow-inner">
                <img src="/clover-icon.svg" alt="Clover IA Logo" className="w-12 h-12 drop-shadow-sm" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                CLOVER <span className="text-[#F39200]">IA</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Tu asistente inteligente para aprender y enseñar
              </p>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div
                id="login-error-alert"
                className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-start gap-2.5 animate-shake"
              >
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  !
                </span>
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Direct Admin Entrance Button for quick access */}
            <div className="mb-4">
              <button
                type="button"
                id="btn-direct-admin-login"
                onClick={handleDirectAdminLogin}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#188E40] via-[#157c37] to-[#126830] hover:brightness-105 active:scale-98 text-white font-bold text-sm shadow-md shadow-[#188E40]/20 transition flex items-center justify-center gap-2.5"
              >
                <Shield className="w-5 h-5 text-[#F39200]" />
                <span>Acceder como Administrador (1 Clic)</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-slate-200/80"></div>
              <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                o ingresar con contraseña
              </span>
              <div className="flex-grow border-t border-slate-200/80"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario institucional"
                    autoComplete="username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 text-sm text-slate-900 bg-white placeholder:text-slate-400 transition"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Contraseña
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-200 focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 text-sm text-slate-900 bg-white placeholder:text-slate-400 transition"
                  />
                  <button
                    type="button"
                    id="btn-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
                  <input
                    id="checkbox-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#188E40] focus:ring-[#188E40] border-slate-300"
                  />
                  <span>Recordar sesión</span>
                </label>

                <span className="text-[11px] text-slate-400">Acceso institucional seguro</span>
              </div>

              {/* Submit Button (Orange Action Button) */}
              <button
                id="btn-submit-login"
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-[#F39200] hover:bg-[#d88200] active:scale-98 text-white font-bold text-sm shadow-md shadow-[#F39200]/25 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Institutional Security Notice */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3.5 text-center">
                <p className="text-[11px] font-semibold text-slate-700">
                  Portal Institucional Clover Hills
                </p>
                <p className="text-[10.5px] text-slate-500 mt-1 leading-relaxed">
                  Ingresa con las credenciales oficiales emitidas por la administración escolar. Si es tu primer ingreso o tu clave fue restablecida, el sistema te solicitará definir una nueva contraseña personalizada.
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-[#188E40]" />
                  <span>Acceso de Administrador inicial: <strong className="text-slate-600 font-mono">admin</strong> / <strong className="text-slate-600 font-mono">CloverHills2026!</strong></span>
                </div>
              </div>
            </div>

          </div>
          
          <p className="mt-4 text-center text-xs text-slate-400">
            © 2026 Clover Hills Educative System. Todos los derechos reservados.
          </p>
        </div>
      </main>

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#188E40] flex items-center justify-center text-white">
                  <Sparkles className="w-5 h-5 text-[#F39200]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Sobre CLOVER IA</h3>
                  <p className="text-xs text-slate-500">Asistente Educativo Inteligente</p>
                </div>
              </div>
              <button
                onClick={() => setShowAboutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <p>
                <strong>CLOVER IA</strong> es la plataforma educativa diseñada exclusivamente para <strong>Clover Hills Educative System</strong>, creada para apoyar tanto a estudiantes como a docentes dentro y fuera del aula.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-lime-50 border border-lime-100">
                  <GraduationCap className="w-5 h-5 text-[#188E40] mb-1.5" />
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Para Estudiantes</h4>
                  <p className="text-[11px] text-slate-600">
                    Tutor inteligente paso a paso, modo "Aprender conmigo", ayuda con tareas sin dependencia, y resúmenes guiados.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <BookOpen className="w-5 h-5 text-[#188E40] mb-1.5" />
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Para Profesores</h4>
                  <p className="text-[11px] text-slate-600">
                    Planificador de clases, generador de exámenes editables, rúbricas de evaluación y análisis de grupos.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
                  <Shield className="w-5 h-5 text-[#F39200] mb-1.5" />
                  <h4 className="font-bold text-slate-900 text-xs mb-1">Para la Escuela</h4>
                  <p className="text-[11px] text-slate-600">
                    Administración segura con credenciales únicas, registro de auditoría y protección infantil responsable.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-600">
                <Info className="w-4 h-4 text-[#188E40] shrink-0 mt-0.5" />
                <p>
                  <strong>IA Responsable:</strong> CLOVER IA no sustituye al profesor. Todos los contenidos creados por la IA para clases deben ser revisados y aprobados por el docente.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAboutModal(false)}
              className="mt-6 w-full rounded-xl bg-[#188E40] py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#126830] transition"
            >
              Comenzar a usar CLOVER IA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

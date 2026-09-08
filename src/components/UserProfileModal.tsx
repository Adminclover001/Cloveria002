import React, { useState, useRef } from 'react';
import {
  X,
  User as UserIcon,
  Camera,
  Upload,
  Link,
  Image as ImageIcon,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { User } from '../types';
import { db, hashPassword } from '../services/db';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: User) => void;
}

// Curated professional institutional avatars
const PRESET_AVATARS = [
  {
    label: 'Administradora Ejecutiva',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=250&auto=format&fit=crop&q=80',
  },
  {
    label: 'Administrador Directivo',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80',
  },
  {
    label: 'Directora Académica',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
  },
  {
    label: 'Coordinador Escolar',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
  },
  {
    label: 'Gestión Institucional',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
  },
  {
    label: 'Liderazgo Clover',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=250&auto=format&fit=crop&q=80',
  },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState<string>(user.avatar || '');
  const [avatarTab, setAvatarTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState('');

  // Password change state
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status state
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // File upload handler converting image to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, GIF).');
      return;
    }

    // Limit size to 4MB for localStorage stability
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg('La imagen seleccionada supera los 4MB. Por favor elige una imagen más ligera.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setAvatar(base64);
        setErrorMsg('');
        setSuccessMsg('Foto cargada correctamente. Recuerda presionar "Guardar Cambios".');
      }
    };
    reader.onerror = () => {
      setErrorMsg('Ocurrió un error al leer la imagen seleccionada.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setAvatar(customUrl.trim());
    setErrorMsg('');
    setSuccessMsg('URL de imagen aplicada. Recuerda presionar "Guardar Cambios".');
  };

  const handleSelectPreset = (url: string) => {
    setAvatar(url);
    setErrorMsg('');
    setSuccessMsg('Avatar institucional seleccionado. Recuerda presionar "Guardar Cambios".');
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    setErrorMsg('');
    setSuccessMsg('Foto de perfil removida. Se mostrarán las iniciales de tu nombre.');
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // max 5
  };

  const passStrength = getPasswordStrength(newPassword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setErrorMsg('El nombre completo es obligatorio.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      setErrorMsg('El nombre de usuario es obligatorio.');
      return;
    }

    // Check username uniqueness
    const existing = db
      .getUsers()
      .find((u) => u.id !== user.id && u.username.toLowerCase() === cleanUsername);
    if (existing) {
      setErrorMsg(`El nombre de usuario "${cleanUsername}" ya está en uso. Por favor elige otro.`);
      return;
    }

    // Password validation if requested
    let updatedPasswordHash = user.passwordHash;
    if (changePassword) {
      if (!newPassword) {
        setErrorMsg('Por favor ingresa la nueva contraseña.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Las contraseñas no coinciden. Verifica ambas casillas.');
        return;
      }
      updatedPasswordHash = hashPassword(newPassword);
    }

    setIsSaving(true);

    try {
      const updatedUser: User = {
        ...user,
        fullName: fullName.trim(),
        username: cleanUsername,
        avatar: avatar || undefined,
        passwordHash: updatedPasswordHash,
        firstLogin: false, // Ensure account is marked as initialized
      };

      db.saveUser(updatedUser);
      db.setCurrentUser(updatedUser);

      // Audit log
      db.addAuditLog({
        userId: user.id,
        userName: updatedUser.fullName,
        userRole: user.role,
        action: 'PERFIL_ACTUALIZADO',
        details: `El administrador ${updatedUser.username} actualizó su perfil institucional (Nombre: "${updatedUser.fullName}", Foto: ${avatar ? 'Sí' : 'No'}, Cambio de clave: ${changePassword ? 'Sí' : 'No'}).`,
      });

      onUserUpdated(updatedUser);
      setSuccessMsg('¡Perfil actualizado con éxito!');

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error(err);
      setErrorMsg('Ocurrió un problema al guardar los cambios en el almacenamiento.');
      setIsSaving(false);
    }
  };

  // Get initials for placeholder
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'AD';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-[#188E40] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Shield className="w-5 h-5 text-[#F39200]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">Mi Perfil</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F39200] text-white uppercase tracking-wider">
                  Administrador
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Personaliza tu nombre, foto de perfil y contraseña de acceso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition focus:outline-none"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* Notifications / Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#188E40]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Photo / Avatar Customization */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#188E40]" />
                Foto de Perfil
              </label>
              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="w-3 h-3" />
                  Quitar foto
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md ring-2 ring-[#188E40]/30 bg-white flex items-center justify-center">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={fullName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#188E40] to-[#126830] flex items-center justify-center text-white font-black text-2xl tracking-wider">
                      {initials}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#F39200] hover:bg-[#d88200] text-white shadow-md transition"
                  title="Subir nueva foto"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Photo Options Tabs */}
              <div className="flex-1 w-full space-y-3">
                <div className="flex rounded-xl bg-slate-200/60 p-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAvatarTab('upload')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      avatarTab === 'upload'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Subir Archivo
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatarTab('preset')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      avatarTab === 'preset'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F39200]" />
                    Galería
                  </button>

                  <button
                    type="button"
                    onClick={() => setAvatarTab('url')}
                    className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                      avatarTab === 'url'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    URL Web
                  </button>
                </div>

                {/* Subir archivo */}
                {avatarTab === 'upload' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-[#188E40] rounded-xl p-3.5 text-center cursor-pointer bg-white/70 hover:bg-emerald-50/40 transition group"
                    >
                      <Upload className="w-5 h-5 mx-auto text-slate-400 group-hover:text-[#188E40] mb-1" />
                      <p className="text-xs font-bold text-slate-700">
                        Haz clic para seleccionar una foto de tu equipo
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Formatos soportados: JPG, PNG, WEBP (hasta 4MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Galería institucional */}
                {avatarTab === 'preset' && (
                  <div className="space-y-1.5">
                    <p className="text-[10.5px] text-slate-500">
                      Selecciona un avatar institucional predefinido:
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {PRESET_AVATARS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPreset(p.url)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition hover:scale-105 ${
                            avatar === p.url
                              ? 'border-[#188E40] ring-2 ring-[#188E40]/30'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                          title={p.label}
                        >
                          <img
                            src={p.url}
                            alt={p.label}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Enlace URL */}
                {avatarTab === 'url' && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/mi-foto.jpg"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#188E40] focus:ring-1 focus:ring-[#188E40]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCustomUrl}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Personal Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <UserIcon className="w-4 h-4 text-[#188E40]" />
              Información de la Cuenta
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Ana Katalina Fonseca Pérez"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de Usuario (Login)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    required
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-slate-900 focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Password Change */}
          <div className="rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-4 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#F39200]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Seguridad y Contraseña
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={changePassword}
                  onChange={(e) => {
                    setChangePassword(e.target.checked);
                    if (!e.target.checked) {
                      setNewPassword('');
                      setConfirmPassword('');
                    }
                  }}
                  className="w-4 h-4 rounded text-[#188E40] focus:ring-[#188E40]"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Modificar mi contraseña
                </span>
              </label>
            </div>

            {changePassword && (
              <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required={changePassword}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Confirmar Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        required={changePassword}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Fuerza de la clave:</span>
                      <span
                        className={`font-bold ${
                          passStrength <= 2
                            ? 'text-rose-600'
                            : passStrength <= 3
                            ? 'text-amber-600'
                            : 'text-[#188E40]'
                        }`}
                      >
                        {passStrength <= 2
                          ? 'Baja'
                          : passStrength <= 3
                          ? 'Media'
                          : 'Alta y Segura'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          passStrength >= 1
                            ? passStrength <= 2
                              ? 'bg-rose-500 w-1/3'
                              : passStrength <= 3
                              ? 'bg-amber-500 w-2/3'
                              : 'bg-[#188E40] w-full'
                            : 'w-0'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#188E40] hover:bg-[#126830] disabled:bg-slate-300 text-white text-xs font-bold shadow-md shadow-[#188E40]/25 transition"
            >
              {isSaving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

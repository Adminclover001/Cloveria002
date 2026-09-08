import React, { useState } from 'react';
import {
  Shield,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  KeyRound,
  FileText,
  Activity,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Printer,
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { User, Course, Subject, Group, AuditLog, UserRole } from '../types';
import { db, hashPassword } from '../services/db';

interface AdminDashboardProps {
  user: User;
  onOpenProfile?: () => void;
}

type AdminTab =
  | 'resumen'
  | 'usuarios'
  | 'estudiantes'
  | 'profesores'
  | 'cursos'
  | 'materias'
  | 'grupos'
  | 'auditoria'
  | 'seguridad';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onOpenProfile }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('resumen');
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [courses, setCourses] = useState<Course[]>(db.getCourses());
  const [subjects, setSubjects] = useState<Subject[]>(db.getSubjects());
  const [groups, setGroups] = useState<Group[]>(db.getGroups());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(db.getAuditLogs());

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // New User Credential Generator Modal
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newCustomUsername, setNewCustomUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('estudiante');
  const [newGrade, setNewGrade] = useState('3° Secundaria');
  const [newSpecialty, setNewSpecialty] = useState('Ciencias Naturales y Matemáticas');
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    temporaryPassword: string;
    fullName: string;
    role: string;
    subject?: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('estudiante');
  const [editGrade, setEditGrade] = useState('3° Secundaria');
  const [editSubject, setEditSubject] = useState('Ciencias Naturales y Matemáticas');
  const [editActive, setEditActive] = useState(true);
  const [editForcePasswordChange, setEditForcePasswordChange] = useState(false);
  const [editError, setEditError] = useState('');

  // Edit Teacher Subject Modal
  const [editingTeacherSubject, setEditingTeacherSubject] = useState<User | null>(null);
  const [newTeacherSubjectValue, setNewTeacherSubjectValue] = useState('Ciencias Naturales y Matemáticas');

  // Reset Password Modal
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [resetPassSuccess, setResetPassSuccess] = useState<string | null>(null);

  // Add Course Modal
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseLevel, setCourseLevel] = useState('Secundaria');

  // Add Subject Modal
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectColor, setSubjectColor] = useState('#188E40');

  // Add Group Modal
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupCourseId, setGroupCourseId] = useState(courses[0]?.id || '');
  const [groupTeacherId, setGroupTeacherId] = useState('usr_teacher_1');

  // Counts
  const totalStudents = users.filter((u) => u.role === 'estudiante').length;
  const totalTeachers = users.filter((u) => u.role === 'profesor').length;
  const totalAdmins = users.filter((u) => u.role === 'administrador').length;

  const handleSaveTeacherSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacherSubject || !newTeacherSubjectValue.trim()) return;
    const updated: User = {
      ...editingTeacherSubject,
      subject: newTeacherSubjectValue.trim(),
      specialty: newTeacherSubjectValue.trim(),
    };
    db.saveUser(updated);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'MODIFICAR_USUARIO',
      details: `Materia oficial del profesor ${updated.fullName} actualizada a "${updated.subject}".`,
    });
    setUsers(db.getUsers());
    setEditingTeacherSubject(null);
  };

  const handleGenerateUserCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) return;

    let targetUsername = newCustomUsername.trim().toLowerCase();
    if (!targetUsername) {
      // Generate clean institutional username (e.g. est_sofia_26)
      const normalizedName = newFullName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .split(' ');
      const prefix = newRole === 'estudiante' ? 'est' : newRole === 'profesor' ? 'prf' : 'adm';
      const cleanFirst = normalizedName[0] || 'user';
      const cleanLast = normalizedName[1] || 'clover';
      targetUsername = `${prefix}_${cleanFirst.slice(0, 4)}_${cleanLast.slice(0, 4)}_${Math.floor(10 + Math.random() * 90)}`;
    }

    // Check username uniqueness
    const existing = users.find((u) => u.username.toLowerCase() === targetUsername);
    if (existing) {
      alert(`El nombre de usuario "${targetUsername}" ya está en uso. Por favor elige otro o deja el campo vacío para auto-generarlo.`);
      return;
    }

    // Generate temporary password
    const temporaryPassword = `Clover#${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: 'usr_' + Date.now(),
      username: targetUsername,
      passwordHash: hashPassword(temporaryPassword),
      role: newRole,
      fullName: newFullName.trim(),
      firstLogin: true, // MUST change password on first login
      active: true,
      createdAt: new Date().toISOString(),
      grade: newRole === 'estudiante' ? newGrade : undefined,
      specialty: newRole === 'profesor' ? newSpecialty : undefined,
      subject: newRole === 'profesor' ? newSpecialty : undefined,
    };

    db.saveUser(newUser);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'CREAR_USUARIO',
      details: `Usuario ${newUser.username} (${newUser.role}) creado con cambio obligatorio de contraseña en primer acceso.${newRole === 'profesor' ? ` Materia asignada: ${newSpecialty}.` : ''}`,
    });

    setUsers(db.getUsers());
    setGeneratedCredentials({
      username: targetUsername,
      temporaryPassword: temporaryPassword,
      fullName: newFullName,
      role: newRole,
      subject: newRole === 'profesor' ? newSpecialty : undefined,
    });
    setNewFullName('');
    setNewCustomUsername('');
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditFullName(u.fullName);
    setEditUsername(u.username);
    setEditRole(u.role);
    setEditGrade(u.grade || '3° Secundaria');
    setEditSubject(u.subject || u.specialty || 'Ciencias Naturales y Matemáticas');
    setEditActive(u.active);
    setEditForcePasswordChange(!!u.firstLogin);
    setEditError('');
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editFullName.trim() || !editUsername.trim()) return;

    const cleanUsername = editUsername.trim().toLowerCase();
    const existing = users.find(
      (u) => u.id !== editingUser.id && u.username.toLowerCase() === cleanUsername
    );
    if (existing) {
      setEditError('El nombre de usuario ya está registrado por otro usuario. Elige uno diferente.');
      return;
    }

    const updated: User = {
      ...editingUser,
      fullName: editFullName.trim(),
      username: cleanUsername,
      role: editRole,
      grade: editRole === 'estudiante' ? editGrade : undefined,
      subject: editRole === 'profesor' ? editSubject : undefined,
      specialty: editRole === 'profesor' ? editSubject : undefined,
      active: editActive,
      firstLogin: editForcePasswordChange,
    };

    db.saveUser(updated);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'MODIFICAR_USUARIO',
      details: `Usuario ${updated.username} modificado. Nombre: ${updated.fullName}, Rol: ${updated.role}, Estado: ${updated.active ? 'Activo' : 'Inactivo'}, Forzar cambio de clave: ${updated.firstLogin ? 'Sí' : 'No'}.`,
    });

    setUsers(db.getUsers());
    setEditingUser(null);
  };

  const handleDeleteUser = (targetUser: User) => {
    if (targetUser.id === user.id) {
      alert('Por motivos de seguridad no puedes eliminar la cuenta de administrador con la que estás en sesión.');
      return;
    }
    if (
      window.confirm(
        `¿Confirmas que deseas eliminar de forma permanente la cuenta de "${targetUser.fullName}" (${targetUser.username})? Esta acción no se puede deshacer.`
      )
    ) {
      db.deleteUser(targetUser.id);
      db.addAuditLog({
        userId: user.id,
        userName: user.fullName,
        userRole: user.role,
        action: 'ELIMINAR_USUARIO',
        details: `Usuario ${targetUser.username} (${targetUser.role}) eliminado permanentemente del sistema.`,
      });
      setUsers(db.getUsers());
    }
  };

  const handleToggleUserActive = (targetUser: User) => {
    const updated = { ...targetUser, active: !targetUser.active };
    db.saveUser(updated);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'ESTADO_USUARIO',
      details: `Usuario ${targetUser.username} cambiado a ${updated.active ? 'ACTIVO' : 'INACTIVO'}.`,
    });
    setUsers(db.getUsers());
  };

  const handleResetPassword = (targetUser: User) => {
    const tempPass = `Clover#${Math.floor(1000 + Math.random() * 9000)}`;
    targetUser.passwordHash = hashPassword(tempPass);
    targetUser.firstLogin = true;
    db.saveUser(targetUser);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'RESTABLECER_CONTRASENA',
      details: `Contraseña de ${targetUser.username} restablecida. Se forzó primer inicio.`,
    });
    setUsers(db.getUsers());
    setResetPassSuccess(tempPass);
  };

  const handleCopyCredentials = () => {
    if (!generatedCredentials) return;
    const text = `=== CLOVER HILLS EDUCATIVE SYSTEM ===
Credenciales de Acceso a CLOVER IA:
Nombre: ${generatedCredentials.fullName}
Rol: ${generatedCredentials.role.toUpperCase()}
Usuario: ${generatedCredentials.username}
Contraseña Temporal: ${generatedCredentials.temporaryPassword}
*IMPORTANTE: El sistema solicitará un cambio obligatorio de contraseña en el primer inicio de sesión.*`;

    navigator.clipboard.writeText(text);
    setCopiedCreds(true);
    setTimeout(() => setCopiedCreds(false), 2000);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const newC: Course = {
      id: 'crs_' + Date.now(),
      name: courseName,
      code: courseCode,
      level: courseLevel,
      description: `Nivel curricular ${courseName}`,
    };
    db.saveCourse(newC);
    setCourses(db.getCourses());
    setShowAddCourse(false);
    setCourseName('');
    setCourseCode('');
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const newS: Subject = {
      id: 'sbj_' + Date.now(),
      name: subjectName,
      code: subjectCode,
      color: subjectColor,
      description: `Asignatura escolar ${subjectName}`,
      icon: 'BookOpen',
    };
    db.saveSubject(newS);
    setSubjects(db.getSubjects());
    setShowAddSubject(false);
    setSubjectName('');
    setSubjectCode('');
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const course = courses.find((c) => c.id === groupCourseId);
    const teacher = users.find((u) => u.id === groupTeacherId);
    const newG: Group = {
      id: 'grp_' + Date.now(),
      name: groupName,
      courseId: groupCourseId,
      courseName: course?.name || 'Curso',
      teacherId: groupTeacherId,
      teacherName: teacher?.fullName || 'Profesor',
      studentCount: 25,
    };
    db.saveGroup(newG);
    setGroups(db.getGroups());
    setShowAddGroup(false);
    setGroupName('');
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase());
    if (activeTab === 'estudiantes') return matchesSearch && u.role === 'estudiante';
    if (activeTab === 'profesores') return matchesSearch && u.role === 'profesor';
    return matchesSearch;
  });

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Admin Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-[#188E40] p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F39200] text-white shadow-sm mb-2">
              <Shield className="w-3.5 h-3.5" /> Administración Institucional
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Control Escolar y Seguridad CLOVER IA
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Gestión centralizada de credenciales, cursos, grupos escolares y registros de auditoría
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenProfile && (
              <button
                id="btn-admin-open-profile"
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition backdrop-blur-xs shadow-xs"
                title="Editar mi nombre, foto de perfil y contraseña"
              >
                <div className="w-5 h-5 rounded-lg overflow-hidden border border-white/40 shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F39200] text-white flex items-center justify-center text-[10px] font-black">
                      {user.fullName[0]}
                    </div>
                  )}
                </div>
                <span>Mi Perfil (Nombre, Foto, Clave)</span>
              </button>
            )}

            <button
              id="btn-admin-create-user"
              onClick={() => {
                setGeneratedCredentials(null);
                setShowCreateUserModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F39200] hover:bg-[#d88200] text-white text-xs font-bold shadow-md shadow-[#F39200]/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Generar Nuevo Usuario y Credenciales</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex overflow-x-auto gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
        {[
          { id: 'resumen', label: 'Resumen', icon: Activity },
          { id: 'usuarios', label: 'Todos los Usuarios', icon: Users },
          { id: 'estudiantes', label: `Estudiantes (${totalStudents})`, icon: GraduationCap },
          { id: 'profesores', label: `Profesores (${totalTeachers})`, icon: BookOpen },
          { id: 'cursos', label: `Cursos (${courses.length})`, icon: Layers },
          { id: 'materias', label: `Materias (${subjects.length})`, icon: BookOpen },
          { id: 'grupos', label: `Grupos (${groups.length})`, icon: Users },
          { id: 'auditoria', label: 'Auditoría y Logs', icon: FileText },
          { id: 'seguridad', label: 'Seguridad y Políticas', icon: Settings },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-[#188E40] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. Tab: Resumen General */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Estudiantes Registrados
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalStudents}</p>
              <span className="text-[11px] text-[#188E40] font-semibold">100% Cuentas Institucionales</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Plantel Docente
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">{totalTeachers}</p>
              <span className="text-[11px] text-slate-500 font-medium">Profesores activos</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Grupos y Aulas
              </span>
              <p className="text-3xl font-black text-slate-900 mt-1">{groups.length}</p>
              <span className="text-[11px] text-slate-500 font-medium">Distribución por turnos</span>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Acciones Registradas
              </span>
              <p className="text-3xl font-black text-[#F39200] mt-1">{auditLogs.length}</p>
              <span className="text-[11px] text-slate-500 font-medium">Trazabilidad en tiempo real</span>
            </div>
          </div>

          {/* Recent Audit Activities */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Actividad Reciente en la Plataforma</h3>
              <button
                onClick={() => setActiveTab('auditoria')}
                className="text-xs font-bold text-[#188E40] hover:underline"
              >
                Ver todos los registros →
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="text-slate-500 ml-2">({log.userRole})</span>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Tab: Gestión de Usuarios (Todos, Estudiantes o Profesores) */}
      {(activeTab === 'usuarios' || activeTab === 'estudiantes' || activeTab === 'profesores') && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          {activeTab === 'profesores' && (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 text-emerald-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#188E40] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Plantel Docente y Asignación de Materias</h4>
                  <p className="text-xs text-slate-600">
                    Gestiona los profesores registrados y la materia/asignatura curricular que imparte cada uno para sus herramientas IA y tareas.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-[#188E40] border border-emerald-200 shadow-xs">
                {totalTeachers} Docentes Activos
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o usuario institucional..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-[#188E40]"
              />
            </div>

            <button
              onClick={() => {
                setGeneratedCredentials(null);
                setShowCreateUserModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="p-3 font-bold">Usuario</th>
                  <th className="p-3 font-bold">Nombre Completo</th>
                  <th className="p-3 font-bold">Rol</th>
                  <th className="p-3 font-bold">Materia / Asignatura</th>
                  <th className="p-3 font-bold">Primer Acceso</th>
                  <th className="p-3 font-bold">Estado</th>
                  <th className="p-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{u.username}</td>
                    <td className="p-3 font-medium text-slate-800">
                      {u.fullName}
                      {u.teacherCode && (
                        <span className="text-slate-400 block text-[10px] font-mono">
                          Cód: {u.teacherCode}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          u.role === 'administrador'
                            ? 'bg-amber-100 text-amber-800'
                            : u.role === 'profesor'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-lime-100 text-lime-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.role === 'profesor' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                            <BookOpen className="w-3.5 h-3.5 text-[#188E40] shrink-0" />
                            <span>{u.subject || u.specialty || 'Ciencias Naturales y Matemáticas'}</span>
                          </span>
                          <button
                            onClick={() => {
                              setEditingTeacherSubject(u);
                              setNewTeacherSubjectValue(u.subject || u.specialty || 'Ciencias Naturales y Matemáticas');
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            title="Modificar materia del docente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : u.role === 'estudiante' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-lime-50 text-lime-900 border border-lime-200 text-[11px] font-semibold">
                          <GraduationCap className="w-3.5 h-3.5 text-[#188E40] shrink-0" />
                          <span>{u.grade || 'Secundaria'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Gestión Institucional</span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.firstLogin ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                          Pendiente de cambio
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Contraseña establecida</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleUserActive(u)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {u.active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            if (u.id === user.id && onOpenProfile) {
                              onOpenProfile();
                            } else {
                              handleOpenEditUser(u);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition ${
                            u.id === user.id
                              ? 'border-[#188E40]/30 bg-[#188E40]/5 text-[#188E40] hover:bg-[#188E40]/10'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                          title={u.id === user.id ? 'Editar mi perfil (nombre, foto y contraseña)' : 'Editar datos, rol y estado del usuario'}
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{u.id === user.id ? 'Mi Perfil' : 'Editar'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setResettingUser(u);
                            handleResetPassword(u);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 flex items-center gap-1 transition"
                          title="Restablecer a contraseña temporal y exigir cambio obligatorio en próximo acceso"
                        >
                          <KeyRound className="w-3 h-3 text-[#F39200]" />
                          <span>Restablecer</span>
                        </button>

                        {u.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Tab: Cursos */}
      {activeTab === 'cursos' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cursos Escolares</h3>
              <p className="text-xs text-slate-500">Grados y niveles educativos oficiales</p>
            </div>
            <button
              onClick={() => setShowAddCourse(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#188E40] text-white text-xs font-bold shadow-xs hover:bg-[#126830]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Curso</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((crs) => (
              <div key={crs.id} className="p-4 rounded-2xl border border-slate-200 bg-[#F8FAF6] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#188E40]">{crs.code}</span>
                <h4 className="text-sm font-bold text-slate-900">{crs.name}</h4>
                <p className="text-xs text-slate-500">{crs.level}</p>
                <p className="text-xs text-slate-600 pt-1">{crs.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab: Materias */}
      {activeTab === 'materias' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Materias y Áreas Académicas</h3>
              <p className="text-xs text-slate-500">Asignaturas con apoyo interactivo de CLOVER IA</p>
            </div>
            <button
              onClick={() => setShowAddSubject(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#188E40] text-white text-xs font-bold shadow-xs hover:bg-[#126830]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Materia</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((sbj) => (
              <div key={sbj.id} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: sbj.color }} />
                  <span className="text-xs font-bold text-slate-900">{sbj.name}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 block">{sbj.code}</span>
                <p className="text-xs text-slate-600">{sbj.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Tab: Grupos */}
      {activeTab === 'grupos' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Grupos y Secciones</h3>
              <p className="text-xs text-slate-500">Asignación de docentes y salones</p>
            </div>
            <button
              onClick={() => setShowAddGroup(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#188E40] text-white text-xs font-bold shadow-xs hover:bg-[#126830]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Grupo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {groups.map((grp) => (
              <div key={grp.id} className="p-4 rounded-2xl border border-slate-200 bg-[#F8FAF6] space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{grp.name}</h4>
                  <span className="text-xs font-semibold text-[#188E40]">{grp.studentCount} Alumnos</span>
                </div>
                <p className="text-xs text-slate-600">
                  <strong>Docente:</strong> {grp.teacherName}
                </p>
                <p className="text-xs text-slate-500">{grp.courseName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tab: Auditoría */}
      {activeTab === 'auditoria' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registro de Auditoría Escolar</h3>
              <p className="text-xs text-slate-500">Trazabilidad de accesos, tareas, exámenes y seguridad</p>
            </div>
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar eventos..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-[#188E40]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                  <th className="p-3 font-bold">Fecha / Hora</th>
                  <th className="p-3 font-bold">Usuario</th>
                  <th className="p-3 font-bold">Rol</th>
                  <th className="p-3 font-bold">Acción</th>
                  <th className="p-3 font-bold">Detalles</th>
                  <th className="p-3 font-bold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-slate-900">{log.userName}</td>
                    <td className="p-3 capitalize">{log.userRole}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{log.details}</td>
                    <td className="p-3 text-slate-400 font-mono text-[10px]">{log.ip || 'Local'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. Tab: Seguridad & Políticas */}
      {activeTab === 'seguridad' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Políticas de Seguridad Institucional</h3>
            <p className="text-xs text-slate-500">Parámetros de acceso seguro y protección infantil</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-[#188E40] uppercase">Regla de Acceso</span>
              <h4 className="text-sm font-bold text-slate-900">Autenticación Sin Correo/Teléfono</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Los alumnos no requieren ingresar números de teléfono ni correos personales externos. La escuela provee únicamente Nombre de Usuario y Contraseña segura.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-[#F39200] uppercase">Regla de Contraseñas</span>
              <h4 className="text-sm font-bold text-slate-900">Cambio Obligatorio en Primer Inicio</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Toda cuenta nueva generada por el administrador cuenta con la marca <code>firstLogin: true</code>. El sistema bloquea el acceso a otras pantallas hasta que el usuario fije su contraseña definitiva.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-emerald-700 uppercase">IA Pedagógica</span>
              <h4 className="text-sm font-bold text-slate-900">Filtro Antihacking Escolar y Pedagógico</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                CLOVER IA no da respuestas completas de tareas de manera pasiva. Promueve el método socrático y cuenta con bloqueo de contenidos inapropiados y violentos.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Trazabilidad</span>
              <h4 className="text-sm font-bold text-slate-900">Registro de Sesiones y Auditoría</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cada inicio de sesión, cambio de contraseña, entrega de tarea y publicación de examen queda registrado con marca temporal para seguridad directiva.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create User & Generate One-Time Credentials */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {generatedCredentials ? 'Credenciales Generadas' : 'Nuevo Usuario Escolar'}
              </h3>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generatedCredentials ? (
              <div className="mt-4 space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-900">
                    ¡Cuenta creada exitosamente!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    Entrega estas credenciales al usuario. Se le solicitará cambio de contraseña en su primer inicio.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-slate-200 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Nombre:</span>
                    <span className="font-bold text-slate-900">{generatedCredentials.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Usuario Institucional:</span>
                    <span className="font-bold text-[#188E40] text-sm">{generatedCredentials.username}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Contraseña Temporal:</span>
                    <span className="font-bold text-[#F39200] text-sm">{generatedCredentials.temporaryPassword}</span>
                  </div>
                  {generatedCredentials.subject && (
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-sans">Materia / Asignatura:</span>
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#188E40]" />
                        {generatedCredentials.subject}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCredentials}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    {copiedCreds ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCreds ? '¡Copiado!' : 'Copiar Credenciales'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                    title="Imprimir credenciales"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setShowCreateUserModal(false)}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateUserCredentials} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Ej. Andrés Navarro Gómez"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#188E40]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Usuario Institucional (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newCustomUsername}
                    onChange={(e) => setNewCustomUsername(e.target.value)}
                    placeholder="Ej. docente_andres o dejar vacío para auto-generar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-[#188E40]"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Si se deja vacío, el sistema asignará el prefijo institucional automáticamente (est_, prf_, adm_).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Rol Institucional
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="estudiante">Estudiante</option>
                    <option value="profesor">Profesor / Docente</option>
                    <option value="administrador">Administrador Escolar</option>
                  </select>
                </div>

                {newRole === 'estudiante' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Grado / Nivel
                    </label>
                    <input
                      type="text"
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                )}

                {newRole === 'profesor' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Materia / Asignatura Oficial
                    </label>
                    <select
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                    >
                      <option value="Ciencias Naturales y Matemáticas">Ciencias Naturales y Matemáticas</option>
                      <option value="Matemáticas y Álgebra">Matemáticas y Álgebra</option>
                      <option value="Ciencias y Biología">Ciencias y Biología</option>
                      <option value="Física y Química">Física y Química</option>
                      <option value="Lengua Española y Literatura">Lengua Española y Literatura</option>
                      <option value="Historia y Geografía">Historia y Geografía</option>
                      <option value="Inglés y Lenguas Extranjeras">Inglés y Lenguas Extranjeras</option>
                      <option value="Formación Cívica y Ética">Formación Cívica y Ética</option>
                      <option value="Educación Artística">Educación Artística</option>
                      <option value="Tecnología e Informática">Tecnología e Informática</option>
                    </select>
                    <input
                      type="text"
                      placeholder="O especifica otra materia/especialidad..."
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                    />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-amber-50 text-[11px] text-amber-800 leading-relaxed border border-amber-200/80">
                  El sistema generará automáticamente un nombre de usuario institucional y una contraseña temporal protegida. El usuario deberá cambiarla obligatoriamente al ingresar.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white text-xs font-bold shadow-xs transition"
                  >
                    Generar Credenciales
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Editar Usuario */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Usuario</h3>
                  <p className="text-[11px] text-slate-500">Modificación de datos, rol institucional y estado</p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#188E40]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Usuario Institucional
                </label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-[#188E40]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Rol Institucional
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="estudiante">Estudiante</option>
                  <option value="profesor">Profesor / Docente</option>
                  <option value="administrador">Administrador Escolar</option>
                </select>
              </div>

              {editRole === 'estudiante' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Grado / Nivel
                  </label>
                  <input
                    type="text"
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              )}

              {editRole === 'profesor' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Materia / Asignatura Oficial
                  </label>
                  <select
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Ciencias Naturales y Matemáticas">Ciencias Naturales y Matemáticas</option>
                    <option value="Matemáticas y Álgebra">Matemáticas y Álgebra</option>
                    <option value="Ciencias y Biología">Ciencias y Biología</option>
                    <option value="Física y Química">Física y Química</option>
                    <option value="Lengua Española y Literatura">Lengua Española y Literatura</option>
                    <option value="Historia y Geografía">Historia y Geografía</option>
                    <option value="Inglés y Lenguas Extranjeras">Inglés y Lenguas Extranjeras</option>
                    <option value="Formación Cívica y Ética">Formación Cívica y Ética</option>
                    <option value="Educación Artística">Educación Artística</option>
                    <option value="Tecnología e Informática">Tecnología e Informática</option>
                  </select>
                  <input
                    type="text"
                    placeholder="O especifica otra materia personalizada..."
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#188E40] focus:ring-[#188E40]"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Cuenta activa (permitir inicio de sesión)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForcePasswordChange}
                    onChange={(e) => setEditForcePasswordChange(e.target.checked)}
                    className="w-4 h-4 rounded text-[#F39200] focus:ring-[#F39200]"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Exigir cambio obligatorio de contraseña en el próximo acceso
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white font-bold transition shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Materia Asignada al Docente */}
      {editingTeacherSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#188E40] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Materia del Docente</h3>
                  <p className="text-[11px] text-slate-500">Asignación curricular institucional</p>
                </div>
              </div>
              <button
                onClick={() => setEditingTeacherSubject(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#F8FAF6] border border-slate-200 text-xs text-slate-700">
              <p className="font-bold text-slate-900">{editingTeacherSubject.fullName}</p>
              <p className="text-[11px] text-slate-500 font-mono">Usuario: {editingTeacherSubject.username}</p>
            </div>

            <form onSubmit={handleSaveTeacherSubject} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block uppercase tracking-wider text-[11px]">
                  Seleccionar Materia / Asignatura
                </label>
                <select
                  value={newTeacherSubjectValue}
                  onChange={(e) => setNewTeacherSubjectValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:border-[#188E40]"
                >
                  <option value="Ciencias Naturales y Matemáticas">Ciencias Naturales y Matemáticas</option>
                  <option value="Matemáticas y Álgebra">Matemáticas y Álgebra</option>
                  <option value="Ciencias y Biología">Ciencias y Biología</option>
                  <option value="Física y Química">Física y Química</option>
                  <option value="Lengua Española y Literatura">Lengua Española y Literatura</option>
                  <option value="Historia y Geografía">Historia y Geografía</option>
                  <option value="Inglés y Lenguas Extranjeras">Inglés y Lenguas Extranjeras</option>
                  <option value="Formación Cívica y Ética">Formación Cívica y Ética</option>
                  <option value="Educación Artística">Educación Artística</option>
                  <option value="Tecnología e Informática">Tecnología e Informática</option>
                </select>

                <input
                  type="text"
                  placeholder="O especifica un nombre personalizado..."
                  value={newTeacherSubjectValue}
                  onChange={(e) => setNewTeacherSubjectValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#188E40]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacherSubject(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white font-bold transition shadow-xs"
                >
                  Guardar Materia
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password Feedback */}
      {resetPassSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center space-y-3">
            <KeyRound className="w-10 h-10 text-[#F39200] mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Contraseña Restablecida</h3>
            <p className="text-xs text-slate-600">
              Nueva contraseña temporal para <strong>{resettingUser?.username}</strong>:
            </p>
            <div className="p-3 rounded-xl bg-slate-100 font-mono text-sm font-bold text-slate-900">
              {resetPassSuccess}
            </div>
            <p className="text-[11px] text-slate-400">
              El usuario deberá cambiarla en su siguiente inicio de sesión.
            </p>
            <button
              onClick={() => setResetPassSuccess(null)}
              className="w-full py-2.5 rounded-xl bg-[#188E40] text-white text-xs font-bold"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-3">Nuevo Curso Escolar</h3>
            <form onSubmit={handleCreateCourse} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre del Curso</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Ej. 1° de Bachillerato"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Código</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="Ej. BACH-101"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourse(false)}
                  className="px-3 py-2 rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#188E40] text-white font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-3">Nueva Materia</h3>
            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre de la Materia</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="Ej. Geografía Universal"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Código</label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  placeholder="Ej. GEO-201"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-3 py-2 rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#188E40] text-white font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-3">Nuevo Grupo</h3>
            <form onSubmit={handleCreateGroup} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nombre del Grupo</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ej. 1° Bachillerato - Grupo C"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Curso</label>
                <select
                  value={groupCourseId}
                  onChange={(e) => setGroupCourseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddGroup(false)}
                  className="px-3 py-2 rounded-xl text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#188E40] text-white font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

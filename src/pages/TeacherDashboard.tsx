import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  FileCheck2,
  Calendar,
  Layers,
  ArrowRight,
  Edit2,
  Award,
  Table,
  X,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { User, Assignment, Submission, Group } from '../types';
import { db } from '../services/db';

interface TeacherDashboardProps {
  user: User;
  onOpenChat: (initialTopic?: string) => void;
  onOpenExamGenerator: () => void;
  onOpenLessonPlanner: () => void;
  onOpenRubricGenerator: () => void;
  onOpenActivityGenerator: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  user,
  onOpenChat,
  onOpenExamGenerator,
  onOpenLessonPlanner,
  onOpenRubricGenerator,
  onOpenActivityGenerator,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>(db.getAssignments());
  const [submissions, setSubmissions] = useState<Submission[]>(db.getSubmissions());
  const groups: Group[] = db.getGroups();
  const subjects = db.getSubjects();

  const activeSubject = user.subject || user.specialty || 'Ciencias Naturales y Matemáticas';

  // Create Assignment Modal
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [newGroupId, setNewGroupId] = useState(groups[0]?.id || '');
  const [newSubjectName, setNewSubjectName] = useState(activeSubject);
  const [newPoints, setNewPoints] = useState(100);

  // Grade Submission Modal
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState<number>(90);
  const [feedbackInput, setFeedbackInput] = useState('');

  const pendingGradingSubmissions = submissions.filter((s) => s.status === 'entregada');

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const grp = groups.find((g) => g.id === newGroupId);
    const chosenSubject = subjects.find((s) => s.name === newSubjectName);
    const newAsg: Assignment = {
      id: 'asg_' + Date.now(),
      title: newTitle,
      description: newDescription,
      subjectId: chosenSubject ? chosenSubject.id : 'sbj_math',
      subjectName: newSubjectName,
      groupId: newGroupId,
      groupName: grp ? grp.name : 'Grupo Asignado',
      teacherId: user.id,
      teacherName: user.fullName,
      dueDate: newDueDate,
      points: newPoints,
      status: 'publicada',
      createdAt: new Date().toISOString(),
    };

    db.saveAssignment(newAsg);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'CREAR_TAREA',
      details: `Nueva tarea "${newTitle}" publicada para la materia ${newSubjectName} (${grp?.name || 'grupo'}).`,
    });

    setAssignments([newAsg, ...assignments]);
    setShowCreateAssignmentModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    const updated: Submission = {
      ...gradingSubmission,
      grade: gradeInput,
      feedback: feedbackInput,
      status: 'revisada',
    };

    db.saveSubmission(updated);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'CALIFICAR_TAREA',
      details: `Calificación asignada a ${gradingSubmission.studentName}: ${gradeInput}/100.`,
    });

    setSubmissions(submissions.map((s) => (s.id === updated.id ? updated : s)));
    setGradingSubmission(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Teacher Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#188E40] via-[#126830] to-emerald-950 p-6 sm:p-9 text-white shadow-xl shadow-[#188E40]/15">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F39200] text-white shadow-sm">
              <BookOpen className="w-3.5 h-3.5" /> Portal Docente • Clover Hills
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/30">
              <GraduationCap className="w-3.5 h-3.5 text-[#BCDB14]" /> Materia: {activeSubject}
            </span>
            {user.teacherCode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-black/25 text-emerald-200">
                Cód: {user.teacherCode}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Hola, {user.fullName} 👋 <br />
            <span className="text-[#BCDB14]">Docente Titular de {activeSubject}</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
            Diseña exámenes personalizados para {activeSubject}, planifica secuencias didácticas y acompaña el rendimiento de tus grupos con asistencia inteligente.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Materia Titular</span>
            <BookOpen className="w-4 h-4 text-[#188E40]" />
          </div>
          <p className="text-sm sm:text-base font-black text-slate-900 truncate" title={activeSubject}>
            {activeSubject}
          </p>
          <span className="text-[11px] text-[#188E40] font-semibold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3" /> Currículo Oficial
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Grupos a Cargo</span>
            <Users className="w-4 h-4 text-[#188E40]" />
          </div>
          <p className="text-2xl font-black text-slate-900">{groups.length}</p>
          <span className="text-[11px] text-slate-400">Grupos de {activeSubject}</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Por Calificar</span>
            <Clock className="w-4 h-4 text-[#F39200]" />
          </div>
          <p className="text-2xl font-black text-[#F39200]">
            {pendingGradingSubmissions.length}
          </p>
          <span className="text-[11px] text-slate-400">Entregas de alumnos</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Tareas Activas</span>
            <FileText className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{assignments.length}</p>
          <span className="text-[11px] text-slate-400">Publicadas en sistema</span>
        </div>
      </div>

      {/* AI Pedagogical Suite Buttons */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Herramientas Inteligentes para el Docente
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={onOpenLessonPlanner}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#188E40] text-left transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#188E40] flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Preparar Clase</span>
            <span className="text-[10px] text-slate-500">Plan didáctico de 50 min</span>
          </button>

          <button
            onClick={onOpenExamGenerator}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#F39200] text-left transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F39200] flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Crear Examen</span>
            <span className="text-[10px] text-slate-500">Editable e imprimible</span>
          </button>

          <button
            onClick={() => setShowCreateAssignmentModal(true)}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-500 text-left transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-lime-50 text-[#188E40] flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Crear Tarea</span>
            <span className="text-[10px] text-slate-500">Asignar a un grupo</span>
          </button>

          <button
            onClick={onOpenRubricGenerator}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#F39200] text-left transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F39200] flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Table className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Crear Rúbrica</span>
            <span className="text-[10px] text-slate-500">Matriz en 4 niveles</span>
          </button>

          <button
            onClick={onOpenActivityGenerator}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-purple-500 text-left transition group shadow-xs"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 block">Dinámica de Aula</span>
            <span className="text-[10px] text-slate-500">Debates y proyectos</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Pending Submissions vs Assigned Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Submissions to Review */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#188E40]" />
                <h3 className="text-base font-bold text-slate-900">Entregas Pendientes de Revisión</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {pendingGradingSubmissions.length} entregas
              </span>
            </div>

            {pendingGradingSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No hay entregas pendientes de calificación en este momento.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingGradingSubmissions.map((sub) => {
                  const assignment = assignments.find((a) => a.id === sub.assignmentId);
                  return (
                    <div
                      key={sub.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-[#F8FAF6] hover:bg-white transition flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {sub.studentName}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                            {assignment?.groupName || '3° A'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          <strong>Tarea:</strong> {assignment?.title}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                          "{sub.content}"
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setGradingSubmission(sub);
                          setGradeInput(sub.grade || 90);
                          setFeedbackInput(sub.feedback || '¡Buen trabajo! Continúa así.');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#F39200] hover:bg-[#d88200] text-white text-xs font-bold shadow-xs transition"
                      >
                        Calificar y Retroalimentar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Homework Assignments List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tareas Publicadas Recientemente</h3>
              <button
                onClick={() => setShowCreateAssignmentModal(true)}
                className="text-xs font-semibold text-[#188E40] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Nueva Tarea
              </button>
            </div>

            <div className="space-y-2.5">
              {assignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-[#F8FAF6] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{asg.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {asg.subjectName || activeSubject}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {asg.groupName} • Vence: {asg.dueDate} • {asg.points} pts
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Publicada
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Groups & Schedule */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Grupos Asignados
            </h3>
            <div className="space-y-3">
              {groups.map((grp) => (
                <div
                  key={grp.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-[#F8FAF6] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{grp.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700">
                      {grp.studentCount} Alumnos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{grp.courseName}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Horario de Clases Hoy
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">08:00 - 08:50 AM</span>
                  <span className="text-slate-600 text-[11px]">Matemáticas • 3° A</span>
                </div>
                <span className="text-[10px] font-bold text-[#188E40]">Aula 204</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">09:00 - 09:50 AM</span>
                  <span className="text-slate-600 text-[11px]">Biología y Laboratorio • 3° B</span>
                </div>
                <span className="text-[10px] font-bold text-slate-600">Lab Ciencias</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Create Assignment Modal */}
      {showCreateAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Crear Nueva Tarea Escolar</h3>
              <button
                onClick={() => setShowCreateAssignmentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Título de la Tarea
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Ejercicios de Trigonometría"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-[#188E40]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Grupo Destino
                </label>
                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Materia / Asignatura
                </label>
                <select
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value={activeSubject}>{activeSubject} (Asignatura Titular)</option>
                  {subjects
                    .filter((s) => s.name !== activeSubject)
                    .map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Fecha de Entrega
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Puntos Máximos
                  </label>
                  <input
                    type="number"
                    value={newPoints}
                    onChange={(e) => setNewPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Instrucciones Detalladas
                </label>
                <textarea
                  rows={4}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe lo que debe entregar el alumno..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-[#188E40]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAssignmentModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white text-xs font-bold shadow-xs transition"
                >
                  Publicar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Submission Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#188E40] uppercase">
                  Calificación Docente
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Revisión: {gradingSubmission.studentName}
                </h3>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="mt-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-40 overflow-y-auto">
                <span className="font-bold text-slate-900 block mb-1">
                  Entrega del estudiante:
                </span>
                {gradingSubmission.content}
                {gradingSubmission.attachmentName && (
                  <div className="mt-2 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Adjunto: {gradingSubmission.attachmentName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Puntuación Obtenida (Máximo {gradingSubmission.maxPoints || 100} pts)
                </label>
                <input
                  type="number"
                  min={0}
                  max={gradingSubmission.maxPoints || 100}
                  value={gradeInput}
                  onChange={(e) => setGradeInput(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Retroalimentación Pedagógica para el Alumno
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Escribe comentarios constructivos sobre aciertos y áreas de mejora..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-[#188E40]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F39200] hover:bg-[#d88200] text-white text-xs font-bold shadow-xs transition"
                >
                  Guardar Calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

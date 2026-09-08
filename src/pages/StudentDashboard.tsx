import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  Send,
  X,
  Upload,
  BarChart3,
  HelpCircle,
} from 'lucide-react';
import { User, Assignment, Submission, ChatMode } from '../types';
import { db } from '../services/db';

interface StudentDashboardProps {
  user: User;
  onOpenChat: (initialTopic?: string, mode?: ChatMode) => void;
  onOpenSummaryTool: () => void;
  onOpenQuizTool: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  onOpenChat,
  onOpenSummaryTool,
  onOpenQuizTool,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>(db.getAssignments());
  const [submissions, setSubmissions] = useState<Submission[]>(
    db.getSubmissions().filter((s) => s.studentId === user.id)
  );
  const [progress, setProgress] = useState(db.getStudentProgress(user.id));
  const subjects = db.getSubjects();

  // Homework submission modal state
  const [activeSubmitAssignment, setActiveSubmitAssignment] = useState<Assignment | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [attachedFileName, setAttachedFileName] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const pendingAssignments = assignments.filter((a) => {
    const isSubmitted = submissions.some(
      (s) => s.assignmentId === a.id && (s.status === 'entregada' || s.status === 'revisada')
    );
    return !isSubmitted;
  });

  const handleSubmitHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmitAssignment) return;

    const newSub: Submission = {
      id: 'sub_' + Date.now(),
      assignmentId: activeSubmitAssignment.id,
      studentId: user.id,
      studentName: user.fullName,
      content: submissionText,
      submittedAt: new Date().toISOString(),
      maxPoints: activeSubmitAssignment.points,
      status: 'entregada',
      attachmentName: attachedFileName || undefined,
    };

    db.saveSubmission(newSub);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'ENTREGA_TAREA',
      details: `Entrega de la tarea "${activeSubmitAssignment.title}".`,
    });

    setSubmissions([...submissions, newSub]);
    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setActiveSubmitAssignment(null);
      setSubmissionText('');
      setAttachedFileName('');
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#188E40] via-[#126830] to-emerald-950 p-6 sm:p-9 text-white shadow-xl shadow-[#188E40]/15">
        
        {/* Decorative background clover watermarks */}
        <div className="absolute -right-6 -bottom-10 opacity-10 pointer-events-none">
          <img src="/clover-icon.svg" alt="" className="w-80 h-80 object-contain" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#F39200] text-white shadow-sm mb-3">
            <Sparkles className="w-3.5 h-3.5" /> Portal del Estudiante
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Hola, {user.fullName.split(' ')[0]} 👋 <br />
            <span className="text-[#BCDB14]">¿Qué quieres aprender hoy?</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
            CLOVER IA está listo para explicarte cualquier tema paso a paso, acompañarte con tus tareas o preparar tus exámenes.
          </p>

          {/* Quick AI Action Chips */}
          <div className="mt-5 flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => onOpenChat('Explicar el Teorema de Pitágoras con un ejemplo', 'general')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-xs text-xs font-medium text-white transition"
            >
              📐 Explicar Teorema de Pitágoras
            </button>
            <button
              onClick={() => onOpenChat(undefined, 'aprender_conmigo')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#96C22E] hover:bg-[#85b026] text-xs font-bold text-slate-900 shadow-sm transition"
            >
              🚀 Aprender conmigo
            </button>
            <button
              onClick={() => onOpenChat(undefined, 'ayuda_tarea')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F39200] hover:bg-[#d88200] text-xs font-bold text-white shadow-sm transition"
            >
              📝 Ayuda con mi tarea
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Tasks vs Academic Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Tareas Pendientes & Acciones Rápidas */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Tools Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onOpenChat()}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#188E40] text-left transition group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#188E40] flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 block">Preguntar a Clover</span>
              <span className="text-[10px] text-slate-500">Tutor 24/7 escolar</span>
            </button>

            <button
              onClick={onOpenSummaryTool}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#F39200] text-left transition group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F39200] flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 block">Crear Resumen</span>
              <span className="text-[10px] text-slate-500">Síntesis inteligente</span>
            </button>

            <button
              onClick={onOpenQuizTool}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#0284c7] text-left transition group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#0284c7] flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <HelpCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 block">Cuestionario</span>
              <span className="text-[10px] text-slate-500">Autoevaluación</span>
            </button>

            <button
              onClick={() => onOpenChat(undefined, 'aprender_conmigo')}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-[#96C22E] text-left transition group shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-lime-50 text-[#188E40] flex items-center justify-center mb-2 group-hover:scale-105 transition">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 block">Estudiar Tema</span>
              <span className="text-[10px] text-slate-500">Método socrático</span>
            </button>
          </div>

          {/* Pending Assignments Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#F39200]" />
                <h3 className="text-base font-bold text-slate-900">Tareas Escolares Pendientes</h3>
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {pendingAssignments.length} por entregar
              </span>
            </div>

            {pendingAssignments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                ¡Estás al día con todas tus tareas!
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-[#F8FAF6] hover:bg-white hover:border-[#188E40]/40 transition space-y-2.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#188E40]">
                          {assignment.subjectName}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {assignment.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Vence: {assignment.dueDate}
                        </span>
                        <span className="font-bold text-slate-700">{assignment.points} pts</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {assignment.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() =>
                          onOpenChat(`Ayúdame a comprender la tarea: "${assignment.title}". La indicación es: "${assignment.description}"`, 'ayuda_tarea')
                        }
                        className="text-xs font-semibold text-[#188E40] hover:text-[#126830] flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#F39200]" />
                        <span>Pedir pistas a CLOVER IA</span>
                      </button>

                      <button
                        onClick={() => setActiveSubmitAssignment(assignment)}
                        className="px-4 py-1.5 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white text-xs font-bold shadow-xs transition"
                      >
                        Entregar Tarea
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Submissions with Teacher Feedback */}
          {submissions.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Historial de Entregas y Calificaciones
              </h3>
              <div className="space-y-2.5">
                {submissions.map((sub) => {
                  const assignment = assignments.find((a) => a.id === sub.assignmentId);
                  return (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {assignment?.title || 'Tarea'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {sub.status === 'revisada' ? 'Revisada por el docente' : 'Entregada - En espera'}
                        </span>
                      </div>

                      {sub.grade !== undefined ? (
                        <div className="text-right">
                          <span className="text-base font-black text-emerald-700">
                            {sub.grade} / {sub.maxPoints}
                          </span>
                          {sub.feedback && (
                            <p className="text-[11px] text-slate-600 italic mt-0.5 max-w-xs">
                              "{sub.feedback}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-semibold">
                          Pendiente de nota
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Col: Academic Progress & Subjects */}
        <div className="space-y-6">
          
          {/* Progress Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <TrendingUp className="w-5 h-5 text-[#188E40]" />
              <h3 className="text-base font-bold text-slate-900">Mi Progreso Académico</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-[11px] text-slate-600 font-medium">Promedio General</span>
                <p className="text-2xl font-black text-[#188E40]">{progress.averageGrade}</p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100">
                <span className="text-[11px] text-slate-600 font-medium">Horas de Estudio</span>
                <p className="text-2xl font-black text-[#F39200]">{progress.studyHours}h</p>
              </div>
            </div>

            {/* Mastered topics */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> Temas Dominados
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {progress.masteredTopics.map((topic, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800"
                  >
                    ✓ {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Topics needing review */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#F39200]" /> Requieren Refuerzo
              </h4>
              <div className="space-y-1.5">
                {progress.topicsNeedingReview.map((topic, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs flex items-center justify-between text-amber-900"
                  >
                    <span className="font-medium">{topic}</span>
                    <button
                      onClick={() => onOpenChat(`Explícame desde cero y paso a paso el tema: "${topic}"`, 'aprender_conmigo')}
                      className="text-[10px] font-bold text-[#F39200] hover:underline"
                    >
                      Repasar con IA →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subjects List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Mis Materias
            </h3>
            <div className="space-y-2.5">
              {subjects.map((sbj) => (
                <div
                  key={sbj.id}
                  onClick={() => onOpenChat(`Quiero estudiar la materia ${sbj.name}`)}
                  className="p-3 rounded-2xl border border-slate-100 hover:border-slate-300 bg-[#F8FAF6] hover:bg-white cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: sbj.color }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#188E40] transition">
                        {sbj.name}
                      </h4>
                      <span className="text-[10px] text-slate-500">{sbj.code}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Homework Submission Modal */}
      {activeSubmitAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#188E40] uppercase">
                  {activeSubmitAssignment.subjectName}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Entregar: {activeSubmitAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveSubmitAssignment(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-12 text-center text-slate-800 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-bold">¡Tarea entregada con éxito!</h4>
                <p className="text-xs text-slate-500">
                  Tu profesor Carlos Mendoza ha recibido tu entrega para calificación.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitHomework} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Respuesta o Desarrollo de la Tarea
                  </label>
                  <textarea
                    rows={5}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Escribe aquí tu procedimiento, respuestas o enlace a tu trabajo..."
                    required
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Adjuntar Archivo (PDF, Word, Imagen)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={attachedFileName}
                      onChange={(e) => setAttachedFileName(e.target.value)}
                      placeholder="Nombre del archivo (Ej. tarea_algebra_sofia.pdf)"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setAttachedFileName('entrega_sofia_ramirez.pdf')}
                      className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Simular archivo
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSubmitAssignment(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white text-xs font-bold shadow-sm transition"
                  >
                    Confirmar Entrega
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

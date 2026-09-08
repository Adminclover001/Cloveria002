import React, { useState } from 'react';
import {
  FileCheck2,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Share2,
  Check,
  Save,
  BookOpen,
  Calendar,
  Layers,
  Award,
} from 'lucide-react';
import { User, Exam, ExamQuestion, Group } from '../../types';
import { db } from '../../services/db';

interface ExamGeneratorProps {
  user: User;
}

export const ExamGenerator: React.FC<ExamGeneratorProps> = ({ user }) => {
  const [subject, setSubject] = useState(user.subject || user.specialty || 'Matemáticas y Álgebra');
  const [topic, setTopic] = useState('Factorización y Ecuaciones Cuadráticas');
  const [level, setLevel] = useState('3° Secundaria');
  const [objectives, setObjectives] = useState('Evaluar despeje de variables y resolución de problemas');
  const [difficulty, setDifficulty] = useState('media');
  const [questionCount, setQuestionCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('grp_sec3_a');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);

  const groups = db.getGroups();

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      const response = await fetch('/api/ai/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          level,
          objectives,
          difficulty,
          questionCount,
        }),
      });

      const data = await response.json();
      const generatedExam: Exam = {
        id: 'exam_' + Date.now(),
        title: data.title || `Examen de ${topic}`,
        subject: data.subject || subject,
        level: data.level || level,
        totalPoints: data.totalPoints || 100,
        instructions:
          data.instructions ||
          'Lee atentamente cada pregunta. Desarrolla el procedimiento de manera clara y ordenada.',
        assignedGroupId: selectedGroup,
        assignedGroupName: groups.find((g) => g.id === selectedGroup)?.name,
        teacherId: user.id,
        status: 'borrador',
        createdAt: new Date().toISOString(),
        questions: (data.questions || []).map((q: any, idx: number) => ({
          id: q.id || String(idx + 1),
          question: q.question,
          type: q.type || 'desarrollo',
          options: q.options,
          points: q.points || 25,
          correctAnswer: q.correctAnswer || 'Criterio de evaluación docente',
          pedagogicalGoal: q.pedagogicalGoal,
        })),
      };

      setExam(generatedExam);
    } catch (err) {
      console.error('Exam generator error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = (idx: number, field: keyof ExamQuestion, value: any) => {
    if (!exam) return;
    const updated = [...exam.questions];
    updated[idx] = { ...updated[idx], [field]: value };
    setExam({ ...exam, questions: updated });
  };

  const handleDeleteQuestion = (idx: number) => {
    if (!exam) return;
    const updated = exam.questions.filter((_, i) => i !== idx);
    setExam({ ...exam, questions: updated });
  };

  const handleAddQuestion = () => {
    if (!exam) return;
    const newQ: ExamQuestion = {
      id: String(exam.questions.length + 1),
      question: 'Nueva pregunta de desarrollo agregada por el docente',
      type: 'desarrollo',
      points: 20,
      correctAnswer: 'Criterio de respuesta del docente',
    };
    setExam({ ...exam, questions: [...exam.questions, newQ] });
  };

  const handleSaveToSchoolSystem = () => {
    if (!exam) return;
    db.saveExam(exam);
    db.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'CREAR_EXAMEN',
      details: `Examen "${exam.title}" guardado y programado para el grupo ${exam.assignedGroupName || ''}.`,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#188E40] flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generador de Exámenes Escolares</h2>
            <p className="text-xs text-slate-500">
              Diseña evaluaciones completas, personalizables e imprimibles con criterios de calificación
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateExam} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Materia
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tema / Unidad
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                placeholder="Ej. Termodinámica, Revolución Mexicana"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Grupo Destino
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 bg-white"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.studentCount} alumnos)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nivel Escolar
              </label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Dificultad
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 bg-white"
              >
                <option value="baja">Básica (Formativa)</option>
                <option value="media">Estándar (Parcial)</option>
                <option value="alta">Avanzada (Examen Final)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Cantidad de Preguntas
              </label>
              <input
                type="number"
                min={3}
                max={10}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Objetivo Pedagógico de la Evaluación
            </label>
            <input
              type="text"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="Habilidad o competencia a certificar"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F39200] hover:bg-[#d88200] text-white text-xs font-bold shadow-sm shadow-[#F39200]/25 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Diseñar Examen con CLOVER IA</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Exam Preview and Editor */}
      {exam && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-8 animate-in fade-in duration-200">
          
          {/* Teacher Action Controls (hidden in print) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 print:hidden">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Modo Edición Docente</span>
              <button
                type="button"
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  showAnswerKey
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {showAnswerKey ? 'Ocultar Pauta de Respuestas' : 'Ver Pauta de Respuestas'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Examen</span>
              </button>

              <button
                onClick={handleSaveToSchoolSystem}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#188E40] hover:bg-[#126830] text-white text-xs font-bold shadow-xs transition"
              >
                {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savedSuccess ? '¡Guardado en el sistema!' : 'Guardar y Publicar'}</span>
              </button>
            </div>
          </div>

          {/* Institutional Exam Header */}
          <div className="border-2 border-slate-900 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                <img src="/clover-icon.svg" alt="Clover Hills Logo" className="w-10 h-10 object-contain" />
                <div>
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
                    Clover Hills Educative System
                  </h1>
                  <p className="text-xs text-slate-600 font-bold uppercase">
                    Evaluación Periódica Departamental
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800 block">Puntuación Total</span>
                <span className="text-lg font-black text-slate-900">{exam.totalPoints} pts</span>
              </div>
            </div>

            {/* Student metadata fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Nombre del Alumno:</span>
                <div className="flex-1 border-b border-slate-400 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Fecha:</span>
                <div className="w-36 border-b border-slate-400 h-4" />
                <span className="font-bold text-slate-800 ml-2">Grupo:</span>
                <span className="font-medium">{exam.assignedGroupName || '3° A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Materia:</span>
                <span className="font-medium">{exam.subject}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">Profesor:</span>
                <span className="font-medium">{user.fullName}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 text-xs text-slate-700 italic">
              <strong>Instrucciones:</strong> {exam.instructions}
            </div>
          </div>

          {/* Exam Questions Editor */}
          <div className="space-y-6">
            {exam.questions.map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-5 rounded-2xl border border-slate-200 bg-[#F8FAF6] space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {q.type === 'opcion_multiple' ? 'Opción Múltiple' : 'Pregunta de Desarrollo'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 print:hidden">
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500 font-medium">Puntos:</span>
                      <input
                        type="number"
                        value={q.points}
                        onChange={(e) => handleUpdateQuestion(idx, 'points', Number(e.target.value))}
                        className="w-14 px-2 py-0.5 rounded border border-slate-300 text-xs font-bold text-center bg-white"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white transition"
                      title="Eliminar pregunta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <textarea
                  rows={2}
                  value={q.question}
                  onChange={(e) => handleUpdateQuestion(idx, 'question', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 bg-white leading-relaxed focus:border-[#188E40]"
                />

                {/* Options if multiple choice */}
                {q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => (
                      <div
                        key={optIdx}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 flex items-center gap-2"
                      >
                        <span className="w-4 h-4 rounded-full border border-slate-400 shrink-0" />
                        <span>{opt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer Key preview (visible if toggled by teacher) */}
                {showAnswerKey && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                    <span className="font-bold flex items-center gap-1 text-[#F39200]">
                      <Check className="w-3.5 h-3.5" /> Pauta y Criterio de Calificación:
                    </span>
                    <p>{q.correctAnswer}</p>
                    {q.pedagogicalGoal && (
                      <p className="text-slate-500 italic text-[11px]">
                        Objetivo formativo: {q.pedagogicalGoal}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add Question Button */}
          <div className="flex justify-center print:hidden">
            <button
              onClick={handleAddQuestion}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#188E40] text-xs font-bold text-slate-700 hover:text-[#188E40] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar otra pregunta a la prueba</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

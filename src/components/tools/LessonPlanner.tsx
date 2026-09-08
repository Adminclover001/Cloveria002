import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Clock,
  CheckCircle2,
  Copy,
  Printer,
  Calendar,
  Layers,
  Award,
  ListOrdered,
} from 'lucide-react';
import { LessonPlan, User } from '../../types';

interface LessonPlannerProps {
  user?: User;
}

export const LessonPlanner: React.FC<LessonPlannerProps> = ({ user }) => {
  const [subject, setSubject] = useState(
    user?.subject || user?.specialty || 'Ciencias Naturales'
  );
  const [topic, setTopic] = useState('Leyes del Movimiento de Newton');
  const [duration, setDuration] = useState('50 minutos');
  const [level, setLevel] = useState('3° Secundaria');
  const [objective, setObjective] = useState(
    'Comprender la 2da ley de Newton (F=m·a) y aplicarla en cálculos cotidianos'
  );
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ai/lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          duration,
          level,
          objective,
        }),
      });

      const data = await response.json();
      setPlan({
        id: 'plan_' + Date.now(),
        title: data.title || `Plan de Clase: ${topic}`,
        subject: subject,
        duration: duration,
        level: level,
        learningObjective: data.learningObjective || objective,
        introduction: data.introduction,
        explanation: data.explanation,
        activity: data.activity,
        exercises: data.exercises || [],
        evaluation: data.evaluation,
        closure: data.closure,
        requiredMaterials: data.requiredMaterials || [],
      });
    } catch (err) {
      console.error('Lesson plan error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!plan) return;
    const text = `=== ${plan.title.toUpperCase()} ===
Materia: ${plan.subject} | Nivel: ${plan.level} | Duración: ${plan.duration}
Objetivo: ${plan.learningObjective}

1. INICIO (10 min):
${plan.introduction}

2. DESARROLLO Y EXPLICACIÓN (15 min):
${plan.explanation}

3. ACTIVIDAD PRÁCTICA (15 min):
${plan.activity}

4. EJERCICIOS:
${plan.exercises.map((e, i) => `${i + 1}. ${e}`).join('\n')}

5. EVALUACIÓN FORMATIVA (5 min):
${plan.evaluation}

6. CIERRE (5 min):
${plan.closure}

7. MATERIALES:
${plan.requiredMaterials.join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#188E40] flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Planificador de Clases ("Preparar mi clase")</h2>
            <p className="text-xs text-slate-500">
              Genera secuencias didácticas completas con actividades, tiempos y evaluación formativa
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="mt-6 space-y-4">
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
                Tema de la Clase
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Duración de la Sesión
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ej. 50 minutos, 90 minutos"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Objetivo de Aprendizaje
            </label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="¿Qué competencia desarrollará el alumno al finalizar la sesión?"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#188E40] hover:bg-[#126830] text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Generar Planificación Didáctica</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Lesson Plan View */}
      {plan && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-md space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 print:hidden">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {plan.subject} • {plan.duration}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{plan.title}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Plan</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Copiado!' : 'Copiar Plan'}</span>
              </button>
            </div>
          </div>

          {/* Goal card */}
          <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#188E40] mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Objetivo de Aprendizaje
            </h4>
            <p className="text-sm font-semibold text-slate-800">{plan.learningObjective}</p>
          </div>

          {/* 8-Part Pedagogical Timeline */}
          <div className="space-y-4">
            {/* 1. Inicio */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#188E40] flex items-center justify-center text-xs">
                  1
                </span>
                <span>Inicio / Activación (10 min)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                {plan.introduction}
              </p>
            </div>

            {/* 2. Desarrollo */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#188E40] flex items-center justify-center text-xs">
                  2
                </span>
                <span>Desarrollo Conceptual Guiado (15 min)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                {plan.explanation}
              </p>
            </div>

            {/* 3. Actividad */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#188E40] flex items-center justify-center text-xs">
                  3
                </span>
                <span>Actividad Práctica / Colaborativa (15 min)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                {plan.activity}
              </p>
            </div>

            {/* 4. Ejercicios */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#188E40] flex items-center justify-center text-xs">
                  4
                </span>
                <span>Ejercicios y Desafíos de Aplicación</span>
              </div>
              <ul className="space-y-1.5 pl-8">
                {plan.exercises.map((ex, i) => (
                  <li key={i} className="text-xs sm:text-sm text-slate-700 list-disc">
                    {ex}
                  </li>
                ))}
              </ul>
            </div>

            {/* 5. Evaluación */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#188E40] flex items-center justify-center text-xs">
                  5
                </span>
                <span>Evaluación Formativa / Ticket de Salida (5 min)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                {plan.evaluation}
              </p>
            </div>

            {/* 6. Cierre */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-[#188E40] flex items-center justify-center text-xs">
                  6
                </span>
                <span>Cierre Metacognitivo (5 min)</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-8">
                {plan.closure}
              </p>
            </div>

            {/* 7. Materiales */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-[#F8FAF6] space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Materiales y Recursos
              </h4>
              <div className="flex flex-wrap gap-2">
                {plan.requiredMaterials.map((mat, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700"
                  >
                    • {mat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

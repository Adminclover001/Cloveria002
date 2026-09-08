import React, { useState } from 'react';
import { Users, Sparkles, Clock, CheckCircle2, Copy, Compass, Lightbulb } from 'lucide-react';
import { ActivityProposal } from '../../types';

export const ActivityGenerator: React.FC = () => {
  const [subject, setSubject] = useState('Historia y Formación Cívica');
  const [topic, setTopic] = useState('Derechos Humanos y Convivencia Escolar');
  const [activityType, setActivityType] = useState('debate');
  const [grade, setGrade] = useState('3° Secundaria');
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<ActivityProposal | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ai/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          activityType,
          grade,
        }),
      });

      const data = await response.json();
      setActivity({
        id: 'act_' + Date.now(),
        title: data.title || `Actividad: ${topic}`,
        type: activityType,
        subject: subject,
        grade: grade,
        estimatedTime: data.estimatedTime || '45 minutos',
        pedagogicalGoal: data.pedagogicalGoal,
        stepByStepInstructions: data.stepByStepInstructions || [],
        materials: data.materials || [],
        reflectionQuestions: data.reflectionQuestions || [],
      });
    } catch (err) {
      console.error('Activity error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!activity) return;
    const text = `=== ${activity.title.toUpperCase()} ===
Materia: ${activity.subject} | Nivel: ${activity.grade} | Tiempo: ${activity.estimatedTime}
Objetivo: ${activity.pedagogicalGoal}

INSTRUCCIONES PASO A PASO:
${activity.stepByStepInstructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

MATERIALES:
${activity.materials.join(', ')}

PREGUNTAS REFLEXIVAS:
${activity.reflectionQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#188E40] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generador de Dinámicas y Actividades</h2>
            <p className="text-xs text-slate-500">
              Diseña debates, retos en equipo, investigaciones relámpago y experimentos de aula
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                Tema de la Dinámica
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
                Tipo de Actividad
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 bg-white"
              >
                <option value="trabajo_en_grupo">Trabajo en Equipo Colaborativo</option>
                <option value="debate">Debate Estructurado</option>
                <option value="investigacion">Investigación Relámpago</option>
                <option value="juego">Juego o Gamificación</option>
                <option value="experimento">Experimento / Laboratorio Casero</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Grado Escolar
              </label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>
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
              <span>Crear Dinámica Innovadora</span>
            </button>
          </div>
        </form>
      </div>

      {activity && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {activity.type.replace('_', ' ')} • {activity.estimatedTime}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{activity.title}</h3>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Dinámica'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-xs sm:text-sm text-slate-800">
            <h4 className="font-bold text-[#188E40] uppercase tracking-wider text-xs mb-1">
              Propósito Pedagógico
            </h4>
            <p>{activity.pedagogicalGoal}</p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Instrucciones Paso a Paso
            </h4>
            <div className="space-y-2">
              {activity.stepByStepInstructions.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-[#188E40] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Materiales Sugeridos
              </h4>
              <ul className="space-y-1">
                {activity.materials.map((m, i) => (
                  <li key={i} className="text-xs text-slate-600 list-disc list-inside">
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-[#F39200]" /> Preguntas para el Cierre
              </h4>
              <ul className="space-y-1">
                {activity.reflectionQuestions.map((q, i) => (
                  <li key={i} className="text-xs text-slate-600 list-disc list-inside">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

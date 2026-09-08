import React, { useState } from 'react';
import { Table, Sparkles, Copy, CheckCircle2, Download, Layers } from 'lucide-react';
import { Rubric } from '../../types';

export const RubricGenerator: React.FC = () => {
  const [activityName, setActivityName] = useState('Ensayo Argumentativo de Historia');
  const [criteriaList, setCriteriaList] = useState(
    'Tesis y postura crítica, Fuentes históricas, Estructura argumentativa, Redacción y ortografía'
  );
  const [maxPoints, setMaxPoints] = useState(100);
  const [loading, setLoading] = useState(false);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ai/rubric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityName,
          criteriaList,
          maxPoints,
        }),
      });

      const data = await response.json();
      setRubric({
        id: 'rub_' + Date.now(),
        activityName: data.activityName || activityName,
        totalPoints: data.totalPoints || maxPoints,
        criteria: data.criteria || [],
      });
    } catch (err) {
      console.error('Rubric error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!rubric) return;
    let text = `=== RÚBRICA DE EVALUACIÓN: ${rubric.activityName.toUpperCase()} ===\nPuntaje Máximo: ${rubric.totalPoints} pts\n\n`;
    rubric.criteria.forEach((c) => {
      text += `CRITERIO: ${c.name} (${c.weight}%)\n`;
      text += `- Excelente: ${c.levels.excelente}\n`;
      text += `- Bueno: ${c.levels.bueno}\n`;
      text += `- En Desarrollo: ${c.levels.enDesarrollo}\n`;
      text += `- Inicial: ${c.levels.inicial}\n\n`;
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#F39200] flex items-center justify-center">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generador de Rúbricas de Evaluación</h2>
            <p className="text-xs text-slate-500">
              Matrices graduadas de desempeño con 4 niveles objetivos para calificar tareas y proyectos
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nombre de la Actividad o Proyecto
              </label>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Puntaje Total
              </label>
              <input
                type="number"
                value={maxPoints}
                onChange={(e) => setMaxPoints(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Criterios de Evaluación Deseados
            </label>
            <input
              type="text"
              value={criteriaList}
              onChange={(e) => setCriteriaList(e.target.value)}
              placeholder="Separados por comas: Ej. Contenido, Argumentación, Trabajo en equipo, Exposición"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !activityName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F39200] hover:bg-[#d88200] text-white text-xs font-bold shadow-sm shadow-[#F39200]/25 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Crear Matriz de Rúbrica</span>
            </button>
          </div>
        </form>
      </div>

      {/* Rubric Table View */}
      {rubric && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">{rubric.activityName}</h3>
              <p className="text-xs text-slate-500">Puntaje total: {rubric.totalPoints} puntos</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar Matriz'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F8FAF6] text-slate-700 border-b border-slate-200">
                  <th className="p-3 font-bold w-1/5">Criterio / Ponderación</th>
                  <th className="p-3 font-bold text-emerald-800 bg-emerald-50/70 w-1/5">
                    Excelente (Sobresaliente)
                  </th>
                  <th className="p-3 font-bold text-blue-800 bg-blue-50/70 w-1/5">
                    Bueno (Competente)
                  </th>
                  <th className="p-3 font-bold text-amber-800 bg-amber-50/70 w-1/5">
                    En Desarrollo
                  </th>
                  <th className="p-3 font-bold text-rose-800 bg-rose-50/70 w-1/5">
                    Inicial
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rubric.criteria.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900 align-top">
                      {c.name}
                      <span className="block text-[11px] text-[#188E40] font-semibold mt-0.5">
                        {c.weight}% del total
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 align-top leading-relaxed bg-emerald-50/20">
                      {c.levels.excelente}
                    </td>
                    <td className="p-3 text-slate-700 align-top leading-relaxed bg-blue-50/20">
                      {c.levels.bueno}
                    </td>
                    <td className="p-3 text-slate-700 align-top leading-relaxed bg-amber-50/20">
                      {c.levels.enDesarrollo}
                    </td>
                    <td className="p-3 text-slate-700 align-top leading-relaxed bg-rose-50/20">
                      {c.levels.inicial}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

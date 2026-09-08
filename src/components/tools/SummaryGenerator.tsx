import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Hash,
  Download,
  ArrowRight,
} from 'lucide-react';
import { SummaryResult } from '../../types';

export const SummaryGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [subject, setSubject] = useState('Matemáticas y Ciencias');
  const [level, setLevel] = useState('3° Secundaria');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          subject,
          level,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Summary error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    if (!result) return;
    const textToCopy = `=== RESUMEN EDUCATIVO - CLOVER IA ===
Materia: ${subject} | Nivel: ${level}

1. RESUMEN CORTO:
${result.shortSummary}

2. RESUMEN DETALLADO:
${result.detailedSummary}

3. CONCEPTOS CLAVE:
${result.keyConcepts.map((c, i) => `${i + 1}. ${c}`).join('\n')}

4. PALABRAS CLAVE:
${result.keywords.join(', ')}

5. PREGUNTAS DE REPASO:
${result.reviewQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#188E40] flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generador de Resúmenes Académicos</h2>
            <p className="text-xs text-slate-500">
              Transforma notas, capítulos o lecturas en síntesis estructuradas con conceptos clave
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Materia o Área
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ej. Biología, Historia Universal, Álgebra"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nivel Escolar
              </label>
              <input
                type="text"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                placeholder="Ej. 1° Secundaria, Bachillerato"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Texto o Apuntes a Resumir
            </label>
            <textarea
              rows={6}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pega aquí el contenido de tu libro, notas de clase o material de lectura..."
              required
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm focus:border-[#188E40] focus:ring-2 focus:ring-[#188E40]/20 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setInputText(
                  `La fotosíntesis es el proceso bioquímico mediante el cual las plantas, algas y ciertas bacterias transforman la energía luminosa en energía química en forma de glucosa. Este proceso ocurre en los cloroplastos, específicamente gracias a la clorofila que absorbe la luz solar. Durante la fase luminosa (dependiente de la luz), se absorbe agua por las raíces y se libera oxígeno a la atmósfera. En la fase oscura o ciclo de Calvin (independiente de la luz), la planta toma dióxido de carbono y produce moléculas de carbohidratos. La fotosíntesis es crucial porque sustenta las cadenas alimenticias y regula el oxígeno y dióxido de carbono del planeta.`
                );
                setSubject('Ciencias y Biología');
              }}
              className="text-xs text-slate-500 hover:text-[#188E40] font-medium px-3 py-2"
            >
              Cargar texto de ejemplo
            </button>

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F39200] hover:bg-[#d88200] text-white text-xs font-bold shadow-sm shadow-[#F39200]/25 transition disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Generar Resumen Inteligente</span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm animate-in fade-in duration-200 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#188E40]" />
              <h3 className="text-base font-bold text-slate-900">Resumen Académico Estructurado</h3>
            </div>
            <button
              onClick={handleCopyAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar todo'}</span>
            </button>
          </div>

          {/* Short Summary */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#188E40] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Resumen Esencial
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {result.shortSummary}
            </p>
          </div>

          {/* Detailed Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Desarrollo y Síntesis Detallada
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {result.detailedSummary}
            </div>
          </div>

          {/* Concepts and Keywords Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#188E40]" /> Conceptos Clave
              </h4>
              <ul className="space-y-1.5">
                {result.keyConcepts.map((concept, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-lime-100 text-[#188E40] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#F39200]" /> Palabras Clave
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.keywords.map((word, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800"
                  >
                    #{word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Review Questions */}
          <div className="p-4 rounded-2xl border border-slate-200/80 bg-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#0284c7]" /> Preguntas para Repasar y Autoevaluarte
            </h4>
            <div className="space-y-2">
              {result.reviewQuestions.map((q, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-50 text-xs text-slate-800 font-medium flex items-center justify-between gap-2"
                >
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

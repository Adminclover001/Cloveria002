import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  RotateCcw,
  Award,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Quiz, QuizQuestion } from '../../types';

export const QuizGenerator: React.FC = () => {
  const [subject, setSubject] = useState('Ciencias y Biología');
  const [topic, setTopic] = useState('Ecosistemas y Cadenas Tróficas');
  const [level, setLevel] = useState('3° Secundaria');
  const [difficulty, setDifficulty] = useState('intermedio');
  const [questionCount, setQuestionCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  // Interactive Quiz State
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUserAnswers({});
    setShowResults(false);
    setActiveHintIndex(null);

    try {
      const response = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          topic,
          level,
          count: questionCount,
          difficulty,
        }),
      });
      const data = await response.json();
      setQuiz(data);
    } catch (err) {
      console.error('Quiz generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionIdx: number, option: string) => {
    if (showResults) return;
    setUserAnswers((prev) => ({ ...prev, [questionIdx]: option }));
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / quiz.questions.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Quiz Config Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#F39200] flex items-center justify-center">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Generador de Cuestionarios Interactivos</h2>
            <p className="text-xs text-slate-500">
              Crea cuestionarios de opción múltiple con retroalimentación didáctica y pistas
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateQuiz} className="mt-6 space-y-4">
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
                Tema a Evaluar
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                placeholder="Ej. Fotosíntesis, Leyes de Newton"
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
                <option value="básico">Básico / Introductorio</option>
                <option value="intermedio">Intermedio (Nivel escolar estándar)</option>
                <option value="avanzado">Avanzado / Reto olímpico</option>
              </select>
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
              <span>Generar Cuestionario con IA</span>
            </button>
          </div>
        </form>
      </div>

      {/* Interactive Quiz Viewer */}
      {quiz && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {quiz.subject || subject}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{quiz.title}</h3>
              <p className="text-xs text-slate-500">{quiz.description}</p>
            </div>

            {showResults && (
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                <Award className="w-6 h-6 text-[#F39200]" />
                <div>
                  <span className="text-xs text-slate-500 font-medium">Calificación final:</span>
                  <p className="text-lg font-black text-slate-900 leading-tight">
                    {calculateScore()}%
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {quiz.questions.map((q, qIdx) => {
              const selectedAnswer = userAnswers[qIdx];
              const isAnswered = !!selectedAnswer;
              const isCorrect = selectedAnswer === q.correctAnswer;

              return (
                <div
                  key={q.id || qIdx}
                  className={`p-5 rounded-2xl border transition ${
                    showResults
                      ? isCorrect
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-rose-200 bg-rose-50/40'
                      : 'border-slate-200/80 bg-[#F8FAF6]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs">
                        {qIdx + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{q.question}</h4>
                    </div>

                    {q.hint && !showResults && (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveHintIndex(activeHintIndex === qIdx ? null : qIdx)
                        }
                        className="text-xs text-[#F39200] hover:text-[#d88200] flex items-center gap-1 font-semibold shrink-0"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>{activeHintIndex === qIdx ? 'Ocultar pista' : 'Ver pista'}</span>
                      </button>
                    )}
                  </div>

                  {/* Hint banner */}
                  {activeHintIndex === qIdx && !showResults && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-[#F39200] shrink-0 mt-0.5" />
                      <span>
                        <strong>Pista:</strong> {q.hint}
                      </span>
                    </div>
                  )}

                  {/* Options */}
                  <div className="space-y-2 mt-3">
                    {q.options.map((opt, optIdx) => {
                      const isThisSelected = selectedAnswer === opt;
                      const isThisCorrect = opt === q.correctAnswer;

                      let btnStyle =
                        'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';

                      if (isThisSelected && !showResults) {
                        btnStyle = 'border-[#188E40] bg-[#188E40]/10 text-[#188E40] font-bold';
                      }

                      if (showResults) {
                        if (isThisCorrect) {
                          btnStyle = 'border-emerald-400 bg-emerald-100 text-emerald-900 font-bold';
                        } else if (isThisSelected && !isThisCorrect) {
                          btnStyle = 'border-rose-300 bg-rose-100 text-rose-900';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={showResults}
                          onClick={() => handleSelectOption(qIdx, opt)}
                          className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition flex items-center justify-between gap-3 ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {showResults && isThisCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {showResults && isThisSelected && !isThisCorrect && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation feedback */}
                  {showResults && (
                    <div className="mt-4 p-3.5 rounded-xl bg-white border border-slate-200 text-xs leading-relaxed text-slate-700">
                      <span className="font-bold text-slate-900 block mb-1">
                        Explicación didáctica:
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => {
                setUserAnswers({});
                setShowResults(false);
                setActiveHintIndex(null);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar Cuestionario</span>
            </button>

            {!showResults ? (
              <button
                type="button"
                onClick={() => setShowResults(true)}
                disabled={Object.keys(userAnswers).length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F39200] hover:bg-[#d88200] text-white text-xs font-bold shadow-md shadow-[#F39200]/25 transition disabled:opacity-50"
              >
                <span>Calificar y Ver Explicaciones</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-xs font-medium text-slate-500">
                ¡Buen trabajo! Continúa practicando para reforzar los temas difíciles.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { User, UserRole, ChatMode } from './types';
import { db } from './services/db';
import { LoginView } from './auth/LoginView';
import { FirstLoginPasswordChangeModal } from './auth/FirstLoginPasswordChangeModal';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { StudentDashboard } from './pages/StudentDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CloverChat } from './ai/CloverChat';
import { SummaryGenerator } from './components/tools/SummaryGenerator';
import { QuizGenerator } from './components/tools/QuizGenerator';
import { ExamGenerator } from './components/tools/ExamGenerator';
import { LessonPlanner } from './components/tools/LessonPlanner';
import { RubricGenerator } from './components/tools/RubricGenerator';
import { ActivityGenerator } from './components/tools/ActivityGenerator';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());
  const [showFirstLoginModal, setShowFirstLoginModal] = useState<boolean>(() => {
    const user = db.getCurrentUser();
    return !!(user && user.firstLogin);
  });
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [chatInitialTopic, setChatInitialTopic] = useState<string | undefined>(undefined);
  const [chatInitialMode, setChatInitialMode] = useState<ChatMode>('general');

  useEffect(() => {
    if (currentUser && currentUser.firstLogin) {
      setShowFirstLoginModal(true);
    }
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.firstLogin) {
      setShowFirstLoginModal(true);
    } else {
      setShowFirstLoginModal(false);
    }
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    db.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handlePasswordChanged = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setShowFirstLoginModal(false);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    const allUsers = db.getUsers();
    const targetUser = allUsers.find((u) => u.role === newRole);
    if (targetUser) {
      db.setCurrentUser(targetUser);
      setCurrentUser(targetUser);
      setCurrentView('dashboard');
    }
  };

  const openChatWithTopic = (topic?: string, mode: ChatMode = 'general') => {
    setChatInitialTopic(topic);
    setChatInitialMode(mode);
    setCurrentView('chat');
  };

  // If user is not logged in, render the login experience
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAF6] text-slate-900 flex flex-col justify-between">
        <OfflineIndicator />
        <LoginView onLoginSuccess={handleLogin} />
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50">
          Clover Hills Educative System © {new Date().getFullYear()} • Plataforma Institucional CLOVER IA
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF6] text-slate-900 flex flex-col selection:bg-[#F39200]/20 selection:text-[#F39200]">
      {/* Top Offline Notification Banner */}
      <OfflineIndicator />

      {/* Main Navigation Bar */}
      <Navbar
        user={currentUser}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* VIEW: Dashboard (Role Specific) */}
        {currentView === 'dashboard' && (
          <>
            {currentUser.role === 'estudiante' && (
              <StudentDashboard
                user={currentUser}
                onOpenChat={openChatWithTopic}
                onOpenSummaryTool={() => setCurrentView('summary')}
                onOpenQuizTool={() => setCurrentView('quiz')}
              />
            )}

            {currentUser.role === 'profesor' && (
              <TeacherDashboard
                user={currentUser}
                onOpenChat={openChatWithTopic}
                onOpenExamGenerator={() => setCurrentView('exam')}
                onOpenLessonPlanner={() => setCurrentView('lesson_plan')}
                onOpenRubricGenerator={() => setCurrentView('rubric')}
                onOpenActivityGenerator={() => setCurrentView('activity')}
              />
            )}

            {currentUser.role === 'administrador' && (
              <AdminDashboard user={currentUser} />
            )}
          </>
        )}

        {/* VIEW: Clover AI Chat */}
        {currentView === 'chat' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition"
              >
                ← Volver al Panel
              </button>
            </div>
            <CloverChat
              user={currentUser}
              initialTopic={chatInitialTopic}
              initialMode={chatInitialMode}
            />
          </div>
        )}

        {/* VIEW: Resumen Inteligente */}
        {currentView === 'summary' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition"
            >
              ← Volver al Panel
            </button>
            <SummaryGenerator />
          </div>
        )}

        {/* VIEW: Cuestionarios / Quizzes */}
        {currentView === 'quiz' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition"
            >
              ← Volver al Panel
            </button>
            <QuizGenerator />
          </div>
        )}

        {/* VIEW: Exámenes Escolares Imprimibles */}
        {currentView === 'exam' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition"
            >
              ← Volver al Panel
            </button>
            <ExamGenerator user={currentUser} />
          </div>
        )}

        {/* VIEW: Planificador de Clases Didáctico */}
        {currentView === 'lesson_plan' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition"
            >
              ← Volver al Panel
            </button>
            <LessonPlanner user={currentUser} />
          </div>
        )}

        {/* VIEW: Rúbricas en 4 niveles */}
        {currentView === 'rubric' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition"
            >
              ← Volver al Panel
            </button>
            <RubricGenerator />
          </div>
        )}

        {/* VIEW: Dinámicas y Actividades Grupales */}
        {currentView === 'activity' && (
          <div className="space-y-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs transition"
            >
              ← Volver al Panel
            </button>
            <ActivityGenerator />
          </div>
        )}

      </main>

      {/* Institutional Footer */}
      <footer className="py-5 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/70 backdrop-blur-xs mt-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/clover-icon.svg" alt="Clover Hills" className="w-5 h-5 object-contain" />
            <span className="font-bold text-slate-800">CLOVER HILLS EDUCATIVE SYSTEM</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">CLOVER IA v1.0 PWA</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Ambiente Educativo Protegido • Sin Recolección de Datos Personales Externos
          </div>
        </div>
      </footer>

      {/* Mandatory Password Change Modal for First-time Logins */}
      {showFirstLoginModal && currentUser && (
        <FirstLoginPasswordChangeModal
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
        />
      )}
    </div>
  );
}

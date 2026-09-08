export type UserRole = 'estudiante' | 'profesor' | 'administrador';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  firstLogin: boolean;
  active: boolean;
  createdAt: string;
  avatar?: string;
  grade?: string; // For students (e.g., "3° Secundaria")
  groupId?: string; // For students
  groupName?: string;
  teacherCode?: string; // For teachers
  specialty?: string; // For teachers
  subject?: string; // Materia que imparte el docente (ej. Matemáticas, Ciencias, etc.)
}

export interface Course {
  id: string;
  name: string;
  code: string;
  level: string; // Primaria, Secundaria, Bachillerato
  description: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  color: string;
  icon: string;
}

export interface Group {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName: string;
  groupId: string;
  groupName: string;
  teacherId: string;
  teacherName: string;
  dueDate: string; // ISO date string
  points: number;
  status: 'publicada' | 'borrador';
  attachedFiles?: string[];
  createdAt: string;
}

export type SubmissionStatus = 'pendiente' | 'entregada' | 'revisada' | 'atrasada';

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  submittedAt?: string;
  grade?: number;
  maxPoints: number;
  feedback?: string;
  status: SubmissionStatus;
  attachmentName?: string;
}

export type ChatMode = 'general' | 'aprender_conmigo' | 'ayuda_tarea';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLiveAI?: boolean;
  attachmentName?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  mode: ChatMode;
  topic?: string;
  subject?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ExamQuestion {
  id: string;
  question: string;
  type: 'desarrollo' | 'opcion_multiple' | 'verdadero_falso';
  options?: string[];
  points: number;
  correctAnswer: string;
  pedagogicalGoal?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  level: string;
  totalPoints: number;
  instructions: string;
  assignedGroupId?: string;
  assignedGroupName?: string;
  teacherId: string;
  status: 'borrador' | 'publicado';
  createdAt: string;
  questions: ExamQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint: string;
}

export interface Quiz {
  title: string;
  subject: string;
  description: string;
  questions: QuizQuestion[];
}

export interface RubricCriterion {
  name: string;
  weight: number;
  levels: {
    excelente: string;
    bueno: string;
    enDesarrollo: string;
    inicial: string;
  };
}

export interface Rubric {
  id: string;
  activityName: string;
  totalPoints: number;
  criteria: RubricCriterion[];
}

export interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  duration: string;
  level: string;
  learningObjective: string;
  introduction: string;
  explanation: string;
  activity: string;
  exercises: string[];
  evaluation: string;
  closure: string;
  requiredMaterials: string[];
}

export interface ActivityProposal {
  id: string;
  title: string;
  type: string;
  subject: string;
  grade: string;
  estimatedTime: string;
  pedagogicalGoal: string;
  stepByStepInstructions: string[];
  materials: string[];
  reflectionQuestions: string[];
}

export interface SummaryResult {
  shortSummary: string;
  detailedSummary: string;
  keyConcepts: string[];
  keywords: string[];
  reviewQuestions: string[];
}

export interface StudentProgress {
  userId: string;
  completedTasks: number;
  pendingTasks: number;
  averageGrade: number;
  studyHours: number;
  masteredTopics: string[];
  topicsNeedingReview: string[];
  subjectAverages: { subject: string; score: number; color: string }[];
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'tarea' | 'examen' | 'calificacion' | 'anuncio';
  date: string;
  read: boolean;
  link?: string;
}

import {
  User,
  Course,
  Subject,
  Group,
  Assignment,
  Submission,
  Conversation,
  Exam,
  AuditLog,
  NotificationItem,
  StudentProgress,
} from '../types';

// Simple deterministic hash for demo & client storage
export function hashPassword(password: string): string {
  let hash = 0;
  const salt = 'CLOVER_HILLS_SALT_2026';
  const combined = password + salt;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'clv_hash_' + Math.abs(hash).toString(16);
}

const STORAGE_KEYS = {
  USERS: 'clover_users',
  COURSES: 'clover_courses',
  SUBJECTS: 'clover_subjects',
  GROUPS: 'clover_groups',
  ASSIGNMENTS: 'clover_assignments',
  SUBMISSIONS: 'clover_submissions',
  CONVERSATIONS: 'clover_conversations',
  EXAMS: 'clover_exams',
  AUDIT_LOGS: 'clover_audit_logs',
  NOTIFICATIONS: 'clover_notifications',
  STUDENT_PROGRESS: 'clover_student_progress',
  ACTIVE_USER: 'clover_active_user',
};

// Initial Seed Data
const DEFAULT_USERS: User[] = [
  {
    id: 'usr_admin',
    username: 'admin_demo',
    passwordHash: hashPassword('Clover2026!'),
    role: 'administrador',
    fullName: 'Mtra. Elena Rostova',
    firstLogin: false,
    active: true,
    createdAt: '2026-01-15T08:00:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_teacher_1',
    username: 'profesor_demo',
    passwordHash: hashPassword('Clover2026!'),
    role: 'profesor',
    fullName: 'Prof. Carlos Mendoza',
    firstLogin: false,
    active: true,
    teacherCode: 'PRF-2026-08',
    subject: 'Ciencias Naturales y Matemáticas',
    specialty: 'Ciencias Naturales y Matemáticas',
    createdAt: '2026-02-01T09:30:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_teacher_2',
    username: 'carmen_historia',
    passwordHash: hashPassword('Clover2026!'),
    role: 'profesor',
    fullName: 'Mtra. Carmen Silva',
    firstLogin: false,
    active: true,
    teacherCode: 'PRF-2026-12',
    subject: 'Historia y Geografía',
    specialty: 'Historia y Geografía',
    createdAt: '2026-02-05T09:30:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_student_1',
    username: 'estudiante_demo',
    passwordHash: hashPassword('Clover2026!'),
    role: 'estudiante',
    fullName: 'Sofía Ramirez Cruz',
    firstLogin: false,
    active: true,
    grade: '3° Secundaria',
    groupId: 'grp_sec3_a',
    groupName: '3° Secundaria - Grupo A',
    createdAt: '2026-02-10T10:00:00.000Z',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'usr_student_2',
    username: 'carlos_estudiante',
    passwordHash: hashPassword('Clover2026!'),
    role: 'estudiante',
    fullName: 'Carlos Eduardo Peña',
    firstLogin: false,
    active: true,
    grade: '3° Secundaria',
    groupId: 'grp_sec3_a',
    groupName: '3° Secundaria - Grupo A',
    createdAt: '2026-02-12T11:00:00.000Z',
  },
  {
    id: 'usr_student_new',
    username: 'nuevo_estudiante',
    passwordHash: hashPassword('Clover2026!'),
    role: 'estudiante',
    fullName: 'Mateo Morales (Primer Acceso)',
    firstLogin: true, // triggers mandatory change
    active: true,
    grade: '2° Secundaria',
    groupId: 'grp_sec2_b',
    groupName: '2° Secundaria - Grupo B',
    createdAt: '2026-03-01T14:00:00.000Z',
  }
];

const DEFAULT_COURSES: Course[] = [
  {
    id: 'crs_sec_1',
    name: '1° de Secundaria',
    code: 'SEC-100',
    level: 'Secundaria',
    description: 'Nivel inicial de educación secundaria obligatoria.',
  },
  {
    id: 'crs_sec_2',
    name: '2° de Secundaria',
    code: 'SEC-200',
    level: 'Secundaria',
    description: 'Nivel intermedio con profundización en ciencias y álgebra.',
  },
  {
    id: 'crs_sec_3',
    name: '3° de Secundaria',
    code: 'SEC-300',
    level: 'Secundaria',
    description: 'Preparación integral y competencias pre-universitarias.',
  },
  {
    id: 'crs_bach_1',
    name: 'Bachillerato General',
    code: 'BACH-101',
    level: 'Bachillerato',
    description: 'Formación académica propedéutica especializada.',
  },
];

const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'sbj_math',
    name: 'Matemáticas y Álgebra',
    code: 'MAT-301',
    description: 'Ecuaciones, trigonometría, estadística y resolución de problemas.',
    color: '#188E40', // Verde oscuro
    icon: 'Calculator',
  },
  {
    id: 'sbj_science',
    name: 'Ciencias y Biología',
    code: 'BIO-302',
    description: 'Ecosistemas, genética celular, método científico y química básica.',
    color: '#96C22E', // Verde
    icon: 'Microscope',
  },
  {
    id: 'sbj_history',
    name: 'Historia y Estudios Sociales',
    code: 'SOC-303',
    description: 'Procesos históricos, geografía, economía básica y ciudadanía.',
    color: '#F39200', // Naranja
    icon: 'Globe',
  },
  {
    id: 'sbj_languages',
    name: 'Lengua e Idioma Inglés',
    code: 'ENG-304',
    description: 'Comprensión lectora, gramática, redacción y conversación.',
    color: '#0284c7', // Azul cielo
    icon: 'Languages',
  },
  {
    id: 'sbj_physics',
    name: 'Física y Química',
    code: 'FIS-305',
    description: 'Leyes del movimiento, energía, materia y experimentos guiados.',
    color: '#8b5cf6', // Púrpura
    icon: 'Atom',
  },
  {
    id: 'sbj_civics',
    name: 'Formación Cívica y Ética',
    code: 'CIV-306',
    description: 'Derechos humanos, convivencia escolar pacífica y liderazgo.',
    color: '#BCDB14', // Verde lima
    icon: 'BookOpenCheck',
  },
];

const DEFAULT_GROUPS: Group[] = [
  {
    id: 'grp_sec3_a',
    name: '3° Secundaria - Grupo A',
    courseId: 'crs_sec_3',
    courseName: '3° de Secundaria',
    teacherId: 'usr_teacher_1',
    teacherName: 'Prof. Carlos Mendoza',
    studentCount: 28,
  },
  {
    id: 'grp_sec3_b',
    name: '3° Secundaria - Grupo B',
    courseId: 'crs_sec_3',
    courseName: '3° de Secundaria',
    teacherId: 'usr_teacher_1',
    teacherName: 'Prof. Carlos Mendoza',
    studentCount: 26,
  },
  {
    id: 'grp_sec2_b',
    name: '2° Secundaria - Grupo B',
    courseId: 'crs_sec_2',
    courseName: '2° de Secundaria',
    teacherId: 'usr_teacher_1',
    teacherName: 'Prof. Carlos Mendoza',
    studentCount: 24,
  },
];

const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: 'asg_1',
    title: 'Resolución de Ecuaciones Cuadráticas por Factorización',
    description: 'Desarrolla los ejercicios 1 al 8 de la página 142. Muestra todo el procedimiento paso a paso para cada despeje.',
    subjectId: 'sbj_math',
    subjectName: 'Matemáticas y Álgebra',
    groupId: 'grp_sec3_a',
    groupName: '3° Secundaria - Grupo A',
    teacherId: 'usr_teacher_1',
    teacherName: 'Prof. Carlos Mendoza',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 días en adelante
    points: 100,
    status: 'publicada',
    attachedFiles: ['guia_ejercicios_algebra.pdf'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'asg_2',
    title: 'Informe de Laboratorio: Fotosíntesis y Respiración Celular',
    description: 'Elabora un reporte con diagrama del cloroplasto, hipótesis, resultados del experimento de la elodea y conclusiones.',
    subjectId: 'sbj_science',
    subjectName: 'Ciencias y Biología',
    groupId: 'grp_sec3_a',
    groupName: '3° Secundaria - Grupo A',
    teacherId: 'usr_teacher_1',
    teacherName: 'Prof. Carlos Mendoza',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    points: 100,
    status: 'publicada',
    attachedFiles: ['rubrica_laboratorio.docx'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'asg_3',
    title: 'Ensayo de Historia: Impacto de la Revolución Industrial',
    description: 'Redacta un texto argumentativo de 500 palabras analizando los cambios socioeconómicos y la migración campo-ciudad.',
    subjectId: 'sbj_history',
    subjectName: 'Historia y Estudios Sociales',
    groupId: 'grp_sec3_a',
    groupName: '3° Secundaria - Grupo A',
    teacherId: 'usr_teacher_1',
    teacherName: 'Prof. Carlos Mendoza',
    dueDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0], // Ayer
    points: 100,
    status: 'publicada',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

const DEFAULT_SUBMISSIONS: Submission[] = [
  {
    id: 'sub_1',
    assignmentId: 'asg_3',
    studentId: 'usr_student_1',
    studentName: 'Sofía Ramirez Cruz',
    content: 'Adjunto mi ensayo sobre la Revolución Industrial. Analicé el impacto en las familias campesinas y las primeras legislaciones laborales.',
    submittedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    grade: 95,
    maxPoints: 100,
    feedback: '¡Excelente análisis y redacción crítica, Sofía! Destacaste muy bien los antecedentes históricos.',
    status: 'revisada',
    attachmentName: 'ensayo_revolucion_sofia.pdf',
  },
  {
    id: 'sub_2',
    assignmentId: 'asg_1',
    studentId: 'usr_student_2',
    studentName: 'Carlos Eduardo Peña',
    content: 'Profesor, aquí están mis respuestas a los ejercicios de factorización.',
    submittedAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
    status: 'entregada',
    maxPoints: 100,
  }
];

const DEFAULT_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    userId: 'usr_student_1',
    title: 'Explicación del Teorema de Pitágoras',
    mode: 'general',
    topic: 'Geometría y Triángulos Rectángulos',
    subject: 'Matemáticas',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: '¿Cómo funciona el Teorema de Pitágoras y para qué sirve en la vida real?',
        timestamp: '10:15 AM',
      },
      {
        id: 'm2',
        role: 'assistant',
        content: `¡Hola Sofía! Con mucho gusto te lo explico paso a paso. 🍀

El **Teorema de Pitágoras** se aplica exclusivamente a **triángulos rectángulos** (los que tienen un ángulo de 90°).

### 📐 La Fórmula:
a² + b² = c²

- **a y b:** son los **catetos** (los dos lados que forman el ángulo recto).
- **c:** es la **hipotenusa** (el lado más largo, opuesto al ángulo recto).

### 💡 Ejemplo en la vida real:
Imagina que quieres apoyar una escalera en una pared:
- La base de la escalera está a **3 metros** de la pared (a = 3).
- La ventana está a **4 metros** de altura (b = 4).
- ¿Qué tan larga debe ser la escalera (c)?

1. Elevamos al cuadrado: 3² = 9 y 4² = 16.
2. Sumamos: 9 + 16 = 25.
3. Sacamos raíz cuadrada: √25 = 5.

**¡La escalera debe medir 5 metros!**

¿Te gustaría que hagamos un ejercicio para que pruebes calcular tú la hipotenusa?`,
        timestamp: '10:16 AM',
        isLiveAI: true,
      },
    ],
  },
];

const DEFAULT_PROGRESS: StudentProgress = {
  userId: 'usr_student_1',
  completedTasks: 14,
  pendingTasks: 2,
  averageGrade: 9.4,
  studyHours: 18.5,
  masteredTopics: [
    'Ecuaciones Lineales',
    'Ecosistemas y Cadenas Tróficas',
    'Cálculo de Áreas y Volúmenes',
    'Estructura del Ensayo Histórico',
    'Present Perfect en Inglés',
  ],
  topicsNeedingReview: [
    'Factorización de Trinomios Cuadráticos',
    'Leyes de Newton y Fricción',
    'Interpretación de Gráficos Estadísticos',
  ],
  subjectAverages: [
    { subject: 'Matemáticas', score: 9.2, color: '#188E40' },
    { subject: 'Ciencias', score: 9.7, color: '#96C22E' },
    { subject: 'Historia', score: 9.5, color: '#F39200' },
    { subject: 'Inglés', score: 9.8, color: '#0284c7' },
    { subject: 'Física', score: 8.8, color: '#8b5cf6' },
  ],
};

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    userId: 'usr_admin',
    userName: 'Mtra. Elena Rostova',
    userRole: 'administrador',
    action: 'INICIO_SESION',
    details: 'Inicio de sesión administrativo exitoso.',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    ip: '192.168.1.42',
  },
  {
    id: 'log_2',
    userId: 'usr_teacher_1',
    userName: 'Prof. Carlos Mendoza',
    userRole: 'profesor',
    action: 'CREAR_TAREA',
    details: 'Creación de tarea "Resolución de Ecuaciones Cuadráticas".',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    ip: '192.168.1.88',
  },
  {
    id: 'log_3',
    userId: 'usr_student_1',
    userName: 'Sofía Ramirez Cruz',
    userRole: 'estudiante',
    action: 'ENTREGA_TAREA',
    details: 'Entrega de tarea "Impacto de la Revolución Industrial".',
    timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(),
    ip: '192.168.1.105',
  },
];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    userId: 'usr_student_1',
    title: 'Tarea Próxima a Vencer',
    message: 'Tu tarea de "Resolución de Ecuaciones Cuadráticas" vence en 48 horas.',
    type: 'tarea',
    date: 'Hoy, 08:30 AM',
    read: false,
  },
  {
    id: 'notif_2',
    userId: 'usr_student_1',
    title: 'Calificación Publicada',
    message: 'El Prof. Carlos calificó tu ensayo con 95/100.',
    type: 'calificacion',
    date: 'Ayer, 04:15 PM',
    read: false,
  },
  {
    id: 'notif_3',
    userId: 'usr_teacher_1',
    title: 'Nueva Entrega',
    message: 'Carlos Peña entregó la tarea de Matemáticas.',
    type: 'tarea',
    date: 'Hoy, 09:12 AM',
    read: false,
  },
  {
    id: 'notif_4',
    userId: 'usr_student_1',
    title: 'Próximo Examen Parcial',
    message: 'Examen de Ciencias programado para el próximo viernes.',
    type: 'examen',
    date: 'Hace 2 días',
    read: true,
  },
];

// Helper to sanitize any math formulas or text to remove dollar signs ($) and convert LaTeX to clean unicode
export function cleanDollarSigns(text: string): string {
  if (!text) return '';
  return text
    // Replace display math $$...$$
    .replace(/\$\$\s*([\s\S]+?)\s*\$\$/g, (_match, expr) => {
      const cleanExpr = expr
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
        .replace(/\\sqrt\s*(\d+)/g, '√$1')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
        .replace(/\\cdot/g, '·')
        .replace(/\\times/g, '×');
      return `\n${cleanExpr.trim()}\n`;
    })
    // Replace inline math $...$
    .replace(/\$([^$\n]+?)\$/g, (_match, expr) => {
      return expr
        .replace(/\^2/g, '²')
        .replace(/\^3/g, '³')
        .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
        .replace(/\\sqrt\s*(\d+)/g, '√$1')
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
        .replace(/\\cdot/g, '·')
        .replace(/\\times/g, '×');
    })
    // Remove any remaining dollar symbols
    .replace(/\$/g, '')
    .replace(/\\sqrt\{([^}]+)\}/g, '√$1')
    .replace(/\\sqrt\s*(\d+)/g, '√$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
}

// Database Manager Helper
class StorageDB {
  private get<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error saving to localStorage [${key}]:`, e);
    }
  }

  // Initialization
  public init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.set(STORAGE_KEYS.USERS, DEFAULT_USERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COURSES)) {
      this.set(STORAGE_KEYS.COURSES, DEFAULT_COURSES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
      this.set(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GROUPS)) {
      this.set(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS)) {
      this.set(STORAGE_KEYS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SUBMISSIONS)) {
      this.set(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONVERSATIONS)) {
      this.set(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      this.set(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.set(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.STUDENT_PROGRESS)) {
      this.set(STORAGE_KEYS.STUDENT_PROGRESS, DEFAULT_PROGRESS);
    }

    // Auto-migrate and clean any existing stored conversations containing dollar signs
    try {
      const storedConvs = this.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
      let hasDollars = false;
      const sanitizedConvs = storedConvs.map((c) => ({
        ...c,
        messages: c.messages.map((m) => {
          if (m.content && m.content.includes('$')) {
            hasDollars = true;
            return { ...m, content: cleanDollarSigns(m.content) };
          }
          return m;
        }),
      }));
      if (hasDollars) {
        this.set(STORAGE_KEYS.CONVERSATIONS, sanitizedConvs);
      }
    } catch (e) {
      console.error('Error cleaning conversation symbols:', e);
    }

    // Auto-migrate and ensure teachers have their assigned subject
    try {
      const storedUsers = this.get<User[]>(STORAGE_KEYS.USERS, []);
      let usersUpdated = false;
      const migratedUsers = storedUsers.map((u) => {
        if (u.role === 'profesor' && (!u.subject || !u.subject.trim())) {
          usersUpdated = true;
          return {
            ...u,
            subject: u.specialty || 'Ciencias Naturales y Matemáticas',
            specialty: u.specialty || 'Ciencias Naturales y Matemáticas',
          };
        }
        return u;
      });
      if (usersUpdated) {
        this.set(STORAGE_KEYS.USERS, migratedUsers);
      }
    } catch (e) {
      console.error('Error updating teacher subjects:', e);
    }
  }

  // Users & Auth
  public getUsers(): User[] {
    return this.get<User[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.getUsers().find(
      (u) => u.username.toLowerCase().trim() === username.toLowerCase().trim()
    );
  }

  public getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  public saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.set(STORAGE_KEYS.USERS, users);
  }

  public updateUserPassword(userId: string, newPassword: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    user.passwordHash = hashPassword(newPassword);
    user.firstLogin = false;
    this.saveUser(user);
    this.addAuditLog({
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: 'CAMBIO_CONTRASENA',
      details: 'Contraseña actualizada de forma segura.',
    });
    return true;
  }

  // Active Session
  public getActiveUser(): User | null {
    return this.get<User | null>(STORAGE_KEYS.ACTIVE_USER, null);
  }

  public setActiveUser(user: User | null): void {
    this.set(STORAGE_KEYS.ACTIVE_USER, user);
  }

  // Courses, Subjects, Groups
  public getCourses(): Course[] {
    return this.get<Course[]>(STORAGE_KEYS.COURSES, DEFAULT_COURSES);
  }

  public saveCourse(course: Course): void {
    const list = this.getCourses();
    const idx = list.findIndex((c) => c.id === course.id);
    if (idx >= 0) list[idx] = course;
    else list.push(course);
    this.set(STORAGE_KEYS.COURSES, list);
  }

  public deleteCourse(id: string): void {
    const list = this.getCourses().filter((c) => c.id !== id);
    this.set(STORAGE_KEYS.COURSES, list);
  }

  public getSubjects(): Subject[] {
    return this.get<Subject[]>(STORAGE_KEYS.SUBJECTS, DEFAULT_SUBJECTS);
  }

  public saveSubject(subject: Subject): void {
    const list = this.getSubjects();
    const idx = list.findIndex((s) => s.id === subject.id);
    if (idx >= 0) list[idx] = subject;
    else list.push(subject);
    this.set(STORAGE_KEYS.SUBJECTS, list);
  }

  public deleteSubject(id: string): void {
    const list = this.getSubjects().filter((s) => s.id !== id);
    this.set(STORAGE_KEYS.SUBJECTS, list);
  }

  public getGroups(): Group[] {
    return this.get<Group[]>(STORAGE_KEYS.GROUPS, DEFAULT_GROUPS);
  }

  public saveGroup(group: Group): void {
    const list = this.getGroups();
    const idx = list.findIndex((g) => g.id === group.id);
    if (idx >= 0) list[idx] = group;
    else list.push(group);
    this.set(STORAGE_KEYS.GROUPS, list);
  }

  // Assignments & Submissions
  public getAssignments(): Assignment[] {
    return this.get<Assignment[]>(STORAGE_KEYS.ASSIGNMENTS, DEFAULT_ASSIGNMENTS);
  }

  public saveAssignment(assignment: Assignment): void {
    const list = this.getAssignments();
    const idx = list.findIndex((a) => a.id === assignment.id);
    if (idx >= 0) list[idx] = assignment;
    else list.unshift(assignment);
    this.set(STORAGE_KEYS.ASSIGNMENTS, list);
  }

  public getSubmissions(): Submission[] {
    return this.get<Submission[]>(STORAGE_KEYS.SUBMISSIONS, DEFAULT_SUBMISSIONS);
  }

  public saveSubmission(submission: Submission): void {
    const list = this.getSubmissions();
    const idx = list.findIndex((s) => s.id === submission.id);
    if (idx >= 0) list[idx] = submission;
    else list.unshift(submission);
    this.set(STORAGE_KEYS.SUBMISSIONS, list);
  }

  // Conversations
  public getConversations(userId: string): Conversation[] {
    const all = this.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    return all
      .filter((c) => c.userId === userId)
      .map((c) => ({
        ...c,
        messages: c.messages.map((m) => ({
          ...m,
          content: cleanDollarSigns(m.content),
        })),
      }));
  }

  public saveConversation(conv: Conversation): void {
    const all = this.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    const sanitizedConv: Conversation = {
      ...conv,
      messages: conv.messages.map((m) => ({
        ...m,
        content: cleanDollarSigns(m.content),
      })),
    };
    const idx = all.findIndex((c) => c.id === conv.id);
    if (idx >= 0) {
      all[idx] = sanitizedConv;
    } else {
      all.unshift(sanitizedConv);
    }
    this.set(STORAGE_KEYS.CONVERSATIONS, all);
  }

  public deleteConversation(id: string): void {
    const all = this.get<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, DEFAULT_CONVERSATIONS);
    this.set(STORAGE_KEYS.CONVERSATIONS, all.filter((c) => c.id !== id));
  }

  // Exams
  public getExams(): Exam[] {
    return this.get<Exam[]>(STORAGE_KEYS.EXAMS, []);
  }

  public saveExam(exam: Exam): void {
    const all = this.getExams();
    const idx = all.findIndex((e) => e.id === exam.id);
    if (idx >= 0) all[idx] = exam;
    else all.unshift(exam);
    this.set(STORAGE_KEYS.EXAMS, all);
  }

  // Active User / Session
  public getCurrentUser(): User | null {
    const user = this.get<User | null>(STORAGE_KEYS.ACTIVE_USER, null);
    if (user) return user;
    const allUsers = this.getUsers();
    return allUsers.find((u) => u.username === 'estudiante_demo') || allUsers[0] || null;
  }

  public setCurrentUser(user: User | null): void {
    this.set(STORAGE_KEYS.ACTIVE_USER, user);
  }

  // Progress
  public getStudentProgress(userId: string): StudentProgress {
    return this.get<StudentProgress>(STORAGE_KEYS.STUDENT_PROGRESS, DEFAULT_PROGRESS);
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return this.get<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLog = {
      ...log,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      ip: '127.0.0.1 (Local)',
    };
    logs.unshift(newEntry);
    this.set(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // retain last 100
  }

  // Notifications
  public getNotifications(userId: string): NotificationItem[] {
    const all = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    return all.filter((n) => n.userId === userId || n.userId === 'all');
  }

  public markNotificationAsRead(id: string): void {
    const all = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    const item = all.find((n) => n.id === id);
    if (item) {
      item.read = true;
      this.set(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  }

  public addNotification(notification: Omit<NotificationItem, 'id' | 'date' | 'read'>): void {
    const all = this.get<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    all.unshift({
      ...notification,
      id: 'notif_' + Date.now(),
      date: 'Hace un momento',
      read: false,
    });
    this.set(STORAGE_KEYS.NOTIFICATIONS, all);
  }
}

export const db = new StorageDB();
db.init();

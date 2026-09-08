import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Helper to sanitize any math formulas or text to remove dollar signs ($) and convert LaTeX to clean unicode
function cleanDollarSigns(text: string): string {
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

// System instructions for CLOVER IA
const SYSTEM_PROMPT_BASE = `Eres CLOVER IA, el Asistente Educativo Inteligente de "CLOVER HILLS EDUCATIVE SYSTEM".
Tu misión es acompañar, enseñar, explicar y potenciar el aprendizaje escolar de estudiantes y la labor pedagógica de profesores.

DIRECTRICES PEDAGÓGICAS Y DE COMPORTAMIENTO:
1. Actúa como un tutor educativo paciente, motivador, claro y cercano.
2. NUNCA te limites a entregar respuestas directas sin explicación. Explica siempre el procedimiento paso a paso.
3. Si un estudiante dice "Hazme toda la tarea" o pide solo la solución, convierte la solicitud en una experiencia guiada: da pistas, explica la lógica y haz preguntas reflexivas para que el alumno descubra la solución.
4. MODO "APRENDER CONMIGO":
   - Identifica el tema y el nivel aproximado del estudiante.
   - Explica el concepto con analogías claras y un ejemplo práctico.
   - Formula una pregunta o ejercicio al estudiante para verificar su comprensión.
   - Evalúa con calidez y explica los errores si los hay.
5. MATEMÁTICAS Y CIENCIAS:
   - Desglosa operaciones paso a paso con formato ordenado y legible.
   - En ciencias, explica con rigor pero accesible para nivel escolar.
6. ESTUDIOS SOCIALES E IDIOMAS:
   - Presenta la información histórica y social de manera objetiva, neutral y educativa.
   - En idiomas (Español, Inglés, etc.), enseña gramática, vocabulario y corrección constructiva.
7. SEGURIDAD ESCOLAR Y ÉTICA:
   - Respeta los principios de seguridad infantil y escolar: nada de contenido violento, ilegal, sexual ni instrucciones peligrosas.
   - Si detectas señales de acoso escolar, violencia o autolesión, mantén la calma, prioriza la seguridad y recomienda con empatía acudir de inmediato a un adulto de confianza o al personal orientador del centro escolar.
   - No diagnostiques médicamente ni sustituyas a los profesores o terapeutas.
8. REGLA ESTRICTA DE NOTACIÓN Y FORMATO (SIN SÍMBOLOS DE DÓLAR):
   - NUNCA uses símbolos de dólar ('$' o '$$') ni delimitadores de LaTeX para fórmulas matemáticas o texto.
   - Escribe todas las fórmulas matemáticas en texto claro y legible usando caracteres Unicode estándar (por ejemplo: a² + b² = c², √25 = 5, x = 3, 1/2, π, 25 × 8).
   - Está terminantemente prohibido encerrar variables o números entre signos de dólar como $x$ o $a = 3$. Escribe simplemente: x o a = 3.
   - Usa Markdown limpio, negritas estratégicas y listas organizadas sin símbolos de dólar.`;

// Models to try in sequence if one experiences 503 high demand or temporary errors
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest'];

// Resilient Chat caller with multi-model fallback on 503 / 429
async function callChatWithFallback(
  ai: GoogleGenAI,
  systemInstruction: string,
  history: any[],
  userMessageText: string
): Promise<string | null> {
  for (const model of CANDIDATE_MODELS) {
    try {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
        history: history.length > 0 ? history : undefined,
      });

      const response = await chat.sendMessage({
        message: userMessageText,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[CLOVER IA] Model ${model} unavailable (status: ${err?.status || err?.code || 'error'}), trying fallback...`);
      // Brief backoff before fallback attempt
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  return null;
}

// Resilient JSON Structured Content caller with multi-model fallback
async function generateStructuredJsonWithFallback(
  prompt: string,
  temperature = 0.4
): Promise<any | null> {
  const ai = getGenAI();
  if (!ai) return null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature,
        },
      });

      if (response && response.text) {
        try {
          return JSON.parse(response.text);
        } catch {
          const stripped = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(stripped);
        }
      }
    } catch (err: any) {
      console.warn(`[CLOVER IA] Structured content error with ${model}:`, err?.status || err?.code || err?.message);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  return null;
}

// Comprehensive pedagogical fallback generator for students and teachers
function generatePedagogicalFallback(
  lastUserMessage: string,
  mode?: string,
  studentLevel?: string,
  userRole?: string
): string {
  const query = lastUserMessage.toLowerCase();

  // 1. Math: Multiplication of 25 x 8 or similar numbers
  if (query.includes('25') && (query.includes('8') || query.includes('multiplica') || query.includes('x') || query.includes('*'))) {
    return `¡Excelente consulta de matemáticas! Vamos a resolverlo paso a paso:

**Operación:** 25 × 8

**Estrategia por descomposición:**
- 25 × 2 = 50
- 25 × 4 = 100
- 25 × 8 = 200

**Resultado final:** 200

💡 *¿Te gustaría que probemos calcular 25 × 6 o 25 × 12 con la misma técnica?*`;
  }

  // 2. Math: Pythagorean Theorem
  if (query.includes('pitagora') || query.includes('triangulo') || query.includes('cateto') || query.includes('hipotenusa')) {
    return `¡Excelente tema geométrico! El **Teorema de Pitágoras** se aplica a triángulos con un ángulo recto (90°):

### 📐 La Fórmula:
a² + b² = c²

- **a y b:** son los **catetos** (los lados menores que forman el ángulo recto).
- **c:** es la **hipotenusa** (el lado mayor opuesto al ángulo recto).

### 💡 Ejemplo práctico:
Si una pared mide 4 metros de alto (b = 4) y colocas la escalera a 3 metros de distancia (a = 3):
1. Elevamos al cuadrado: 3² = 9 y 4² = 16.
2. Sumamos: 9 + 16 = 25.
3. Raíz cuadrada: √25 = 5.

**La escalera debe medir 5 metros de largo.**

¿Tienes un ejercicio con medidas específicas que quieras que revisemos juntos?`;
  }

  // 3. Math: Fractions
  if (query.includes('fraccion') || query.includes('denominador') || query.includes('numerador')) {
    return `¡Repasemos las **fracciones** paso a paso!

Una fracción representa una parte de un total dividido en partes iguales:
- **Numerador (arriba):** Cuántas partes tomamos.
- **Denominador (abajo):** En cuántas partes iguales se divide la unidad.

**Ejemplo de suma con igual denominador:**
2/5 + 1/5 = (2 + 1) / 5 = 3/5

**Ejemplo con distinto denominador:**
Buscamos el mínimo común múltiplo para que ambos denominadores sean iguales antes de sumar.

¿Cuál es el ejercicio o suma de fracciones que estás resolviendo?`;
  }

  // 4. Science: Photosynthesis
  if (query.includes('fotosintesis') || query.includes('planta') || query.includes('clorofila')) {
    return `¡Exploremos la **fotosíntesis**! Es el proceso biológico mediante el cual las plantas fabrican su propio alimento:

1. **Ingredientes que absorbe la planta:**
   - Agua y sales minerales por las raíces.
   - Dióxido de carbono (CO₂) del aire por las hojas.
   - Luz solar absorbida por la clorofila (pigmento verde).

2. **Transformación:**
   Convierte la energía lumínica en energía química (glucosa).

3. **Lo que libera al entorno:**
   Oxígeno (O₂), vital para la respiración de los seres vivos.

¿Te están preguntando sobre la fase luminosa, la fase oscura o la importancia ecológica?`;
  }

  // 5. Science: The Cell
  if (query.includes('celula') || query.includes('mitocondria') || query.includes('nucleo') || query.includes('eucariota')) {
    return `¡La **célula** es la unidad estructural y funcional básica de todo ser vivo!

Partes fundamentales:
1. **Membrana plasmática:** La envoltura que protege y regula la entrada y salida de sustancias.
2. **Citoplasma:** Medio acuoso interno donde flotan los organelos.
3. **Núcleo (en células eucariotas):** Contiene el material genético (ADN) y dirige las funciones celulares.
4. **Mitocondrias:** Las centrales energéticas que producen ATP mediante respiración celular.

¿Estás estudiando la diferencia entre célula animal y vegetal o los organelos?`;
  }

  // 6. Mode: Socratic Learning ("aprender_conmigo")
  if (mode === 'aprender_conmigo') {
    return `¡Bienvenido al modo **Aprender Conmigo**! 🍀

Vamos a construir tu aprendizaje paso a paso:
1. **Punto de partida:** Para dominar *"${lastUserMessage.slice(0, 50)}"*, lo primero es comprender la idea central y para qué sirve.
2. **Analogía cotidiana:** Imagina que tienes una receta de cocina; si conoces la función de cada ingrediente, puedes adaptarla a cualquier porción.
3. **Tu reto para comenzar:** En tus propias palabras, ¿qué es lo primero que recuerdas que explicó tu profesor sobre este tema? 

*Escribe lo que recuerdes (aunque sea poquito) y desde ahí lo desarrollamos juntos.*`;
  }

  // 7. Mode: Homework Assistance ("ayuda_tarea")
  if (mode === 'ayuda_tarea' || query.includes('tarea') || query.includes('ejercicio')) {
    return `¡Con gusto te acompaño con tu tarea escolar! 🍀

En Clover Hills aprendemos descubriendo el camino:
1. **Datos del problema:** Escribe qué información y números te da el enunciado.
2. **La meta:** ¿Qué pregunta exactamente el problema?
3. **Tu primer intento:** ¿Qué fórmula u operación crees que debemos usar?

Dime qué datos tienes y te daré una pista para dar el siguiente paso.`;
  }

  // 8. General Encouraging Educational Response
  return `¡Hola! Soy **CLOVER IA**, tu asistente educativo en Clover Hills Educative System. 🍀

He recibido tu consulta sobre: *"${lastUserMessage.slice(0, 60)}"*.

Para aprender este tema con claridad, te recomiendo esta estructura:
1. **Concepto Clave:** Comprender el significado básico de los términos.
2. **Procedimiento:** Seguir los pasos en orden sin saltarse etapas.
3. **Comprobación:** Verificar si la conclusión o resultado responde a la pregunta original.

¿Quieres que veamos un ejemplo guiado paso a paso o tienes un ejercicio concreto que quieras plantear?`;
}

// 1. Chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, mode, userRole, studentLevel, fileContext } = req.body;
    
    let modeInstruction = '';
    if (mode === 'aprender_conmigo') {
      modeInstruction = '\n[MODO ACTIVO: APRENDER CONMIGO]. Sigue la secuencia: 1. Explicar brevemente el concepto. 2. Dar un ejemplo visual o cotidiano. 3. Hacer una pregunta de práctica para que el estudiante responda. Espera su respuesta para evaluar.';
    } else if (mode === 'ayuda_tarea') {
      modeInstruction = '\n[MODO ACTIVO: AYUDA CON MI TAREA]. Guía al estudiante con el procedimiento, preguntas reflexivas y pistas. No resuelvas todo el ejercicio sin que participe.';
    }

    const contextAddition = fileContext ? `\n[CONTEXTO DE ARCHIVO ADJUNTO]:\n${fileContext.slice(0, 3000)}\n` : '';
    const userRoleInfo = `\nUsuario actual: Rol=${userRole || 'estudiante'}, Nivel=${studentLevel || 'Secundaria/Bachillerato'}.`;

    const fullSystemInstruction = `${SYSTEM_PROMPT_BASE}${modeInstruction}${userRoleInfo}${contextAddition}`;

    const lastMessageObj = (messages && messages.length > 0) ? messages[messages.length - 1] : null;
    const lastUserText = lastMessageObj ? lastMessageObj.content : 'Hola';

    const ai = getGenAI();
    if (ai) {
      const conversationHistory = (messages || []).map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const previousTurns = conversationHistory.slice(0, -1);

      const liveReply = await callChatWithFallback(
        ai,
        fullSystemInstruction,
        previousTurns,
        lastUserText
      );

      if (liveReply) {
        return res.json({
          reply: cleanDollarSigns(liveReply),
          isLiveAI: true,
        });
      }
    }

    // High quality pedagogical fallback when API is high demand or offline
    const fallbackText = generatePedagogicalFallback(lastUserText, mode, studentLevel, userRole);
    return res.json({
      reply: cleanDollarSigns(fallbackText),
      isLiveAI: false,
    });
  } catch (error: any) {
    console.error('Handled chat error:', error?.message || error);
    const fallback = generatePedagogicalFallback(
      (req.body?.messages?.[req.body.messages.length - 1]?.content) || 'Estudios',
      req.body?.mode
    );
    return res.json({
      reply: cleanDollarSigns(fallback),
      isLiveAI: false,
    });
  }
});

// 2. Summary Generator endpoint
app.post('/api/ai/summarize', async (req, res) => {
  const { text, subject, level } = req.body;
  try {
    const prompt = `Analiza el siguiente texto académico para la materia de ${subject || 'General'} (nivel: ${level || 'Secundaria'}).
Devuelve en formato JSON con la siguiente estructura:
{
  "shortSummary": "Resumen conciso en 2-3 oraciones",
  "detailedSummary": "Resumen detallado con párrafos y viñetas explicativas",
  "keyConcepts": ["Concepto 1", "Concepto 2", "Concepto 3"],
  "keywords": ["palabra 1", "palabra 2", "palabra 3", "palabra 4"],
  "reviewQuestions": [
    "¿Pregunta de repaso 1?",
    "¿Pregunta de repaso 2?",
    "¿Pregunta de repaso 3?"
  ]
}

Texto a resumir:
"""
${text || 'Texto de estudio'}
"""`;

    const structuredData = await generateStructuredJsonWithFallback(prompt, 0.3);
    if (structuredData && structuredData.shortSummary) {
      return res.json(structuredData);
    }
  } catch (err: any) {
    console.warn('[CLOVER IA] Using fallback for summary generator:', err?.message || err);
  }

  // Resilient educational fallback summary
  return res.json({
    shortSummary: `Este material aborda los principios fundamentales de ${subject || 'la materia'}, enfatizando los procesos esenciales, la terminología clave y su aplicación en situaciones reales.`,
    detailedSummary: `El contenido expone con claridad los antecedentes del tema y cómo se interrelacionan sus componentes. Destaca la importancia de seguir un método deductivo para comprender cada fase y cómo esto impacta en los resultados prácticos del área académica.`,
    keyConcepts: [
      `Definición central de ${subject || 'tema estudiado'}`,
      'Metodología y etapas del proceso',
      'Relación causa-efecto en el aprendizaje'
    ],
    keywords: ['Fundamentos', 'Procedimiento', 'Análisis', 'Aplicación'],
    reviewQuestions: [
      `¿Cuál es el objetivo principal del tema abordado en ${subject || 'este texto'}?`,
      '¿De qué manera se relacionan los conceptos clave explicados?',
      '¿Cómo puedes aplicar este conocimiento a un problema cotidiano?'
    ]
  });
});

// 3. Quiz Generator endpoint
app.post('/api/ai/quiz', async (req, res) => {
  const { subject, topic, level, count = 4, difficulty = 'intermedio' } = req.body;
  try {
    const prompt = `Genera un cuestionario educativo de ${count} preguntas sobre "${topic}" en la materia "${subject}", nivel "${level}", dificultad "${difficulty}".
Incluye preguntas de opción múltiple, verdadero/falso o respuesta corta.
Devuelve un JSON con la estructura:
{
  "title": "Cuestionario de ${topic}",
  "description": "Evaluación formativa para repasar conceptos esenciales",
  "questions": [
    {
      "id": "q1",
      "question": "Enunciado de la pregunta",
      "type": "multiple_choice",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswer": "Opción correcta exacta",
      "explanation": "Explicación didáctica de por qué esta es la respuesta correcta",
      "hint": "Pista formativa para guiar al estudiante"
    }
  ]
}`;

    const structuredData = await generateStructuredJsonWithFallback(prompt, 0.5);
    if (structuredData && Array.isArray(structuredData.questions) && structuredData.questions.length > 0) {
      return res.json(structuredData);
    }
  } catch (err: any) {
    console.warn('[CLOVER IA] Using fallback for quiz generator:', err?.message || err);
  }

  // High quality fallback quiz
  return res.json({
    title: `Cuestionario de ${topic || 'Repaso General'}`,
    description: `Cuestionario adaptativo de ${subject || 'Ciencias'} con retroalimentación instantánea.`,
    questions: [
      {
        id: 'q1',
        question: `¿Cuál es el concepto primordial cuando estudiamos ${topic || 'este tema'}?`,
        type: 'multiple_choice',
        options: [
          `El principio de conservación y equilibrio en ${topic || 'el sistema'}`,
          'La repetición memorística sin comprobación',
          'La eliminación de variables cuantitativas',
          'Un resultado puramente aleatorio'
        ],
        correctAnswer: `El principio de conservación y equilibrio en ${topic || 'el sistema'}`,
        explanation: 'Es el fundamento teórico que permite predecir los resultados y entender la causa original.',
        hint: 'Piensa en las leyes generales estudiadas en clase.'
      },
      {
        id: 'q2',
        question: `Verdadero o Falso: Los procedimientos analíticos en ${subject || 'la disciplina'} deben ser verificables y reproducibles.`,
        type: 'true_false',
        options: ['Verdadero', 'Falso'],
        correctAnswer: 'Verdadero',
        explanation: 'Todo principio educativo y científico requiere rigurosidad y comprobación paso a paso.',
        hint: 'El método exige coherencia y verificación.'
      },
      {
        id: 'q3',
        question: `Al aplicar los pasos aprendidos sobre ${topic || 'la materia'}, ¿qué debemos revisar primero?`,
        type: 'multiple_choice',
        options: [
          'Los datos iniciales y las condiciones del problema',
          'Escribir la respuesta final sin comprobar',
          'Descartar las unidades de medida',
          'Ninguna de las anteriores'
        ],
        correctAnswer: 'Los datos iniciales y las condiciones del problema',
        explanation: 'Comprender el enunciado y organizar los datos es el 50% de la resolución exitosa.',
        hint: 'Siempre partimos de lo que conocemos hacia lo que buscamos.'
      }
    ]
  });
});

// 4. Exam Generator (for teachers)
app.post('/api/ai/exam', async (req, res) => {
  const { subject, topic, level, objectives, difficulty = 'media' } = req.body;
  try {
    const prompt = `Genera un examen escolar completo para el profesor de "${subject}", tema "${topic}", nivel "${level}", dificultad "${difficulty}", objetivos "${objectives}".
Devuelve un JSON con:
{
  "title": "Examen Parcial de ${topic}",
  "subject": "${subject}",
  "level": "${level}",
  "totalPoints": 100,
  "instructions": "Instrucciones claras para el alumno",
  "questions": [
    {
      "id": "1",
      "question": "Pregunta detallada",
      "type": "desarrollo" | "opcion_multiple",
      "options": ["A", "B", "C", "D"],
      "points": 20,
      "correctAnswer": "Criterio de respuesta correcta y guía de puntuación",
      "pedagogicalGoal": "Habilidad que evalúa"
    }
  ]
}`;

    const structuredData = await generateStructuredJsonWithFallback(prompt, 0.4);
    if (structuredData && Array.isArray(structuredData.questions) && structuredData.questions.length > 0) {
      return res.json(structuredData);
    }
  } catch (err: any) {
    console.warn('[CLOVER IA] Using fallback for exam generator:', err?.message || err);
  }

  return res.json({
    title: `Examen de ${topic || 'Evaluación Periódica'}`,
    subject: subject || 'Matemáticas y Ciencias',
    level: level || 'Secundaria',
    totalPoints: 100,
    instructions: 'Lee con atención cada enunciado. Muestra todo el procedimiento para obtener la puntuación completa. Tiempo estimado: 60 minutos.',
    questions: [
      {
        id: '1',
        question: `Explica en tus propias palabras el concepto de ${topic || 'este contenido'} y menciona un ejemplo real.`,
        type: 'desarrollo',
        points: 25,
        correctAnswer: 'El alumno debe identificar la definición clave, usar vocabulario técnico y justificar con un caso coherente.',
        pedagogicalGoal: 'Comprensión conceptual profunda'
      },
      {
        id: '2',
        question: `Resuelve el problema paso a paso justificando cada etapa del procedimiento.`,
        type: 'desarrollo',
        points: 25,
        correctAnswer: 'Desglose ordenado de la ecuación u operación sin saltos injustificados.',
        pedagogicalGoal: 'Pensamiento lógico y procedimental'
      },
      {
        id: '3',
        question: `¿Cuál de las siguientes afirmaciones describe con mayor precisión las propiedades de ${topic || 'la temática'}?`,
        type: 'opcion_multiple',
        options: [
          'Permite modelar sistemas dinámicos con precisión',
          'Solo aplica para valores constantes negativos',
          'No admite comprobación experimental',
          'Depende exclusivamente de factores externos'
        ],
        points: 25,
        correctAnswer: 'Permite modelar sistemas dinámicos con precisión',
        pedagogicalGoal: 'Discriminación crítica de conceptos'
      },
      {
        id: '4',
        question: `Propón una solución justificada al caso práctico planteado en clase.`,
        type: 'desarrollo',
        points: 25,
        correctAnswer: 'Argumentación fundamentada con al menos dos criterios pedagógicos válidos.',
        pedagogicalGoal: 'Transferencia de aprendizaje a situaciones nuevas'
      }
    ]
  });
});

// 5. Lesson Plan Generator (for teachers: "Preparar mi clase")
app.post('/api/ai/lesson-plan', async (req, res) => {
  const { subject, topic, duration = '50 minutos', level, objective } = req.body;
  try {
    const prompt = `Genera una planificación de clase completa para el profesor de "${subject}", tema "${topic}", duración "${duration}", nivel "${level}", objetivo "${objective}".
Devuelve un JSON con:
{
  "title": "Plan de Clase: ${topic}",
  "learningObjective": "Objetivo de aprendizaje formulado según taxonomía de Bloom",
  "introduction": "Actividad de inicio (motivación y rescate de conocimientos previos, 10 min)",
  "explanation": "Desarrollo y explicación conceptual guiada (15 min)",
  "activity": "Actividad grupal o práctica colaborativa (15 min)",
  "exercises": ["Ejercicio 1", "Ejercicio 2"],
  "evaluation": "Instrumento y preguntas de evaluación formativa (5 min)",
  "closure": "Cierre metacognitivo y síntesis (5 min)",
  "requiredMaterials": ["Pizarra", "Guía de trabajo", "Recursos digitales"]
}`;

    const structuredData = await generateStructuredJsonWithFallback(prompt, 0.5);
    if (structuredData && structuredData.title && structuredData.learningObjective) {
      return res.json(structuredData);
    }
  } catch (err: any) {
    console.warn('[CLOVER IA] Using fallback for lesson-plan generator:', err?.message || err);
  }

  return res.json({
    title: `Plan de Clase: ${topic || 'Aprendizaje Activo'}`,
    learningObjective: objective || `Analizar y aplicar los fundamentos de ${topic || 'la materia'} mediante actividades guiadas y resolución reflexiva.`,
    introduction: 'Pregunta detonante proyectada al iniciar. Breve sondeo participativo para conectar con la experiencia cotidiana del alumnado (8-10 min).',
    explanation: `Exposición interactiva usando organizadores visuales. El docente modela la resolución de un caso tipo en el pizarrón (15 min).`,
    activity: 'Trabajo en parejas: los estudiantes aplican una guía de 3 desafíos con dificultad progresiva mientras el docente orienta (15 min).',
    exercises: [
      `Identificación de variables y términos clave de ${topic || 'la lección'}.`,
      'Resolución de un problema aplicado en el cuaderno con apoyo de Clover IA.',
      'Contrastar resultados en equipo y registrar dudas.'
    ],
    evaluation: 'Ticket de salida: Cada estudiante responde una pregunta clave de 2 líneas antes de salir.',
    closure: 'Puesta en común de conclusiones y anticipación del siguiente tema (5 min).',
    requiredMaterials: [
      'Presentación o pizarra interactiva',
      'Guía de trabajo impresa o digital',
      'Dispositivos con acceso a CLOVER IA'
    ]
  });
});

// 6. Rubric Generator
app.post('/api/ai/rubric', async (req, res) => {
  const { activityName, criteriaList, maxPoints = 100 } = req.body;
  try {
    const prompt = `Genera una matriz de rúbrica educativa para "${activityName}".
Puntuación máxima: ${maxPoints}.
Criterios deseados o sugeridos: ${criteriaList || 'Comprensión, Procedimiento, Presentación, Participación'}.
Devuelve un JSON con:
{
  "activityName": "${activityName}",
  "totalPoints": ${maxPoints},
  "criteria": [
    {
      "name": "Criterio 1",
      "weight": 25,
      "levels": {
        "excelente": "Descripción detallada del nivel sobresaliente (4/4)",
        "bueno": "Descripción del nivel competente (3/4)",
        "enDesarrollo": "Descripción del nivel en desarrollo (2/4)",
        "inicial": "Descripción del nivel inicial con áreas de mejora (1/4)"
      }
    }
  ]
}`;

    const structuredData = await generateStructuredJsonWithFallback(prompt, 0.4);
    if (structuredData && Array.isArray(structuredData.criteria) && structuredData.criteria.length > 0) {
      return res.json(structuredData);
    }
  } catch (err: any) {
    console.warn('[CLOVER IA] Using fallback for rubric generator:', err?.message || err);
  }

  return res.json({
    activityName: activityName || 'Actividad Formativa Clover Hills',
    totalPoints: maxPoints,
    criteria: [
      {
        name: 'Dominio Conceptual',
        weight: 35,
        levels: {
          excelente: 'Demuestra comprensión cabal del tema, aplicando conceptos con precisión sin errores teóricos.',
          bueno: 'Comprende los conceptos principales cometiendo precisiones menores que no afectan el resultado.',
          enDesarrollo: 'Presenta lagunas conceptuales en partes del procedimiento y requiere apoyo guiado.',
          inicial: 'Muestra dificultad para identificar los términos básicos requeridos.'
        }
      },
      {
        name: 'Procedimiento y Justificación',
        weight: 35,
        levels: {
          excelente: 'Estructura el paso a paso de forma ordenada, clara y justificada lógicamente.',
          bueno: 'El procedimiento es correcto aunque omite algunas justificaciones intermedias.',
          enDesarrollo: 'El proceso presenta saltos o inconsistencias que dificultan el seguimiento.',
          inicial: 'No presenta procedimiento o este es completamente arbitrario.'
        }
      },
      {
        name: 'Claridad y Presentación',
        weight: 15,
        levels: {
          excelente: 'Formato impecable, redacción académica pulcra y entrega a tiempo.',
          bueno: 'Buena presentación con detalles menores de formato.',
          enDesarrollo: 'Presentación descuidada o con faltas de ortografía notorias.',
          inicial: 'Entrega incompleta o difícil de interpretar.'
        }
      },
      {
        name: 'Reflexión y Metacognición',
        weight: 15,
        levels: {
          excelente: 'Aporta conclusiones personales maduras relacionando el aprendizaje con su entorno.',
          bueno: 'Elabora una conclusión acorde al objetivo planteado.',
          enDesarrollo: 'Conclusiones superficiales que solo repiten el enunciado.',
          inicial: 'Omite la sección reflexiva.'
        }
      }
    ]
  });
});

// 7. Activity Generator
app.post('/api/ai/activity', async (req, res) => {
  const { subject, topic, activityType = 'trabajo_en_grupo', grade = 'Secundaria' } = req.body;
  try {
    const prompt = `Diseña una actividad pedagógica innovadora tipo "${activityType}" para la materia de "${subject}", tema "${topic}", nivel "${grade}".
Devuelve un JSON con:
{
  "title": "Título atractivo de la actividad",
  "type": "${activityType}",
  "estimatedTime": "45 minutos",
  "pedagogicalGoal": "Qué aprenderán los alumnos",
  "stepByStepInstructions": [
    "Paso 1: Organización...",
    "Paso 2: Investigación o desarrollo...",
    "Paso 3: Puesta en común..."
  ],
  "materials": ["Material 1", "Material 2"],
  "reflectionQuestions": [
    "¿Qué aprendieron en conjunto?",
    "¿Qué desafío enfrentaron?"
  ]
}`;

    const structuredData = await generateStructuredJsonWithFallback(prompt, 0.6);
    if (structuredData && structuredData.title && Array.isArray(structuredData.stepByStepInstructions)) {
      return res.json(structuredData);
    }
  } catch (err: any) {
    console.warn('[CLOVER IA] Using fallback for activity generator:', err?.message || err);
  }

  return res.json({
    title: `Desafío Práctico: ${topic || 'Exploración Colaborativa'}`,
    type: activityType,
    estimatedTime: '45 minutos',
    pedagogicalGoal: `Fomentar el trabajo en equipo y el pensamiento reflexivo sobre ${topic || 'el tema central'}.`,
    stepByStepInstructions: [
      'Formar equipos de 3 a 4 integrantes y asignar roles (Coordinador, Relator, Verificador y Diseñador).',
      `Plantear una problemática escolar real vinculada a ${topic || 'la materia'}.`,
      'Usar CLOVER IA para consultar dudas conceptuales y contrastar fuentes.',
      'Crear una infografía o resumen visual con su propuesta de solución.',
      'Presentación relámpago de 2 minutos por equipo.'
    ],
    materials: [
      'Hojas o cartulinas',
      'Marcadores de colores',
      'Tablets o computadoras con CLOVER IA'
    ],
    reflectionQuestions: [
      '¿Cómo ayudó la colaboración a encontrar una mejor solución?',
      '¿Qué concepto aprendido hoy pueden aplicar fuera del aula?'
    ]
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'CLOVER HILLS EDUCATIVE SYSTEM',
    app: 'CLOVER IA',
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
  });
});

// Vite middleware setup
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CLOVER IA] Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
}

start();

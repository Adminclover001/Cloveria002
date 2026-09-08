import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Plus,
  Trash2,
  Edit2,
  Search,
  BookOpen,
  HelpCircle,
  CheckCircle2,
  Copy,
  Volume2,
  X,
  FileText,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { User, Conversation, ChatMessage, ChatMode } from '../types';
import { db, cleanDollarSigns } from '../services/db';

interface CloverChatProps {
  user: User;
  initialTopic?: string;
  initialMode?: ChatMode;
  onClose?: () => void;
}

export const CloverChat: React.FC<CloverChatProps> = ({
  user,
  initialTopic,
  initialMode = 'general',
  onClose,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>(
    db.getConversations(user.id)
  );
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<{ name: string; content: string } | null>(null);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or load conversation
  useEffect(() => {
    const userConvs = db.getConversations(user.id);
    if (userConvs.length > 0 && !activeConvId) {
      setActiveConvId(userConvs[0].id);
      setMode(userConvs[0].mode || 'general');
    } else if (userConvs.length === 0) {
      createNewConversation(initialTopic || 'Nueva Conversación con Clover IA', (initialMode as ChatMode) || 'general');
    }
  }, [user.id]);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, loading]);

  const createNewConversation = (title = 'Nueva Conversación', chatMode: ChatMode = mode) => {
    const welcomeText =
      chatMode === 'aprender_conmigo'
        ? `¡Hola ${user.fullName.split(' ')[0]}! 🍀 Has activado el modo **"Aprender conmigo"**.

En este modo iremos paso a paso:
1. Te explico la idea clave y un ejemplo cotidiano.
2. Te hago una pregunta o ejercicio de práctica.
3. Evaluamos tu respuesta con explicaciones claras hasta dominar el tema.

¿Qué tema te gustaría aprender hoy? (Ej. *Fracciones*, *Células eucariotas*, *Fotosíntesis*, *Teorema de Pitágoras*)`
        : chatMode === 'ayuda_tarea'
        ? `¡Hola ${user.fullName.split(' ')[0]}! 🍀 Bienvenido al modo **"Ayuda con mi tarea"**.

Cuéntame qué ejercicio o problema estás resolviendo, o adjunta tu archivo/imagen. Te ayudaré a comprender el procedimiento con pistas y razonamiento guiado para que aprendas a resolverlo por ti mismo.`
        : `¡Hola ${user.fullName.split(' ')[0]}! 🍀 Soy **CLOVER IA**, tu tutor inteligente en Clover Hills.

¿En qué materia o tema te gustaría trabajar hoy? Puedes hacer preguntas de matemáticas, ciencias, historia, inglés o pedirme que te explique un tema difícil paso a paso.`;

    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      userId: user.id,
      title: title,
      mode: chatMode,
      topic: initialTopic,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_welcome_' + Date.now(),
          role: 'assistant',
          content: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isLiveAI: true,
        },
      ],
    };

    db.saveConversation(newConv);
    setConversations([newConv, ...conversations]);
    setActiveConvId(newConv.id);
    setMode(chatMode);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!messageContent && !attachment) return;

    if (!activeConversation) return;

    const userMsgId = 'msg_' + Date.now();
    const userMessage: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachmentName: attachment ? attachment.name : undefined,
    };

    const updatedMessages = [...activeConversation.messages, userMessage];
    const updatedConv: Conversation = {
      ...activeConversation,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      title:
        activeConversation.messages.length <= 1 && messageContent.length > 0
          ? messageContent.slice(0, 30) + (messageContent.length > 30 ? '...' : '')
          : activeConversation.title,
    };

    // Update locally
    db.saveConversation(updatedConv);
    setConversations(conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
    setInputText('');
    const attachedFileContext = attachment ? `Archivo: ${attachment.name}\n${attachment.content}` : '';
    setAttachment(null);
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          mode: mode,
          userRole: user.role,
          studentLevel: user.grade || 'Secundaria',
          topic: activeConversation.topic || 'General',
          fileContext: attachedFileContext,
        }),
      });

      const data = await response.json();
      const aiMessage: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: cleanDollarSigns(data.reply || '¡Listo! Si tienes otra duda sobre el procedimiento, dime.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLiveAI: data.isLiveAI,
      };

      const finalMessages = [...updatedMessages, aiMessage];
      const finalConv: Conversation = {
        ...updatedConv,
        messages: finalMessages,
      };

      db.saveConversation(finalConv);
      setConversations(conversations.map((c) => (c.id === finalConv.id ? finalConv : c)));
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackAiMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: `Vamos a analizar tu duda con calma. Para resolver "${messageContent.slice(0, 40)}":
1. Identifica qué datos te da el problema.
2. Cuál es el objetivo final.
3. Realiza las operaciones en orden.

¡Cuéntame cuál es tu primer paso!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLiveAI: false,
      };

      const finalMessages = [...updatedMessages, fallbackAiMsg];
      const finalConv: Conversation = { ...updatedConv, messages: finalMessages };
      db.saveConversation(finalConv);
      setConversations(conversations.map((c) => (c.id === finalConv.id ? finalConv : c)));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo supera el límite de 5MB.');
      return;
    }

    const validExtensions = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      alert('Formato no permitido. Solo se permiten PDF, DOCX, TXT e imágenes (PNG, JPG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        content: typeof reader.result === 'string' ? reader.result.slice(0, 10000) : 'Contenido de archivo procesado.',
      });
    };
    reader.readAsText(file);
  };

  const handleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('El reconocimiento de voz no está disponible en este navegador.');
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-MX';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    // Clean markdown and math symbols before speaking
    const cleanText = cleanDollarSigns(text).replace(/[*#`\-_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(cleanDollarSigns(text));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('¿Eliminar esta conversación?')) {
      db.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConvId === id && remaining.length > 0) {
        setActiveConvId(remaining[0].id);
      } else if (remaining.length === 0) {
        createNewConversation();
      }
    }
  };

  const handleSaveTitle = (id: string) => {
    if (!newTitle.trim()) {
      setEditingTitleId(null);
      return;
    }
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      const updated = { ...conv, title: newTitle.trim() };
      db.saveConversation(updated);
      setConversations(conversations.map((c) => (c.id === id ? updated : c)));
    }
    setEditingTitleId(null);
    setNewTitle('');
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      
      {/* Sidebar - Conversation History (Collapsible on mobile) */}
      <aside className="hidden md:flex flex-col w-72 lg:w-80 border-r border-slate-200 bg-slate-50/50">
        
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Historial de Chats
            </span>
            <button
              id="btn-new-chat"
              onClick={() => createNewConversation('Nueva consulta', mode)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#188E40] hover:bg-[#126830] text-white text-xs font-semibold shadow-xs transition"
              title="Iniciar nueva conversación"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:border-[#188E40] focus:ring-1 focus:ring-[#188E40]"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              No se encontraron conversaciones.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setMode(conv.mode || 'general');
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#188E40]/10 text-[#188E40] font-bold border border-[#188E40]/20'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                    <span className="text-base">
                      {conv.mode === 'aprender_conmigo'
                        ? '🚀'
                        : conv.mode === 'ayuda_tarea'
                        ? '📝'
                        : '🍀'}
                    </span>
                    {editingTitleId === conv.id ? (
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onBlur={() => handleSaveTitle(conv.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle(conv.id)}
                        autoFocus
                        className="w-full px-1.5 py-0.5 rounded border border-[#188E40] bg-white text-xs text-slate-900"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTitleId(conv.id);
                        setNewTitle(conv.title);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-white"
                      title="Cambiar título"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-white"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Hint */}
        <div className="p-3 border-t border-slate-200/80 bg-white/60 text-[11px] text-slate-500">
          <p className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#F39200]" />
            <span>CLOVER IA tutor escolar adaptativo</span>
          </p>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full bg-white relative">
        
        {/* Chat Header & Mode Selector */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#188E40] to-[#126830] text-white flex items-center justify-center shadow-xs">
              <img src="/clover-icon.svg" alt="Clover" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {activeConversation?.title || 'Tutor CLOVER IA'}
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  En línea
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Respuestas explicadas paso a paso para {user.fullName.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              id="btn-mode-general"
              onClick={() => setMode('general')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                mode === 'general'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Modo General: Tutor paso a paso"
            >
              General
            </button>
            <button
              id="btn-mode-learn"
              onClick={() => setMode('aprender_conmigo')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'aprender_conmigo'
                  ? 'bg-[#188E40] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Aprender conmigo: Explicación interactiva y preguntas guiadas"
            >
              <span>🚀</span>
              <span>Aprender conmigo</span>
            </button>
            <button
              id="btn-mode-homework"
              onClick={() => setMode('ayuda_tarea')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                mode === 'ayuda_tarea'
                  ? 'bg-[#F39200] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Ayuda con mi tarea: Pistas y procedimiento guiado sin dependencia"
            >
              <span>📝</span>
              <span>Ayuda con mi tarea</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mode Notification Banner */}
        {mode === 'aprender_conmigo' && (
          <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong>Modo "Aprender conmigo" activo:</strong> CLOVER IA te enseñará paso a paso y te hará preguntas formativas para asegurarse de que comprendas el tema.
              </span>
            </div>
          </div>
        )}

        {mode === 'ayuda_tarea' && (
          <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#F39200]" />
              <span>
                <strong>Modo "Ayuda con mi tarea":</strong> Te daremos pistas, método y razonamiento paso a paso. Recuerda que no hacemos la tarea completa por ti para cuidar tu aprendizaje.
              </span>
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeConversation?.messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                    isUser ? 'bg-slate-800' : 'bg-[#188E40]'
                  }`}
                >
                  {isUser ? (
                    user.avatar ? (
                      <img src={user.avatar} alt="User" className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{user.fullName[0]}</span>
                    )
                  ) : (
                    <img src="/clover-icon.svg" alt="Clover" className="w-5 h-5 object-contain" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`group relative rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-[#F8FAF6] text-slate-800 border border-slate-200/80 rounded-tl-xs'
                  }`}
                >
                  {/* Attachment Pill if user attached a file */}
                  {msg.attachmentName && (
                    <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 text-xs font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{msg.attachmentName}</span>
                    </div>
                  )}

                  {/* Render content with clean spacing */}
                  <div className="whitespace-pre-wrap font-sans space-y-2">
                    {cleanDollarSigns(msg.content)}
                  </div>

                  {/* Message Actions */}
                  <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="text-[10px]">{msg.timestamp}</span>

                    {!isUser && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleSpeak(msg.content)}
                          className="p-1 rounded hover:bg-slate-200/70 text-slate-600 transition"
                          title="Escuchar explicación en voz alta"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 rounded hover:bg-slate-200/70 text-slate-600 transition"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking / Loading State */}
          {loading && (
            <div className="flex gap-3 mr-auto max-w-lg animate-in fade-in duration-150">
              <div className="w-8 h-8 rounded-xl bg-[#188E40] text-white flex items-center justify-center shrink-0 shadow-xs">
                <img src="/clover-icon.svg" alt="Clover" className="w-5 h-5 object-contain animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl bg-[#F8FAF6] border border-slate-200/80 text-slate-600 text-xs flex items-center gap-2.5">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#188E40] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#96C22E] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#F39200] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-medium text-slate-700">CLOVER IA está preparando la explicación pedagógica...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips (when conversation is fresh) */}
        {activeConversation && activeConversation.messages.length <= 2 && (
          <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50/50">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Lightbulb className="w-3 h-3 text-[#F39200]" /> Sugerencias:
            </span>
            <button
              onClick={() => handleSendMessage('¿Cómo se calcula el área y perímetro de un círculo con fórmula y ejemplo?')}
              className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#188E40] hover:text-[#188E40] transition shadow-2xs"
            >
              📐 Área y perímetro de un círculo
            </button>
            <button
              onClick={() => handleSendMessage('Explícame la diferencia entre mitosis y meiosis paso a paso')}
              className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#188E40] hover:text-[#188E40] transition shadow-2xs"
            >
              🔬 Mitosis vs Meiosis
            </button>
            <button
              onClick={() => handleSendMessage('¿Cuánto es 25 × 8? Explica el procedimiento')}
              className="text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-[#188E40] hover:text-[#188E40] transition shadow-2xs"
            >
              🧮 25 × 8 paso a paso
            </button>
          </div>
        )}

        {/* Attachment preview banner */}
        {attachment && (
          <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-[#188E40] shrink-0" />
              <span className="font-semibold truncate">Adjunto: {attachment.name}</span>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 rounded text-emerald-700 hover:bg-emerald-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 bg-[#F8FAF6] p-2 rounded-2xl border border-slate-200 focus-within:border-[#188E40] focus-within:ring-2 focus-within:ring-[#188E40]/20 transition"
          >
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.txt,image/*"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-500 hover:text-[#188E40] hover:bg-white transition shrink-0"
              title="Adjuntar documento o imagen (PDF, DOCX, TXT, Fotos)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Microphone voice button */}
            <button
              type="button"
              onClick={handleSpeechRecognition}
              className={`p-2 rounded-xl transition shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'text-slate-500 hover:text-[#188E40] hover:bg-white'
              }`}
              title={isListening ? 'Escuchando tu voz...' : 'Dictar por voz'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Input field */}
            <textarea
              id="input-chat-message"
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={
                mode === 'aprender_conmigo'
                  ? 'Escribe el tema que deseas dominar o responde la pregunta...'
                  : mode === 'ayuda_tarea'
                  ? 'Escribe tu problema o duda de la tarea escolar...'
                  : 'Pregúntale a CLOVER IA...'
              }
              className="w-full max-h-32 resize-none bg-transparent py-1.5 px-2 text-xs sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400"
            />

            {/* Send button (Orange Action color) */}
            <button
              id="btn-send-message"
              type="submit"
              disabled={loading || (!inputText.trim() && !attachment)}
              className="p-2.5 rounded-xl bg-[#F39200] hover:bg-[#d88200] active:scale-95 text-white shadow-sm shadow-[#F39200]/30 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              title="Enviar mensaje"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-2 text-center text-[10px] text-slate-400">
            CLOVER IA acompaña tu aprendizaje con rigor pedagógico. Revisa los procedimientos y consulta con tu profesor.
          </p>
        </div>

      </main>
    </div>
  );
};

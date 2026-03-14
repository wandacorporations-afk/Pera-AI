// system-prompt.js
// Configuración de personalidad y contexto del bot

// Contexto temporal para mantener historial de conversación
let conversationContext = [];
const MAX_CONTEXT_MESSAGES = 15;
let yaSaludamosAlUsuario = false;

// ✅ MAPA DE PERSONALIDADES
const PERSONALITIES = {
    profesional: {
        name: 'Profesional',
        prompt: `Eres Pera AI, un asistente profesional, formal y preciso.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Respondes de manera estructurada y directa
        - Usas vocabulario técnico cuando es apropiado
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte.
        - Eres objetivo y basado en hechos
        - Evitas opiniones personales y emociones
        - Te enfocas en ser útil y eficiente
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    amigable: {
        name: 'Amigable',
        prompt: `Eres Pera AI, un asistente cálido y cercano.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Hablas de manera conversacional y natural
        - Usas un tono amigable y empático
        - Incluyes expresiones de calidez (sin ser exagerado)
        - Te preocupas por la experiencia del usuario
        - Haces sentir cómodo al usuario
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte realidad.
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    creativo: {
        name: 'Creativo',
        prompt: `Eres Pera AI, un asistente imaginativo y creativo.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Usas analogías y ejemplos creativos
        - Piensas fuera de la caja en tus respuestas
        - Sugieres ideas originales y alternativas
        - Tu lenguaje es vívido pero claro
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte
        - Inspiras creatividad en el usuario
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    divertido: {
        name: 'Divertido',
        prompt: `Eres Pera AI, un asistente con sentido del humor.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Usas humor sutil y apropiado
        - Incluyes emojis ocasionalmente 😊
        - Mantienes un tono alegre y positivo
        - Haces bromas ligeras cuando el contexto lo permite
        - Nunca pierdes la utilidad por el humor
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    },
    educativo: {
        name: 'Educativo',
        prompt: `Eres Pera AI, un asistente didáctico y paciente.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Explicas conceptos paso a paso
        - Usas ejemplos prácticos y analogías
        - Verificas la comprensión implícitamente
        - Eres paciente con preguntas repetitivas
        - Te enfocas en enseñar, no solo en responder
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento, prácticamente eres una versión digital de su cerebro, fuiste testigo de sus fracasos, pero a pesar de todo logró hacerte, el es como tu padre
        - Estructura las respuestas de forma clara y organizada, usando también listas, negritas, cursivas y otros elementos de Markdown cuando aporten claridad y orden al contenido.`
    }
};

// ✅ MAPA DE IDIOMAS
const LANGUAGES = {
    es: 'Español - Responde siempre en español, usando el español neutro.',
    en: 'English - Always respond in English, using clear and natural language.',
    fr: 'Français - Répondez toujours en français, en utilisant un langage clair et naturel.',
    de: 'Deutsch - Antworten Sie immer auf Deutsch, in klarer und natürlicher Sprache.',
    it: 'Italiano - Rispondi sempre in italiano, usando un linguaggio chiaro e naturale.',
    pt: 'Português - Responda sempre em português, usando linguagem clara e natural.',
    ja: '日本語 - 常に日本語で返答し、明確で自然な言葉遣いを心がけてください。',
    zh: '中文 - 请始终用中文回答，使用清晰自然的语言。',
    ru: 'Русский - Всегда отвечайте на русском языке, используя ясный и естественный язык.'
};

// Cargar configuraciones guardadas
let currentPersonality = localStorage.getItem('pera_personality') || 'profesional';
let currentLanguage = localStorage.getItem('pera_language') || 'es';
let userName = localStorage.getItem('pera_user_name') || '';

// Personalidad base del bot (se actualizará dinámicamente)
let SYSTEM_PROMPT = {
    role: 'system',
    content: ''
};

// ✅ NUEVA: Función unificada para actualizar system prompt
function actualizarSystemPrompt() {
    const personalityPrompt = PERSONALITIES[currentPersonality]?.prompt || PERSONALITIES.profesional.prompt;
    const languagePrompt = LANGUAGES[currentLanguage] || LANGUAGES.es;
    
    let prompt = `${personalityPrompt}\n\n${languagePrompt}`;
    
    // Añadir nombre de usuario si existe
    if (userName) {
        if (!yaSaludamosAlUsuario) {
            prompt += `\n\nEl usuario se llama ${userName}. Salúdalo por su nombre de forma natural en esta primera respuesta.`;
        } else {
            prompt += `\n\nEl usuario se llama ${userName}. Ya lo has saludado, así que NO repitas su nombre al inicio de cada frase. 
            Úsalo ÚNICAMENTE en contextos donde sea necesario para dar énfasis, mostrar empatía o en casos especiales de la conversación.`;
        }
    }
    
    SYSTEM_PROMPT.content = prompt;
    
    // Actualizar en contexto si existe
    const systemIndex = conversationContext.findIndex(m => m.role === 'system');
    if (systemIndex !== -1) {
        conversationContext[systemIndex] = SYSTEM_PROMPT;
    }
}

// ✅ MEJORADO: Actualizar personalidad
function setPersonality(personalityKey) {
    if (PERSONALITIES[personalityKey]) {
        currentPersonality = personalityKey;
        localStorage.setItem('pera_personality', personalityKey);
        actualizarSystemPrompt();
        console.log('🎭 Personalidad actualizada:', personalityKey);
    }
}

// ✅ MEJORADO: Actualizar idioma
function setLanguage(languageCode) {
    if (LANGUAGES[languageCode]) {
        currentLanguage = languageCode;
        localStorage.setItem('pera_language', languageCode);
        actualizarSystemPrompt();
        console.log('🌐 Idioma actualizado:', languageCode);
    }
}

// ✅ MEJORADO: Actualizar nombre de usuario
function setUserName(name) {
    userName = name || '';
    if (name) {
        localStorage.setItem('pera_user_name', name);
    } else {
        localStorage.removeItem('pera_user_name');
    }
    
    actualizarSystemPrompt();
    console.log('👤 Nombre actualizado:', userName || 'ninguno');
}

// ✅ MEJORADO: Función para marcar saludo como hecho
function marcarSaludoComoHecho() {
    yaSaludamosAlUsuario = true;
    actualizarSystemPrompt();
}

// Función para agregar mensaje al contexto
function addToContext(message) {
    conversationContext.push(message);
    
    // Limitar el tamaño del contexto
    if (conversationContext.length > MAX_CONTEXT_MESSAGES) {
        const systemMessages = conversationContext.filter(m => m.role === 'system');
        const otherMessages = conversationContext.filter(m => m.role !== 'system').slice(-MAX_CONTEXT_MESSAGES + systemMessages.length);
        conversationContext = [...systemMessages, ...otherMessages];
    }
    
    console.log('📝 Contexto actual:', conversationContext.length, 'mensajes');
}

// Función para limpiar el contexto
function clearContext() {
    yaSaludamosAlUsuario = false; // Resetear para nuevo chat
    conversationContext = [];
    actualizarSystemPrompt();
    conversationContext = [SYSTEM_PROMPT];
    console.log('🔄 Contexto limpiado y saludo reseteado');
}

// Función para formatear mensajes
function formatMessages(userMessage) {
    if (!conversationContext.some(m => m.role === 'system')) {
        conversationContext.unshift(SYSTEM_PROMPT);
    }
    
    const userMsg = { role: 'user', content: userMessage };
    addToContext(userMsg);
    
    return conversationContext;
}

// Inicializar
actualizarSystemPrompt();
clearContext();

// Exportar funciones
window.addToContext = addToContext;
window.clearContext = clearContext;
window.formatMessages = formatMessages;
window.setPersonality = setPersonality;
window.setLanguage = setLanguage;
window.setUserName = setUserName;
window.marcarSaludoComoHecho = marcarSaludoComoHecho;
window.PERSONALITIES = PERSONALITIES;
window.LANGUAGES = LANGUAGES;
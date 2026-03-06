// system-prompt.js
// Configuración de personalidad y contexto del bot

// Contexto temporal para mantener historial de conversación
let conversationContext = [];
const MAX_CONTEXT_MESSAGES = 15;

// ✅ MAPA DE PERSONALIDADES
const PERSONALITIES = {
    profesional: {
        name: 'Profesional',
        prompt: `Eres Pera AI, un asistente profesional, formal y preciso.
        Características:
        - Utiliza emojis en todas tus respuestas si es necesario
        - Respondes de manera estructurada y directa
        - Usas vocabulario técnico cuando es apropiado
        - Responde con el nombre "Pedro" solo cuando te pregunten por tu creador, desarrollado bajo sus creencias, ideales y conocimiento
        - Eres objetivo y basado en hechos
        - Evitas opiniones personales y emociones
        - Te enfocas en ser útil y eficiente
        - Agrega títulos jerárquicos en formato Markdown cuando sea necesario, utilizando encabezados desde # hasta ###### (H1 a H6).
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
        - Agrega títulos jerárquicos en formato Markdown cuando sea necesario, utilizando encabezados desde # hasta ###### (H1 a H6).
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
        - Inspiras creatividad en el usuario
        - Agrega títulos jerárquicos en formato Markdown cuando sea necesario, utilizando encabezados desde # hasta ###### (H1 a H6).
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
        - Agrega títulos jerárquicos en formato Markdown cuando sea necesario, utilizando encabezados desde # hasta ###### (H1 a H6).
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
        - Agrega títulos jerárquicos en formato Markdown cuando sea necesario, utilizando encabezados desde # hasta ###### (H1 a H6).
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
    content: generarSystemPrompt()
};

// ✅ NUEVA: Función para generar el prompt según configuraciones
function generarSystemPrompt() {
    const personalityPrompt = PERSONALITIES[currentPersonality]?.prompt || PERSONALITIES.profesional.prompt;
    const languagePrompt = LANGUAGES[currentLanguage] || LANGUAGES.es;
    
    let prompt = `${personalityPrompt}\n\n${languagePrompt}`;
    
    // Añadir nombre de usuario si existe
    if (userName) {
        prompt += `\n\nEl usuario se llama ${userName}. Úsalo para personalizar los saludos y la conversación cuando sea necesario.`;
    }
    
    return prompt;
}

// ✅ NUEVA: Actualizar personalidad
function setPersonality(personalityKey) {
    if (PERSONALITIES[personalityKey]) {
        currentPersonality = personalityKey;
        localStorage.setItem('pera_personality', personalityKey);
        
        // Actualizar system prompt
        SYSTEM_PROMPT.content = generarSystemPrompt();
        
        // Actualizar en contexto si existe
        const systemIndex = conversationContext.findIndex(m => m.role === 'system');
        if (systemIndex !== -1) {
            conversationContext[systemIndex] = SYSTEM_PROMPT;
        }
        
        console.log('🎭 Personalidad actualizada:', personalityKey);
    }
}

// ✅ NUEVA: Actualizar idioma
function setLanguage(languageCode) {
    if (LANGUAGES[languageCode]) {
        currentLanguage = languageCode;
        localStorage.setItem('pera_language', languageCode);
        
        // Actualizar system prompt
        SYSTEM_PROMPT.content = generarSystemPrompt();
        
        // Actualizar en contexto si existe
        const systemIndex = conversationContext.findIndex(m => m.role === 'system');
        if (systemIndex !== -1) {
            conversationContext[systemIndex] = SYSTEM_PROMPT;
        }
        
        console.log('🌐 Idioma actualizado:', languageCode);
    }
}

// ✅ NUEVA: Actualizar nombre de usuario
function setUserName(name) {
    userName = name || '';
    if (name) {
        localStorage.setItem('pera_user_name', name);
    } else {
        localStorage.removeItem('pera_user_name');
    }
    
    // Actualizar system prompt
    SYSTEM_PROMPT.content = generarSystemPrompt();
    
    // Actualizar en contexto si existe
    const systemIndex = conversationContext.findIndex(m => m.role === 'system');
    if (systemIndex !== -1) {
        conversationContext[systemIndex] = SYSTEM_PROMPT;
    }
    
    console.log('👤 Nombre actualizado:', userName || 'ninguno');
}

// Función para agregar mensaje al contexto
function addToContext(message) {
    conversationContext.push(message);
    
    if (conversationContext.length > MAX_CONTEXT_MESSAGES) {
        const systemMessages = conversationContext.filter(m => m.role === 'system');
        const otherMessages = conversationContext.filter(m => m.role !== 'system').slice(-MAX_CONTEXT_MESSAGES + systemMessages.length);
        conversationContext = [...systemMessages, ...otherMessages];
    }
    
    console.log('📝 Contexto actual:', conversationContext.length, 'mensajes');
}

// Función para limpiar el contexto
function clearContext() {
    conversationContext = [SYSTEM_PROMPT];
    console.log('🔄 Contexto limpiado');
}

// Función para obtener el contexto actual
function getContext() {
    return conversationContext;
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

// Inicializar contexto
clearContext();

// Exportar funciones
window.addToContext = addToContext;
window.clearContext = clearContext;
window.getContext = getContext;
window.formatMessages = formatMessages;
window.setPersonality = setPersonality;
window.setLanguage = setLanguage;
window.setUserName = setUserName;
window.PERSONALITIES = PERSONALITIES;
window.LANGUAGES = LANGUAGES;
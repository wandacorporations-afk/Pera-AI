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
        - Respondes de manera estructurada, directa y muy simple 
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

// ✅ IDIOMAS - Se llenarán después de cargar el JSON
let LANGUAGES = {};
let languagesData = [];
let languagesLoaded = false;

// Función para cargar JSON
function loadLanguagesData() {
    fetch('languages.json')
        .then(response => response.json())
        .then(data => {
            languagesData = data;
            // Construir LANGUAGES para el system prompt
            data.forEach(lang => {
                LANGUAGES[lang.code] = `${lang.name} - Responde siempre en ${lang.name}, usando lenguaje claro y natural.`;
            });
            languagesLoaded = true;
            console.log(`✅ ${languagesData.length} idiomas cargados`);
            
            // Actualizar system prompt después de cargar idiomas
            actualizarSystemPrompt();
            
            // Disparar evento para que la UI se actualice
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('languagesReady'));
            }
        })
        .catch(error => {
            console.error('❌ Error cargando idiomas:', error);
            // Fallback por si falla
            languagesData = [
                { code: "es", name: "Español", flag: "🇪🇸" },
                { code: "en", name: "English", flag: "🇺🇸" },
                { code: "pt", name: "Português", flag: "🇧🇷" }
            ];
            languagesData.forEach(lang => {
                LANGUAGES[lang.code] = `${lang.name} - Responde siempre en ${lang.name}, usando lenguaje claro y natural.`;
            });
            languagesLoaded = true;
            actualizarSystemPrompt();
            window.dispatchEvent(new CustomEvent('languagesReady'));
        });
}

// Cargar configuraciones guardadas
let currentPersonality = localStorage.getItem('pera_personality') || 'profesional';
let currentLanguage = localStorage.getItem('pera_language') || 'es';
let userName = localStorage.getItem('pera_user_name') || '';

// Personalidad base del bot
let SYSTEM_PROMPT = {
    role: 'system',
    content: ''
};

// Función unificada para actualizar system prompt
function actualizarSystemPrompt() {
    const personalityPrompt = PERSONALITIES[currentPersonality]?.prompt || PERSONALITIES.profesional.prompt;
    const languagePrompt = LANGUAGES[currentLanguage] || `Responde siempre en el idioma apropiado.`;
    
    let prompt = `${personalityPrompt}\n\n${languagePrompt}`;
    
    if (userName) {
        if (!yaSaludamosAlUsuario) {
            prompt += `\n\nEl usuario se llama ${userName}. Salúdalo por su nombre de forma natural en esta primera respuesta.`;
        } else {
            prompt += `\n\nEl usuario se llama ${userName}. Ya lo has saludado, así que NO repitas su nombre al inicio de cada frase. Úsalo ÚNICAMENTE en contextos donde sea necesario para dar énfasis, mostrar empatía o en casos especiales de la conversación.`;
        }
    }
    
    SYSTEM_PROMPT.content = prompt;
    
    const systemIndex = conversationContext.findIndex(m => m.role === 'system');
    if (systemIndex !== -1) {
        conversationContext[systemIndex] = SYSTEM_PROMPT;
    }
}

// Actualizar personalidad
function setPersonality(personalityKey) {
    if (PERSONALITIES[personalityKey]) {
        currentPersonality = personalityKey;
        localStorage.setItem('pera_personality', personalityKey);
        actualizarSystemPrompt();
    }
}

// Actualizar idioma
function setLanguage(languageCode) {
    if (LANGUAGES[languageCode]) {
        currentLanguage = languageCode;
        localStorage.setItem('pera_language', languageCode);
        actualizarSystemPrompt();
    }
}

// Actualizar nombre de usuario
function setUserName(name) {
    userName = name || '';
    if (name) {
        localStorage.setItem('pera_user_name', name);
    } else {
        localStorage.removeItem('pera_user_name');
        userName = 'Zenicero';
        localStorage.setItem('pera_user_name', userName);
    }
    actualizarSystemPrompt();
    if (typeof updateProfileInitial === 'function') {
        updateProfileInitial();
    }
}

// Marcar saludo como hecho
function marcarSaludoComoHecho() {
    yaSaludamosAlUsuario = true;
    actualizarSystemPrompt();
}

// Agregar mensaje al contexto
function addToContext(message) {
    conversationContext.push(message);
    if (conversationContext.length > MAX_CONTEXT_MESSAGES) {
        const systemMessages = conversationContext.filter(m => m.role === 'system');
        const otherMessages = conversationContext.filter(m => m.role !== 'system').slice(-MAX_CONTEXT_MESSAGES + systemMessages.length);
        conversationContext = [...systemMessages, ...otherMessages];
    }
}

// Limpiar contexto
function clearContext() {
    yaSaludamosAlUsuario = false;
    conversationContext = [];
    actualizarSystemPrompt();
    conversationContext = [SYSTEM_PROMPT];
}

// Formatear mensajes
function formatMessages(userMessage) {
    if (!conversationContext.some(m => m.role === 'system')) {
        conversationContext.unshift(SYSTEM_PROMPT);
    }
    const userMsg = { role: 'user', content: userMessage };
    addToContext(userMsg);
    return conversationContext;
}

// Obtener lista de idiomas para UI
function getLanguagesList() {
    return languagesData;
}

// Verificar si los idiomas están cargados
function isLanguagesLoaded() {
    return languagesLoaded;
}

// Iniciar carga de idiomas
loadLanguagesData();

// Inicialización básica (sin esperar idiomas)
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
window.getLanguagesList = getLanguagesList;
window.isLanguagesLoaded = isLanguagesLoaded;
window.PERSONALITIES = PERSONALITIES;
window.LANGUAGES = LANGUAGES;
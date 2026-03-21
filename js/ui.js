// ui.js
// Manejo de toda la interfaz de usuario y renderizado

// Configuración de marked con renderer personalizado para código
const renderer = new marked.Renderer();

// Personalizar la renderización de tablas
renderer.table = function(header, body) {
    return `
        <div class="table-wrapper">
            <table>
                <thead>${header}</thead>
                <tbody>${body}</tbody>
            </table>
        </div>
    `;
};

// También personalizar el row de tabla para mantener consistencia
renderer.tablerow = function(content) {
    return `<tr>${content}</tr>`;
};

renderer.tablecell = function(content, flags) {
    const type = flags.header ? 'th' : 'td';
    const tag = flags.align ? `<${type} align="${flags.align}">` : `<${type}>`;
    return tag + content + `</${type}>`;
};

// Personalizar la renderización de bloques de código
renderer.code = function(code, language) {
    // Detectar el lenguaje o usar 'text' por defecto
    const lang = language || 'text';
    const validLang = hljs.getLanguage(lang) ? lang : 'text';
    
    // Resaltar el código con highlight.js
    const highlighted = hljs.highlight(code, { language: validLang }).value;
    
    // Crear la estructura del bloque de código
    return `
        <div class="code-block-wrapper">
            <div class="code-header">
                <span class="code-language">${validLang}</span>
                <button class="code-copy-btn" onclick="copyCodeBlock(this)" aria-label="Copiar código">
                    <span class="material-symbols-outlined" translate="no">content_copy</span>
                </button>
            </div>
            <pre><code class="hljs language-${validLang}">${highlighted}</code></pre>
        </div>
    `;
};

// Configuración de marked (actualizada con el renderer)
marked.setOptions({
    renderer: renderer,
    breaks: true,
    gfm: true,
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

// Elementos del DOM
const messageContainer = document.getElementById('messageContainer');
const messagesDynamic = document.getElementById('messagesDynamic');
const chatTextarea = document.getElementById('chatTextarea');
const messageArea = document.getElementById('messageArea');
const sendBtn = document.getElementById('sendBtn');

// Estado del UI
let isTyping = false;
let typingAnimationInterval;
let currentStreamingMessage = '';
let streamingMessageId = null;

// ✅ NUEVA: Cargar configuración de Enter desde localStorage
let enterToSend = localStorage.getItem('pera_enter_to_send') !== 'true'; // true por defecto



// Función para crear burbuja de usuario
function createUserBubble(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-user';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble user-bubble';
    
     bubbleDiv.innerHTML = marked.parse(message.replace(/\n/g, '<br>'));
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="icon-btn copy-btn" aria-label="Copiar mensaje" onclick="copyMessage(this)">
            <span class="material-symbols-outlined" translate="no">content_copy</span>
        </button> 
        <button class="icon-btn edit-message-user" aria-label="Editar mensaje">
            <span class="material-symbols-outlined" translate="no">edit</span>
        </button>
    `;
    
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(actionsDiv);
    return messageDiv;
}

// Función para crear burbuja del bot
function createBotBubble(message, isStreaming = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message-ia';
    if (isStreaming) messageDiv.id = 'streaming-message';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble bot-bubble';
    
    if (message) {
        bubbleDiv.innerHTML = isStreaming ? message : marked.parse(message);
    }
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';
    actionsDiv.innerHTML = `
        <button class="icon-btn action-btn copy-btn" aria-label="Copiar mensaje" onclick="copyMessage(this)">
            <span class="material-symbols-outlined" translate="no">content_copy</span>
        </button> 
    `;
    
    messageDiv.appendChild(bubbleDiv);
    messageDiv.appendChild(actionsDiv);
    return messageDiv;
}

// ✅ FUNCIÓN MEJORADA - Streaming suave sin parpadeos
function updateStreamingMessage(newChunk) {
    // Acumular el nuevo chunk
    currentStreamingMessage += newChunk;
    
    // Buscar o crear la burbuja de streaming
    let streamingMsg = document.getElementById('streaming-message');
    
    if (!streamingMsg) {
        // Crear nueva burbuja SOLO si no existe
        streamingMsg = document.createElement('div');
        streamingMsg.className = 'message-ia';
        streamingMsg.id = 'streaming-message';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble bot-bubble';
        bubbleDiv.id = 'streaming-bubble-content';
        streamingMsg.appendChild(bubbleDiv);
        
        // Añadir acciones después (vacías por ahora)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        actionsDiv.id = 'streaming-actions';
        actionsDiv.style.opacity = '0'; // Ocultar acciones durante streaming
        streamingMsg.appendChild(actionsDiv);
        
        messagesDynamic.appendChild(streamingMsg);
        
        // Guardar referencia al contenido
        streamingMsg.contentBubble = bubbleDiv;
    }
    
    // Actualizar SOLO el contenido, sin tocar acciones
    const bubble = streamingMsg.querySelector('.bubble');
    if (bubble) {
        // Usar requestAnimationFrame para evitar parpadeos
        requestAnimationFrame(() => {
            bubble.innerHTML = marked.parse(currentStreamingMessage);
        });
    }
}

// ✅ FUNCIÓN CORREGIDA - Finalización limpia sin pérdida de texto
function finalizeStreamingMessage() {
    const streamingMsg = document.getElementById('streaming-message');
    
    if (streamingMsg) {
        // Quitar ID de streaming
        streamingMsg.id = '';
        
        // Asegurar que el contenido final esté renderizado
        const bubble = streamingMsg.querySelector('.bubble');
        if (bubble) {
            // Última actualización por si acaso
            bubble.innerHTML = marked.parse(currentStreamingMessage);
        }
        
        // AÑADIR LAS ACCIONES AHORA (copiar)
        const actionsDiv = streamingMsg.querySelector('.message-actions');
        if (actionsDiv) {
            actionsDiv.innerHTML = `
                <button class="icon-btn action-btn copy-btn" aria-label="Copiar mensaje" onclick="copyMessage(this)">
                    <span class="material-symbols-outlined" translate="no">content_copy</span>
                </button>
            `;
            actionsDiv.style.opacity = '1'; // Mostrar acciones
        }
        
        // ANIMACIÓN SUTIL DE FINALIZACIÓN
        bubble.style.transition = 'border-color 0.3s ease';
        bubble.style.borderColor = 'rgba(59, 130, 246, 0.5)';
        setTimeout(() => {
            bubble.style.borderColor = '';
        }, 300);
    }
    
    // Resetear para el próximo mensaje (pero después de un pequeño delay)
    setTimeout(() => {
        currentStreamingMessage = '';
    }, 100);
}

// ✅ FUNCIÓN NUEVA - Para limpiar si hay error
function abortStreaming() {
    const streamingMsg = document.getElementById('streaming-message');
    if (streamingMsg) {
        streamingMsg.remove(); // Eliminar burbuja incompleta
    }
    currentStreamingMessage = '';
    streamingMessageId = null;
}

// Función para mostrar indicador de typing
function showTypingIndicator() {
    isTyping = true;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message-ia typing-indicator-container';
    typingDiv.id = 'typingIndicator';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'bubble bot-bubble typing-bubble';
    bubbleDiv.innerHTML = `
        <div class="typing-animation">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
        <span class="typing-text">typing</span>
    `;
    
    typingDiv.appendChild(bubbleDiv);
    messagesDynamic.appendChild(typingDiv);
    scrollToBottom();
    
    let step = 0;
    typingAnimationInterval = setInterval(() => {
        const textElement = document.querySelector('.typing-text');
        if (textElement) {
            const dots = '.'.repeat((step % 3) + 1);
            textElement.textContent = `typing${dots}`;
            step++;
        }
    }, 500);
}

// Función para ocultar indicador de typing
function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        clearInterval(typingAnimationInterval);
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateY(10px)';
        setTimeout(() => {
            if (indicator && indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }
    isTyping = false;
}

// Función para copiar mensaje
window.copyMessage = function(button) {
    const messageDiv = button.closest('.message-ia, .message-user');
    const bubble = messageDiv.querySelector('.bubble');
    const text = bubble.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalIcon = button.innerHTML;
        button.innerHTML = '<span class="material-symbols-outlined" translate="no">check</span>';
        setTimeout(() => {
            button.innerHTML = originalIcon;
        }, 2000);
    });
};

// Función para copiar bloques de código
window.copyCodeBlock = function(button) {
    const wrapper = button.closest('.code-block-wrapper');
    const codeElement = wrapper.querySelector('code');
    const code = codeElement.textContent || codeElement.innerText;
    
    navigator.clipboard.writeText(code).then(() => {
        const originalIcon = button.innerHTML;
        const originalColor = button.style.color;
        const originalBorder = button.style.borderColor;
        
        button.innerHTML = '<span class="material-symbols-outlined" translate="no">check</span>';
        button.style.color = '#10b981';
        button.style.borderColor = '#10b981';
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.style.color = originalColor;
            button.style.borderColor = originalBorder;
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
        alert('No se pudo copiar el código automáticamente. Selecciona y copia manualmente.');
    });
};

// Función para scroll al último mensaje
function scrollToBottom() {
    messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// Ajustar altura del textarea
function adjustTextareaHeight() {
    chatTextarea.style.height = 'auto';
    const newHeight = Math.min(chatTextarea.scrollHeight, 200);
    chatTextarea.style.height = newHeight + 'px';
}

// Resetear textarea
function resetTextarea() {
    chatTextarea.value = '';
    chatTextarea.style.height = '40px';
}

// Manejar foco del textarea
function handleTextareaFocus() {
    messageArea.classList.add('sticky');
}

// Inicializar UI
function initUI() {
    chatTextarea.addEventListener('input', adjustTextareaHeight);
    chatTextarea.addEventListener('focus', handleTextareaFocus);
    
    // ✅ MEJORADO: Comportamiento de Enter con configuración
    chatTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            if (isMobile) {
                // En móviles: Enter siempre salta línea
                return;
            } else {
                // En desktop: depende de la configuración
                if (enterToSend && !e.shiftKey) {
                    e.preventDefault();
                    sendBtn.click();
                } else if (!enterToSend && e.shiftKey) {
                    e.preventDefault();
                    sendBtn.click();
                }
            }
        }
    });
}

const botones = document.querySelectorAll('.toolbar-btn');

botones.forEach(boton => {
    boton.addEventListener('click', () => {
        const estaActivo = boton.classList.contains('active-btn');
        
        // Quitamos la clase active-btn de todos los botones
        botones.forEach(b => b.classList.remove('active-btn'));
        
        // Si NO estaba activo, lo activamos ahora
        if (!estaActivo) {
            boton.classList.add('active-btn');
        }
        // Si estaba activo, ya lo desactivamos con el remove anterior
    });
});

// ===== CONTROL DE WELCOME CHAT =====
const welcomeContainer = document.querySelector('.welcome-chat');

function hideWelcomeChat() {
    if (welcomeContainer && welcomeContainer.style.display !== 'none') {
        welcomeContainer.style.display = 'none';
        console.log('👋 Welcome chat ocultado');
    }
}

function showWelcomeChat() {
    if (welcomeContainer && welcomeContainer.style.display !== 'flex') {
        welcomeContainer.style.display = 'flex'; // Porque en CSS tiene display: flex
        console.log('👋 Welcome chat mostrado');
    }
}

// Verificar si hay mensajes al cargar la página (por si hay conversación guardada)
function checkWelcomeChatOnLoad() {
    if (!welcomeContainer) return;
    
    // Si hay mensajes en el contenedor dinámico, ocultar welcome
    if (messagesDynamic && messagesDynamic.children.length > 0) {
        hideWelcomeChat();
    } else {
        showWelcomeChat();
    }
}

// ===== SHOW NOTIFICATION=====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 100px;
        font-size: 0.95rem;
        font-weight: 500;
        z-index: 9999;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Exportar Funciones
window.showNotification = showNotification;
window.hideWelcomeChat = hideWelcomeChat;
window.showWelcomeChat = showWelcomeChat;
window.checkWelcomeChatOnLoad = checkWelcomeChatOnLoad;
window.createUserBubble = createUserBubble;
window.createBotBubble = createBotBubble;
window.updateStreamingMessage = updateStreamingMessage;
window.finalizeStreamingMessage = finalizeStreamingMessage;
window.showTypingIndicator = showTypingIndicator;
window.hideTypingIndicator = hideTypingIndicator;
window.scrollToBottom = scrollToBottom;
window.resetTextarea = resetTextarea;
window.initUI = initUI;
window.setEnterToSend = (value) => { enterToSend = value; };
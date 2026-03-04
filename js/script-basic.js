// script-basic.js
// Archivo principal que orquesta toda la funcionalidad

document.addEventListener('DOMContentLoaded', () => {
    initUI();
    setupEventListeners();
    initSettingsModal(); // ✅ Inicializar modal
    loadSettingsToUI(); // ✅ Cargar configuraciones guardadas
});

function setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const thinkBtn = document.getElementById('thinkBtn');
    const searchBtn = document.getElementById('searchBtn');
    const newChatBtns = document.querySelectorAll('#newChatBtnDesktop, #newChatBtnMobile');
    const shareBtns = document.querySelectorAll('#shareBtnDesktop, #shareBtnMobile');
    const settingsBtns = document.querySelectorAll('#settingsBtnDesktop, #settingsBtnMobile');
    const communityBtn = document.getElementById('communityBtn');

    sendBtn.addEventListener('click', handleSendMessage);
    thinkBtn.addEventListener('click', () => handleModelToggle('think', thinkBtn));
    searchBtn.addEventListener('click', () => handleModelToggle('search', searchBtn));
    
    newChatBtns.forEach(btn => btn.addEventListener('click', handleNewChat));
    shareBtns.forEach(btn => btn.addEventListener('click', handleShare));
    settingsBtns.forEach(btn => btn.addEventListener('click', openSettingsModal)); // ✅ Abrir modal
    if (communityBtn) communityBtn.addEventListener('click', handleCommunity);
}

// ===== FUNCIONES DEL MODAL DE CONFIGURACIÓN =====

let settingsModal, settingsOverlay, closeBtn;

function initSettingsModal() {
    settingsOverlay = document.getElementById('settingsModalOverlay');
    settingsModal = document.getElementById('settingsModal');
    closeBtn = document.getElementById('settingsModalClose');
    
    if (!settingsOverlay || !settingsModal) {
        console.warn('⚠️ Modal de configuración no encontrado en el DOM');
        return;
    }
    
    // Cerrar al hacer clic en X
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Cerrar al hacer clic fuera del modal
    settingsOverlay.addEventListener('click', (e) => {
        if (e.target === settingsOverlay) {
            closeSettingsModal();
        }
    });
    
    // Inicializar eventos de los controles
    initSettingsControls();
}

function openSettingsModal() {
    if (settingsOverlay) {
        settingsOverlay.classList.add('active');
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
    }
}

function closeSettingsModal() {
    if (settingsOverlay) {
        settingsOverlay.classList.remove('active');
        // Restaurar scroll del body
        document.body.style.overflow = '';
    }
}

function initSettingsControls() {
    // ✅ NUEVO : argar modelos dinámicamente =====
    populateModelsDropdown();
    // ===== NOMBRE DE USUARIO =====
    const userNameInput = document.getElementById('userNameInput');
    const clearNameBtn = document.getElementById('clearUserNameBtn');
    const saveNameBtn = document.getElementById('saveUserNameBtn');
    
    if (userNameInput) {
        userNameInput.addEventListener('input', (e) => {
            // Solo actualizamos cuando se guarda
        });
    }
    
    if (clearNameBtn) {
        clearNameBtn.addEventListener('click', () => {
            if (userNameInput) userNameInput.value = '';
        });
    }
    
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', () => {
            if (userNameInput) {
                const name = userNameInput.value.trim();
                setUserName(name || '');
                
                // Actualizar mensaje de bienvenida
                refreshWelcomeMessage();
                
                // Feedback visual
                saveNameBtn.textContent = '✓ Guardado';
                setTimeout(() => {
                    saveNameBtn.textContent = 'Guardar';
                }, 2000);
            }
        });
    }
    
    // ===== IDIOMA =====
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
    
    // ===== PERSONALIDAD =====
    const personalityRadios = document.querySelectorAll('input[name="personality"]');
    personalityRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                setPersonality(e.target.value);
            }
        });
    });
    
    // ===== ENTER PARA ENVIAR =====
    const enterToSendCheckbox = document.getElementById('enterToSendCheckbox');
    if (enterToSendCheckbox) {
        enterToSendCheckbox.addEventListener('change', (e) => {
            const value = e.target.checked;
            localStorage.setItem('pera_enter_to_send', value);
            window.setEnterToSend(value);
        });
    }
    
    // ===== MODELO POR DEFECTO =====
    const defaultModelSelect = document.getElementById('defaultModelSelect');
    if (defaultModelSelect) {
        defaultModelSelect.addEventListener('change', (e) => {
            const model = e.target.value;
            setModelFromSettings(model);
        });
    }
    
    // ===== TEMPERATURA =====
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    
    if (temperatureSlider && temperatureValue) {
        temperatureSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            temperatureValue.textContent = value;
        });
        
        temperatureSlider.addEventListener('change', (e) => {
            const value = e.target.value;
            localStorage.setItem('pera_temperature', value);
        });
    }
}

// ===== ✅ NUEVA FUNCIÓN: Cargar modelos desde API con caché 8h =====
async function populateModelsDropdown() {
    const select = document.getElementById('defaultModelSelect');
    if (!select) return;
    
    const EIGHT_HOURS = 28800000; // 8h en milisegundos
    const lastFetch = localStorage.getItem('pera_models_last_fetch');
    const cachedModels = localStorage.getItem('pera_models_cache');
    
    let models = null;
    
    // 1. Intentar usar caché si existe y no expiró
    if (cachedModels && lastFetch && (Date.now() - lastFetch < EIGHT_HOURS)) {
        models = JSON.parse(cachedModels);
        console.log('📦 Usando modelos en caché');
    } else {
        // 2. Hacer fetch a la API
        try {
            console.log('🌐 Obteniendo modelos de Pollinations.ai...');
            const response = await fetch('https://gen.pollinations.ai/v1/models');
            const data = await response.json();
            
            if (data && data.data && data.data.length > 0) {
                models = data;
                // Guardar en caché
                localStorage.setItem('pera_models_cache', JSON.stringify(models));
                localStorage.setItem('pera_models_last_fetch', Date.now());
                console.log('✅ Modelos actualizados desde API');
            }
        } catch (error) {
            console.error('❌ Error fetching models:', error);
        }
    }
    
    // 3. Si no hay modelos (ni caché ni API), usar defaults
    if (!models || !models.data || models.data.length === 0) {
        console.log('⚠️ Usando modelos por defecto');
        return; // El select ya tiene opciones HTML hardcodeadas
    }
    
    // 4. Poblar el select con los modelos
    const currentValue = select.value; // Guardar selección actual
    
    // Limpiar opciones actuales (excepto la primera si quieres mantenerla)
    select.innerHTML = '';
    
    // Añadir cada modelo como option
    models.data.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.id;
        select.appendChild(option);
    });
    
    // 5. Restaurar selección guardada si existe y es válida
    const savedModel = localStorage.getItem('pera_default_model');
    if (savedModel && models.data.some(m => m.id === savedModel)) {
        select.value = savedModel;
    } else if (currentValue && models.data.some(m => m.id === currentValue)) {
        select.value = currentValue;
    }
}

function loadSettingsToUI() {
    // Cargar nombre de usuario
    const userName = localStorage.getItem('pera_user_name') || '';
    const userNameInput = document.getElementById('userNameInput');
    if (userNameInput) userNameInput.value = userName;
    
    // Cargar idioma
    const language = localStorage.getItem('pera_language') || 'es';
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) languageSelect.value = language;
    
    // Cargar personalidad
    const personality = localStorage.getItem('pera_personality') || 'profesional';
    const personalityRadio = document.querySelector(`input[name="personality"][value="${personality}"]`);
    if (personalityRadio) personalityRadio.checked = true;
    
    // Cargar enter to send
    const enterToSend = localStorage.getItem('pera_enter_to_send') !== 'false';
    const enterToSendCheckbox = document.getElementById('enterToSendCheckbox');
    if (enterToSendCheckbox) enterToSendCheckbox.checked = enterToSend;
    
    // Cargar modelo por defecto
    const defaultModel = localStorage.getItem('pera_default_model') || 'openai';
    const defaultModelSelect = document.getElementById('defaultModelSelect');
    if (defaultModelSelect) {
        // ✅ MODIFICADO: Esperar un momento para que el select se llene
        setTimeout(() => {
            if (defaultModelSelect.querySelector(`option[value="${defaultModel}"]`)) {
                defaultModelSelect.value = defaultModel;
            }
        }, 100);
    }
    
    // Cargar temperatura
    const temperature = localStorage.getItem('pera_temperature') || '0.7';
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    if (temperatureSlider) temperatureSlider.value = temperature;
    if (temperatureValue) temperatureValue.textContent = temperature;
}

// ===== FUNCIONES PRINCIPALES DEL CHAT =====

async function handleSendMessage() {
    const message = chatTextarea.value.trim();
    if (!message || isTyping) return;

    messageArea.classList.add('sticky');

    const userBubble = createUserBubble(message);
    messagesDynamic.appendChild(userBubble);
    resetTextarea();
    scrollToBottom();

    const messagesWithContext = formatMessages(message);
    currentStreamingMessage = '';

    showTypingIndicator();

    try {
        await callPollinationsAPI(messagesWithContext, (chunk) => {
            updateStreamingMessage(chunk);
        });

        hideTypingIndicator();
        finalizeStreamingMessage();
        
        addToContext({ role: 'assistant', content: currentStreamingMessage });
        scrollToBottom();
        
    } catch (error) {
        console.error('Error:', error);
        hideTypingIndicator();
        
        const errorBubble = createBotBubble(`❌ Error: ${error.message}`);
        messagesDynamic.appendChild(errorBubble);
        scrollToBottom();
    }
}

function handleModelToggle(type, button) {
    const newModel = setActiveModel(type);
    
    button.classList.toggle('active');
    
  
    const otherType = type === 'think' ? 'search' : 'think';
    const otherButton = document.getElementById(otherType + 'Btn');
    if (otherButton) {
        otherButton.classList.remove('active');
        otherButton.style.backgroundColor = '';
    }
}

function handleNewChat() {
    clearContext();
    messagesDynamic.innerHTML = '';
    setActiveModel('base');
    
    const thinkBtn = document.getElementById('thinkBtn');
    const searchBtn = document.getElementById('searchBtn');
    thinkBtn.classList.remove('active');
    searchBtn.classList.remove('active');
    thinkBtn.style.backgroundColor = '';
    searchBtn.style.backgroundColor = '';
    
    if (!chatTextarea.matches(':focus')) {
        messageArea.classList.remove('sticky');
        showWelcomeMessage();
    }
}

function handleShare() {
    if (navigator.share) {
        navigator.share({
            title: 'Pera AI - Chatbot Inteligente',
            text: '¡Prueba Pera AI, un asistente inteligente!',
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        alert('¡Link copiado al portapapeles!');
    }
}

function handleSettings() {
    // Esta función ahora abre el modal
    openSettingsModal();
}

function handleCommunity() {
    window.open('https://chat.whatsapp.com/FmTPOf2J4ICKSqez5U12Zi?mode=gi_t', '_blank');
}
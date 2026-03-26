// script-basic.js
// Archivo principal que orquesta toda la funcionalidad

// ===== DOM CONTENT LOADED =====
document.addEventListener('DOMContentLoaded', () => {
    initUI();
    setupEventListeners();
    initSettingsModal();
    loadSettingsToUI();
    observeNewUserBubbles();
    updateProfileInitial();
    if (typeof window.checkWelcomeChatOnLoad === 'function') {
        window.checkWelcomeChatOnLoad();
    }
});

function setupEventListeners() {
    const sendBtn = document.getElementById('sendBtn');
    const thinkBtn = document.getElementById('thinkBtn');
    const searchBtn = document.getElementById('searchBtn');
    const newChatBtns = document.querySelectorAll('#newChatBtnDesktop, #newChatBtnMobile');
    const settingsBtns = document.querySelectorAll('#settingsBtnDesktop, #settingsBtnMobile');
    const communityBtn = document.getElementById('communityBtn');

    sendBtn.addEventListener('click', handleSendMessage);
    thinkBtn.addEventListener('click', () => handleModelToggle('think', thinkBtn));
    searchBtn.addEventListener('click', () => handleModelToggle('search', searchBtn));
    
    newChatBtns.forEach(btn => btn.addEventListener('click', handleNewChat));
    settingsBtns.forEach(btn => btn.addEventListener('click', openSettingsModal));
    if (communityBtn) communityBtn.addEventListener('click', handleCommunity);
    
    messagesDynamic.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-message-user');
        if (editBtn) {
            e.preventDefault();
            editUserMessage(editBtn);
        }
    });
}

// ===== FUNCIONES DEL MODAL DE CONFIGURACIÓN =====

let settingsModal, settingsOverlay, closeBtn;

function initSettingsModal() {
    settingsOverlay = document.getElementById('settingsModalOverlay');
    settingsModal = document.getElementById('settingsModal');
    closeBtn = document.getElementById('settingsModalClose');
    
    if (!settingsOverlay || !settingsModal) {
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
    
    // Inicializar todos los nuevos componentes del modal
    initCustomSelects();
    initTabs();
    initTemperatureSlider();
    initSettingsControlsLegacy();
}

function openSettingsModal() {
    if (settingsOverlay) {
        settingsOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeSettingsModal() {
    if (settingsOverlay) {
        settingsOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Actualizar la inicial del perfil según el nombre guardado
function updateProfileInitial() {
    const profileInitialEl = document.getElementById('profileInitial');
    if (!profileInitialEl) return;
    
    let userName = localStorage.getItem('pera_user_name');
    
    // Si no hay nombre guardado, usar "Zenicero" como default
    if (!userName || userName.trim() === '') {
        userName = 'Zenicero';
        localStorage.setItem('pera_user_name', userName);
        // También actualizar el input si existe
        const userNameInput = document.getElementById('userNameInput');
        if (userNameInput) userNameInput.value = userName;
        // Actualizar system prompt con el nombre
        if (typeof setUserName === 'function') {
            setUserName(userName);
        }
    }
    
    // Obtener la primera letra en mayúscula
    const initial = userName.charAt(0).toUpperCase();
    profileInitialEl.textContent = initial;
}

// ===== CONTROLES LEGACY (nombre, enter) =====
function initSettingsControlsLegacy() {
    // NOMBRE DE USUARIO
    const userNameInput = document.getElementById('userNameInput');
    const clearNameBtn = document.getElementById('clearUserNameBtn');
    const saveNameBtn = document.getElementById('saveUserNameBtn');
    
    // Cargar Valor inicial en el input si existe 
    if (userNameInput) {
        let currentName = localStorage.getItem('pera_user_name');
        if (!currentName || currentName.trim() === '') {
            currentName = 'Zenicero';
            localStorage.setItem('pera_user_name', currentName);
            if (typeof setUserName === 'function') {
                setUserName(currentName);
            }
        }
        userNameInput.value = currentName;
    }
    
    if (clearNameBtn) {
        clearNameBtn.addEventListener('click', () => {
            if (userNameInput) userNameInput.value = '';
        });
    }
    
    if (saveNameBtn) {
        saveNameBtn.addEventListener('click', () => {
            if (userNameInput) {
                let name = userNameInput.value.trim();
                setUserName(name || '');
                
                if (!name) {
                    // Si está vacío, usar default "Zenicero"
                    name = 'Zenicero';
                    userNameInput.value = name;
                }
                
                setUserName(name);
                
                saveNameBtn.textContent = '✓ Guardado';
                setTimeout(() => {
                    saveNameBtn.textContent = 'Guardar';
                }, 2000);
            }
        });
    }
    
    // ENTER PARA ENVIAR
    const enterToSendCheckbox = document.getElementById('enterToSendCheckbox');
    if (enterToSendCheckbox) {
        enterToSendCheckbox.addEventListener('change', (e) => {
            const value = e.target.checked;
            localStorage.setItem('pera_enter_to_send', value);
            window.setEnterToSend(value);
        });
    }
}

// ===== CUSTOM SELECTS =====
function initCustomSelects() {
    initLanguageSelect();
    initPersonalitySelect();
    initModelSelect();
    initAccentColorSelect();
}
// Selector de Idioma (con datos desde languages.json)
function initLanguageSelect() {
    const container = document.getElementById('languageSelectContainer');
    const trigger = document.getElementById('languageSelectTrigger');
    const dropdown = document.getElementById('languageSelectDropdown');
    
    if (!container || !trigger || !dropdown) return;
    
    // Si los idiomas no están cargados, esperar evento
    if (typeof window.isLanguagesLoaded === 'function' && !window.isLanguagesLoaded()) {
        trigger.querySelector('.custom-select-value').textContent = 'Cargando idiomas...';
        window.addEventListener('languagesReady', function onReady() {
            window.removeEventListener('languagesReady', onReady);
            renderLanguageSelect();
        });
        return;
    }
    
    renderLanguageSelect();
    
    function renderLanguageSelect() {
        const languages = typeof window.getLanguagesList === 'function' ? window.getLanguagesList() : [];
        
        if (languages.length === 0) {
            trigger.querySelector('.custom-select-value').textContent = 'Error al cargar idiomas';
            return;
        }
        
        // Actualizar contador
        const languageHint = document.getElementById('languageCountHint');
        if (languageHint) {
            languageHint.textContent = `${languages.length} idiomas disponibles`;
        }
        
        // Limpiar y llenar dropdown
        dropdown.innerHTML = '';
        languages.forEach(lang => {
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = lang.code;
            option.innerHTML = `${lang.flag} ${lang.name}`;
            dropdown.appendChild(option);
        });
        
        const options = dropdown.querySelectorAll('.custom-select-option');
        
        // Cargar valor guardado
        const savedLanguage = localStorage.getItem('pera_language') || 'es';
        const savedOption = Array.from(options).find(opt => opt.dataset.value === savedLanguage);
        
        if (savedOption) {
            trigger.querySelector('.custom-select-value').textContent = savedOption.textContent;
            savedOption.classList.add('selected');
        } else if (options.length > 0) {
            trigger.querySelector('.custom-select-value').textContent = options[0].textContent;
            options[0].classList.add('selected');
        }
        
        // Abrir/cerrar dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            closeAllCustomSelects();
            container.classList.toggle('open');
        });
        
        // Seleccionar opción
        options.forEach(option => {
            option.addEventListener('click', () => {
                const value = option.dataset.value;
                trigger.querySelector('.custom-select-value').textContent = option.textContent;
                container.classList.remove('open');
                setLanguage(value);
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }
}

// Selector de Personalidad
function initPersonalitySelect() {
    const container = document.getElementById('personalitySelectContainer');
    const trigger = document.getElementById('personalitySelectTrigger');
    const dropdown = document.getElementById('personalitySelectDropdown');
    const options = dropdown ? dropdown.querySelectorAll('.custom-select-option') : [];
    
    if (!container || !trigger) return;
    
    const personalityNames = {
        profesional: 'Profesional', amigable: 'Amigable',
        creativo: 'Creativo', divertido: 'Divertido', educativo: 'Educativo'
    };
    
    const savedPersonality = localStorage.getItem('pera_personality') || 'profesional';
    const savedOption = Array.from(options).find(opt => opt.dataset.value === savedPersonality);
    if (savedOption) {
        const strongText = savedOption.querySelector('strong')?.textContent || personalityNames[savedPersonality];
        trigger.querySelector('.custom-select-value').textContent = strongText;
    } else {
        trigger.querySelector('.custom-select-value').textContent = personalityNames[savedPersonality];
    }
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllCustomSelects();
        container.classList.toggle('open');
    });
    
    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const displayText = option.querySelector('strong')?.textContent || value;
            trigger.querySelector('.custom-select-value').textContent = displayText;
            container.classList.remove('open');
            
            setPersonality(value);
            
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

// Selector de Modelos (con carga dinámica)
let modelSelectInitialized = false;

async function initModelSelect() {
    const container = document.getElementById('modelSelectContainer');
    const trigger = document.getElementById('modelSelectTrigger');
    const dropdown = document.getElementById('modelSelectDropdown');
    
    if (!container || !trigger || !dropdown) return;
    
    await populateModelsDropdownModern(trigger, dropdown);
    modelSelectInitialized = true;
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllCustomSelects();
        container.classList.toggle('open');
    });
}

async function populateModelsDropdownModern(trigger, dropdown) {
    const EIGHT_HOURS = 28800000;
    const lastFetch = localStorage.getItem('pera_models_last_fetch');
    const cachedModels = localStorage.getItem('pera_models_cache');
    
    let models = null;
    
    if (cachedModels && lastFetch && (Date.now() - lastFetch < EIGHT_HOURS)) {
        models = JSON.parse(cachedModels);
    } else {
        try {
            const response = await fetch('https://gen.pollinations.ai/v1/models');
            const data = await response.json();
            if (data && data.data && data.data.length > 0) {
                models = data;
                localStorage.setItem('pera_models_cache', JSON.stringify(models));
                localStorage.setItem('pera_models_last_fetch', Date.now());
            }
        } catch (error) {
            console.error('Error fetching models:', error);
        }
    }
    
    if (!models || !models.data || models.data.length === 0) {
        trigger.querySelector('.custom-select-value').textContent = 'openai (default)';
        return;
    }
    
    dropdown.innerHTML = '';
    const savedModel = localStorage.getItem('pera_default_model') || 'openai';
    let selectedOption = null;
    
    // Guardar referencia al container
    const container = document.getElementById('modelSelectContainer');
    
    models.data.forEach(model => {
        const option = document.createElement('div');
        option.className = 'custom-select-option';
        if (model.id === savedModel) {
            option.classList.add('selected');
            selectedOption = option;
        }
        option.dataset.value = model.id;
        option.textContent = model.id;
        
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            trigger.querySelector('.custom-select-value').textContent = value;
            // Ahora container está definido en este ámbito
            if (container) container.classList.remove('open');
            setActiveModel(value);
            
            dropdown.querySelectorAll('.custom-select-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
        
        dropdown.appendChild(option);
    });
    
    if (selectedOption) {
        trigger.querySelector('.custom-select-value').textContent = selectedOption.textContent;
    } else {
        trigger.querySelector('.custom-select-value').textContent = savedModel;
    }
}

function closeAllCustomSelects() {
    document.querySelectorAll('.custom-select.open').forEach(select => {
        select.classList.remove('open');
    });
}

// Cerrar al hacer click fuera
document.addEventListener('click', () => {
    closeAllCustomSelects();
});

// ===== TABS =====
function initTabs() {
    const tabBtns = document.querySelectorAll('.settings-tab-btn');
    const tabPanes = document.querySelectorAll('.settings-tab-pane');
    
    if (tabBtns.length === 0) return;
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            tabBtns.forEach(b => b.classList.remove('active-tab'));
            btn.classList.add('active-tab');
            
            tabPanes.forEach(pane => pane.classList.remove('active-pane'));
            const activePane = document.getElementById(`tab-${tabId}`);
            if (activePane) activePane.classList.add('active-pane');
        });
    });
}

// ===== TEMPERATURA SLIDER MODERNO =====
function initTemperatureSlider() {
    const sliderTrack = document.getElementById('sliderTrack');
    const sliderFill = document.getElementById('sliderFill');
    const sliderThumb = document.getElementById('sliderThumb');
    const hiddenSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    
    if (!sliderTrack) return;
    
    let isDragging = false;
    
    function updateSliderFromValue(value) {
        const percent = value * 100;
        if (sliderFill) sliderFill.style.width = `${percent}%`;
        if (sliderThumb) sliderThumb.style.left = `${percent}%`;
        if (temperatureValue) temperatureValue.textContent = value;
        if (hiddenSlider) hiddenSlider.value = value;
        localStorage.setItem('pera_temperature', value);
    }
    
    function handleSliderMove(clientX) {
        if (!isDragging) return;
        const rect = sliderTrack.getBoundingClientRect();
        let x = clientX - rect.left;
        x = Math.max(0, Math.min(x, rect.width));
        const percent = x / rect.width;
        const value = Math.round(percent * 10) / 10;
        updateSliderFromValue(value);
    }
    
    const savedTemp = localStorage.getItem('pera_temperature') || '0.7';
    updateSliderFromValue(parseFloat(savedTemp));
    
    sliderTrack.addEventListener('mousedown', (e) => {
        isDragging = true;
        handleSliderMove(e.clientX);
    });
    
    if (sliderThumb) {
        sliderThumb.addEventListener('mousedown', (e) => {
            isDragging = true;
            e.preventDefault();
        });
    }
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) handleSliderMove(e.clientX);
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    // Touch events
    sliderTrack.addEventListener('touchstart', (e) => {
        isDragging = true;
        handleSliderMove(e.touches[0].clientX);
    });
    
    if (sliderThumb) {
        sliderThumb.addEventListener('touchstart', (e) => {
            isDragging = true;
            e.preventDefault();
        });
    }
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) handleSliderMove(e.touches[0].clientX);
    });
    
    document.addEventListener('touchend', () => {
        isDragging = false;
    });
}

// ===== LOAD SETTINGS TO UI =====
function loadSettingsToUI() {
    // Cargar nombre de usuario (Solo una declaración)
    let userName = localStorage.getItem('pera_user_name');
    if (!userName || userName.trim() === '') {
        userName = 'Zenicero';
        localStorage.setItem('pera_user_name', userName);
        if (typeof setUserName === 'function') {
            setUserName(userName);
        }
    }
    
    const userNameInput = document.getElementById('userNameInput');
    if (userNameInput) userNameInput.value = userName;
    
    // Actualizar inicial del perfil
    updateProfileInitial();
    
    // Cargar idioma en custom select
    const language = localStorage.getItem('pera_language') || 'es';
    const languageOptions = document.querySelectorAll('#languageSelectDropdown .custom-select-option');
    const languageTrigger = document.getElementById('languageSelectTrigger');
    if (languageOptions.length > 0 && languageTrigger) {
        const selectedOpt = Array.from(languageOptions).find(opt => opt.dataset.value === language);
        if (selectedOpt) {
            languageTrigger.querySelector('.custom-select-value').textContent = selectedOpt.textContent;
            languageOptions.forEach(opt => opt.classList.remove('selected'));
            selectedOpt.classList.add('selected');
        }
    }
    
    // Cargar personalidad en custom select
    const personality = localStorage.getItem('pera_personality') || 'profesional';
    const personalityOptions = document.querySelectorAll('#personalitySelectDropdown .custom-select-option');
    const personalityTrigger = document.getElementById('personalitySelectTrigger');
    if (personalityOptions.length > 0 && personalityTrigger) {
        const selectedOpt = Array.from(personalityOptions).find(opt => opt.dataset.value === personality);
        if (selectedOpt) {
            const displayText = selectedOpt.querySelector('strong')?.textContent || personality;
            personalityTrigger.querySelector('.custom-select-value').textContent = displayText;
            personalityOptions.forEach(opt => opt.classList.remove('selected'));
            selectedOpt.classList.add('selected');
        }
    }
    
    // Cargar enter to send
    const enterToSend = localStorage.getItem('pera_enter_to_send') !== 'false';
    const enterToSendCheckbox = document.getElementById('enterToSendCheckbox');
    if (enterToSendCheckbox) enterToSendCheckbox.checked = enterToSend;
    
    // Cargar color de acento en custom select
    const accentColor = localStorage.getItem('pera_accent_color') || '#2C2C2E';
    const accentOptions = document.querySelectorAll('#accentColorSelectDropdown .custom-select-option');
    const accentTrigger = document.getElementById('accentColorSelectTrigger');
    if (accentOptions.length > 0 && accentTrigger) {
        const selectedOpt = Array.from(accentOptions).find(opt => opt.dataset.value === accentColor);
        if (selectedOpt) {
            const colorSpan = selectedOpt.querySelector('.color-preview').cloneNode(true);
            const colorName = selectedOpt.childNodes[1]?.textContent?.trim() || 'Predeterminado';
            accentTrigger.querySelector('.custom-select-value').innerHTML = '';
            accentTrigger.querySelector('.custom-select-value').appendChild(colorSpan);
            accentTrigger.querySelector('.custom-select-value').appendChild(document.createTextNode(colorName));
            accentOptions.forEach(opt => opt.classList.remove('selected'));
            selectedOpt.classList.add('selected');
        }
    }
    
    // Aplicar color a burbujas existentes
    applyUserBubbleColor(accentColor);
    
    // Cargar modelo por defecto (se maneja en initModelSelect)
    // La temperatura se carga en initTemperatureSlider
}

// ===== HANDLE SEND MESSAGE =====
async function handleSendMessage() {
    const message = chatTextarea.value.trim();
    if (!message || isTyping) return;
    
    if (window.editingMessage) {
      await handleEditMessage(message);
      return;
    }
    
    if (typeof window.hideWelcomeChat === 'function') {
        window.hideWelcomeChat();
    }

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
        
        if (typeof window.marcarSaludoComoHecho === 'function' && localStorage.getItem('pera_user_name')) {
            window.marcarSaludoComoHecho();
        }
        
        addToContext({ role: 'assistant', content: currentStreamingMessage });
        scrollToBottom();
        
    } catch (error) {
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
    setActiveModel('openai');
    
    if (typeof window.showWelcomeChat === 'function') {
        window.showWelcomeChat();
    }
    
    const thinkBtn = document.getElementById('thinkBtn');
    const searchBtn = document.getElementById('searchBtn');
    if (thinkBtn) thinkBtn.classList.remove('active');
    if (searchBtn) searchBtn.classList.remove('active');
    if (thinkBtn) thinkBtn.style.backgroundColor = '';
    if (searchBtn) searchBtn.style.backgroundColor = '';
    
    if (!chatTextarea.matches(':focus')) {
        messageArea.classList.remove('sticky');
    }
}

// Función de edición
function editUserMessage(button) {
    const userMessageDiv = button.closest('.message-user');
    const originalMessage = userMessageDiv.querySelector('.bubble').innerText;
    
    const textarea = document.getElementById('chatTextarea');
    textarea.value = originalMessage;
    textarea.focus();
    adjustTextareaHeight();
    
    window.editingMessage = {
        element: userMessageDiv,
        originalText: originalMessage
    };
}

// Manejar el reemplazo
async function handleEditMessage(newMessage) {
    const editing = window.editingMessage;
    if (!editing) return;
    
    const bubble = editing.element.querySelector('.bubble');
    bubble.innerHTML = marked.parse(newMessage.replace(/\n/g, '<br>'));
    
    const allMessages = Array.from(messagesDynamic.children);
    const currentIndex = allMessages.indexOf(editing.element);
    
    for (let i = currentIndex + 1; i < allMessages.length; i++) {
        allMessages[i].remove();
    }
    
    clearContext();
    
    const remainingUserMessages = Array.from(messagesDynamic.children)
        .filter(msg => msg.classList.contains('message-user'))
        .map(msg => msg.querySelector('.bubble').innerText);
    
    remainingUserMessages.forEach(msg => {
        addToContext({ role: 'user', content: msg });
    });
    
    resetTextarea();
    window.editingMessage = null;
    
    const messagesWithContext = formatMessages(newMessage);
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
        hideTypingIndicator();
        const errorBubble = createBotBubble(`❌ Error: ${error.message}`);
        messagesDynamic.appendChild(errorBubble);
        scrollToBottom();
    }
}

// Selector de Color de Acento
function initAccentColorSelect() {
    const container = document.getElementById('accentColorSelectContainer');
    const trigger = document.getElementById('accentColorSelectTrigger');
    const dropdown = document.getElementById('accentColorSelectDropdown');
    const options = dropdown ? dropdown.querySelectorAll('.custom-select-option') : [];
    
    if (!container || !trigger) return;
    
    // Colores con sus nombres
    const colorNames = {
        '#2C2C2E': 'Predeterminado',
        '#0a84ff': 'Azul',
        '#30d158': 'Verde',
        '#ffd60a': 'Amarillo',
        '#ff375f': 'Rosa',
        '#ff9f0a': 'Naranja'
    };
    
    // Cargar valor guardado
    const savedColor = localStorage.getItem('pera_accent_color') || '#2C2C2E';
    
    // Aplicar color inicial a las burbujas
    applyUserBubbleColor(savedColor);
    
    // Actualizar trigger con el color guardado
    const savedOption = Array.from(options).find(opt => opt.dataset.value === savedColor);
    if (savedOption) {
        const colorSpan = savedOption.querySelector('.color-preview').cloneNode(true);
        const textNode = savedOption.childNodes[1]?.textContent || colorNames[savedColor];
        trigger.querySelector('.custom-select-value').innerHTML = '';
        trigger.querySelector('.custom-select-value').appendChild(colorSpan);
        trigger.querySelector('.custom-select-value').appendChild(document.createTextNode(textNode));
    } else {
        trigger.querySelector('.custom-select-value').innerHTML = `
            <span class="color-preview" style="background: ${savedColor}"></span>
            ${colorNames[savedColor] || 'Predeterminado'}
        `;
    }
    
    // Abrir/cerrar dropdown
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllCustomSelects();
        container.classList.toggle('open');
    });
    
    // Seleccionar opción
    options.forEach(option => {
        option.addEventListener('click', () => {
            const colorValue = option.dataset.value;
            const colorName = option.childNodes[1]?.textContent?.trim() || colorNames[colorValue];
            
            // Actualizar trigger
            const colorSpan = option.querySelector('.color-preview').cloneNode(true);
            trigger.querySelector('.custom-select-value').innerHTML = '';
            trigger.querySelector('.custom-select-value').appendChild(colorSpan);
            trigger.querySelector('.custom-select-value').appendChild(document.createTextNode(colorName));
            
            container.classList.remove('open');
            
            // Guardar en localStorage
            localStorage.setItem('pera_accent_color', colorValue);
            
            // Aplicar cambio inmediato
            applyUserBubbleColor(colorValue);
            
            // Actualizar clase selected en opciones
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
}

// Aplicar color a las burbujas de usuario
function applyUserBubbleColor(color) {
    document.documentElement.style.setProperty('--user-bubble-color', color);
    
    // Actualizar burbujas existentes
    const userBubbles = document.querySelectorAll('.message-user .bubble');
    userBubbles.forEach(bubble => {
        bubble.style.backgroundColor = color;
    });
}

// Función para observar nuevas burbujas (opcional, para MutationObserver)
function observeNewUserBubbles() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && node.classList && node.classList.contains('message-user')) {
                    const bubble = node.querySelector('.bubble');
                    if (bubble) {
                        const savedColor = localStorage.getItem('pera_accent_color') || '#2C2C2E';
                        bubble.style.backgroundColor = savedColor;
                    }
                }
            });
        });
    });
    
    const messagesContainer = document.getElementById('messagesDynamic');
    if (messagesContainer) {
        observer.observe(messagesContainer, { childList: true, subtree: true });
    }
}

function handleCommunity() {
    window.open('https://chat.whatsapp.com/FmTPOf2J4ICKSqez5U12Zi?mode=gi_t', '_blank');
}

window.updateProfileInitial = updateProfileInitial;
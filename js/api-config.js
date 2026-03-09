// api-config.js
// Configuración de la API de Pollinations.ai

const API_CONFIG = {
    // 🔐 API Key
    apiKey: localStorage.getItem('pera_api_key'),
    // URLs base
    baseURL: 'https://gen.pollinations.ai',
    
    // Modelos disponibles
    models: {
        base: 'openai',
        reasoning: 'perplexity-reasoning',
        search: 'gemini-search'
    },
    
    // Endpoints
    endpoints: {
        chat: '/v1/chat/completions',
        image: '/image',
        text: '/text',
        models: '/v1/models'
    },
    
    // Configuración por defecto (será sobrescrita por localStorage)
    defaultOptions: {
        temperature: 0.7,
        stream: true
    },
    
    // Método para obtener headers con autenticación
    getHeaders: function() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        };
    }
};

// Estado actual del modelo
let currentModel = API_CONFIG.models.base;

// ✅ MEJORADO: Función para actualizar modelo desde ajustes (AHORA DINÁMICA)
function setModelFromSettings(modelKey) {
    if (!modelKey) return currentModel;
    
    // Guardar en localStorage
    localStorage.setItem('pera_default_model', modelKey);
    
    // Actualizar modelo actual
    currentModel = modelKey;
    
    console.log('🤖 Modelo cambiado a:', modelKey);
    return currentModel;
}

// Función para cambiar el modelo activo (desde botones) - AHORA MÁS FLEXIBLE
function setActiveModel(modelType) {
    // Si no hay modelos definidos en API_CONFIG, mantener comportamiento simple
    if (!API_CONFIG.models || !API_CONFIG.models.reasoning || !API_CONFIG.models.search) {
        return currentModel;
    }
    
    switch(modelType) {
        case 'think':
            // Alternar entre reasoning y base
            currentModel = currentModel === API_CONFIG.models.reasoning ? 
                          (API_CONFIG.models.base || 'openai') : 
                          (API_CONFIG.models.reasoning || 'perplexity-reasoning');
            break;
        case 'search':
            // Alternar entre search y base
            currentModel = currentModel === API_CONFIG.models.search ? 
                          (API_CONFIG.models.base || 'openai') : 
                          (API_CONFIG.models.search || 'gemini-search');
            break;
        default:
            currentModel = API_CONFIG.models.base || 'openai';
    }
    
    // Guardar en localStorage
    localStorage.setItem('pera_default_model', currentModel);
    
    return currentModel;
}

// Función para obtener el modelo actual
function getCurrentModel() {
    return currentModel;
}

// ✅ MEJORADO: Ahora usa temperatura desde configuración
async function callPollinationsAPI(messages, onChunk, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Obtener temperatura desde localStorage si existe
    let temperature = API_CONFIG.defaultOptions.temperature;
    const savedTemp = localStorage.getItem('pera_temperature');
    if (savedTemp) temperature = parseFloat(savedTemp);
    
    try {
        console.log('📡 Enviando petición con modelo:', currentModel, 'temperatura:', temperature);
        
        const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.chat}`, {
            method: 'POST',
            headers: API_CONFIG.getHeaders(),
            body: JSON.stringify({
                model: currentModel,
                messages: messages,
                stream: true,
                temperature: options.temperature || temperature
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            let errorMsg = `Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMsg = errorData.error?.message || errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('✅ Streaming completado');
                break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';
                        
                        if (content && onChunk) {
                            onChunk(content);
                        }
                        
                    } catch (e) {
                        console.warn('Error parsing chunk:', e);
                    }
                }
            }
        }
        
        clearTimeout(timeoutId);
        return true;
        
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('⏱️ Tiempo de espera agotado');
        }
        console.error('🔥 Error:', error);
        throw error;
    }
}

// Exportar funciones
window.API_CONFIG = API_CONFIG;
window.setActiveModel = setActiveModel;
window.setModelFromSettings = setModelFromSettings;
window.getCurrentModel = getCurrentModel;
window.callPollinationsAPI = callPollinationsAPI;

console.log('🚀 API Config cargada correctamente');
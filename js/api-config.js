// api-config.js
// Configuración de la API de Pollinations.ai

const API_CONFIG = {
    // 🔐 API Key
    apiKey: "sk_ZkpCEOhkuwM4oFOeKpWJzqeInHM9aUjT",
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
let currentModel = localStorage.getItem('pera_default_model') || 'openai';

function setActiveModel(modelTypeOrKey) {
    if (modelTypeOrKey !== 'think' && modelTypeOrKey !== 'search') {
        // Si pasas "base" aquí por error, forzamos que sea "openai"
        currentModel = modelTypeOrKey === 'base' ? API_CONFIG.models.base : modelTypeOrKey;
        localStorage.setItem('pera_default_model', currentModel);
        return currentModel;
    }
    
    switch(modelTypeOrKey) {
        case 'think':
            currentModel = (currentModel === API_CONFIG.models.reasoning) ? 
                          API_CONFIG.models.base : API_CONFIG.models.reasoning;
            break;
        case 'search':
            currentModel = (currentModel === API_CONFIG.models.search) ? 
                          API_CONFIG.models.base : API_CONFIG.models.search;
            break;
    }
    
    localStorage.setItem('pera_default_model', currentModel);
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
        
        throw error;
    }
}

// Exportar funciones (eliminamos getCurrentModel y setModelFromSettings)
window.API_CONFIG = API_CONFIG;
window.setActiveModel = setActiveModel;
window.callPollinationsAPI = callPollinationsAPI;


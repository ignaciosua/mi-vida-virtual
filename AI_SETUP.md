# 🤖 Guía de Configuración - Integración con IA

## Configuración de OpenAI para Generación de Flashcards

### Opción 1: OpenAI (GPT-4 / GPT-3.5)

#### Paso 1: Obtener API Key

1. Ve a [platform.openai.com](https://platform.openai.com)
2. Crea una cuenta o inicia sesión
3. Ve a **API Keys** en el menú lateral
4. Haz clic en **Create new secret key**
5. Copia la key (empieza con `sk-...`)
6. ⚠️ **IMPORTANTE:** Guárdala en un lugar seguro, no podrás verla de nuevo

#### Paso 2: Agregar API Key al Código

Por seguridad, NO pongas la API key directamente en el código del cliente. En su lugar:

**Opción A: Backend intermedio (Recomendado)**
```javascript
// Crear un endpoint en tu servidor
// server.js o similar
app.post('/api/generate-flashcards', async (req, res) => {
    const { content, title } = req.body;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un experto en educación que genera flashcards de alta calidad...'
                },
                {
                    role: 'user',
                    content: `Genera flashcards del siguiente contenido:\n\n${content}`
                }
            ]
        })
    });
    
    const data = await response.json();
    res.json(data);
});
```

**Opción B: Variables de entorno (Solo para desarrollo local)**
```javascript
// En el código del cliente
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // No committed a git
```

#### Paso 3: Implementar Función de Generación

Reemplaza la función `generateFlashcardsWithAI()` en `index.html` (línea ~8960):

```javascript
async function generateFlashcardsWithAI(content, title) {
    try {
        // Opción A: Usar backend intermedio (RECOMENDADO)
        const response = await fetch('/api/generate-flashcards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                title: title
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al generar flashcards');
        }
        
        const data = await response.json();
        const flashcardsData = JSON.parse(data.choices[0].message.content);
        
        return flashcardsData.cards;
        
    } catch (error) {
        console.error('Error en generación de flashcards:', error);
        throw error;
    }
}
```

#### Paso 4: Configurar el Prompt Óptimo

El prompt es crucial para obtener buenos resultados. Aquí hay un ejemplo optimizado:

```javascript
const systemPrompt = `Eres un experto en educación y memorización que genera flashcards de alta calidad para estudiantes.

REGLAS IMPORTANTES:
1. Genera SOLO flashcards basadas en el contenido proporcionado
2. NO inventes información que no esté en el texto
3. Crea entre 10-20 flashcards según la longitud del texto
4. Usa diferentes tipos: preguntas/respuestas (qa) y completar espacios (cloze)
5. Asigna dificultad del 1-5 según complejidad del concepto
6. Prioriza conceptos clave y términos importantes

FORMATO DE SALIDA (JSON estricto):
{
  "cards": [
    {
      "front": "Pregunta o texto con espacio en blanco",
      "back": "Respuesta o palabra que falta",
      "type": "qa" o "cloze",
      "difficulty": 1-5
    }
  ]
}

Ejemplos:

Tipo QA:
{
  "front": "¿Qué es la fotosíntesis?",
  "back": "Proceso por el cual las plantas convierten luz solar en energía química",
  "type": "qa",
  "difficulty": 3
}

Tipo CLOZE:
{
  "front": "La _____ es el proceso por el cual las plantas convierten luz en energía",
  "back": "fotosíntesis",
  "type": "cloze",
  "difficulty": 2
}`;

const userPrompt = `Genera flashcards del siguiente apunte titulado "${title}":

${content}

Devuelve SOLO el JSON con las flashcards, sin texto adicional.`;
```

---

## Opción 2: Anthropic Claude

### Paso 1: Obtener API Key

1. Ve a [console.anthropic.com](https://console.anthropic.com)
2. Crea una cuenta
3. Ve a **API Keys**
4. Crea una nueva key
5. Copia y guarda la key

### Paso 2: Implementación

```javascript
async function generateFlashcardsWithAI(content, title) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': ANTHROPIC_API_KEY, // Usar backend intermedio
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 4096,
            messages: [
                {
                    role: 'user',
                    content: `${systemPrompt}\n\n${userPrompt}`
                }
            ]
        })
    });
    
    const data = await response.json();
    const flashcardsData = JSON.parse(data.content[0].text);
    
    return flashcardsData.cards;
}
```

---

## Opción 3: Otras Alternativas

### Google Gemini
- API Key desde [makersuite.google.com](https://makersuite.google.com)
- Modelo: `gemini-pro`
- Similar a OpenAI en estructura

### Llama 3 (Local)
- Sin costo
- Requiere hardware potente
- Usa Ollama para deployment local

### Mistral AI
- API similar a OpenAI
- Modelos open source
- Buenos resultados para educación

---

## 🔧 Configuración de Backend (Node.js + Express)

### Archivo: server.js

```javascript
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Endpoint para generar flashcards
app.post('/api/generate-flashcards', async (req, res) => {
    try {
        const { content, title } = req.body;
        
        // Validaciones
        if (!content || content.length < 50) {
            return res.status(400).json({
                error: 'El contenido es muy corto'
            });
        }
        
        // Llamar a OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: `Genera flashcards del siguiente apunte titulado "${title}":\n\n${content}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'Error en OpenAI');
        }
        
        // Extraer y parsear las flashcards
        const flashcardsText = data.choices[0].message.content;
        const flashcardsData = JSON.parse(flashcardsText);
        
        res.json({
            success: true,
            flashcards: flashcardsData.cards
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            error: 'Error al generar flashcards',
            message: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
```

### Archivo: .env

```env
OPENAI_API_KEY=sk-...tu-key-aqui...
PORT=3000
```

### Archivo: package.json

```json
{
  "name": "mi-vida-virtual-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 💰 Costos Estimados

### OpenAI GPT-4
- **Input:** $0.03 / 1K tokens
- **Output:** $0.06 / 1K tokens
- **Estimado por apunte:** $0.01 - $0.05
- **1000 generaciones:** ~$20

### OpenAI GPT-3.5 Turbo
- **Input:** $0.0005 / 1K tokens
- **Output:** $0.0015 / 1K tokens
- **Estimado por apunte:** $0.001 - $0.003
- **1000 generaciones:** ~$1.50

### Anthropic Claude 3 Sonnet
- **Input:** $0.003 / 1K tokens
- **Output:** $0.015 / 1K tokens
- **Estimado por apunte:** $0.003 - $0.01
- **1000 generaciones:** ~$5

---

## 🧪 Testing

### Probar Generación

1. Abre la consola del navegador
2. Crea un apunte de prueba
3. Presiona "Generar Flashcards"
4. Verifica en la consola los logs
5. Revisa las flashcards generadas

### Ejemplo de Apunte para Testing

```
Título: Fotosíntesis

Contenido:
La fotosíntesis es el proceso mediante el cual las plantas, algas y algunas bacterias convierten la luz solar en energía química. Este proceso ocurre principalmente en los cloroplastos de las células vegetales.

La ecuación general de la fotosíntesis es:
6CO2 + 6H2O + luz → C6H12O6 + 6O2

Los componentes esenciales son:
- Clorofila: pigmento verde que captura la luz
- Agua: fuente de electrones
- Dióxido de carbono: fuente de carbono
- Luz solar: fuente de energía

El proceso se divide en dos fases:
1. Reacciones luminosas (fase clara)
2. Ciclo de Calvin (fase oscura)
```

Resultado esperado: 10-15 flashcards con preguntas sobre fotosíntesis, ecuación química, componentes y fases.

---

## 🔒 Seguridad

### Mejores Prácticas

1. **NUNCA expongas tu API key en el cliente**
2. **Usa variables de entorno** (.env)
3. **Implementa rate limiting** en tu backend
4. **Valida inputs** (longitud máxima, contenido malicioso)
5. **Registra logs** para debugging
6. **Monitorea costos** en el dashboard de OpenAI

---

## 📊 Optimizaciones

### Reducir Costos

1. **Usa GPT-3.5 en lugar de GPT-4** para la mayoría de casos
2. **Limita el max_tokens** a lo necesario
3. **Cachea resultados** para apuntes similares
4. **Implementa límites** (ej: 5 generaciones por día por usuario)

### Mejorar Calidad

1. **Ajusta el temperature** (0.7 es un buen balance)
2. **Refina el prompt** con ejemplos específicos
3. **Valida el output** antes de guardar
4. **Permite regeneración** si el usuario no está satisfecho

---

## ✅ Checklist de Configuración

- [ ] API Key obtenida (OpenAI/Claude/etc)
- [ ] Backend creado con Express
- [ ] Variables de entorno configuradas
- [ ] Endpoint `/api/generate-flashcards` funcionando
- [ ] Frontend actualizado para usar el endpoint
- [ ] Prompt optimizado
- [ ] Rate limiting implementado
- [ ] Testing completado
- [ ] Validaciones agregadas
- [ ] Logs configurados
- [ ] Monitoreo de costos activo

---

¡Listo! Ahora tu app puede generar flashcards inteligentes con IA 🤖✨

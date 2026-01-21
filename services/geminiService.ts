
import { GoogleGenAI, Type } from "@google/genai";
import { Mooring, Boat, TariffSeason } from "../types";
import { isHeadMooring } from "../constants";

// Always use the named parameter and directly reference process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Definimos la estructura de respuesta para que la IA pueda devolver gráficos
const aiResponseSchema = {
  type: Type.OBJECT,
  properties: {
    answer: {
      type: Type.STRING,
      description: "La respuesta textual de la Capitana, con su personalidad irónica y emojis."
    },
    hasChart: {
      type: Type.BOOLEAN,
      description: "True si la respuesta debe incluir un gráfico visual."
    },
    chartType: {
      type: Type.STRING,
      enum: ["bar", "pie", "area"],
      description: "Tipo de gráfico a renderizar."
    },
    chartTitle: {
      type: Type.STRING,
      description: "Título corto para el gráfico."
    },
    chartData: {
      type: Type.ARRAY,
      description: "Datos para el gráfico. Array de objetos con 'name', 'value' y opcionalmente 'fill' (color hex).",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.NUMBER },
          fill: { type: Type.STRING, description: "Color hexadecimal opcional para la barra/sector (ej: #3b82f6)" }
        },
        required: ["name", "value"]
      }
    }
  },
  required: ["answer", "hasChart"]
};

export const getMooringAdvice = async (
  moorings: Mooring[], 
  registry: Boat[], 
  tariffs: TariffSeason[], 
  query: string
) => {
  // Mapeamos los amarres enviando TODOS los datos del barco si existe.
  const contextMoorings = moorings.map(m => ({
    id: m.id,
    status: m.status,
    dims: `${m.maxDimensions.length}x${m.maxDimensions.beam}`,
    isHead: isHeadMooring(m.id), // Indicamos si es cabecera (Martillo)
    // Si hay barco, enviamos el objeto completo, incluyendo isBase, isMember y isMultihull
    boat: m.boat ? { ...m.boat, history: undefined } : 'LIBRE',
    reservation: m.reservation
  }));

  // Contexto del registro histórico. 
  // Enviamos los últimos 100 movimientos.
  const recentRegistry = registry.slice(-100).map(b => ({
     ...b,
     history: undefined
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', 
    contents: `
    Actúa como la Capitana del puerto ("MarinaPro AI"). 
    
    PERSONALIDAD:
    1. Experta, perspicaz, con humor irónico marinero.
    2. Usas emojis náuticos (⚓, 🚤, 📊).
    3. Eres la "Jefa de Datos".
    
    REGLAS DE TARIFAS Y PRECIOS:
    - Las TARIFAS se dividen en Baja y Alta Temporada, y por tramos de eslora.
    - Si 'isBase' es true, el barco tiene CONTRATO ANUAL. Se aplica la columna 'annual'.
    - Si 'isBase' es false, el barco es de TRÁNSITO. Se aplica tarifa diaria/semanal/mensual.
    - Si 'isMember' es true, aplica un 10% DE DESCUENTO adicional sobre el precio.
    
    REGLA MULTICASCO (CATAMARÁN / TRIMARÁN):
    - Si 'boat.isMultihull' es TRUE:
      - Si el barco está en una plaza de CABECERA (mooring.isHead = TRUE), se cobra la tarifa normal.
      - Si el barco está en una plaza NORMAL (mooring.isHead = FALSE), ocupa más espacio, por lo que la tarifa se multiplica por 1.5 (+50%).
    
    DATOS COMPLETOS DISPONIBLES:
    - Estado Actual: ${JSON.stringify(contextMoorings)}
    - Registro Histórico (Reciente): ${JSON.stringify(recentRegistry)}
    - Tarifas vigentes: ${JSON.stringify(tariffs)}

    INSTRUCCIONES DE PRIVACIDAD:
    - El usuario es el DIRECTOR del puerto. Tienes permiso total para mostrar datos personales.
    
    INSTRUCCIONES PARA GRÁFICOS:
    Si el usuario pide estadísticas, comparativas, informes o datos visuales, DEBES generar el campo 'chartData' en el JSON.
    
    Consulta del usuario: "${query}"
    `,
    config: {
      temperature: 0.4, 
      responseMimeType: "application/json",
      responseSchema: aiResponseSchema
    }
  });

  return response.text;
};

export const suggestAssignment = async (moorings: Mooring[], boatData: { length: number; beam: number }) => {
  const available = moorings.filter(m => m.status === 'AVAILABLE');

  if (available.length === 0) return JSON.stringify({ answer: "Jefe, estamos llenos. Toca jugar al Tetris o fondear fuera. ⚓😅", hasChart: false });

  const contextList = available.map(a => ({
    id: a.id,
    dims: `${a.maxDimensions.length}x${a.maxDimensions.beam}`
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    Eres la Capitana. Tengo un barco de ${boatData.length}x${boatData.beam}m.
    Amarres libres: ${JSON.stringify(contextList)}.
    Recomienda el mejor amarre con humor. Devuelve solo texto plano, no JSON.
    `,
  });

  return JSON.stringify({ answer: response.text, hasChart: false });
};

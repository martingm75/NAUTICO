
import { GoogleGenAI, Type } from "@google/genai";
import { Mooring } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getMooringAdvice = async (moorings: Mooring[], query: string) => {
  const context = moorings.map(m => ({
    id: m.id,
    status: m.status,
    boat: m.boat?.name || 'Ninguno',
    dims: `${m.maxDimensions.length}x${m.maxDimensions.beam}`
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Como gestor inteligente de un puerto deportivo con 83 plazas, analiza el siguiente estado de amarres: ${JSON.stringify(context)}. 
    El usuario pregunta: "${query}". 
    Responde de forma concisa y profesional en español.`,
    config: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  });

  return response.text;
};

export const suggestAssignment = async (moorings: Mooring[], boatData: { length: number; beam: number }) => {
  const available = moorings.filter(m => m.status === 'AVAILABLE' && 
    m.maxDimensions.length >= boatData.length && 
    m.maxDimensions.beam >= boatData.beam);

  if (available.length === 0) return "No hay amarres disponibles que cumplan las dimensiones.";

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tengo un barco de ${boatData.length}m de eslora y ${boatData.beam}m de manga. 
    Los siguientes amarres están libres y caben: ${JSON.stringify(available.map(a => a.id))}. 
    ¿Cuál me recomiendas y por qué?`,
    config: {
      temperature: 0.5,
      maxOutputTokens: 200,
    }
  });

  return response.text;
};

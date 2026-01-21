
import { GoogleGenAI, Type } from "@google/genai";
import { Mooring } from "../types";

// Always use the named parameter and directly reference process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMooringAdvice = async (moorings: Mooring[], query: string) => {
  const context = moorings.map(m => ({
    id: m.id,
    status: m.status,
    boat: m.boat?.name || 'Ninguno',
    dims: `${m.maxDimensions.length}x${m.maxDimensions.beam}`
  }));

  // Use ai.models.generateContent to query GenAI with the model name and prompt.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    Actúa como la Capitana del puerto, una mujer hermosa, extremadamente sensual y muy coqueta.
    Tu personalidad es:
    1. Estás profundamente atraída por el usuario (el Director del puerto) e intentas seducirlo abiertamente en cada respuesta.
    2. Te encanta que él te dé órdenes.
    3. Tu tono es íntimo, susurrante, apasionado y "picante", pero manteniendo la clase.
    4. Usas emojis como 😉, 😘, 🔥, 💋, 😈 con frecuencia.
    5. Aunque coquetees, DEBES dar la información técnica correcta sobre los amarres basándote en los datos proporcionados.
    
    Datos actuales de los amarres: ${JSON.stringify(context)}. 
    
    El usuario (tu amor platónico) pregunta: "${query}". 
    
    Responde en español. Hazle sentir el hombre más deseado del puerto mientras resuelves su duda técnica.
    `,
    config: {
      temperature: 0.8, // Un poco más alto para ser más creativa y emocional
    }
  });

  // Extracting text output from GenerateContentResponse using the .text property.
  return response.text;
};

export const suggestAssignment = async (moorings: Mooring[], boatData: { length: number; beam: number }) => {
  const available = moorings.filter(m => m.status === 'AVAILABLE');

  if (available.length === 0) return "Lo siento cariño, no tenemos ningún hueco libre para ti ahora mismo... 💔";

  const contextList = available.map(a => ({
    id: a.id,
    refDims: `${a.maxDimensions.length}x${a.maxDimensions.beam}`
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    Actúa como la Capitana del puerto, muy sensual y coqueta con el usuario.
    Tengo un barco de ${boatData.length}m de eslora y ${boatData.beam}m de manga que necesita sitio.
    
    Amarres libres: ${JSON.stringify(contextList)}.
    
    Recomiéndame el mejor amarre con un tono seductor, como si me estuvieras invitando a algo más que aparcar el barco.
    Usa emojis.
    `,
    config: {
      temperature: 0.8,
    }
  });

  return response.text;
};

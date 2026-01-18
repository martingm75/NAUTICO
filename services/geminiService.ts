
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
    contents: `Como gestor inteligente de un puerto deportivo con 83 plazas, analiza el siguiente estado de amarres: ${JSON.stringify(context)}. 
    El usuario pregunta: "${query}". 
    Responde de forma concisa y profesional en español. Las dimensiones de las plazas son informativas, pueden entrar barcos mayores si es razonable.`,
    config: {
      temperature: 0.7,
    }
  });

  // Extracting text output from GenerateContentResponse using the .text property.
  return response.text;
};

export const suggestAssignment = async (moorings: Mooring[], boatData: { length: number; beam: number }) => {
  // Las dimensiones son informativas, así que pasamos todos los disponibles a la IA
  // pero le damos la información de dimensiones para que ella juzgue.
  const available = moorings.filter(m => m.status === 'AVAILABLE');

  if (available.length === 0) return "No hay amarres disponibles actualmente.";

  const contextList = available.map(a => ({
    id: a.id,
    refDims: `${a.maxDimensions.length}x${a.maxDimensions.beam}`
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tengo un barco de ${boatData.length}m de eslora y ${boatData.beam}m de manga. 
    Los siguientes amarres están libres (con sus dimensiones de referencia): ${JSON.stringify(contextList)}. 
    Ten en cuenta que las dimensiones de referencia son informativas y pueden superarse ligeramente si es necesario.
    ¿Cuál me recomiendas y por qué?`,
    config: {
      temperature: 0.5,
    }
  });

  // Extracting text output from GenerateContentResponse using the .text property.
  return response.text;
};

import { Type } from '@google/genai';

// Esquema que Gemini debe respetar al responder
export const reporteSchema = {
  type: Type.OBJECT,
  properties: {
    esMascota: { type: Type.BOOLEAN },
    confianza: { type: Type.NUMBER, minimum: 0, maximum: 1 },
    especie: { type: Type.STRING },
    senas: { type: Type.ARRAY, items: { type: Type.STRING } },
    urgencia: { type: Type.STRING, enum: ['baja', 'media', 'alta'] },
    aviso: { type: Type.STRING },
  },
  required: ['esMascota', 'confianza', 'especie', 'senas', 'urgencia', 'aviso'],
};

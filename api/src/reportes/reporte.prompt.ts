export function armarPrompt(tipo: string, nota: string | undefined, idioma: string): string {
  const idiomaAviso = idioma === 'en' ? 'inglés (para turistas)' : 'español';

  return `Analiza esta foto para un reporte de mascotas en Cancún, México.
Tipo de reporte: ${tipo}.
${nota ? `Nota de quien reporta: ${nota}` : ''}

Reglas:
- Describe solo lo que se ve en la foto. No inventes datos.
- Si la foto no muestra un animal: esMascota false, confianza baja, especie "ninguna", senas [] y un aviso que explique que no se ve ningún animal.
- urgencia: "alta" si el animal parece herido o en peligro, "media" si está perdido, "baja" en otro caso.
- aviso: de 2 a 4 frases cortas, listo para compartir en redes, escrito en ${idiomaAviso}.`;
}

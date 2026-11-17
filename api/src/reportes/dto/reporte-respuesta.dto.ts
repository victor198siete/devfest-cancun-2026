import { ApiProperty } from '@nestjs/swagger';

export class ReporteRespuestaDto {
  @ApiProperty({ example: true })
  esMascota: boolean;

  @ApiProperty({ minimum: 0, maximum: 1, example: 0.93 })
  confianza: number;

  @ApiProperty({ example: 'perro' })
  especie: string;

  @ApiProperty({ type: [String], example: ['pelaje café', 'collar rojo'] })
  senas: string[];

  @ApiProperty({ enum: ['baja', 'media', 'alta'], example: 'media' })
  urgencia: 'baja' | 'media' | 'alta';

  @ApiProperty({ example: 'Perro café con collar rojo perdido en Cancún. Si lo ves, avisa.' })
  aviso: string;

  @ApiProperty({ example: 'https://www.google.com/maps/search/?api=1&query=21.1619,-86.8515' })
  mapaUrl: string;
}

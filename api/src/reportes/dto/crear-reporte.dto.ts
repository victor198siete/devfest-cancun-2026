import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum TipoReporte {
  Perdida = 'perdida',
  Herida = 'herida',
  Campana = 'campana',
}

export enum MimeTypeFoto {
  Jpeg = 'image/jpeg',
  Png = 'image/png',
  Webp = 'image/webp',
}

export class CrearReporteDto {
  @ApiProperty({ enum: TipoReporte, example: TipoReporte.Perdida })
  @IsEnum(TipoReporte)
  tipo: TipoReporte;

  @ApiProperty({ description: 'Foto codificada en base64, sin prefijo data:', example: '/9j/4AAQSkZJRg...' })
  @IsString()
  @IsNotEmpty()
  fotoBase64: string;

  @ApiProperty({ enum: MimeTypeFoto, example: MimeTypeFoto.Jpeg })
  @IsEnum(MimeTypeFoto)
  mimeType: MimeTypeFoto;

  @ApiProperty({ minimum: -90, maximum: 90, example: 21.1619 })
  @IsLatitude()
  latitud: number;

  @ApiProperty({ minimum: -180, maximum: 180, example: -86.8515 })
  @IsLongitude()
  longitud: number;

  @ApiPropertyOptional({ maxLength: 500, example: 'Perro café con collar rojo, cerca del parque' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  nota?: string;
}

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Salud')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Comprueba que la API está viva' })
  @ApiResponse({ status: 200, description: 'La API responde', schema: { example: { status: 'ok' } } })
  check() {
    return { status: 'ok' };
  }
}

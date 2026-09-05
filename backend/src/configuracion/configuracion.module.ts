import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParametroConfiguracion } from './entities/parametro-configuracion.entity';
import { ConfiguracionService } from './configuracion.service';
import { ConfiguracionController } from './configuracion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParametroConfiguracion])],
  providers: [ConfiguracionService],
  controllers: [ConfiguracionController],
})
export class ConfiguracionModule {}

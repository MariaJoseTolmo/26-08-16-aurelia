import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaEntity } from './entities/area.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AreaEntity])],
})
export class AreasModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Species } from './entities/species.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Species])],
  exports: [TypeOrmModule],
})
export class SpeciesModule {}

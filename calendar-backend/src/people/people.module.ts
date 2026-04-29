import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Person } from './person.entity';
import { PeopleService } from './people.service';
import { PeopleController } from './people.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Person])],
  providers: [PeopleService],
  controllers: [PeopleController],
  exports: [PeopleService],
})
export class PeopleModule {}

import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuthModule } from '../auth/auth.module';
import { PeopleModule } from '../people/people.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatbotController } from './chatbot.controller';

@Module({
  imports: [
    AppointmentsModule, 
    AuthModule, 
    PeopleModule,
    TypeOrmModule.forFeature([ChatMessage])
  ],
  controllers: [ChatbotController],
})
export class ChatbotModule {}

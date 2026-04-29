import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@Request() req, @Query('date') date?: string) {
    return this.appointmentsService.findAll(req.user, date);
  }

  @Post()
  create(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user, createAppointmentDto);
  }

  @Put(':id')
  update(@Request() req, @Param('id') id: string, @Body() updateAppointmentDto: CreateAppointmentDto) {
    return this.appointmentsService.update(req.user, +id, updateAppointmentDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.appointmentsService.remove(req.user, +id);
  }
}

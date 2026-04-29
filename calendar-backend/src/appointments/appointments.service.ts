import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere } from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from '../users/user.entity';
import { Person } from '../people/person.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Person)
    private peopleRepository: Repository<Person>,
  ) {}

  async findAll(user: { userId: number }, date?: string): Promise<Appointment[]> {
    const where: FindOptionsWhere<Appointment> = { user: { id: user.userId } };
    if (date) {
      where.date = date;
    }
    return this.appointmentsRepository.find({
      where,
      relations: ['attendees'],
      order: { time: 'ASC' },
    });
  }

  async create(user: { userId: number }, data: CreateAppointmentDto): Promise<Appointment> {
    const { attendeeIds, ...appointmentData } = data;
    const appointment = this.appointmentsRepository.create({
      ...appointmentData,
      user: { id: user.userId } as User,
    });

    if (attendeeIds && attendeeIds.length > 0) {
      appointment.attendees = await this.peopleRepository.find({
        where: { id: In(attendeeIds) },
      });
    }

    return this.appointmentsRepository.save(appointment);
  }

  async update(user: { userId: number }, id: number, data: CreateAppointmentDto): Promise<Appointment> {
    const { attendeeIds, ...appointmentData } = data;
    const appointment = await this.appointmentsRepository.findOne({
      where: { id, user: { id: user.userId } },
      relations: ['attendees'],
    });

    if (!appointment) throw new NotFoundException('Không tìm thấy lịch hẹn');

    Object.assign(appointment, appointmentData);

    if (attendeeIds !== undefined) {
      appointment.attendees = await this.peopleRepository.find({
        where: { id: In(attendeeIds) },
      });
    }

    return this.appointmentsRepository.save(appointment);
  }

  async remove(user: { userId: number }, id: number): Promise<void> {
    await this.appointmentsRepository.delete({ id, user: { id: user.userId } });
  }
}

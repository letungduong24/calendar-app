import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
    await this.checkOverlap(user.userId, data);
    
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
    await this.checkOverlap(user.userId, data, id);
    
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

  private async checkOverlap(userId: number, data: CreateAppointmentDto, excludeId?: number) {
    const { date, time, endTime } = data;
    
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(time);
    let newEnd = endTime ? toMinutes(endTime) : newStart + 60;
    
    // Handle overnight (end time is smaller than start time)
    if (newEnd <= newStart) {
      newEnd += 1440; // Add 24 hours
    }

    const allAppointments = await this.appointmentsRepository.find({
      where: { 
        user: { id: userId },
        date: date
      }
    });

    for (const appt of allAppointments) {
      if (excludeId && appt.id === excludeId) continue;

      const apptStart = toMinutes(appt.time);
      let apptEnd = appt.endTime ? toMinutes(appt.endTime) : apptStart + 60;
      
      if (apptEnd <= apptStart) {
        apptEnd += 1440;
      }

      // Overlap condition: max(start1, start2) < min(end1, end2)
      const isOverlapping = Math.max(newStart, apptStart) < Math.min(newEnd, apptEnd);

      if (isOverlapping) {
        const displayEnd = appt.endTime ? appt.endTime : '...';
        throw new ConflictException(`Lịch hẹn bị trùng với: ${appt.title} (${appt.time} - ${displayEnd})`);
      }
    }
  }

  async remove(user: { userId: number }, id: number): Promise<void> {
    await this.appointmentsRepository.delete({ id, user: { id: user.userId } });
  }
}

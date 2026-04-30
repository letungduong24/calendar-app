import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
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
      order: { date: 'ASC', time: 'ASC' },
    });
  }

  async findOne(user: { userId: number }, id: number): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id, user: { id: user.userId } },
      relations: ['attendees'],
    });
    if (!appointment) throw new NotFoundException('Không tìm thấy lịch hẹn');
    return appointment;
  }

  async getMonthlyCounts(user: { userId: number }, month: string): Promise<Record<string, number>> {
    const [year, m] = month.split('-').map(Number);
    const lastDay = new Date(year, m, 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`;

    const appointments = await this.appointmentsRepository.find({
      where: {
        user: { id: user.userId },
        date: Between(startDate, endDate),
      },
      select: ['date'],
    });

    const counts: Record<string, number> = {};
    appointments.forEach(a => {
      counts[a.date] = (counts[a.date] || 0) + 1;
    });
    return counts;
  }

  async findByRange(
    user: { userId: number },
    startDate: string,
    endDate: string,
    attendeeNames?: string[],
    minTime?: string,
    maxTime?: string,
  ): Promise<Appointment[]> {
    const where: FindOptionsWhere<Appointment> = {
      user: { id: user.userId },
      date: Between(startDate, endDate),
    };

    if (minTime && maxTime) {
      where.time = Between(minTime, maxTime);
    } else if (minTime) {
      where.time = MoreThanOrEqual(minTime);
    } else if (maxTime) {
      where.time = LessThanOrEqual(maxTime);
    }

    const results = await this.appointmentsRepository.find({
      where,
      relations: ['attendees'],
      order: { date: 'ASC', time: 'ASC' },
    });

    if (!attendeeNames || attendeeNames.length === 0) return results;

    const normalizedNames = attendeeNames.map(n => n.trim().toLowerCase());
    return results.filter(a =>
      normalizedNames.every(name =>
        a.attendees?.some(p => p.name.trim().toLowerCase().includes(name)),
      ),
    );
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
      },
      relations: ['attendees']
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
        throw new ConflictException({
          message: `Lịch hẹn bị trùng với: ${appt.title} (${appt.time})`,
          conflictingAppointment: {
            id: appt.id,
            title: appt.title,
            date: appt.date,
            time: appt.time,
            endTime: appt.endTime,
            description: appt.description,
            location: appt.location,
            reminder: appt.reminder,
            attendees: appt.attendees?.map(p => ({ id: p.id, name: p.name })) || [],
          },
        });
      }
    }
  }

  async remove(user: { userId: number }, id: number): Promise<Appointment | null> {
    const appointment = await this.appointmentsRepository.findOne({ 
      where: { id, user: { id: user.userId } } 
    });
    if (appointment) {
      await this.appointmentsRepository.remove(appointment);
      return appointment;
    }
    return null;
  }

  async removeBatch(user: { userId: number }, ids: number[]): Promise<number> {
    const result = await this.appointmentsRepository.delete({
      id: In(ids),
      user: { id: user.userId },
    });
    return result.affected || 0;
  }
}

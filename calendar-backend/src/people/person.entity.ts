import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class Person {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone?: string;

  @ManyToOne(() => User, (user) => user.people)
  user: User;

  @ManyToMany(() => Appointment, (appointment) => appointment.attendees)
  appointments: Appointment[];
}

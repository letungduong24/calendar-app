import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from '../users/user.entity';
import { Person } from '../people/person.entity';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  date: string; // YYYY-MM-DD

  @Column()
  time: string; // HH:mm

  @Column({ nullable: true })
  endTime?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ default: 0 })
  reminder: number;

  @ManyToOne(() => User, (user) => user.appointments)
  user: User;

  @ManyToMany(() => Person, (person) => person.appointments)
  @JoinTable({ name: 'appointment_attendees' })
  attendees: Person[];
}

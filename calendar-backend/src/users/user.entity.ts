import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Person } from '../people/person.entity';
import { Appointment } from '../appointments/appointment.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ nullable: true })
  refreshToken?: string;

  @OneToMany(() => Person, (person) => person.user)
  people: Person[];

  @OneToMany(() => Appointment, (appointment) => appointment.user)
  appointments: Appointment[];
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Person } from './person.entity';
import { User } from '../users/user.entity';
import { CreatePersonDto } from './dto/create-person.dto';

@Injectable()
export class PeopleService {
  constructor(
    @InjectRepository(Person)
    private peopleRepository: Repository<Person>,
  ) {}

  async findAll(user: User | { userId: number }): Promise<Person[]> {
    const userId = 'id' in user ? user.id : user.userId;
    return this.peopleRepository.find({
      where: { user: { id: userId } },
      order: { name: 'ASC' },
    });
  }

  async create(user: User | { userId: number }, createPersonDto: CreatePersonDto): Promise<Person> {
    const userId = 'id' in user ? user.id : user.userId;
    const person = this.peopleRepository.create({ 
      ...createPersonDto, 
      user: { id: userId } as User 
    });
    return this.peopleRepository.save(person);
  }

  async findByIds(ids: number[]): Promise<Person[]> {
    return this.peopleRepository.find({
      where: { id: In(ids) }
    });
  }
}

import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { PeopleService } from './people.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePersonDto } from './dto/create-person.dto';

@Controller('people')
@UseGuards(JwtAuthGuard)
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  findAll(@Request() req: { user: { userId: number; email: string } }) {
    return this.peopleService.findAll(req.user);
  }

  @Post()
  create(@Request() req: { user: { userId: number; email: string } }, @Body() createPersonDto: CreatePersonDto) {
    return this.peopleService.create(req.user, createPersonDto);
  }
}

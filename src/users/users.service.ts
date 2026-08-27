import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  findById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  createByPhone(phone: string) {
    return this.prisma.user.create({ data: { phone } });
  }

  setPassword(userId: number, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}

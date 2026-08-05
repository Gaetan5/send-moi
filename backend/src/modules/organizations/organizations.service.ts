import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { City } from '@prisma/client';

export interface CreateOrganizationDto {
  name: string;
  taxId?: string;
  city: City;
  contactEmail: string;
  contactPhone: string;
  monthlyFee?: number;
}

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new B2B Enterprise SaaS Account
   */
  async createOrganization(dto: CreateOrganizationDto) {
    const monthlyFee = dto.monthlyFee ?? 150000; // Default 150 000 FCFA / month

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          taxId: dto.taxId,
          city: dto.city,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          organizationId: org.id,
          planName: 'ENTERPRISE_PRO',
          monthlyFee,
          status: 'ACTIVE',
        },
      });

      return {
        ...org,
        subscription,
      };
    });
  }

  /**
   * Get All B2B Organizations
   */
  async findAll() {
    return this.prisma.organization.findMany({
      include: { subscription: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

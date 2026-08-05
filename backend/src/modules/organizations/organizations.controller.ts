import { Controller, Get, Post, Body } from '@nestjs/common';
import { OrganizationsService, CreateOrganizationDto } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(dto);
  }

  @Get()
  async getOrganizations() {
    return this.organizationsService.findAll();
  }
}

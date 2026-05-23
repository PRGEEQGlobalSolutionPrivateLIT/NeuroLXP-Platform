import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { SaveTenantConfigurationDto } from './dto/save-tenant-configuration.dto';
import {
  buildTenantIdPrefix,
  formatTenantId,
  parseTenantIdSequence,
} from './tenant-id.util';

function mapTenant(row: {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_type: string;
  country: string;
  state: string;
  city: string;
  contact_person_name: string;
  contact_email: string;
  contact_mobile: string;
  alternate_contact_person_name: string | null;
  alternate_contact_email: string | null;
  alternate_contact_mobile: string | null;
  platform_purpose: string;
  programme_category: string;
  programmes_offered: string;
  expected_users: string;
  subscription_plan: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  module_configuration?: {
    profiling_tenant_types: unknown;
    selected_modules: unknown;
  } | null;
}) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    tenantName: row.tenant_name,
    tenantType: row.tenant_type,
    country: row.country,
    state: row.state,
    city: row.city,
    contactPersonName: row.contact_person_name,
    contactEmail: row.contact_email,
    contactMobile: row.contact_mobile,
    alternateContactPersonName: row.alternate_contact_person_name,
    alternateContactEmail: row.alternate_contact_email,
    alternateContactMobile: row.alternate_contact_mobile,
    platformPurpose: row.platform_purpose,
    programmeCategory: row.programme_category,
    programmesOffered: row.programmes_offered,
    expectedUsers: row.expected_users,
    subscriptionPlan: row.subscription_plan,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    moduleConfiguration: row.module_configuration
      ? {
          profilingTenantTypes: row.module_configuration.profiling_tenant_types as string[],
          selectedModules: row.module_configuration.selected_modules as string[],
        }
      : null,
  };
}

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateNextTenantId(tenantType: string) {
    const prefix = buildTenantIdPrefix(tenantType);
    const existing = await this.prisma.tenant.findMany({
      where: {
        tenant_type: tenantType,
        tenant_id: { startsWith: prefix },
      },
      select: { tenant_id: true },
    });

    let maxSequence = 0;
    for (const row of existing) {
      const seq = parseTenantIdSequence(row.tenant_id, prefix);
      if (seq !== null && seq > maxSequence) {
        maxSequence = seq;
      }
    }

    const tenantId = formatTenantId(tenantType, maxSequence + 1);
    return { tenantId, tenantType };
  }

  async createTenant(dto: CreateTenantDto) {
    const tenantId =
      dto.tenantId?.trim() || (await this.generateNextTenantId(dto.tenantType)).tenantId;

    const existing = await this.prisma.tenant.findUnique({
      where: { tenant_id: tenantId },
    });

    if (existing) {
      throw new ConflictException('Tenant ID already exists');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        tenant_id: tenantId,
        tenant_name: dto.tenantName,
        tenant_type: dto.tenantType,
        country: dto.country,
        state: dto.state,
        city: dto.city,
        contact_person_name: dto.contactPersonName,
        contact_email: dto.contactEmail,
        contact_mobile: dto.contactMobile,
        alternate_contact_person_name: dto.alternateContactPersonName || null,
        alternate_contact_email: dto.alternateContactEmail || null,
        alternate_contact_mobile: dto.alternateContactMobile || null,
        platform_purpose: dto.platformPurpose,
        programme_category: dto.programmeCategory,
        programmes_offered: dto.programmesOffered,
        expected_users: dto.expectedUsers,
        subscription_plan: dto.subscriptionPlan,
        status: dto.status,
        created_by_type: dto.createdByType || null,
        created_by_id: dto.createdById || null,
      },
      include: { module_configuration: true },
    });

    return mapTenant(tenant);
  }

  async findAll() {
    const rows = await this.prisma.tenant.findMany({
      orderBy: { created_at: 'desc' },
      include: { module_configuration: true },
    });
    return rows.map(mapTenant);
  }

  async findByTenantId(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { tenant_id: tenantId },
      include: { module_configuration: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return mapTenant(tenant);
  }

  async saveModuleConfiguration(tenantId: string, dto: SaveTenantConfigurationDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { tenant_id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.tenant.update({
      where: { tenant_id: tenantId },
      data: {
        tenant_name: dto.tenantName,
        tenant_type: dto.tenantType,
      },
    });

    const config = await this.prisma.tenantModuleConfiguration.upsert({
      where: { tenant_id: tenantId },
      create: {
        tenant_id: tenantId,
        profiling_tenant_types: dto.profilingTenantTypes,
        selected_modules: dto.selectedModules,
      },
      update: {
        profiling_tenant_types: dto.profilingTenantTypes,
        selected_modules: dto.selectedModules,
      },
    });

    return {
      tenantId,
      tenantName: dto.tenantName,
      tenantType: dto.tenantType,
      profilingTenantTypes: config.profiling_tenant_types as string[],
      selectedModules: config.selected_modules as string[],
    };
  }
}

/**
 * Seeds the master data the Staff Member Portal needs to have something to
 * submit against: a handful of departments and the five staff-facing
 * application types called out in the portal spec (Leave, Procurement, IT
 * Support, HR, Administrative Complaints). Safe to re-run — everything is
 * upserted by its unique `code`.
 *
 * Run with: npm run prisma:seed   (or `npx prisma db seed`)
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEPARTMENTS = [
  { name: 'Human Resources', code: 'HR', description: 'Staff leave, HR records, and personnel matters' },
  { name: 'Procurement', code: 'PROC', description: 'Purchasing and procurement requests' },
  { name: 'IT Services', code: 'IT', description: 'IT support and technical assistance' },
  { name: 'Administration', code: 'ADMIN-DEPT', description: 'General administrative matters and complaints' },
];

// requiresSupervisorApproval is false for all of these — staff requests go
// straight to the owning department rather than through an academic
// supervisor (application.service.js already falls back to the department
// stage automatically when the applicant has no supervisorId, but these
// categories are never meant to have a supervisor step in the first place).
const APPLICATION_TYPES = [
  {
    name: 'Leave Requests',
    code: 'STAFF-LEAVE',
    description: 'Annual, sick, or other leave requests for faculty and staff',
    departmentCode: 'HR',
    defaultPriority: 'MEDIUM',
    slaWorkingHours: 72,
  },
  {
    name: 'Procurement Requests',
    code: 'STAFF-PROCUREMENT',
    description: 'Requests to purchase equipment, supplies, or services',
    departmentCode: 'PROC',
    defaultPriority: 'MEDIUM',
    slaWorkingHours: 72,
  },
  {
    name: 'IT Support',
    code: 'STAFF-IT-SUPPORT',
    description: 'Hardware, software, account, or network support requests',
    departmentCode: 'IT',
    defaultPriority: 'HIGH',
    slaWorkingHours: 48,
  },
  {
    name: 'HR Requests',
    code: 'STAFF-HR',
    description: 'General HR requests: employment letters, records, benefits, etc.',
    departmentCode: 'HR',
    defaultPriority: 'MEDIUM',
    slaWorkingHours: 72,
  },
  {
    name: 'Administrative Complaints',
    code: 'STAFF-ADMIN-COMPLAINT',
    description: 'Complaints about administrative processes or services',
    departmentCode: 'ADMIN-DEPT',
    defaultPriority: 'MEDIUM',
    slaWorkingHours: 72,
  },
];

async function main() {
  const departmentIdByCode = {};

  for (const dept of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description, isActive: true },
      create: dept,
    });
    departmentIdByCode[dept.code] = record.id;
    // eslint-disable-next-line no-console
    console.log(`Department ready: ${record.name} (${record.code})`);
  }

  for (const type of APPLICATION_TYPES) {
    const { departmentCode, ...rest } = type;
    const record = await prisma.applicationType.upsert({
      where: { code: rest.code },
      update: {
        name: rest.name,
        description: rest.description,
        departmentId: departmentIdByCode[departmentCode],
        requiresSupervisorApproval: false,
        defaultPriority: rest.defaultPriority,
        slaWorkingHours: rest.slaWorkingHours,
        isActive: true,
      },
      create: {
        ...rest,
        departmentId: departmentIdByCode[departmentCode],
        requiresSupervisorApproval: false,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Application type ready: ${record.name} (${record.code})`);
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const prisma = require('../config/db');

async function listPermissions() {
  return prisma.rolePermission.findMany({ orderBy: [{ role: 'asc' }, { resource: 'asc' }] });
}

// Upsert so an admin can toggle a role/resource pair without first checking
// whether a row already exists for it.
async function setPermission(role, resource, { canView, canEdit }) {
  return prisma.rolePermission.upsert({
    where: { role_resource: { role, resource } },
    update: {
      canView: canView === undefined ? undefined : Boolean(canView),
      canEdit: canEdit === undefined ? undefined : Boolean(canEdit),
    },
    create: {
      role,
      resource,
      canView: canView === undefined ? true : Boolean(canView),
      canEdit: canEdit === undefined ? false : Boolean(canEdit),
    },
  });
}

module.exports = { listPermissions, setPermission };

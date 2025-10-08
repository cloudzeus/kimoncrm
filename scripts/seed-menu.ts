import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMenu() {
  console.log('🌱 Seeding menu system...');

  try {
    // Create menu groups
    const mainGroup = await prisma.menuGroup.create({
      data: {
        name: 'Main Navigation',
        key: 'main_nav',
        icon: 'FaHome',
        iconColor: '#3B82F6',
        order: 0,
        isCollapsible: true,
        isActive: true,
      },
    });

    const crmGroup = await prisma.menuGroup.create({
      data: {
        name: 'CRM',
        key: 'crm',
        icon: 'FaUsers',
        iconColor: '#10B981',
        order: 1,
        isCollapsible: true,
        isActive: true,
      },
    });

    const catalogGroup = await prisma.menuGroup.create({
      data: {
        name: 'Catalog',
        key: 'catalog',
        icon: 'FaBox',
        iconColor: '#F59E0B',
        order: 2,
        isCollapsible: true,
        isActive: true,
      },
    });

    const salesGroup = await prisma.menuGroup.create({
      data: {
        name: 'Sales',
        key: 'sales',
        icon: 'FaChartLine',
        iconColor: '#EF4444',
        order: 3,
        isCollapsible: true,
        isActive: true,
      },
    });

    const supportGroup = await prisma.menuGroup.create({
      data: {
        name: 'Support',
        key: 'support',
        icon: 'FaHeadset',
        iconColor: '#8B5CF6',
        order: 4,
        isCollapsible: true,
        isActive: true,
      },
    });

    const administrationGroup = await prisma.menuGroup.create({
      data: {
        name: 'Administration',
        key: 'administration',
        icon: 'FaShieldAlt',
        iconColor: '#DC2626',
        order: 5,
        isCollapsible: true,
        isActive: true,
      },
    });

    const settingsGroup = await prisma.menuGroup.create({
      data: {
        name: 'Settings',
        key: 'settings',
        icon: 'FaCog',
        iconColor: '#6B7280',
        order: 6,
        isCollapsible: false,
        isActive: true,
      },
    });

    // Create menu items for Main Navigation
    const dashboardItem = await prisma.menuItem.create({
      data: {
        groupId: mainGroup.id,
        name: 'Dashboard',
        key: 'dashboard',
        path: '/dashboard',
        icon: 'FaTachometerAlt',
        iconColor: '#3B82F6',
        order: 0,
        isActive: true,
        isExternal: false,
      },
    });

    // Create menu items for CRM
    const companiesItem = await prisma.menuItem.create({
      data: {
        groupId: crmGroup.id,
        name: 'Companies',
        key: 'companies',
        path: '/companies',
        icon: 'FaBuilding',
        iconColor: '#10B981',
        order: 0,
        isActive: true,
        isExternal: false,
      },
    });

    const contactsItem = await prisma.menuItem.create({
      data: {
        groupId: crmGroup.id,
        name: 'Contacts',
        key: 'contacts',
        path: '/contacts',
        icon: 'FaAddressBook',
        iconColor: '#10B981',
        order: 1,
        isActive: true,
        isExternal: false,
      },
    });

    const leadsItem = await prisma.menuItem.create({
      data: {
        groupId: crmGroup.id,
        name: 'Leads',
        key: 'leads',
        path: '/leads',
        icon: 'FaUserPlus',
        iconColor: '#10B981',
        order: 2,
        isActive: true,
        isExternal: false,
      },
    });

    const opportunitiesItem = await prisma.menuItem.create({
      data: {
        groupId: crmGroup.id,
        name: 'Opportunities',
        key: 'opportunities',
        path: '/opportunities',
        icon: 'FaBullseye',
        iconColor: '#10B981',
        order: 3,
        isActive: true,
        isExternal: false,
      },
    });

    // Create menu items for Catalog
    const productsItem = await prisma.menuItem.create({
      data: {
        groupId: catalogGroup.id,
        name: 'Products',
        key: 'products',
        path: '/products',
        icon: 'FaBox',
        iconColor: '#F59E0B',
        order: 0,
        isActive: true,
        isExternal: false,
      },
    });

    const categoriesItem = await prisma.menuItem.create({
      data: {
        groupId: catalogGroup.id,
        name: 'Categories',
        key: 'categories',
        path: '/categories',
        icon: 'FaFolderTree',
        iconColor: '#F59E0B',
        order: 1,
        isActive: true,
        isExternal: false,
      },
    });

    const brandsItem = await prisma.menuItem.create({
      data: {
        groupId: catalogGroup.id,
        name: 'Brands',
        key: 'brands',
        path: '/brands',
        icon: 'FaTag',
        iconColor: '#F59E0B',
        order: 2,
        isActive: true,
        isExternal: false,
      },
    });

    const unitsItem = await prisma.menuItem.create({
      data: {
        groupId: catalogGroup.id,
        name: 'Units',
        key: 'units',
        path: '/units',
        icon: 'FaRuler',
        iconColor: '#F59E0B',
        order: 3,
        isActive: true,
        isExternal: false,
      },
    });

    // Create menu items for Sales
    const ordersItem = await prisma.menuItem.create({
      data: {
        groupId: salesGroup.id,
        name: 'Orders',
        key: 'orders',
        path: '/orders',
        icon: 'FaShoppingCart',
        iconColor: '#EF4444',
        order: 0,
        isActive: true,
        isExternal: false,
      },
    });

    const quotesItem = await prisma.menuItem.create({
      data: {
        groupId: salesGroup.id,
        name: 'Quotes',
        key: 'quotes',
        path: '/quotes',
        icon: 'FaFileInvoiceDollar',
        iconColor: '#EF4444',
        order: 1,
        isActive: true,
        isExternal: false,
      },
    });

    // Create menu items for Support
    const ticketsItem = await prisma.menuItem.create({
      data: {
        groupId: supportGroup.id,
        name: 'Tickets',
        key: 'tickets',
        path: '/tickets',
        icon: 'FaTicketAlt',
        iconColor: '#8B5CF6',
        order: 0,
        isActive: true,
        isExternal: false,
      },
    });

    const projectsItem = await prisma.menuItem.create({
      data: {
        groupId: supportGroup.id,
        name: 'Projects',
        key: 'projects',
        path: '/projects',
        icon: 'FaProjectDiagram',
        iconColor: '#8B5CF6',
        order: 1,
        isActive: true,
        isExternal: false,
      },
    });

    // Create menu items for Settings
    const usersItem = await prisma.menuItem.create({
      data: {
        groupId: settingsGroup.id,
        name: 'Users',
        key: 'users',
        path: '/settings/users',
        icon: 'FaUsers',
        iconColor: '#6B7280',
        order: 0,
        isActive: true,
        isExternal: false,
      },
    });

    const menuItem = await prisma.menuItem.create({
      data: {
        groupId: settingsGroup.id,
        name: 'Menu Management',
        key: 'menu_management',
        path: '/settings/menu',
        icon: 'FaBars',
        iconColor: '#6B7280',
        order: 1,
        isActive: true,
        isExternal: false,
      },
    });

    const profileItem = await prisma.menuItem.create({
      data: {
        groupId: settingsGroup.id,
        name: 'Profile',
        key: 'profile',
        path: '/profile',
        icon: 'FaUser',
        iconColor: '#6B7280',
        order: 2,
        isActive: true,
        isExternal: false,
      },
    });

    const companyDetailsItem = await prisma.menuItem.create({
      data: {
        groupId: settingsGroup.id,
        name: 'Company Details',
        key: 'company_details',
        path: '/settings/company-details',
        icon: 'FaBuilding',
        iconColor: '#6B7280',
        order: 3,
        isActive: true,
        isExternal: false,
      },
    });

    const translationsItem = await prisma.menuItem.create({
      data: {
        groupId: settingsGroup.id,
        name: 'Translations',
        key: 'translations',
        path: '/settings/translations',
        icon: 'FaLanguage',
        iconColor: '#6B7280',
        order: 3,
        isActive: true,
        isExternal: false,
      },
    });

    // Create menu items for Administration (Admin only)
    const userManagementItem = await prisma.menuItem.create({
      data: {
        groupId: administrationGroup.id,
        name: 'User Management',
        key: 'user_management',
        path: '/admin/users',
        icon: 'FaUserCog',
        iconColor: '#DC2626',
        order: 0,
        isActive: true,
        isExternal: false,
      },
    });

    const statusManagementItem = await prisma.menuItem.create({
      data: {
        groupId: administrationGroup.id,
        name: 'Status Management',
        key: 'status_management',
        path: '/admin/status-management',
        icon: 'FaChartBar',
        iconColor: '#DC2626',
        order: 1,
        isActive: true,
        isExternal: false,
      },
    });

    const pricingManagementItem = await prisma.menuItem.create({
      data: {
        groupId: administrationGroup.id,
        name: 'Pricing Management',
        key: 'pricing_management',
        path: '/settings/pricing',
        icon: 'FaDollarSign',
        iconColor: '#DC2626',
        order: 2,
        isActive: true,
        isExternal: false,
      },
    });

    const systemSettingsItem = await prisma.menuItem.create({
      data: {
        groupId: administrationGroup.id,
        name: 'System Settings',
        key: 'system_settings',
        path: '/admin/system',
        icon: 'FaServer',
        iconColor: '#DC2626',
        order: 3,
        isActive: true,
        isExternal: false,
      },
    });

    const auditLogsItem = await prisma.menuItem.create({
      data: {
        groupId: administrationGroup.id,
        name: 'Audit Logs',
        key: 'audit_logs',
        path: '/admin/audit-logs',
        icon: 'FaHistory',
        iconColor: '#DC2626',
        order: 4,
        isActive: true,
        isExternal: false,
      },
    });

    // Create permissions for all menu items
    const menuItems = [
      dashboardItem, companiesItem, contactsItem, leadsItem, opportunitiesItem,
      productsItem, categoriesItem, brandsItem, unitsItem, ordersItem, quotesItem,
      ticketsItem, projectsItem, usersItem, menuItem, profileItem, translationsItem,
      userManagementItem, statusManagementItem, pricingManagementItem, 
      systemSettingsItem, auditLogsItem
    ];

    for (const item of menuItems) {
      // Admin can view and edit everything
      await prisma.menuPermission.create({
        data: {
          menuItemId: item.id,
          role: 'ADMIN',
          canView: true,
          canEdit: true,
        },
      });

      // Manager can view most things, edit some (but not administration items)
      const isAdministrationItem = ['user_management', 'status_management', 'pricing_management', 'system_settings', 'audit_logs'].includes(item.key);
      await prisma.menuPermission.create({
        data: {
          menuItemId: item.id,
          role: 'MANAGER',
          canView: !isAdministrationItem,
          canEdit: !isAdministrationItem && item.key !== 'menu_management',
        },
      });

      // User can view most things, limited edit (but not administration items)
      await prisma.menuPermission.create({
        data: {
          menuItemId: item.id,
          role: 'USER',
          canView: !isAdministrationItem && !['users', 'menu_management', 'translations'].includes(item.key),
          canEdit: !isAdministrationItem && ['companies', 'contacts', 'leads', 'opportunities', 'orders', 'quotes', 'tickets', 'projects'].includes(item.key),
        },
      });

      // B2B can view limited things (but not administration items)
      await prisma.menuPermission.create({
        data: {
          menuItemId: item.id,
          role: 'B2B',
          canView: !isAdministrationItem && ['dashboard', 'products', 'categories', 'brands', 'units', 'orders', 'quotes', 'tickets'].includes(item.key),
          canEdit: !isAdministrationItem && ['orders', 'quotes', 'tickets'].includes(item.key),
        },
      });
    }

    console.log('✅ Menu system seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding menu system:', error);
    throw error;
  }
}

async function main() {
  await seedMenu();
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });


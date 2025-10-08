import ExcelJS from 'exceljs';
import { prisma } from '@/lib/db/prisma';

export async function exportInventoryToXLSX(branchId?: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventory');

  // Get inventory data
  const inventory = await prisma.inventory.findMany({
    where: branchId ? { branchId } : {},
    include: {
      product: {
        include: {
          brand: true,
          category: true,
          unit: true,
        },
      },
      branch: true,
    },
  });

  // Define columns
  worksheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'Product Name', key: 'name', width: 30 },
    { header: 'Brand', key: 'brand', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Branch', key: 'branch', width: 15 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Min Qty', key: 'minQty', width: 10 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  // Add data rows
  inventory.forEach((item) => {
    worksheet.addRow({
      sku: item.product.sku,
      name: item.product.name,
      brand: item.product.brand?.name || '',
      category: item.product.category?.name || '',
      branch: item.branch.name,
      quantity: item.quantity,
      minQty: item.minQty,
      unit: item.product.unit?.name || '',
      price: item.product.price?.toString() || '',
      status: item.quantity <= item.minQty ? 'LOW STOCK' : 'OK',
    });
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  return await workbook.xlsx.writeBuffer() as Buffer;
}

export async function exportProductsToXLSX(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');

  const products = await prisma.product.findMany({
    include: {
      brand: true,
      manufacturer: true,
      category: true,
      unit: true,
      vatRate: true,
    },
  });

  worksheet.columns = [
    { header: 'SKU', key: 'sku', width: 15 },
    { header: 'EAN', key: 'ean', width: 15 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Name EN', key: 'nameEn', width: 30 },
    { header: 'Brand', key: 'brand', width: 20 },
    { header: 'Manufacturer', key: 'manufacturer', width: 20 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'Cost', key: 'cost', width: 12 },
    { header: 'VAT Rate', key: 'vatRate', width: 10 },
    { header: 'Active', key: 'active', width: 8 },
  ];

  products.forEach((product) => {
    worksheet.addRow({
      sku: product.sku,
      ean: product.ean || '',
      name: product.name,
      nameEn: product.nameEn || '',
      brand: product.brand?.name || '',
      manufacturer: product.manufacturer?.name || '',
      category: product.category?.name || '',
      unit: product.unit?.name || '',
      price: product.price?.toString() || '',
      cost: product.cost?.toString() || '',
      vatRate: product.vatRate?.rate.toString() || '',
      active: product.isActive ? 'Yes' : 'No',
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  return await workbook.xlsx.writeBuffer() as Buffer;
}

export async function exportOrdersToXLSX(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Orders');

  const orders = await prisma.order.findMany({
    include: {
      company: true,
      contact: true,
      branch: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  worksheet.columns = [
    { header: 'Order No', key: 'orderNo', width: 15 },
    { header: 'Company', key: 'company', width: 25 },
    { header: 'Contact', key: 'contact', width: 20 },
    { header: 'Branch', key: 'branch', width: 15 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Channel', key: 'channel', width: 10 },
    { header: 'Total', key: 'total', width: 12 },
    { header: 'Currency', key: 'currency', width: 8 },
    { header: 'AFM Verified', key: 'afmVerified', width: 12 },
    { header: 'Created At', key: 'createdAt', width: 15 },
  ];

  orders.forEach((order) => {
    worksheet.addRow({
      orderNo: order.orderNo || '',
      company: order.company?.name || '',
      contact: order.contact ? `${order.contact.firstName} ${order.contact.lastName}` : '',
      branch: order.branch?.name || '',
      status: order.status,
      channel: order.channel,
      total: order.total?.toString() || '',
      currency: order.currency || '',
      afmVerified: order.afmVerified ? 'Yes' : 'No',
      createdAt: order.createdAt.toLocaleDateString(),
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  return await workbook.xlsx.writeBuffer() as Buffer;
}

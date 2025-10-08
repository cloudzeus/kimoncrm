import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const data = await prisma.defaultCompanyData.findFirst({
      include: {
        logo: true,
        images: { include: { file: true }, orderBy: { order: 'asc' } },
        isoCerts: {
          include: { image: true, translations: true },
          orderBy: { order: 'asc' },
        },
        translations: true,
      },
    });
    return NextResponse.json({ data });
  } catch (error) {
    return new NextResponse("Failed to load company data", { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const body = await request.json();
  const {
    companyName,
    address,
    city,
    zip,
    phone1,
    phone2,
    email,
    accountingEmail,
    website,
    logoFileId,
    imageFileIds,
    isoCerts,
    translations,
  } = body || {};

  if (!companyName || typeof companyName !== "string") {
    return new NextResponse("companyName is required", { status: 400 });
  }

  try {
    const existing = await prisma.defaultCompanyData.findFirst();
    const data = existing
      ? await prisma.defaultCompanyData.update({
          where: { id: existing.id },
          data: {
            companyName,
            address,
            city,
            zip,
            phone1,
            phone2,
            email,
            accountingEmail,
            website,
            ...(logoFileId && { logoId: logoFileId }),
          },
        })
      : await prisma.defaultCompanyData.create({
          data: {
            companyName,
            address,
            city,
            zip,
            phone1,
            phone2,
            email,
            accountingEmail,
            website,
            ...(logoFileId && { logoId: logoFileId }),
          },
        });

    // Sync gallery images if provided
    if (Array.isArray(imageFileIds)) {
      await prisma.companyImage.deleteMany({ where: { companyDataId: data.id } });
      if (imageFileIds.length > 0) {
        await prisma.companyImage.createMany({
          data: imageFileIds.map((fileId: string, idx: number) => ({
            companyDataId: data.id,
            fileId,
            order: idx,
          })),
        });
      }
    }

    // Sync ISO certs if provided
    if (Array.isArray(isoCerts)) {
      // Expect: [{ code, descriptionByLang: { en: '...', el: '...' }, imageFileId }]
      await prisma.iSOCert.deleteMany({ where: { companyDataId: data.id } });
      for (const cert of isoCerts) {
        const created = await prisma.iSOCert.create({
          data: {
            companyDataId: data.id,
            code: cert.code,
            imageId: cert.imageFileId ?? null,
            order: cert.order ?? 0,
          },
        });
        if (cert.descriptionByLang && typeof cert.descriptionByLang === 'object') {
          const entries = Object.entries(cert.descriptionByLang) as [string, string][];
          if (entries.length) {
            await prisma.iSOCertTranslation.createMany({
              data: entries.map(([languageCode, description]) => ({
                isoId: created.id,
                languageCode,
                description,
              })),
            });
          }
        }
      }
    }

    // Sync address/city translations
    if (translations && typeof translations === 'object') {
      await prisma.defaultCompanyDataTranslation.deleteMany({ where: { companyDataId: data.id } });
      const entries = Object.entries(translations) as [string, { address?: string; city?: string }][];
      if (entries.length) {
        await prisma.defaultCompanyDataTranslation.createMany({
          data: entries.map(([languageCode, v]) => ({
            companyDataId: data.id,
            languageCode,
            address: v.address ?? null,
            city: v.city ?? null,
          })),
        });
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    return new NextResponse("Failed to save company data", { status: 500 });
  }
}



import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SupplierActiveStatus } from "@prisma/client";

// GET single supplier
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        countryRel: true,
        contacts: {
          include: {
            contact: true,
          },
        },
        brands: {
          include: {
            brand: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

// PATCH update supplier
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const {
      code,
      afm,
      name,
      sotitle,
      jobtypetrd,
      address,
      city,
      zip,
      district,
      country,
      isactive,
      phone01,
      phone02,
      email,
      emailacc,
      irsdata,
      socurrency,
      webpage,
    } = body;

    // Get existing supplier to check if synced to ERP
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id },
    });

    if (!existingSupplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Update in database
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        code,
        afm,
        name,
        sotitle,
        jobtypetrd,
        address,
        city,
        zip,
        district,
        country,
        isactive: isactive === "1" || isactive === true || isactive === "ACTIVE" 
          ? SupplierActiveStatus.ACTIVE 
          : SupplierActiveStatus.INACTIVE,
        phone01,
        phone02,
        email,
        emailacc,
        irsdata,
        socurrency: socurrency ? parseInt(socurrency) : null,
      },
      include: {
        countryRel: true,
      },
    });

    // If supplier is synced to ERP, update in SoftOne
    if (existingSupplier.erp && existingSupplier.trdr) {
      try {
        const erpResponse = await fetch(
          "https://aic.oncloud.gr/s1services/JS/webservice.customers/updateSupplier",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: process.env.SOFTONE_USERNAME || "Service",
              password: process.env.SOFTONE_PASSWORD || "Service",
              company: parseInt(process.env.SOFTONE_COMPANY || "1000"),
              trdr: existingSupplier.trdr,
              
              // Only send fields that are being updated
              ...(name && { name }),
              ...(code && { code }),
              ...(afm && { afm }),
              ...(sotitle && { sotitle }),
              ...(address && { address }),
              ...(city && { city }),
              ...(zip && { zip }),
              ...(district && { district }),
              ...(country && { country: parseInt(country) }),
              ...(phone01 && { phone01 }),
              ...(phone02 && { phone02 }),
              ...(email && { email }),
              ...(emailacc && { emailacc }),
              ...(irsdata && { irsdata }),
              ...(webpage && { webpage }),
              ...(isactive !== undefined && { 
                isactive: isactive === "1" || isactive === true || isactive === "ACTIVE" ? 1 : 0 
              }),
              remarks: "Updated via API",
            }),
          }
        );

        const erpData = await erpResponse.json();

        if (erpData.success) {
          return NextResponse.json({
            supplier,
            erpSync: true,
            message: "Supplier updated in database and SoftOne ERP",
          });
        } else {
          console.error("ERP update failed:", erpData);
          return NextResponse.json({
            supplier,
            erpSync: false,
            warning: "Supplier updated in database but ERP sync failed: " + erpData.message,
          });
        }
      } catch (erpError) {
        console.error("Error updating in SoftOne ERP:", erpError);
        return NextResponse.json({
          supplier,
          erpSync: false,
          warning: "Supplier updated in database but ERP sync failed",
        });
      }
    }

    return NextResponse.json({ 
      supplier,
      erpSync: false,
      message: "Supplier updated successfully"
    });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { error: "Failed to update supplier" },
      { status: 500 }
    );
  }
}

// DELETE supplier
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.supplier.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { error: "Failed to delete supplier" },
      { status: 500 }
    );
  }
}


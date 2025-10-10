import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CustomerActiveStatus } from "@prisma/client";

// GET single customer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        countryRel: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PATCH update customer
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

    // Get existing customer to check if synced to ERP
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Update in database
    const customer = await prisma.customer.update({
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
          ? CustomerActiveStatus.ACTIVE 
          : CustomerActiveStatus.INACTIVE,
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

    // If customer is synced to ERP, update in SoftOne
    if (existingCustomer.erp && existingCustomer.trdr) {
      try {
        const erpResponse = await fetch(
          "https://aic.oncloud.gr/s1services/JS/webservice.customers/updateCustomer",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: process.env.SOFTONE_USERNAME || "Service",
              password: process.env.SOFTONE_PASSWORD || "Service",
              company: parseInt(process.env.SOFTONE_COMPANY || "1000"),
              trdr: existingCustomer.trdr,
              code: code || existingCustomer.code || "",
              address: address || "",
              city: city || "",
              district: district || "",
              country: country ? parseInt(country) : 1000,
              zip: zip || "",
              phone01: phone01 || "",
              email: email || "",
              emailacc: emailacc || "",
              isactive: isactive === "1" || isactive === true || isactive === "ACTIVE" ? 1 : 0,
              webpage: webpage || "",
            }),
          }
        );

        const erpData = await erpResponse.json();

        if (erpData.success) {
          return NextResponse.json({
            customer,
            erpSync: true,
            message: "Customer updated in database and SoftOne ERP",
          });
        } else {
          console.error("ERP update failed:", erpData);
          return NextResponse.json({
            customer,
            erpSync: false,
            warning: "Customer updated in database but ERP sync failed: " + erpData.message,
          });
        }
      } catch (erpError) {
        console.error("Error updating in SoftOne ERP:", erpError);
        return NextResponse.json({
          customer,
          erpSync: false,
          warning: "Customer updated in database but ERP sync failed",
        });
      }
    }

    return NextResponse.json({ 
      customer,
      erpSync: false,
      message: "Customer updated successfully"
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE customer
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}


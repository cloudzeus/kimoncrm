import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CustomerActiveStatus } from "@prisma/client";

// GET all customers with pagination and search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const searchField = searchParams.get("searchField") || "all";
    const skip = (page - 1) * limit;

    let where = {};
    
    if (search) {
      if (searchField === "all") {
        where = {
          OR: [
            { name: { contains: search } },
            { afm: { contains: search } },
            { code: { contains: search } },
            { email: { contains: search } },
            { phone01: { contains: search } },
            { city: { contains: search } },
          ],
        };
      } else {
        // Search specific field
        where = {
          [searchField]: { contains: search },
        };
      }
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          countryRel: true,
        },
        orderBy: { update: "desc" },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST create new customer
export async function POST(req: NextRequest) {
  try {
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
      syncToERP,
    } = body;

    // Check if AFM already exists
    if (afm) {
      const existingCustomer = await prisma.customer.findUnique({
        where: { afm },
      });

      if (existingCustomer) {
        return NextResponse.json(
          { 
            error: "Customer with this AFM already exists",
            details: `A customer named "${existingCustomer.name}" with AFM ${afm} already exists in the system.`
          },
          { status: 409 }
        );
      }
    }

    // Create customer in database
    const customer = await prisma.customer.create({
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
        isactive: isactive === "1" || isactive === true ? CustomerActiveStatus.ACTIVE : CustomerActiveStatus.INACTIVE,
        phone01,
        phone02,
        email,
        emailacc,
        irsdata,
        socurrency: socurrency ? parseInt(socurrency) : null,
        erp: false, // Will be updated if sync is successful
      },
      include: {
        countryRel: true,
      },
    });

    // If syncToERP is true, create customer in SoftOne
    if (syncToERP) {
      try {
        const erpResponse = await fetch(
          "https://aic.oncloud.gr/s1services/JS/webservice.customers/createCustomer",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: process.env.SOFTONE_USERNAME || "Service",
              password: process.env.SOFTONE_PASSWORD || "Service",
              company: parseInt(process.env.SOFTONE_COMPANY || "1000"),
              code: code || "",
              sotitle: sotitle || "",
              jobtypetrd: jobtypetrd || "",
              name: name,
              afm: afm || "",
              isactive: isactive === "1" || isactive === true ? 1 : 0,
              country: country ? parseInt(country) : 1000,
              district: district || "",
              address: address || "",
              city: city || "",
              zip: zip || "",
              areas: 0,
              phone01: phone01 || "",
              phone02: phone02 || "",
              webpage: "",
              email: email || "",
              emailacc: emailacc || "",
            }),
          }
        );

        const erpData = await erpResponse.json();

        if (erpData.success && erpData.TRDR) {
          // Update customer with TRDR and set erp to true
          await prisma.customer.update({
            where: { id: customer.id },
            data: {
              trdr: erpData.TRDR,
              erp: true,
            },
          });

          return NextResponse.json({
            customer: {
              ...customer,
              trdr: erpData.TRDR,
              erp: true,
            },
            erpSync: true,
            erpData,
          });
        }
      } catch (erpError) {
        console.error("Error syncing to SoftOne ERP:", erpError);
        // Return customer even if ERP sync failed
        return NextResponse.json({
          customer,
          erpSync: false,
          error: "Customer created but ERP sync failed",
        });
      }
    }

    return NextResponse.json({ customer, erpSync: false });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}


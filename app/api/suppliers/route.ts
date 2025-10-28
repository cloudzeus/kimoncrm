import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SupplierActiveStatus } from "@prisma/client";

// GET all suppliers with pagination and search
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

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          countryRel: true,
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
        orderBy: { update: "desc" },
        skip,
        take: limit,
      }),
      prisma.supplier.count({ where }),
    ]);

    return NextResponse.json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// POST create new supplier
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
      const existingSupplier = await prisma.supplier.findUnique({
        where: { afm },
      });

      if (existingSupplier) {
        return NextResponse.json(
          { 
            error: "Supplier with this AFM already exists",
            details: `A supplier named "${existingSupplier.name}" with AFM ${afm} already exists in the system.`
          },
          { status: 409 }
        );
      }
    }

    // Create supplier in database
    const supplier = await prisma.supplier.create({
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
        isactive: isactive === "1" || isactive === true ? SupplierActiveStatus.ACTIVE : SupplierActiveStatus.INACTIVE,
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

    // If syncToERP is true, create supplier in SoftOne
    if (syncToERP) {
      try {
        const erpResponse = await fetch(
          "https://aic.oncloud.gr/s1services/JS/webservice.customers/createNewSupplier",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: process.env.SOFTONE_USERNAME || "Service",
              password: process.env.SOFTONE_PASSWORD || "Service",
              company: parseInt(process.env.SOFTONE_COMPANY || "1000"),
              
              // Required fields
              name: name,
              code: code || "",
              afm: afm || "",
              isactive: isactive === "1" || isactive === true ? 1 : 0,
              country: country ? parseInt(country) : 1000,
              socurrency: socurrency || 100,
              
              // Default required numeric fields
              vatsts: 1,
              kepyosts: 1,
              kepyomd: 1,
              gsismd: 1,
              cmpmode: 0,
              efkflag: 0,
              opitmode: 0,
              opitfindoc: 0,
              trdtype1: 0,
              inpayvat: 0,
              
              // Contact info
              sotitle: sotitle || name,
              address: address || "",
              zip: zip || "",
              district: district || "",
              city: city || "",
              areas: 0,
              phone01: phone01 || "",
              phone02: phone02 || "",
              fax: "",
              webpage: "",
              email: email || "",
              emailacc: emailacc || "",
              
              // Additional fields with defaults
              jobtype: 0,
              jobtypetrd: jobtypetrd || "",
              trdgroup: 0,
              trdpgroup: 0,
              shipment: 0,
              payment: 0,
              priority: 0,
              prcpolicy: 0,
              dscpolicy: 0,
              isvalcredit: 0,
              socarrier: 0,
              trucks: 0,
              routing: 0,
              salesman: 0,
              code1: "",
              irsdata: irsdata || "",
              receiptcard: "",
              glncode: "",
              numcg: "",
              cbearer: "SLEV",
              reltrdr: 0,
              costcntr: 0,
              remarks: "Created via API",
            }),
          }
        );

        const erpData = await erpResponse.json();

        if (erpData.success && erpData.TRDR) {
          // Update supplier with TRDR and set erp to true
          await prisma.supplier.update({
            where: { id: supplier.id },
            data: {
              trdr: erpData.TRDR,
              erp: true,
            },
          });

          return NextResponse.json({
            supplier: {
              ...supplier,
              trdr: erpData.TRDR,
              erp: true,
            },
            erpSync: true,
            erpData,
          });
        }
      } catch (erpError) {
        console.error("Error syncing to SoftOne ERP:", erpError);
        // Return supplier even if ERP sync failed
        return NextResponse.json({
          supplier,
          erpSync: false,
          error: "Supplier created but ERP sync failed",
        });
      }
    }

    return NextResponse.json({ supplier, erpSync: false });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Failed to create supplier" },
      { status: 500 }
    );
  }
}


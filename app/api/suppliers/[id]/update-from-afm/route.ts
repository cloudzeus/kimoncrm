import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { SupplierActiveStatus } from "@prisma/client";

/**
 * Update supplier details from Greek Tax Authority (AADE) API
 * PATCH /api/suppliers/[id]/update-from-afm
 * Only updates fields that come from the AFM validation API
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get supplier to find their AFM
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      select: { afm: true, name: true },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    if (!supplier.afm) {
      return NextResponse.json(
        { error: "Supplier has no AFM to validate" },
        { status: 400 }
      );
    }

    // Call Greek authorities VAT validation API
    const response = await fetch("https://vat.wwa.gr/afm2info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ afm: supplier.afm }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to validate AFM with Greek authorities" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check if we got valid data
    if (!data.basic_rec) {
      return NextResponse.json(
        { error: "Invalid response from Greek authorities", raw: data },
        { status: 400 }
      );
    }

    const basicRec = data.basic_rec;
    const firmAct = data.firm_act_tab?.item?.[0];

    // Helper function to check if value is null indicator from XML
    const isNullValue = (value: any): boolean => {
      return (
        !value ||
        (typeof value === "object" && value.$ && value.$.hasOwnProperty("xsi:nil"))
      );
    };

    // Helper to get string value or null
    const getStringValue = (value: any): string | null => {
      if (isNullValue(value)) return null;
      if (typeof value === "string") return value;
      return null;
    };

    // Prepare update data - only fields from AFM validation
    const updateData: any = {};

    const onomasia = getStringValue(basicRec.onomasia);
    if (onomasia) {
      updateData.name = onomasia;
    }

    const commerTitle = getStringValue(basicRec.commer_title);
    if (commerTitle) {
      updateData.sotitle = commerTitle;
    }

    const postalAddress = getStringValue(basicRec.postal_address);
    const postalAddressNo = getStringValue(basicRec.postal_address_no);
    if (postalAddress) {
      updateData.address = postalAddressNo
        ? `${postalAddress} ${postalAddressNo}`
        : postalAddress;
    }

    const postalZipCode = getStringValue(basicRec.postal_zip_code);
    if (postalZipCode) {
      updateData.zip = postalZipCode;
    }

    const postalAreaDescription = getStringValue(basicRec.postal_area_description);
    if (postalAreaDescription) {
      updateData.city = postalAreaDescription;
    }

    const doyDescr = getStringValue(basicRec.doy_descr);
    if (doyDescr) {
      updateData.irsdata = doyDescr;
    }

    const firmActDescr = getStringValue(firmAct?.firm_act_descr);
    if (firmActDescr) {
      updateData.jobtypetrd = firmActDescr;
    }

    if (basicRec.deactivation_flag) {
      updateData.isactive =
        basicRec.deactivation_flag === "1"
          ? SupplierActiveStatus.ACTIVE
          : SupplierActiveStatus.INACTIVE;
    }

    // Update supplier with validated data
    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
      include: {
        countryRel: true,
      },
    });

    return NextResponse.json({
      success: true,
      supplier: updatedSupplier,
      updatedFields: Object.keys(updateData),
      message: "Supplier updated successfully from Greek Tax Authority",
    });
  } catch (error) {
    console.error("Error updating supplier from AFM:", error);
    return NextResponse.json(
      { error: "Failed to update supplier from AFM" },
      { status: 500 }
    );
  }
}

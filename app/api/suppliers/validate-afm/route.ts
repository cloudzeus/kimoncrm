import { NextRequest, NextResponse } from "next/server";

/**
 * Validate AFM and get company details from Greek Tax Authority (AADE) API
 * POST /api/suppliers/validate-afm
 * Used when creating new suppliers to pre-fill form data
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { afm } = body;

    if (!afm) {
      return NextResponse.json(
        { error: "AFM is required" },
        { status: 400 }
      );
    }

    // Call Greek authorities VAT validation API
    const response = await fetch("https://vat.wwa.gr/afm2info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ afm }),
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
        { 
          error: "Invalid AFM or no data found", 
          details: "The Greek Tax Authority did not return valid information for this AFM"
        },
        { status: 404 }
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

    // Extract data from response
    const supplierData = {
      code: afm, // Use AFM as code
      afm,
      name: getStringValue(basicRec.onomasia),
      sotitle: getStringValue(basicRec.commer_title),
      address: (() => {
        const postalAddress = getStringValue(basicRec.postal_address);
        const postalAddressNo = getStringValue(basicRec.postal_address_no);
        if (!postalAddress) return null;
        return postalAddressNo ? `${postalAddress} ${postalAddressNo}` : postalAddress;
      })(),
      zip: getStringValue(basicRec.postal_zip_code),
      city: getStringValue(basicRec.postal_area_description),
      irsdata: getStringValue(basicRec.doy_descr),
      jobtypetrd: getStringValue(firmAct?.firm_act_descr),
      isactive: basicRec.deactivation_flag === "1" ? "ACTIVE" : "INACTIVE",
    };

    return NextResponse.json({
      success: true,
      data: supplierData,
      message: "AFM validated successfully",
    });
  } catch (error: any) {
    console.error("Error validating AFM:", error);
    return NextResponse.json(
      { error: "Failed to validate AFM", details: error.message },
      { status: 500 }
    );
  }
}


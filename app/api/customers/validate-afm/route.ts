import { NextRequest, NextResponse } from "next/server";

/**
 * Validate Greek AFM (VAT number) with Greek authorities
 * POST /api/customers/validate-afm
 * Body: { afm: "801946016" }
 */
export async function POST(req: NextRequest) {
  try {
    const { afm } = await req.json();

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

    // Map the response to our customer fields
    if (data.basic_rec) {
      const basicRec = data.basic_rec;
      const firmAct = data.firm_act_tab?.item?.[0];

      // Helper function to check if value is null indicator from XML
      const isNullValue = (value: any): boolean => {
        return (
          !value ||
          (typeof value === "object" && value.$ && value.$.hasOwnProperty("xsi:nil"))
        );
      };

      // Helper to get string value or empty string
      const getStringValue = (value: any): string => {
        if (isNullValue(value)) return "";
        if (typeof value === "string") return value;
        return "";
      };

      const postalAddress = getStringValue(basicRec.postal_address);
      const postalAddressNo = getStringValue(basicRec.postal_address_no);

      const mappedData = {
        afm: getStringValue(basicRec.afm),
        irsdata: getStringValue(basicRec.doy_descr),
        name: getStringValue(basicRec.onomasia),
        sotitle: getStringValue(basicRec.commer_title),
        address: postalAddress && postalAddressNo
          ? `${postalAddress} ${postalAddressNo}`
          : postalAddress,
        zip: getStringValue(basicRec.postal_zip_code),
        city: getStringValue(basicRec.postal_area_description),
        jobtypetrd: getStringValue(firmAct?.firm_act_descr),
        isactive: basicRec.deactivation_flag === "1" ? "1" : "0",
      };

      return NextResponse.json({
        success: true,
        data: mappedData,
        raw: data,
      });
    }

    return NextResponse.json({
      success: false,
      error: "Invalid response from Greek authorities",
      raw: data,
    });
  } catch (error) {
    console.error("Error validating AFM:", error);
    return NextResponse.json(
      { error: "Failed to validate AFM" },
      { status: 500 }
    );
  }
}


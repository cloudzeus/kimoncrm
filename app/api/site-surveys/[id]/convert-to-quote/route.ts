import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { SurveyStage } from "@prisma/client";
import iconv from "iconv-lite";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER", "EMPLOYEE"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { comments, series } = body;

    // Verify site survey exists and get all data
    const siteSurvey = await prisma.siteSurvey.findUnique({
      where: { id },
      include: {
        lead: {
          include: {
            customer: true,
          },
        },
        customer: true,
        proposedProductAssociations: {
          include: {
            product: true,
            service: true,
          },
        },
      },
    });

    if (!siteSurvey) {
      return NextResponse.json(
        { error: "Site survey not found" },
        { status: 404 }
      );
    }

    // Check if stage is DOCUMENTS_READY
    if (siteSurvey.stage !== SurveyStage.DOCUMENTS_READY) {
      return NextResponse.json(
        { error: "Site survey must be in DOCUMENTS_READY stage to convert to quote" },
        { status: 400 }
      );
    }

    // Get customer's TRDR code
    const customer = siteSurvey.customer;
    if (!customer || !customer.trdr) {
      return NextResponse.json(
        { error: "Customer does not have a TRDR code in ERP" },
        { status: 400 }
      );
    }

    // Get TRDR as number
    const trdr = customer.trdr;

    // Prepare product lines for ERP
    const mtrlLines = siteSurvey.proposedProductAssociations
      .filter((item) => {
        // Only include items with product MTRL or service MTRL
        return item.product?.mtrl || item.service?.mtrl;
      })
      .map((item) => {
        const mtrl = item.product?.mtrl || item.service?.mtrl;
        const qty = item.quantity || 1;
        const price = item.unitPrice || 0;

        return {
          MTRL: mtrl,
          QTY1: qty,
          PRICE: parseFloat(price.toString()),
        };
      });

    if (mtrlLines.length === 0) {
      return NextResponse.json(
        { error: "No products or services with MTRL codes found in site survey" },
        { status: 400 }
      );
    }

    // Prepare ERP request payload
    const erpPayload = {
      username: "Service",
      password: "Service",
      SERIES: series || "7001",
      TRDR: trdr.toString(),
      COMMENTS: comments || "Quote generated from site survey in CRM",
      MTRLINES: mtrlLines,
    };

    console.log("📤 ERP Request:", JSON.stringify(erpPayload, null, 2));

    // Call ERP getOrderDoc endpoint
    const erpUrl = "https://aic.oncloud.gr/s1services/JS/webservice.utilities/getOrderDoc";
    
    const erpResponse = await fetch(erpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(erpPayload),
    });

    if (!erpResponse.ok) {
      const errorText = await erpResponse.text();
      console.error("ERP Error Response:", errorText);
      throw new Error(`ERP request failed: ${erpResponse.status} ${errorText}`);
    }

    // Decode response from ANSI 1253 to UTF-8
    const arrayBuffer = await erpResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const decodedText = iconv.decode(buffer, "win1253");
    const erpData = JSON.parse(decodedText);

    console.log("📥 ERP Response:", JSON.stringify(erpData, null, 2));

    if (!erpData.success) {
      return NextResponse.json(
        { error: "ERP error", details: erpData.error },
        { status: 400 }
      );
    }

    // Store ERP response data in site survey
    const updatedSurvey = await prisma.siteSurvey.update({
      where: { id },
      data: {
        erpOrderNumber: erpData.SALDOCNUM?.toString(),
        erpSeries: erpData.SERIES?.toString(),
        erpSeriesNum: erpData.SERIESNUM?.toString(),
        erpFinCode: erpData.FINCODE,
        erpTurnover: erpData.TURNOVR ? parseFloat(erpData.TURNOVR.toString()) : null,
        erpVatAmount: erpData.VATAMNT ? parseFloat(erpData.VATAMNT.toString()) : null,
      },
      include: {
        lead: true,
        customer: true,
        contact: true,
      },
    });

    // Update lead stage to QUOTE_SENT
    if (siteSurvey.leadId) {
      await prisma.lead.update({
        where: { id: siteSurvey.leadId },
        data: { stage: "QUOTE_SENT" as any },
      });
    }

    // Create a quote record in the database
    const quote = await prisma.quote.create({
      data: {
        quoteNo: erpData.FINCODE,
        status: "Sent",
        currency: "EUR",
        subtotal: erpData.TURNOVR ? parseFloat(erpData.TURNOVR.toString()) : null,
        vatTotal: erpData.VATAMNT ? parseFloat(erpData.VATAMNT.toString()) : null,
        total: erpData.TURNOVR ? parseFloat((parseFloat(erpData.TURNOVR.toString()) + parseFloat(erpData.VATAMNT.toString())).toFixed(2)) : null,
        leadId: siteSurvey.leadId || undefined,
        contactId: siteSurvey.contactId || undefined,
        softoneId: erpData.SALDOCNUM?.toString(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Create quote items from product associations
    const quoteItems = await Promise.all(
      siteSurvey.proposedProductAssociations
        .filter((item) => item.product || item.service)
        .map(async (item) => {
          const product = item.product;
          const service = item.service;
          const name = product?.name || service?.name || "Item";
          const description = product?.name || service?.name || "";
          const qty = item.quantity || 1;
          const price = item.unitPrice || 0;
          const totalPrice = parseFloat((qty * price).toFixed(2));

          return await prisma.quoteItem.create({
            data: {
              quoteId: quote.id,
              productId: item.productId || undefined,
              name: name,
              description: description,
              qty: qty,
              price: price,
              vatRateId: undefined, // You may want to set this based on product
              lineTotal: totalPrice,
              unitId: product?.unitId || undefined,
            },
          });
        })
    );

    // Update quote with total recalculations
    const finalSubtotal = quoteItems.reduce((sum, item) => sum + parseFloat(item.lineTotal.toString()), 0);
    const finalVatTotal = 0; // Calculate based on VAT rates
    const finalTotal = finalSubtotal + finalVatTotal;

    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        subtotal: finalSubtotal,
        vatTotal: finalVatTotal,
        total: finalTotal,
      },
    });

    return NextResponse.json({
      success: true,
      siteSurvey: updatedSurvey,
      erpResponse: erpData,
      quote: {
        ...quote,
        subtotal: finalSubtotal,
        vatTotal: finalVatTotal,
        total: finalTotal,
      },
      quoteItems,
    });
  } catch (error: any) {
    console.error("Error converting site survey to quote:", error);
    return NextResponse.json(
      { error: "Failed to convert site survey to quote", details: error.message },
      { status: 500 }
    );
  }
}


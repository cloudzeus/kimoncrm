import { NextRequest, NextResponse } from "next/server";
import { bunnyPut } from "@/lib/bunny/upload";
import { randomBytes } from "crypto";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string; // building, floor, rack, room
    const entityId = formData.get("entityId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if it's a PDF - don't process PDFs
    if (file.type === "application/pdf") {
      const randomId = randomBytes(8).toString("hex");
      const timestamp = Date.now();
      const fileName = `cabling/${entityType}/${entityId}/${timestamp}-${randomId}.pdf`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { url } = await bunnyPut(fileName, buffer);

      return NextResponse.json({
        success: true,
        url,
        fileName,
      });
    }

    // Validate image file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only images and PDFs are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum 10MB allowed." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Process image: resize to max 1280x1280 and convert to WebP
    const processedBuffer = await sharp(inputBuffer)
      .resize(1280, 1280, {
        fit: 'inside', // Maintain aspect ratio, fit within 1280x1280
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({
        quality: 95,
        alphaQuality: 100, // Preserve transparency
      })
      .toBuffer();

    // Generate unique filename
    const randomId = randomBytes(8).toString("hex");
    const timestamp = Date.now();
    const fileName = `cabling/${entityType}/${entityId}/${timestamp}-${randomId}.webp`;

    // Upload to BunnyCDN
    const { url } = await bunnyPut(fileName, processedBuffer);

    return NextResponse.json({
      success: true,
      url,
      fileName,
    });
  } catch (error) {
    console.error("Error uploading cabling image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}


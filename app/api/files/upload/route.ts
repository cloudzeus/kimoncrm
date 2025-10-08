import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { bunnyPut } from "@/lib/bunny/upload";
import fetch from "node-fetch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const folder = (form.get("folder") as string | null) || "uploads";

    if (!file) return new NextResponse("File is required", { status: 400 });

    const arrayBuf = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuf);

    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    const safeFolder = folder.replace(/[^a-zA-Z0-9\/_-]/g, "");
    let finalExt = ext;
    // Claid AI background removal for non-SVG images
    if (ext !== 'svg' && process.env.CLAID_API_KEY) {
      try {
        const resClaid = await fetch('https://api.claid.ai/v1/image/edit/remove-background', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLAID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: `data:${file.type};base64,${buffer.toString('base64')}`,
            output_format: 'webp',
            output_background: 'transparent',
          }),
        });
        if (resClaid.ok) {
          const json: any = await resClaid.json();
          if (json?.image_base64) {
            buffer = Buffer.from(json.image_base64, 'base64');
            finalExt = 'webp';
          }
        }
      } catch {}
    }

    const path = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${finalExt}`;

    const { url } = await bunnyPut(path, buffer);

    const fileRef = await prisma.fileRef.create({
      data: {
        name: file.name,
        url,
        driveProv: "bunny",
        driveId: path,
        fileType: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "document",
      },
      select: { id: true, url: true },
    });

    return NextResponse.json(fileRef);
  } catch (e) {
    return new NextResponse("Upload failed", { status: 500 });
  }
}



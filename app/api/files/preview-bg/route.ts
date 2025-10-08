import { NextResponse } from "next/server";
import fetch from "node-fetch";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return new NextResponse("File required", { status: 400 });

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (ext === 'svg') {
      const buf = Buffer.from(await file.arrayBuffer());
      const b64 = `data:${file.type};base64,${buf.toString('base64')}`;
      return NextResponse.json({ original: b64, processed: b64, skipped: true });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const original = `data:${file.type};base64,${buf.toString('base64')}`;

    if (!process.env.CLAID_API_KEY) {
      return NextResponse.json({ original, processed: original, skipped: true });
    }

    const res = await fetch('https://api.claid.ai/v1/image/edit/remove-background', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLAID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: original,
        output_format: 'webp',
        output_background: 'transparent',
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ original, processed: original, skipped: true });
    }

    const data: any = await res.json();
    const processed = data?.image_base64 ? `data:image/webp;base64,${data.image_base64}` : original;
    return NextResponse.json({ original, processed, skipped: false });
  } catch (e) {
    return new NextResponse("Preview failed", { status: 500 });
  }
}



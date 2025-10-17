// @ts-nocheck
import fetch from "node-fetch";
import { Readable } from "stream";

function buildStorageUrl(path: string, useRegionHost: boolean): string {
  const zone = process.env.BUNNY_STORAGE_ZONE!;
  // Prefer explicit host if provided (e.g., storage.bunnycdn.com)
  const explicitHost = process.env.BUNNY_HOST_NAME;
  if (explicitHost) {
    return `https://${explicitHost}/${zone}/${path.replace(/^\/+/, "")}`;
  }
  const region = process.env.BUNNY_STORAGE_REGION || "";
  const host = useRegionHost && region ? `${region}.storage.bunnycdn.com` : `storage.bunnycdn.com`;
  return `https://${host}/${zone}/${path.replace(/^\/+/, "")}`;
}

async function fetchWithFallback(input: string, init: any): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (e: any) {
    // Retry without region host if DNS fails
    if (input.includes('.storage.bunnycdn.com')) {
      const withoutRegion = input.replace(/^https:\/\/[^.]+\.storage\.bunnycdn\.com\//, 'https://storage.bunnycdn.com/');
      return await fetch(withoutRegion, init);
    }
    throw e;
  }
}

export async function bunnyPut(path: string, data: Buffer | ReadableStream<any> | Readable): Promise<{ url: string }> {
  const key = process.env.BUNNY_ACCESS_KEY!;
  const cdnPull = process.env.BUNNY_CDN_PULL_ZONE!;
  const url = buildStorageUrl(path, true);

  const res = await fetchWithFallback(url, {
    method: "PUT",
    headers: {
      AccessKey: key,
      'Content-Type': 'application/octet-stream',
    },
    body: data as any,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Bunny PUT failed: ${res.status} ${errorText}`);
  }

  return { url: `https://${cdnPull}/${path}` };
}

export async function bunnyDelete(path: string): Promise<void> {
  const key = process.env.BUNNY_ACCESS_KEY!;
  const url = buildStorageUrl(path, true);

  const res = await fetchWithFallback(url, {
    method: "DELETE",
    headers: { AccessKey: key },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Bunny DELETE failed: ${res.status} ${errorText}`);
  }
}

export async function bunnyGet(path: string): Promise<Buffer> {
  const key = process.env.BUNNY_ACCESS_KEY!;
  const url = buildStorageUrl(path, true);

  const res = await fetchWithFallback(url, {
    method: "GET",
    headers: { AccessKey: key },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Bunny GET failed: ${res.status} ${errorText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

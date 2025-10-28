import axios from "axios";
import iconv from "iconv-lite";
import { prisma } from "@/lib/db/prisma";

export async function softoneCall(method: string, payload: any): Promise<any> {
  const ep = await prisma.softoneEndpoint.findUnique({ where: { method } });
  if (!ep) throw new Error(`SoftOne endpoint not configured: ${method}`);
  
  const res = await axios.post(ep.url, payload, { 
    responseType: "arraybuffer",
    auth: {
      username: process.env.SOFTONE_USERNAME!,
      password: process.env.SOFTONE_PASSWORD!,
    },
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  // Convert ANSI-1253 to UTF-8
  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

export async function getCustomers(): Promise<any[]> {
  return softoneCall("getCustomers", {});
}

export async function getProducts(): Promise<any[]> {
  return softoneCall("getProducts", {});
}

export async function insertQuote(quoteData: any): Promise<any> {
  return softoneCall("insertQuote", quoteData);
}

export async function insertOrder(orderData: any): Promise<any> {
  return softoneCall("insertOrder", orderData);
}

export async function getInventory(): Promise<any[]> {
  return softoneCall("getInventory", {});
}

export async function updateInventory(inventoryData: any): Promise<any> {
  return softoneCall("updateInventory", inventoryData);
}

export async function updateMtrMark(payload: {
  username?: string;
  password?: string;
  company: number;
  sodtype: number;
  mtrmark: string;
  name: string;
}): Promise<any> {
  const url =
    (await prisma.softoneEndpoint.findUnique({ where: { method: "updateMtrMark" } }))?.url ||
    "https://aic.oncloud.gr/s1services/JS/webservice.mtrmark/updateMtrMark";

  const res = await axios.post(
    url,
    {
      username: payload.username ?? process.env.SOFTONE_USERNAME ?? "Service",
      password: payload.password ?? process.env.SOFTONE_PASSWORD ?? "Service",
      company: payload.company,
      sodtype: payload.sodtype,
      mtrmark: payload.mtrmark,
      name: payload.name,
    },
    {
      responseType: "arraybuffer",
      headers: { "Content-Type": "application/json" },
    }
  );

  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

export async function getMtrCategory(): Promise<any> {
  // Prefer dynamic endpoint if configured; fallback to provided URL
  const ep = await prisma.softoneEndpoint.findUnique({ where: { method: "getMtrCategory" } });
  const url = ep?.url || "https://aic.oncloud.gr/s1services/JS/webservice.mtrcategory/getMtrCategory";

  const res = await axios.post(
    url,
    {
      username: process.env.SOFTONE_USERNAME ?? "Service",
      password: process.env.SOFTONE_PASSWORD ?? "Service",
      company: 1000,
      sodtype: 51,
    },
    { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
  );
  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

export async function updateMtrCategory(payload: {
  mtrmark: string;
  name: string;
  company?: number;
  sodtype?: number;
  username?: string;
  password?: string;
}): Promise<any> {
  const ep = await prisma.softoneEndpoint.findUnique({ where: { method: "updateMtrCategory" } });
  const url = ep?.url || "https://aic.oncloud.gr/s1services/JS/webservice.mtrcategory/getMtrCategory";

  const res = await axios.post(
    url,
    {
      username: payload.username ?? process.env.SOFTONE_USERNAME ?? "Service",
      password: payload.password ?? process.env.SOFTONE_PASSWORD ?? "Service",
      company: payload.company ?? 1000,
      sodtype: payload.sodtype ?? 51,
      mtrmark: payload.mtrmark,
      name: payload.name,
    },
    { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
  );
  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

export async function getMtrUnit(): Promise<any> {
  const ep = await prisma.softoneEndpoint.findUnique({ where: { method: "getMtrUnit" } });
  const url = ep?.url || "https://aic.oncloud.gr/s1services/JS/webservice.mtrunit/getMtrUnit";

  const res = await axios.post(
    url,
    {
      username: process.env.SOFTONE_USERNAME ?? "Service",
      password: process.env.SOFTONE_PASSWORD ?? "Service",
      company: 1000,
    },
    { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
  );
  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

export async function updateMtrUnit(payload: {
  mtrunit: string;
  name: string;
  company?: number;
  username?: string;
  password?: string;
}): Promise<any> {
  const ep = await prisma.softoneEndpoint.findUnique({ where: { method: "updateMtrUnit" } });
  const url = ep?.url || "https://aic.oncloud.gr/s1services/JS/webservice.mtrunit/updateMtrUnit";

  const res = await axios.post(
    url,
    {
      username: payload.username ?? process.env.SOFTONE_USERNAME ?? "Service",
      password: payload.password ?? process.env.SOFTONE_PASSWORD ?? "Service",
      company: payload.company ?? 1000,
      mtrunit: payload.mtrunit,
      name: payload.name,
    },
    { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
  );
  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

export async function getMtrGroup(sodtype: number = 51): Promise<any> {
  const ep = await prisma.softoneEndpoint.findUnique({ where: { method: "getMtrGroup" } });
  const url = ep?.url || "https://aic.oncloud.gr/s1services/JS/webservice.utilities/getMtrgroup";

  const res = await axios.post(
    url,
    {
      username: process.env.SOFTONE_USERNAME ?? "Service",
      password: process.env.SOFTONE_PASSWORD ?? "Service",
      sodtype: sodtype,
    },
    { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
  );
  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

export async function addMtrGroup(payload: {
  mtrgroup: string;
  name: string;
  code: string;
  isactive?: number;
  sodtype?: number;
  company?: number;
  username?: string;
  password?: string;
}): Promise<any> {
  const ep = await prisma.softoneEndpoint.findUnique({ where: { method: "addMtrGroup" } });
  const url = ep?.url || "https://aic.oncloud.gr/s1services/JS/webservice.utilities/addMtrgroup";

  const res = await axios.post(
    url,
    {
      username: payload.username ?? process.env.SOFTONE_USERNAME ?? "Service",
      password: payload.password ?? process.env.SOFTONE_PASSWORD ?? "Service",
      sodtype: payload.sodtype ?? 51,
      mtrgroup: payload.mtrgroup,
      name: payload.name,
      code: payload.code,
      isactive: payload.isactive ?? 0,
      company: payload.company ?? 1000,
    },
    { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
  );
  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

export async function updateMtrGroup(payload: {
  mtrgroup: string;
  name: string;
  sodtype?: number;
  username?: string;
  password?: string;
}): Promise<any> {
  const ep = await prisma.softoneEndpoint.findUnique({ where: { method: "updateMtrGroup" } });
  const url = ep?.url || "https://aic.oncloud.gr/s1services/JS/webservice.utilities/putMtrgroup";

  const res = await axios.post(
    url,
    {
      username: payload.username ?? process.env.SOFTONE_USERNAME ?? "Service",
      password: payload.password ?? process.env.SOFTONE_PASSWORD ?? "Service",
      sodtype: payload.sodtype ?? 51,
      mtrgroup: payload.mtrgroup,
      name: payload.name,
    },
    { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
  );
  const txt = iconv.decode(Buffer.from(res.data), "win1253");
  return JSON.parse(txt);
}

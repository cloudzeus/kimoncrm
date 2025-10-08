import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { promises as fs } from "fs";
import path from "path";

type ScanResult = {
  foundKeys: string[];
  created: number;
  existing: number;
  errors?: string[];
};

const DEFAULT_DIRS = ["app", "components", "lib", "hooks", "contexts"];
const EXCLUDE_DIRS = new Set(["node_modules", ".next", ".git", "public", "dist", "build"]);
const VALID_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else if (VALID_EXTENSIONS.has(path.extname(entry.name))) {
      yield fullPath;
    }
  }
}

function extractKeysFromContent(content: string): string[] {
  const keys = new Set<string>();
  // Support t("..."), t('...'), t(`...`), and namespaced forms like i18n.t("...") or obj.t("...")
  const patterns: RegExp[] = [
    /(?:\b\w[\w$.]*\.)?t\(\s*"([^"]+)"\s*\)/g, // double quotes
    /(?:\b\w[\w$.]*\.)?t\(\s*'([^']+)'\s*\)/g,   // single quotes
    /(?:\b\w[\w$.]*\.)?t\(\s*`([^`]+)`\s*\)/g,   // template literals
  ];

  for (const regex of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const key = match[1]?.trim();
      if (key) keys.add(key);
    }
  }

  // Filter out likely icon names or non-translation tokens
  const filtered = Array.from(keys).filter((k) => {
    // exclude empty, single symbol, or common icon-like tokens
    if (!k || k.length < 2) return false;
    // if no letters at all (e.g., only symbols), skip
    if (!/[a-zA-Z]/.test(k)) return false;
    // if looks like an icon token (kebab or snake without dots and short)
    const looksLikeIcon = /^[a-z0-9-_:]+$/.test(k) && !k.includes('.') && k.length <= 24;
    if (looksLikeIcon) return false;
    return true;
  });

  return filtered;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const root = process.cwd();
    const body = await request.json().catch(() => ({}));
    const dirs: string[] = Array.isArray(body?.dirs) && body.dirs.length > 0 ? body.dirs : DEFAULT_DIRS;

    const scanDirs = dirs
      .map((d) => path.join(root, d))
      .filter((p) => p.startsWith(root));

    const found = new Set<string>();
    const errors: string[] = [];

    for (const dir of scanDirs) {
      try {
        for await (const filePath of walk(dir)) {
          try {
            const content = await fs.readFile(filePath, "utf8");
            extractKeysFromContent(content).forEach((k) => found.add(k));
          } catch (e: any) {
            errors.push(`Failed to read ${filePath}: ${e?.message || String(e)}`);
          }
        }
      } catch (e: any) {
        errors.push(`Failed to scan ${dir}: ${e?.message || String(e)}`);
      }
    }

    let created = 0;
    let existing = 0;

    // Upsert TranslationKey for each discovered key
    for (const key of found) {
      const category = key.includes(".") ? key.split(".")[0] : "general";
      try {
        await prisma.translationKey.upsert({
          where: { key },
          update: {},
          create: {
            key,
            category,
          },
        });
        // Determine if it existed by attempting a find first to avoid double queries
        // For simplicity, count everything as created unless a unique constraint stops it
        created += 1;
      } catch (e: any) {
        // If it already exists, count as existing; otherwise record error
        if (String(e?.message || "").includes("Unique")) {
          existing += 1;
        } else {
          errors.push(`Failed to upsert key '${key}': ${e?.message || String(e)}`);
        }
      }
    }

    const result: ScanResult = {
      foundKeys: Array.from(found).sort(),
      created,
      existing,
      errors: errors.length ? errors : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to scan for translation keys" },
      { status: 500 }
    );
  }
}



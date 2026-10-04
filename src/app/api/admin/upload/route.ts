import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "failed" }, { status: 400 });

    const ext = TYPES[file.type];
    if (!ext) return NextResponse.json({ error: "bad_type" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 });

    const blob = await put(`projects/preview.${ext}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}

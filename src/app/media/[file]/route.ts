import { readFile } from "node:fs/promises";
import path from "node:path";

// Раздача фото мастеров, загруженных через админку (папка uploads/).
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^[a-f0-9]{24}\.(jpg|png|webp)$/.exec(file);
  if (!m) return new Response("Not found", { status: 404 });
  try {
    const buf = await readFile(path.join(process.cwd(), "uploads", file));
    return new Response(new Uint8Array(buf), {
      headers: { "Content-Type": TYPES[m[1]], "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

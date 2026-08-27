import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title") || "Restaurant operations, connected.";
  const eyebrow = request.nextUrl.searchParams.get("eyebrow") || "Servora";
  return new ImageResponse(
    <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#ffffff", color: "#111827" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#2563eb" }}>{eyebrow}</div>
      <div style={{ marginTop: 24, fontSize: 64, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
      <div style={{ marginTop: 32, fontSize: 28, color: "#6b7280" }}>Servora — restaurant operations, connected.</div>
    </div>,
    { width: 1200, height: 630 },
  );
}

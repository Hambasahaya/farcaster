import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : req.headers.get("host")
      ? `https://${req.headers.get("host")}`
      : "http://localhost:3000"

  // Return mini app manifest
  const manifest = {
    name: "CLENXI Game",
    description: "Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral!",
    icon: `${baseUrl}/logo.png`,
    url: baseUrl,
    version: "1.0.0",
    author: {
      name: "CLENXI Team",
      url: baseUrl,
    },
    categories: ["games", "defi", "social"],
    screenshots: [`${baseUrl}/logo.png`],
    permissions: ["identity", "storage"],
    frame: {
      enabled: true,
      url: `${baseUrl}/api/frame`,
    },
  }

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  })
}

import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : req.headers.get("host")
      ? `https://${req.headers.get("host")}`
      : "http://localhost:3000"

  const config = {
    name: "Clenxi",
    description: "Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral! Community-driven Web3 project.",
    icon: `${baseUrl}/logo.png`,
    url: baseUrl,
    version: "1.0.0",
    author: {
      name: "Clenxi",
      username: "clenix.eth",
      farcaster: "https://farcaster.xyz/clenix.eth",
      website: "https://paragraph.com/@clenix/what-is-clenix",
    },
    categories: ["games", "defi", "social"],
    permissions: ["identity", "storage", "wallet"],
    frame: {
      enabled: true,
      url: `${baseUrl}/api/frame`,
    },
    miniapp: {
      enabled: true,
      entrypoint: baseUrl,
      manifest: `${baseUrl}/manifest.json`,
    },
    social: {
      farcaster: "https://farcaster.xyz/clenix.eth",
      website: "https://paragraph.com/@clenix/what-is-clenix",
    },
  }

  return NextResponse.json(config, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

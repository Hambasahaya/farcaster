import { type NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}` 
    : req.headers.get("host")
      ? `https://${req.headers.get("host")}` 
      : "http://localhost:3000";

  // Get referral code from query params if present
  const url = new URL(req.url);
  const refCode = url.searchParams.get("ref");

  // Create target URL with referral code if present
  const targetUrl = refCode
    ? `${baseUrl}?ref=${refCode}`
    : baseUrl;

  return NextResponse.json(
    {
      version: "v0.2",
      title: "Clenxi",
      image: `${baseUrl}/logo.png`,
      buttons: [
        {
          label: "🎮 Play Clenxi",
          action: "post",
          target: `${baseUrl}/api/frame-action`,
        },
      ],
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=0, s-maxage=60, stale-while-revalidate",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract referral code from the frame data if present
    let refCode = null;
    try {
      if (body.untrustedData && body.untrustedData.fid) {
        // Generate a referral code from the user's FID
        const fid = body.untrustedData.fid;
        refCode = `FC${fid}`;
      }
    } catch (e) {
      console.error("Error extracting frame data:", e);
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` 
      : req.headers.get("host")
        ? `https://${req.headers.get("host")}` 
        : "http://localhost:3000";

    // Create target URL with referral code if present
    const targetUrl = refCode
      ? `${baseUrl}?ref=${refCode}`
      : baseUrl;

    return NextResponse.json(
      {
        version: "v0.2",
        title: "Redirecting to Clenxi Game...",
        image: `${baseUrl}/logo.png`,
        buttons: [
          {
            label: "🎮 Play Now & Get 5000 $CLENXI",
            action: "link",
            target: targetUrl,
          },
        ],
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "max-age=0, s-maxage=60, stale-while-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error processing frame action:", error);

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` 
      : req.headers.get("host")
        ? `https://${req.headers.get("host")}` 
        : "http://localhost:3000";

    return NextResponse.redirect(baseUrl, 302);
  }
}
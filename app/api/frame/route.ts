import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : req.headers.get("host")
      ? `https://${req.headers.get("host")}`
      : "http://localhost:3000"

  // Get referral code from query params if present
  const url = new URL(req.url)
  const refCode = url.searchParams.get("ref")

  // Create target URL with referral code if present
  const targetUrl = refCode ? `${baseUrl}?ref=${refCode}` : baseUrl

  return new NextResponse(
    `<!DOCTYPE html>
<html>
  <head>
    <title>Clenxi</title>
    <meta property="og:title" content="Clenxi - Daily Claim & Referral" />
    <meta property="og:description" content="Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral! Community-driven Web3 project." />
    <meta property="og:image" content="${baseUrl}/logo.png" />
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/logo.png" />
    <meta property="fc:frame:button:1" content="🎮 Play Clenxi" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${targetUrl}" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/frame" />
  </head>
  <body>
    <h1>Clenxi</h1>
    <p>Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral!</p>
    <p>Community-driven Web3 project by @clenix.eth</p>
    <a href="${targetUrl}">Play Now</a>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "max-age=0",
      },
    },
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Extract referral code from the frame data if present
    let refCode = null
    try {
      if (body.untrustedData && body.untrustedData.fid) {
        // Generate a referral code from the user's FID
        const fid = body.untrustedData.fid
        refCode = `FC${fid}`
      }
    } catch (e) {
      console.error("Error extracting frame data:", e)
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : req.headers.get("host")
        ? `https://${req.headers.get("host")}`
        : "http://localhost:3000"

    // Create target URL with referral code if present
    const targetUrl = refCode ? `${baseUrl}?ref=${refCode}` : baseUrl

    // Return a frame response with a redirect button
    return new NextResponse(
      `<!DOCTYPE html>
<html>
  <head>
    <title>Clenxi</title>
    <meta property="og:title" content="Clenxi - Daily Claim & Referral" />
    <meta property="og:description" content="Daily claim 1000 $CLENXI and get 5000 $CLENXI per friend referral! Community-driven Web3 project." />
    <meta property="og:image" content="${baseUrl}/logo.png" />
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/logo.png" />
    <meta property="fc:frame:button:1" content="🎮 Play Now & Get 5000 $CLENXI" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${targetUrl}" />
  </head>
  <body>
    <script>
      window.location.href = "${targetUrl}";
    </script>
    <h1>Redirecting to Clenxi Game...</h1>
    <p>If you are not redirected, <a href="${targetUrl}">click here</a>.</p>
  </body>
</html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "max-age=0",
        },
      },
    )
  } catch (error) {
    console.error("Error processing frame action:", error)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : req.headers.get("host")
        ? `https://${req.headers.get("host")}`
        : "http://localhost:3000"

    return NextResponse.redirect(baseUrl, 302)
  }
}

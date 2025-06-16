// /app/api/frame/referral/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fid = body?.untrustedData?.fid || "unknown"
    const referrerFid = body?.untrustedData?.inputText?.trim() || ""
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` 
      : req.headers.get("host")
        ? `https://${req.headers.get("host")}` 
        : "http://localhost:3000"

    const userStorageKey = `clenxi-game-data-fid-${fid}`
    const referrerStorageKey = `clenxi-game-data-fid-${referrerFid}`

    let userData = JSON.parse(localStorage.getItem(userStorageKey) || "{}")
    let referrerData = JSON.parse(localStorage.getItem(referrerStorageKey) || "{}")

    if (userData.hasUsedReferral) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
  <head>
    <meta property="og:title" content="Already Used Referral" />
    <meta property="og:description" content="You've already used a referral code." />
    <meta property="og:image" content="${baseUrl}/logo.png" />

    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/logo.png" />
    <meta property="fc:frame:button:1" content="🎮 Back to Game" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}" />
  </head>
  <body></body>
</html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        },
      )
    }

    // Update user
    userData.balance = (userData.balance || 0) + 5000
    userData.totalEarned = (userData.totalEarned || 0) + 5000
    userData.referralCount = (userData.referralCount || 0)
    userData.hasUsedReferral = true

    // Update referrer
    referrerData.balance = (referrerData.balance || 0) + 5000
    referrerData.totalEarned = (referrerData.totalEarned || 0) + 5000
    referrerData.referralCount = (referrerData.referralCount || 0) + 1

    localStorage.setItem(userStorageKey, JSON.stringify(userData))
    localStorage.setItem(referrerStorageKey, JSON.stringify(referrerData))

    return new NextResponse(
      `<!DOCTYPE html>
<html>
  <head>
    <meta property="og:title" content="Referral Bonus Activated!" />
    <meta property="og:description" content="You and your friend earned 5000 $CLENXI!" />
    <meta property="og:image" content="${baseUrl}/api/frame/referral/image?fid=${fid}&referrer=${referrerFid}" />
    
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/frame/referral/image?fid=${fid}&referrer=${referrerFid}" />
    <meta property="fc:frame:button:1" content="🎮 Back to Game" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}" />
  </head>
  <body>
    <script>
      window.location.href = "${baseUrl}?ref=FC${referrerFid}"
    </script>
  </body>
</html>`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      },
    )
  } catch (error) {
    console.error("Error in /api/frame/referral:", error)
    return NextResponse.redirect("/", 302)
  }
}
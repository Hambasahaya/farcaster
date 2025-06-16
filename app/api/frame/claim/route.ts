// /app/api/frame/claim/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fid = body?.untrustedData?.fid || "unknown"
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` 
      : req.headers.get("host")
        ? `https://${req.headers.get("host")}` 
        : "http://localhost:3000"

    // Simulasi daily claim dengan localStorage (hanya untuk demo)
    const storageKey = `clenxi-game-data-fid-${fid}`
    const now = new Date().toISOString()
    let gameData = JSON.parse(localStorage.getItem(storageKey) || "{}")

    if (!gameData.lastClaim || new Date(now) - new Date(gameData.lastClaim) >= 86400000) {
      // Tambah balance jika bisa klaim
      gameData.balance = (gameData.balance || 0) + 1000
      gameData.totalEarned = (gameData.totalEarned || 0) + 1000
      gameData.lastClaim = now
      localStorage.setItem(storageKey, JSON.stringify(gameData))
    }

    return new NextResponse(
      `<!DOCTYPE html>
<html>
  <head>
    <meta property="og:title" content="Clenxi - Daily Claim Success!" />
    <meta property="og:description" content="You claimed 1000 $CLENXI successfully!" />
    <meta property="og:image" content="${baseUrl}/api/frame/claim/image?fid=${fid}" />
    
    <!-- Farcaster Frame -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/frame/claim/image?fid=${fid}" />
    <meta property="fc:frame:button:1" content="🎮 Back to Game" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${baseUrl}" />
  </head>
  <body>
    <script>
      window.location.href = "${baseUrl}"
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
    console.error("Error in /api/frame/claim:", error)
    return NextResponse.redirect("/", 302)
  }
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Gift, Users, Coins, Clock, Share2, Copy, Shield, Zap, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { WalletConnect } from "@/components/wallet-connect"
import { Leaderboard } from "@/components/leaderboard"
import { useFarcaster } from "@/components/farcaster-provider"

interface GameData {
  balance: number
  lastClaim: string | null
  referralCount: number
  totalEarned: number
  referralCode: string
  hasUsedReferral?: boolean
}

interface WalletInfo {
  address: string
  balance: string
  chainId: number
  chainName: string
}

export default function ClenxiGame() {
  const { user, isInFarcaster, isLoading } = useFarcaster()
  const [gameData, setGameData] = useState<GameData>({
    balance: 0,
    lastClaim: null,
    referralCount: 0,
    totalEarned: 0,
    referralCode: "",
    hasUsedReferral: false,
  })
  const [canClaim, setCanClaim] = useState(false)
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState("")
  const [wallet, setWallet] = useState<WalletInfo | null>(null)
  const [leaderboardKey, setLeaderboardKey] = useState(0)
  const [pendingReferralCode, setPendingReferralCode] = useState<string | null>(null)
  const { toast } = useToast()

  // Generate a referral code based on wallet address
  const generateReferralCode = (address: string) => {
    const addressBase = address.toLowerCase().replace("0x", "")
    const referralCode = addressBase.slice(0, 3) + addressBase.slice(-3)
    return referralCode.toUpperCase()
  }

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get("ref")
    if (refCode) {
      setPendingReferralCode(refCode)
      console.log("Found referral code in URL:", refCode)
    }
  }, [])

  // Handle referral when wallet connects and game data is loaded
  useEffect(() => {
    if (wallet && gameData.referralCode && pendingReferralCode && !gameData.hasUsedReferral) {
      console.log("Processing referral:", {
        pendingCode: pendingReferralCode,
        userCode: gameData.referralCode,
        hasUsedReferral: gameData.hasUsedReferral,
      })

      if (pendingReferralCode !== gameData.referralCode) {
        handleReferralJoin(pendingReferralCode)
        setPendingReferralCode(null)
      } else {
        toast({
          title: "Invalid Referral",
          description: "You cannot use your own referral code",
          variant: "destructive",
        })
        setPendingReferralCode(null)
      }
    }
  }, [wallet, gameData.referralCode, pendingReferralCode, gameData.hasUsedReferral])

  useEffect(() => {
    // Load wallet data
    const savedWallet = localStorage.getItem("connected-wallet")
    if (savedWallet) {
      const parsedWallet = JSON.parse(savedWallet)
      setWallet(parsedWallet)

      // Load game data specific to this wallet
      const savedData = localStorage.getItem(`clenxi-game-data-${parsedWallet.address}`)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setGameData({
          ...parsedData,
          hasUsedReferral: parsedData.hasUsedReferral || false,
        })
      } else {
        // Initialize with wallet-specific referral code
        const newGameData = {
          balance: 0,
          lastClaim: null,
          referralCount: 0,
          totalEarned: 0,
          referralCode: generateReferralCode(parsedWallet.address),
          hasUsedReferral: false,
        }
        setGameData(newGameData)
      }
    } else {
      // No wallet connected, load generic data if exists
      const savedData = localStorage.getItem("clenxi-game-data")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setGameData({
          ...parsedData,
          hasUsedReferral: parsedData.hasUsedReferral || false,
        })
      }
    }
  }, [])

  useEffect(() => {
    const checkClaimStatus = () => {
      if (!gameData.lastClaim) {
        setCanClaim(true)
        return
      }

      const lastClaimTime = new Date(gameData.lastClaim).getTime()
      const now = new Date().getTime()
      const timeDiff = now - lastClaimTime
      const hoursLeft = 24 - Math.floor(timeDiff / (1000 * 60 * 60))

      if (timeDiff >= 24 * 60 * 60 * 1000) {
        setCanClaim(true)
        setTimeUntilNextClaim("")
      } else {
        setCanClaim(false)
        const minutesLeft = 60 - Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeUntilNextClaim(`${hoursLeft}h ${minutesLeft}m`)
      }
    }

    checkClaimStatus()
    const interval = setInterval(checkClaimStatus, 60000)

    return () => clearInterval(interval)
  }, [gameData.lastClaim])

  const saveGameData = (newData: GameData) => {
    if (wallet) {
      localStorage.setItem(`clenxi-game-data-${wallet.address}`, JSON.stringify(newData))
    } else {
      localStorage.setItem("clenxi-game-data", JSON.stringify(newData))
    }
    setGameData(newData)
    setLeaderboardKey((prev) => prev + 1)
  }

  const handleWalletChange = (newWallet: WalletInfo | null) => {
    setWallet(newWallet)

    if (newWallet) {
      localStorage.setItem("connected-wallet", JSON.stringify(newWallet))

      const savedData = localStorage.getItem(`clenxi-game-data-${newWallet.address}`)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setGameData({
          ...parsedData,
          hasUsedReferral: parsedData.hasUsedReferral || false,
        })
      } else {
        const walletReferralCode = generateReferralCode(newWallet.address)
        const newGameData = {
          balance: 0,
          lastClaim: null,
          referralCount: 0,
          totalEarned: 0,
          referralCode: walletReferralCode,
          hasUsedReferral: false,
        }
        setGameData(newGameData)
        localStorage.setItem(`clenxi-game-data-${newWallet.address}`, JSON.stringify(newGameData))
      }
    } else {
      localStorage.removeItem("connected-wallet")

      const savedData = localStorage.getItem("clenxi-game-data")
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setGameData({
          ...parsedData,
          hasUsedReferral: parsedData.hasUsedReferral || false,
        })
      } else {
        setGameData({
          balance: 0,
          lastClaim: null,
          referralCount: 0,
          totalEarned: 0,
          referralCode: "",
          hasUsedReferral: false,
        })
      }
    }

    setLeaderboardKey((prev) => prev + 1)
  }

  const handleDailyClaim = () => {
    if (!canClaim || !wallet) return

    const newData = {
      ...gameData,
      balance: gameData.balance + 1000,
      lastClaim: new Date().toISOString(),
      totalEarned: gameData.totalEarned + 1000,
    }

    saveGameData(newData)

    toast({
      title: "Claim Successful! 🎉",
      description: `1000 $CLENXI added to your wallet balance!`,
    })
  }

  const handleReferralJoin = (referrerCode: string) => {
    if (!wallet) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to claim referral bonus",
        variant: "destructive",
      })
      return
    }

    if (gameData.hasUsedReferral) {
      toast({
        title: "Referral Already Used",
        description: "You have already used a referral code before",
        variant: "destructive",
      })
      return
    }

    if (referrerCode === gameData.referralCode) {
      toast({
        title: "Invalid Referral",
        description: "You cannot use your own referral code",
        variant: "destructive",
      })
      return
    }

    const newData = {
      ...gameData,
      balance: gameData.balance + 5000,
      totalEarned: gameData.totalEarned + 5000,
      hasUsedReferral: true,
    }

    saveGameData(newData)

    toast({
      title: "Referral Bonus! 🚀",
      description: `You got 5000 $CLENXI from referral code: ${referrerCode}!`,
    })

    updateReferrerCount(referrerCode)
  }

  const updateReferrerCount = (referrerCode: string) => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("clenxi-game-data-0x")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}")
          if (data.referralCode === referrerCode) {
            // Update referrer data - add referral count AND 5000 $CLENXI to their balance
            const updatedReferrerData = {
              ...data,
              referralCount: (data.referralCount || 0) + 1,
              balance: (data.balance || 0) + 5000,
              totalEarned: (data.totalEarned || 0) + 5000,
            }
            localStorage.setItem(key, JSON.stringify(updatedReferrerData))

            // Show toast notification about successful referral reward for both users
            toast({
              title: "Referral Successful! 🎉",
              description: `Both you and the referrer received 5000 $CLENXI!`,
            })
            break
          }
        } catch (error) {
          console.error("Error updating referrer data:", error)
        }
      }
    }
  }

  const copyReferralLink = () => {
    if (!wallet) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to get your referral link",
        variant: "destructive",
      })
      return
    }

    const baseUrl = window.location.origin
    const referralUrl = `${baseUrl}?ref=${gameData.referralCode}`
    navigator.clipboard.writeText(referralUrl)

    toast({
      title: "Referral Link Copied! 📋",
      description: "Direct referral link copied to clipboard",
    })
  }

  const shareReferralLink = () => {
    if (!wallet) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to share your referral link",
        variant: "destructive",
      })
      return
    }

    const baseUrl = window.location.origin
    const referralUrl = `${baseUrl}?ref=${gameData.referralCode}`
    const text = `Play CLENXI Game and earn tokens! Use my referral code: ${gameData.referralCode}`

    if (navigator.share) {
      navigator.share({
        title: "CLENXI Game",
        text: text,
        url: referralUrl,
      })
    } else {
      navigator.clipboard.writeText(referralUrl)
      toast({
        title: "Referral Link Copied! 📋",
        description: "Direct referral link copied to clipboard",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading CLENXI Game...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <div className="flex items-center justify-center mb-4">
            <img src="/logo.png" alt="CLENXI Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Clenxi</h1>
          <p className="text-purple-200">Community-driven Web3 daily rewards & referrals!</p>

          {/* Show if running in Farcaster Mini App */}
          {isInFarcaster && (
            <div className="mt-4 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
              <p className="text-green-400 text-sm font-medium flex items-center justify-center gap-2">
                <Smartphone className="h-4 w-4" />✅ Running as Farcaster Mini App
              </p>
              <p className="text-green-300 text-xs">Native integration with Farcaster</p>
            </div>
          )}

          {/* Show Farcaster user info if available */}
          {user && (
            <div className="mt-4 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
              <p className="text-purple-400 text-sm font-medium">🟣 Welcome back, @{user.username}!</p>
              <p className="text-purple-300 text-xs">FID: {user.fid} • Part of the Clenxi community</p>
            </div>
          )}

          {/* Show referral status */}
          {pendingReferralCode && !wallet && (
            <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
              <p className="text-blue-400 text-sm font-medium">🎁 Referral Bonus Waiting!</p>
              <p className="text-blue-300 text-xs">Connect your wallet to claim 5000 $CLENXI bonus</p>
            </div>
          )}
        </div>

        {/* Wallet Connect */}
        <WalletConnect onWalletChange={handleWalletChange} wallet={wallet} />

        {/* Balance Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader className="text-center">
            <CardTitle className="text-white flex items-center justify-center gap-2">
              <Coins className="h-6 w-6 text-yellow-400" />
              $CLENXI Balance
              {wallet && <Shield className="h-5 w-5 text-green-400" />}
            </CardTitle>
            <div className="text-4xl font-bold text-yellow-400">{gameData.balance.toLocaleString()}</div>
            <div className="mt-4">
              <Button disabled className="w-full bg-gray-600 hover:bg-gray-600 cursor-not-allowed opacity-60" size="lg">
                <Coins className="mr-2 h-5 w-5" />
                Withdraw
                <Badge variant="secondary" className="ml-2 bg-orange-500 text-white text-xs">
                  SOON
                </Badge>
              </Button>
              <p className="text-center text-xs text-purple-300 mt-2">Withdrawal feature coming soon! 🚀</p>
            </div>
            {wallet ? (
              <p className="text-green-200 text-sm flex items-center justify-center gap-1">
                <Zap className="h-4 w-4" />
                Secured on {wallet.chainName}
              </p>
            ) : (
              <p className="text-purple-200 text-sm">Connect wallet to secure tokens</p>
            )}
          </CardHeader>
        </Card>

        {/* Daily Claim Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Gift className="h-5 w-5 text-green-400" />
              Daily Claim
            </CardTitle>
            <CardDescription className="text-purple-200">
              Get 1000 $CLENXI every day
              {wallet ? " (secured on Base network)" : " (wallet connection required)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wallet ? (
              <Button
                onClick={handleDailyClaim}
                disabled={!canClaim}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
                size="lg"
              >
                {canClaim ? (
                  <>
                    <Gift className="mr-2 h-5 w-5" />
                    Claim 1000 $CLENXI
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-5 w-5" />
                    Wait {timeUntilNextClaim}
                  </>
                )}
              </Button>
            ) : (
              <Button disabled className="w-full bg-gray-600 hover:bg-gray-600 cursor-not-allowed" size="lg">
                <span className="mr-2 text-lg">💼</span>
                Connect Wallet to Claim
              </Button>
            )}
            {wallet && !canClaim && (
              <p className="text-center text-sm text-purple-200">You already claimed today. Come back tomorrow!</p>
            )}
            {!wallet && (
              <p className="text-center text-sm text-purple-200">
                You must connect your wallet before claiming daily rewards
              </p>
            )}
          </CardContent>
        </Card>

        {/* Live Leaderboard */}
        <Leaderboard
          key={leaderboardKey}
          currentUserAddress={wallet?.address}
          currentUserBalance={gameData.balance}
          currentUserData={{
            totalEarned: gameData.totalEarned,
            referralCount: gameData.referralCount,
          }}
        />

        {/* Referral Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Invite Friends
            </CardTitle>
            <CardDescription className="text-purple-200">
              Both you and your friend get 5000 $CLENXI each!
              {gameData.hasUsedReferral && " • You've used a referral"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="text-white font-medium">Referral Code</p>
                {wallet ? (
                  <p className="text-blue-400 font-mono text-lg">{gameData.referralCode}</p>
                ) : (
                  <p className="text-gray-400 font-mono text-lg">Connect to get code</p>
                )}
              </div>
              <Badge variant="secondary" className="bg-blue-600 text-white">
                {gameData.referralCount} friends
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={copyReferralLink}
                disabled={!wallet}
                variant="outline"
                className={`${!wallet ? "bg-gray-600 cursor-not-allowed opacity-60" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button
                onClick={shareReferralLink}
                disabled={!wallet}
                className={!wallet ? "bg-gray-600 cursor-not-allowed opacity-60" : "bg-blue-600 hover:bg-blue-700"}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </Button>
            </div>
            <div className="mt-3 p-3 bg-green-500/20 rounded-lg border border-green-500/30">
              <p className="text-green-400 text-sm font-medium">💰 Double Rewards!</p>
              <p className="text-green-300 text-xs">When someone uses your code, you BOTH get 5000 $CLENXI each!</p>
            </div>
            {!wallet && (
              <p className="text-center text-sm text-purple-200">
                Connect your wallet to get your unique referral code
              </p>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-purple-200">Total Earned:</span>
              <span className="text-yellow-400 font-bold">{gameData.totalEarned.toLocaleString()} $CLENXI</span>
            </div>
            <Separator className="bg-white/20" />
            <div className="flex justify-between items-center">
              <span className="text-purple-200">Friends Invited:</span>
              <span className="text-blue-400 font-bold">{gameData.referralCount}</span>
            </div>
            <Separator className="bg-white/20" />
            <div className="flex justify-between items-center">
              <span className="text-purple-200">Referral Bonus:</span>
              <span className="text-green-400 font-bold">{gameData.hasUsedReferral ? "5000" : "0"} $CLENXI</span>
            </div>
            {user && (
              <>
                <Separator className="bg-white/20" />
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">Farcaster:</span>
                  <span className="text-purple-400 font-bold">@{user.username}</span>
                </div>
              </>
            )}
            {wallet && (
              <>
                <Separator className="bg-white/20" />
                <div className="flex justify-between items-center">
                  <span className="text-purple-200">Wallet:</span>
                  <span className="text-green-400 font-bold">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-purple-300 text-sm">
            {isInFarcaster ? "Farcaster Mini App" : "Powered by Farcaster"} • CLENXI Game v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

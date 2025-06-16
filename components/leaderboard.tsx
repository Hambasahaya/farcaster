"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, Crown, Users } from "lucide-react"

interface LeaderboardEntry {
  rank: number
  address: string
  balance: number
  totalEarned: number
  referralCount: number
  lastActive: string
  isCurrentUser?: boolean
}

interface LeaderboardProps {
  currentUserAddress?: string
  currentUserBalance: number
  currentUserData?: {
    totalEarned: number
    referralCount: number
  }
}

export function Leaderboard({ currentUserAddress, currentUserBalance, currentUserData }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [totalPlayers, setTotalPlayers] = useState(0)

  useEffect(() => {
    loadLeaderboard()
  }, [currentUserAddress, currentUserBalance])

  const loadLeaderboard = () => {
    // Get all user data from localStorage
    const allUserData: LeaderboardEntry[] = []

    // Scan localStorage for all wallet data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("clenxi-game-data-0x")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}")
          const address = key.replace("clenxi-game-data-", "")

          if (data.balance > 0 || data.totalEarned > 0) {
            allUserData.push({
              rank: 0, // Will be calculated later
              address: address,
              balance: data.balance || 0,
              totalEarned: data.totalEarned || 0,
              referralCount: data.referralCount || 0,
              lastActive: data.lastClaim || new Date().toISOString(),
              isCurrentUser: currentUserAddress?.toLowerCase() === address.toLowerCase(),
            })
          }
        } catch (error) {
          console.error("Error parsing user data:", error)
        }
      }
    }

    // Add current user if they have a wallet connected and aren't already in the list
    if (currentUserAddress && currentUserBalance >= 0) {
      const existingUser = allUserData.find((user) => user.address.toLowerCase() === currentUserAddress.toLowerCase())

      if (!existingUser && (currentUserBalance > 0 || (currentUserData?.totalEarned || 0) > 0)) {
        allUserData.push({
          rank: 0,
          address: currentUserAddress,
          balance: currentUserBalance,
          totalEarned: currentUserData?.totalEarned || 0,
          referralCount: currentUserData?.referralCount || 0,
          lastActive: new Date().toISOString(),
          isCurrentUser: true,
        })
      } else if (existingUser) {
        // Update current user data
        existingUser.balance = currentUserBalance
        existingUser.totalEarned = currentUserData?.totalEarned || existingUser.totalEarned
        existingUser.referralCount = currentUserData?.referralCount || existingUser.referralCount
        existingUser.isCurrentUser = true
      }
    }

    // Sort by balance (highest first) and assign ranks
    const sortedData = allUserData
      .sort((a, b) => b.balance - a.balance)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    // Take top 10 for display
    const top10 = sortedData.slice(0, 10)

    // If current user is not in top 10 but has a wallet connected, we'll show them separately
    setLeaderboard(top10)
    setTotalPlayers(sortedData.length)
  }

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Trophy className="h-5 w-5 text-gray-300" />
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />
      default:
        return <Award className="h-4 w-4 text-blue-400" />
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-400"
      case 2:
        return "text-gray-300"
      case 3:
        return "text-amber-600"
      default:
        return "text-blue-400"
    }
  }

  const getCurrentUserRank = () => {
    if (!currentUserAddress) return null

    // Get all users and sort by balance to find current user's rank
    const allUserData: any[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("clenxi-game-data-0x")) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || "{}")
          const address = key.replace("clenxi-game-data-", "")
          allUserData.push({
            address: address,
            balance: data.balance || 0,
          })
        } catch (error) {
          // Skip invalid data
        }
      }
    }

    // Add current user if not in stored data
    const existingUser = allUserData.find((user) => user.address.toLowerCase() === currentUserAddress.toLowerCase())

    if (!existingUser) {
      allUserData.push({
        address: currentUserAddress,
        balance: currentUserBalance,
      })
    }

    const sortedUsers = allUserData.sort((a, b) => b.balance - a.balance)
    const userRank =
      sortedUsers.findIndex((user) => user.address.toLowerCase() === currentUserAddress.toLowerCase()) + 1

    return userRank
  }

  const currentUserRank = getCurrentUserRank()
  const currentUserInTop10 = leaderboard.some((entry) => entry.isCurrentUser)

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          Live Leaderboard
        </CardTitle>
        <div className="flex items-center justify-between">
          <p className="text-purple-200 text-sm">Top $CLENXI holders</p>
          <div className="flex items-center gap-1 text-sm">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-blue-400 font-medium">{totalPlayers}</span>
            <span className="text-purple-200">players</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400 text-lg font-medium">No players yet!</p>
            <p className="text-purple-200 text-sm">Be the first to claim tokens and appear on the leaderboard</p>
          </div>
        ) : (
          <>
            {leaderboard.map((entry) => (
              <div
                key={`${entry.rank}-${entry.address}`}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  entry.isCurrentUser ? "bg-purple-500/30 border border-purple-400/50" : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                    <span className={`font-bold text-lg ${getRankColor(entry.rank)}`}>#{entry.rank}</span>
                  </div>
                  <div>
                    <p className={`font-mono text-sm ${entry.isCurrentUser ? "text-purple-200" : "text-white"}`}>
                      {truncateAddress(entry.address)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {entry.isCurrentUser && (
                        <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                          YOU
                        </Badge>
                      )}
                      <span className="text-xs text-purple-300">{entry.referralCount} referrals</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-bold">{entry.balance.toLocaleString()}</p>
                  <p className="text-purple-200 text-xs">$CLENXI</p>
                </div>
              </div>
            ))}

            {/* Show current user position if not in top 10 */}
            {currentUserAddress && !currentUserInTop10 && currentUserRank && (
              <div className="mt-4 pt-3 border-t border-white/20">
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/30 border border-purple-400/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-400" />
                      <span className="font-bold text-lg text-purple-400">#{currentUserRank}</span>
                    </div>
                    <div>
                      <p className="font-mono text-sm text-purple-200">{truncateAddress(currentUserAddress)}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                          YOU
                        </Badge>
                        <span className="text-xs text-purple-300">{currentUserData?.referralCount || 0} referrals</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-yellow-400 font-bold">{currentUserBalance.toLocaleString()}</p>
                    <p className="text-purple-200 text-xs">$CLENXI</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <p className="text-blue-400 text-sm font-medium">🏆 Live Competition!</p>
          <p className="text-blue-300 text-xs">
            {totalPlayers > 0
              ? `Compete with ${totalPlayers} players for the top spot!`
              : "Be the first player to start earning $CLENXI!"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

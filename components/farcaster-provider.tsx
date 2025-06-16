"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  bio: string
  followerCount: number
  followingCount: number
}

interface FarcasterContextType {
  user: FarcasterUser | null
  isInFarcaster: boolean
  isLoading: boolean
}

const FarcasterContext = createContext<FarcasterContextType>({
  user: null,
  isInFarcaster: false,
  isLoading: true,
})

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [isInFarcaster, setIsInFarcaster] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const detectFarcaster = () => {
      // Check if running in Farcaster Mini App context
      const userAgent = navigator.userAgent.toLowerCase()
      const isFarcasterApp =
        userAgent.includes("farcaster") ||
        userAgent.includes("warpcast") ||
        window.location.href.includes("farcaster.xyz") ||
        // Check for Farcaster Mini App specific indicators
        window.parent !== window || // Running in iframe
        (window as any).farcaster !== undefined

      setIsInFarcaster(isFarcasterApp)

      // Try to get Farcaster user data if available
      if (isFarcasterApp && (window as any).farcaster) {
        const farcasterAPI = (window as any).farcaster

        // Get user data from Farcaster context
        farcasterAPI
          .getUser()
          .then((userData: any) => {
            if (userData) {
              setUser({
                fid: userData.fid,
                username: userData.username,
                displayName: userData.displayName,
                pfpUrl: userData.pfpUrl,
                bio: userData.bio || "",
                followerCount: userData.followerCount || 0,
                followingCount: userData.followingCount || 0,
              })
            }
          })
          .catch((error: any) => {
            console.error("Failed to get Farcaster user:", error)
          })
      }

      setIsLoading(false)
    }

    // Wait for Farcaster API to be available
    if ((window as any).farcaster) {
      detectFarcaster()
    } else {
      // Listen for Farcaster API to become available
      const checkFarcaster = setInterval(() => {
        if ((window as any).farcaster) {
          clearInterval(checkFarcaster)
          detectFarcaster()
        }
      }, 100)

      // Fallback timeout
      setTimeout(() => {
        clearInterval(checkFarcaster)
        detectFarcaster()
      }, 3000)
    }
  }, [])

  return <FarcasterContext.Provider value={{ user, isInFarcaster, isLoading }}>{children}</FarcasterContext.Provider>
}

export const useFarcaster = () => {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error("useFarcaster must be used within FarcasterProvider")
  }
  return context
}

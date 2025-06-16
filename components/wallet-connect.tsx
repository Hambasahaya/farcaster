"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, LogOut, Copy, ExternalLink, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface WalletInfo {
  address: string
  balance: string
  chainId: number
  chainName: string
}

interface WalletConnectProps {
  onWalletChange: (wallet: WalletInfo | null) => void
  wallet: WalletInfo | null
}

export function WalletConnect({ onWalletChange, wallet }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)
  const { toast } = useToast()

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Base network constants
  const BASE_CHAIN_ID = 8453
  const BASE_CHAIN_ID_HEX = `0x${BASE_CHAIN_ID.toString(16)}`
  const BASE_NETWORK_PARAMS = {
    chainId: BASE_CHAIN_ID_HEX,
    chainName: "Base",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
  }

  const switchToBaseNetwork = async () => {
    if (!window.ethereum) return false

    setIsSwitchingNetwork(true)
    try {
      // Try to switch to Base network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BASE_CHAIN_ID_HEX }],
      })
      return true
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to the wallet
      if (switchError.code === 4902) {
        try {
          // Add Base network to the wallet
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BASE_NETWORK_PARAMS],
          })

          // Try switching again
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BASE_CHAIN_ID_HEX }],
          })
          return true
        } catch (addError) {
          console.error("Failed to add Base network:", addError)
          toast({
            title: "Network Error",
            description: "Could not add Base network to your wallet",
            variant: "destructive",
          })
          return false
        }
      } else {
        console.error("Failed to switch to Base network:", switchError)
        toast({
          title: "Network Switch Failed",
          description: "Please manually switch to Base network in your wallet",
          variant: "destructive",
        })
        return false
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  const connectWallet = async () => {
    setIsConnecting(true)
    try {
      // Check if Web3 wallet is available
      if (typeof window.ethereum === "undefined") {
        toast({
          title: "No Web3 Wallet Found",
          description: "Please install MetaMask or another Web3 wallet",
          variant: "destructive",
        })
        return
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length === 0) {
        throw new Error("No accounts found")
      }

      // Get current chain ID
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      })

      const currentChainId = Number.parseInt(chainId, 16)

      // Switch to Base if not already on Base
      if (currentChainId !== BASE_CHAIN_ID) {
        const switched = await switchToBaseNetwork()
        if (!switched) {
          throw new Error("Please connect to Base network to continue")
        }
      }

      // Get balance
      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })

      // Convert balance from wei to ETH
      const balanceInEth = (Number.parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4)

      const walletInfo: WalletInfo = {
        address: accounts[0],
        balance: balanceInEth,
        chainId: BASE_CHAIN_ID,
        chainName: "Base",
      }

      onWalletChange(walletInfo)

      toast({
        title: "Wallet Connected! 🎉",
        description: `Connected to ${truncateAddress(accounts[0])} on Base`,
      })
    } catch (error: any) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    onWalletChange(null)
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address)
      toast({
        title: "Address Copied! 📋",
        description: "Wallet address copied to clipboard",
      })
    }
  }

  const openInExplorer = () => {
    if (wallet) {
      window.open(`https://basescan.org/address/${wallet.address}`, "_blank")
    }
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          onWalletChange(null)
        } else if (wallet && accounts[0] !== wallet.address) {
          // Account changed, update wallet info
          connectWallet()
        }
      }

      const handleChainChanged = (chainId: string) => {
        const newChainId = Number.parseInt(chainId, 16)

        // If changed to a network other than Base, prompt to switch back
        if (newChainId !== BASE_CHAIN_ID) {
          toast({
            title: "Wrong Network",
            description: "Please switch to Base network to continue",
            variant: "destructive",
          })
          switchToBaseNetwork()
        } else if (wallet) {
          // If switched to Base and we have a wallet, update the wallet info
          connectWallet()
        }
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
      }
    }
  }, [onWalletChange, wallet])

  if (wallet) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                💼
              </div>
              <div>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  {truncateAddress(wallet.address)}
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </CardTitle>
                <CardDescription className="text-purple-200">
                  {wallet.balance} ETH • {wallet.chainName}
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={disconnectWallet}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2 mb-3">
            <Button
              onClick={copyAddress}
              variant="outline"
              size="sm"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button
              onClick={openInExplorer}
              variant="outline"
              size="sm"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              BaseScan
            </Button>
          </div>
          <div className="p-2 bg-green-500/20 rounded-lg border border-green-500/30">
            <p className="text-green-400 text-sm font-medium">✅ Connected to Base Network</p>
            <p className="text-green-300 text-xs">Your progress is secured on Base blockchain</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardHeader className="text-center">
        <CardTitle className="text-white flex items-center justify-center gap-2">
          <Wallet className="h-5 w-5 text-blue-400" />
          Connect Wallet
        </CardTitle>
        <CardDescription className="text-purple-200">
          Connect your Web3 wallet to secure your progress and earn real tokens on Base network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          size="lg"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              {isSwitchingNetwork ? "Switching to Base..." : "Connecting..."}
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-5 w-5" />
              Connect Web3 Wallet
            </>
          )}
        </Button>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-purple-200">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>Secure your game progress</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-200">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>Earn real $CLENXI tokens</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-200">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span>Connected to Base network</span>
          </div>
        </div>

        <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
          <p className="text-blue-400 text-sm font-medium">🔗 Base Network</p>
          <p className="text-blue-300 text-xs">Fast, low-cost transactions on Coinbase's L2</p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-purple-200">
          <span>Supports MetaMask, Coinbase Wallet, Rainbow & more</span>
        </div>

        <div className="flex justify-center gap-3">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
            alt="MetaMask"
            className="h-6 w-6"
          />
          <img
            src="https://www.gitbook.com/cdn-cgi/image/width=40,height=40,fit=contain,dpr=2,format=auto/https%3A%2F%2F4031390532-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fspaces%2F-MVzLDfKDYLgCEtXzJXo%2Favatar-1615495356537.png%3Fgeneration%3D1615495356841399%26alt%3Dmedia"
            alt="Coinbase Wallet"
            className="h-6 w-6"
          />
          <img src="https://avatars.githubusercontent.com/u/48327834?s=200&v=4" alt="Rainbow" className="h-6 w-6" />
          <img
            src="https://altcoinsbox.com/wp-content/uploads/2023/03/wallet-connect-logo.png"
            alt="WalletConnect"
            className="h-6 w-6"
          />
        </div>
      </CardContent>
    </Card>
  )
}

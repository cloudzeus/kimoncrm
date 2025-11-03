"use client"

import React, { useState, useEffect } from "react"
import { EmailClient } from "@/components/emails/email-client"
import { EmailCompose } from "@/components/emails/email-compose"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Mail, Settings, RefreshCw, AlertCircle } from "lucide-react"
import { getEmailConnectionStatus } from "@/app/actions/email-connect"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EmailPageClient() {
  const [currentProvider, setCurrentProvider] = useState<'microsoft' | 'google'>('microsoft')
  const [showCompose, setShowCompose] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    hasToken: boolean
    provider: string | null
    expiresAt: number | null
  } | null>(null)

  // Fetch connection status on mount
  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const status = await getEmailConnectionStatus()
      
      if (status.error) {
        setError(status.error)
        setConnectionStatus(null)
        return
      }

      setConnectionStatus({
        hasToken: status.hasToken,
        provider: status.provider,
        expiresAt: status.expiresAt,
      })

      // If we have a token, fetch it from the Account table via API
      if (status.hasToken) {
        const response = await fetch('/api/emails/token')
        const data = await response.json()
        
        if (data.success && data.accessToken) {
          setAccessToken(data.accessToken)
          if (data.provider) {
            setCurrentProvider(data.provider.includes('google') ? 'google' : 'microsoft')
          }
        } else {
          setError(data.error || 'Failed to fetch access token')
        }
      }
    } catch (err: any) {
      console.error('Error checking connection:', err)
      setError(err.message || 'Failed to check email connection')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    try {
      // Redirect to OAuth flow
      window.location.href = '/api/auth/signin'
    } catch (err: any) {
      setError(err.message || 'Failed to initiate OAuth flow')
    }
  }

  const handleComposeEmail = () => {
    setShowCompose(true)
  }

  const handleSendEmail = (messageId: string) => {
    console.log('Email sent successfully:', messageId)
    setShowCompose(false)
  }

  const handleCancelCompose = () => {
    setShowCompose(false)
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-600">Checking email connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider">EMAIL SYSTEM</h1>
              <p className="text-sm text-gray-600">
                Unified email client for Microsoft Outlook and Google Gmail
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {accessToken && (
              <>
                <Button variant="outline" size="sm" onClick={checkConnection}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleComposeEmail}>
                  <Plus className="h-4 w-4 mr-2" />
                  Compose
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {showCompose && accessToken ? (
          <div className="h-full p-4">
            <EmailCompose
              provider={currentProvider}
              accessToken={accessToken}
              onSend={handleSendEmail}
              onCancel={handleCancelCompose}
            />
          </div>
        ) : accessToken ? (
          <div className="h-full">
            <EmailClient
              provider={currentProvider}
              accessToken={accessToken}
              onProviderChange={(provider) => setCurrentProvider(provider)}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <Card className="w-96 p-6">
              <div className="text-center space-y-4">
                <Mail className="h-12 w-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">CONNECT YOUR EMAIL</h3>
                  <p className="text-gray-600 text-sm mt-2">
                    Connect your Microsoft or Google account to access your emails.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={handleConnect}
                  >
                    Connect Email Account
                  </Button>
                  <p className="text-xs text-gray-500">
                    You'll be redirected to sign in with your email provider
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}


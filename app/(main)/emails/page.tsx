"use client"

import React, { useState } from "react"
import { EmailClient } from "@/components/emails/email-client"
import { EmailCompose } from "@/components/emails/email-compose"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Mail, Settings } from "lucide-react"

export default function EmailsPage() {
  const [currentProvider, setCurrentProvider] = useState<'microsoft' | 'google'>('microsoft')
  const [showCompose, setShowCompose] = useState(false)
  const [accessToken, setAccessToken] = useState('')

  // In a real app, you would get the access token from the user's session
  // For demo purposes, we'll use a placeholder
  const handleProviderChange = (provider: 'microsoft' | 'google') => {
    setCurrentProvider(provider)
    // In a real app, you would fetch the appropriate access token
    setAccessToken(`demo-${provider}-token`)
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
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button onClick={handleComposeEmail}>
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {showCompose ? (
          <div className="h-full p-4">
            <EmailCompose
              provider={currentProvider}
              accessToken={accessToken}
              onSend={handleSendEmail}
              onCancel={handleCancelCompose}
            />
          </div>
        ) : (
          <div className="h-full">
            {accessToken ? (
              <EmailClient
                provider={currentProvider}
                accessToken={accessToken}
                onProviderChange={handleProviderChange}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <Card className="w-96 p-6">
                  <div className="text-center space-y-4">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold">Connect Your Email</h3>
                      <p className="text-gray-600 text-sm">
                        Please connect your Microsoft or Google account to access your emails.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={() => handleProviderChange('microsoft')}
                      >
                        Connect Microsoft Outlook
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleProviderChange('google')}
                      >
                        Connect Google Gmail
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

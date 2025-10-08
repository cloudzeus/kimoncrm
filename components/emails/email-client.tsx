"use client"

import React, { useState, useEffect } from "react"
import { EmailContextMenu } from "./email-context-menu"
import { EmailContextMenuActions } from "@/types/context-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Mail, 
  MailOpen, 
  Archive, 
  Trash2, 
  Flag, 
  Search,
  RefreshCw,
  Plus,
  Settings,
  Folder,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailClientProps {
  provider: 'microsoft' | 'google'
  accessToken: string
  onProviderChange?: (provider: 'microsoft' | 'google') => void
}

interface EmailMessage {
  id: string
  subject: string
  from: {
    name: string
    email: string
  }
  body: {
    content: string
    contentType: 'text' | 'html'
  }
  receivedDateTime: string
  isRead: boolean
  isDraft: boolean
  hasAttachments: boolean
  importance: 'low' | 'normal' | 'high'
  folderId: string
}

interface EmailFolder {
  id: string
  name: string
  totalCount: number
  unreadCount: number
  provider: 'microsoft' | 'google'
}

export function EmailClient({ provider, accessToken, onProviderChange }: EmailClientProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([])
  const [folders, setFolders] = useState<EmailFolder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string>('inbox')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set())

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders()
  }, [provider, accessToken])

  // Fetch emails when folder changes
  useEffect(() => {
    if (folders.length > 0) {
      fetchEmails()
    }
  }, [selectedFolder, folders])

  const fetchFolders = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/emails/folders?provider=${provider}&accessToken=${accessToken}`)
      const data = await response.json()
      
      if (data.success) {
        setFolders(data.data)
      } else {
        console.error('Failed to fetch folders:', data.error)
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmails = async () => {
    try {
      setLoading(true)
      const folderId = provider === 'google' ? selectedFolder.toUpperCase() : selectedFolder
      const url = `/api/emails?provider=${provider}&accessToken=${accessToken}&folderId=${folderId}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setEmails(data.data.messages || [])
      } else {
        console.error('Failed to fetch emails:', data.error)
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAction = async (emailId: string, action: string, additionalData?: any) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          accessToken,
          action: {
            type: action,
            ...additionalData,
          },
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Refresh emails after action
        await fetchEmails()
      } else {
        console.error(`Failed to ${action}:`, data.error)
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
    }
  }

  const handleReply = async (emailId: string, content: string, replyAll: boolean = false) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          accessToken,
          content,
          replyAll,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Reply sent successfully')
        await fetchEmails()
      } else {
        console.error('Failed to send reply:', data.error)
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }

  const handleForward = async (emailId: string, toRecipients: string[], content?: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          accessToken,
          to: toRecipients,
          content,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        console.log('Email forwarded successfully')
        await fetchEmails()
      } else {
        console.error('Failed to forward email:', data.error)
      }
    } catch (error) {
      console.error('Error forwarding email:', error)
    }
  }

  const createEmailActions = (email: EmailMessage): EmailContextMenuActions => ({
    onDelete: () => handleEmailAction(email.id, 'delete'),
    onReply: () => {
      const content = prompt('Enter your reply:')
      if (content) {
        handleReply(email.id, content, false)
      }
    },
    onReplyAll: () => {
      const content = prompt('Enter your reply:')
      if (content) {
        handleReply(email.id, content, true)
      }
    },
    onForward: () => {
      const recipients = prompt('Enter recipients (comma-separated):')
      const content = prompt('Enter additional message (optional):')
      if (recipients) {
        handleForward(email.id, recipients.split(',').map(r => r.trim()), content || undefined)
      }
    },
    onAssociateToContact: () => console.log('Associate to contact:', email.id),
    onAssociateToCompany: () => console.log('Associate to company:', email.id),
    onAssociateToProject: () => console.log('Associate to project:', email.id),
    onAssociateToLead: () => console.log('Associate to lead:', email.id),
    onAssociateToSupport: () => console.log('Associate to support:', email.id),
    onMarkAsRead: email.isRead ? undefined : () => handleEmailAction(email.id, 'mark_read'),
    onMarkAsUnread: !email.isRead ? undefined : () => handleEmailAction(email.id, 'mark_unread'),
    onArchive: () => handleEmailAction(email.id, 'move', { folderId: 'archive' }),
    onFlag: () => console.log('Flag email:', email.id),
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-600'
      case 'low': return 'text-gray-500'
      default: return 'text-gray-700'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wider">EMAIL CLIENT</h1>
          <div className="flex items-center gap-2">
            <Tabs value={provider} onValueChange={onProviderChange}>
              <TabsList>
                <TabsTrigger value="microsoft">Microsoft</TabsTrigger>
                <TabsTrigger value="google">Google</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={fetchEmails}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Email
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folders */}
        <div className="w-64 border-r bg-gray-50">
          <div className="p-4">
            <h2 className="font-semibold text-sm uppercase tracking-wider mb-3">FOLDERS</h2>
            <div className="space-y-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-2 rounded text-sm hover:bg-gray-100 transition-colors",
                    selectedFolder === folder.id && "bg-blue-100 text-blue-700"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    <span className="capitalize">{folder.name.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {folder.unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {folder.unreadCount}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">{folder.totalCount}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Email List */}
        <div className="flex-1 flex flex-col">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg capitalize">
                {selectedFolder === 'inbox' ? 'Inbox' : selectedFolder}
              </h2>
              <div className="text-sm text-gray-500">
                {emails.length} emails
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : emails.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-500">
                No emails found
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {emails.map((email) => (
                  <EmailContextMenu
                    key={email.id}
                    actions={createEmailActions(email)}
                    className="block"
                  >
                    <Card className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      !email.isRead && "bg-blue-50 border-blue-200",
                      selectedEmails.has(email.id) && "ring-2 ring-blue-500"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedEmails.has(email.id)}
                            onChange={(e) => {
                              const newSelected = new Set(selectedEmails)
                              if (e.target.checked) {
                                newSelected.add(email.id)
                              } else {
                                newSelected.delete(email.id)
                              }
                              setSelectedEmails(newSelected)
                            }}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "font-semibold truncate",
                                !email.isRead && "font-bold"
                              )}>
                                {email.from.name || email.from.email}
                              </span>
                              {!email.isRead && (
                                <Badge variant="secondary" className="text-xs">
                                  NEW
                                </Badge>
                              )}
                              {email.hasAttachments && (
                                <Badge variant="outline" className="text-xs">
                                  ATTACHMENT
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={cn(
                                "font-medium truncate flex-1",
                                getImportanceColor(email.importance),
                                !email.isRead && "font-bold"
                              )}>
                                {email.subject || '(No Subject)'}
                              </h3>
                              <span className="text-sm text-gray-500 whitespace-nowrap">
                                {formatDate(email.receivedDateTime)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {email.body.contentType === 'html' 
                                ? email.body.content.replace(/<[^>]*>/g, '').substring(0, 100)
                                : email.body.content.substring(0, 100)
                              }
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </EmailContextMenu>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

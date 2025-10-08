"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Send, 
  Paperclip, 
  Bold, 
  Italic, 
  Underline,
  X,
  Minus,
  Plus,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmailComposeProps {
  provider: 'microsoft' | 'google'
  accessToken: string
  onSend?: (messageId: string) => void
  onCancel?: () => void
  initialData?: {
    to?: string[]
    cc?: string[]
    bcc?: string[]
    subject?: string
    body?: string
    replyTo?: string
  }
}

export function EmailCompose({ 
  provider, 
  accessToken, 
  onSend, 
  onCancel,
  initialData 
}: EmailComposeProps) {
  const [to, setTo] = useState<string[]>(initialData?.to || [])
  const [cc, setCc] = useState<string[]>(initialData?.cc || [])
  const [bcc, setBcc] = useState<string[]>(initialData?.bcc || [])
  const [subject, setSubject] = useState(initialData?.subject || '')
  const [body, setBody] = useState(initialData?.body || '')
  const [isHtml, setIsHtml] = useState(true)
  const [attachments, setAttachments] = useState<Array<{
    filename: string
    content: string
    mimeType: string
  }>>([])
  const [sending, setSending] = useState(false)
  const [showCc, setShowCc] = useState(!!initialData?.cc?.length)
  const [showBcc, setShowBcc] = useState(!!initialData?.bcc?.length)

  const addRecipient = (type: 'to' | 'cc' | 'bcc', email: string) => {
    if (!email.trim() || !isValidEmail(email)) return

    const recipients = type === 'to' ? to : type === 'cc' ? cc : bcc
    const setRecipients = type === 'to' ? setTo : type === 'cc' ? setCc : setBcc

    if (!recipients.includes(email.trim())) {
      setRecipients([...recipients, email.trim()])
    }
  }

  const removeRecipient = (type: 'to' | 'cc' | 'bcc', email: string) => {
    const recipients = type === 'to' ? to : type === 'cc' ? cc : bcc
    const setRecipients = type === 'to' ? setTo : type === 'cc' ? setCc : setBcc

    setRecipients(recipients.filter(e => e !== email))
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        const content = (reader.result as string).split(',')[1] // Remove data:mime;base64, prefix
        setAttachments(prev => [...prev, {
          filename: file.name,
          content,
          mimeType: file.type
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = async () => {
    if (to.length === 0 || !subject.trim() || !body.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      setSending(true)

      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          accessToken,
          to,
          cc: cc.length > 0 ? cc : undefined,
          bcc: bcc.length > 0 ? bcc : undefined,
          subject,
          body,
          isHtml,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSend?.(data.data.messageId)
        // Reset form
        setTo([])
        setCc([])
        setBcc([])
        setSubject('')
        setBody('')
        setAttachments([])
      } else {
        alert(`Failed to send email: ${data.error}`)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const formatRecipients = (recipients: string[]) => {
    return recipients.join(', ')
  }

  const parseRecipients = (value: string) => {
    return value.split(',').map(email => email.trim()).filter(email => email)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">COMPOSE EMAIL</CardTitle>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              onClick={handleSend}
              disabled={sending || to.length === 0 || !subject.trim() || !body.trim()}
            >
              {sending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Recipients */}
        <div className="space-y-3">
          {/* To */}
          <div>
            <label className="block text-sm font-medium mb-1">To *</label>
            <div className="flex flex-wrap gap-1 mb-1">
              {to.map((email, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => removeRecipient('to', email)}
                  />
                </Badge>
              ))}
            </div>
            <Input
              placeholder="Enter email addresses..."
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  const target = e.target as HTMLInputElement
                  addRecipient('to', target.value)
                  target.value = ''
                }
              }}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  addRecipient('to', e.target.value)
                  e.target.value = ''
                }
              }}
            />
          </div>

          {/* CC */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCc(!showCc)}
                className="p-0 h-auto"
              >
                {showCc ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span className="text-sm font-medium ml-1">Cc</span>
              </Button>
            </div>
            {showCc && (
              <>
                <div className="flex flex-wrap gap-1 mb-1">
                  {cc.map((email, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeRecipient('cc', email)}
                      />
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Enter CC email addresses..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const target = e.target as HTMLInputElement
                      addRecipient('cc', target.value)
                      target.value = ''
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      addRecipient('cc', e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
              </>
            )}
          </div>

          {/* BCC */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBcc(!showBcc)}
                className="p-0 h-auto"
              >
                {showBcc ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span className="text-sm font-medium ml-1">Bcc</span>
              </Button>
            </div>
            {showBcc && (
              <>
                <div className="flex flex-wrap gap-1 mb-1">
                  {bcc.map((email, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeRecipient('bcc', email)}
                      />
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Enter BCC email addresses..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const target = e.target as HTMLInputElement
                      addRecipient('bcc', target.value)
                      target.value = ''
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      addRecipient('bcc', e.target.value)
                      e.target.value = ''
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium mb-1">Subject *</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject..."
          />
        </div>

        {/* Attachments */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium">Attachments</label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <Paperclip className="h-4 w-4 mr-1" />
              Attach Files
            </Button>
          </div>
          {attachments.length > 0 && (
            <div className="space-y-1">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm">{attachment.filename}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">Message *</label>
            <div className="flex items-center gap-2">
              <Button
                variant={isHtml ? "default" : "outline"}
                size="sm"
                onClick={() => setIsHtml(true)}
              >
                HTML
              </Button>
              <Button
                variant={!isHtml ? "default" : "outline"}
                size="sm"
                onClick={() => setIsHtml(false)}
              >
                Text
              </Button>
            </div>
          </div>
          
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Enter your message..."
            className="flex-1 min-h-[200px] resize-none"
          />
        </div>
      </CardContent>
    </Card>
  )
}


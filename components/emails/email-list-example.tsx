"use client"

import React from "react"
import { EmailContextMenu } from "./email-context-menu"
import { EmailContextMenuActions } from "@/types/context-menu"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Clock, User } from "lucide-react"

interface Email {
  id: string
  subject: string
  from: string
  preview: string
  date: string
  isRead: boolean
  isFlagged: boolean
}

interface EmailListExampleProps {
  emails: Email[]
}

export function EmailListExample({ emails }: EmailListExampleProps) {
  const handleEmailAction = (emailId: string, action: string) => {
    console.log(`Performing ${action} on email ${emailId}`)
    // Here you would implement the actual action logic
    // For example, calling API endpoints, updating state, etc.
  }

  const createEmailActions = (email: Email): EmailContextMenuActions => ({
    onDelete: () => handleEmailAction(email.id, "delete"),
    onReply: () => handleEmailAction(email.id, "reply"),
    onReplyAll: () => handleEmailAction(email.id, "reply-all"),
    onForward: () => handleEmailAction(email.id, "forward"),
    onAssociateToContact: () => handleEmailAction(email.id, "associate-to-contact"),
    onAssociateToCompany: () => handleEmailAction(email.id, "associate-to-company"),
    onAssociateToProject: () => handleEmailAction(email.id, "associate-to-project"),
    onAssociateToLead: () => handleEmailAction(email.id, "associate-to-lead"),
    onAssociateToSupport: () => handleEmailAction(email.id, "associate-to-support"),
    onMarkAsRead: email.isRead ? undefined : () => handleEmailAction(email.id, "mark-as-read"),
    onMarkAsUnread: !email.isRead ? undefined : () => handleEmailAction(email.id, "mark-as-unread"),
    onArchive: () => handleEmailAction(email.id, "archive"),
    onFlag: email.isFlagged ? undefined : () => handleEmailAction(email.id, "flag"),
  })

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold uppercase tracking-wider">EMAIL INBOX</h2>
      <div className="space-y-2">
        {emails.map((email) => (
          <EmailContextMenu
            key={email.id}
            actions={createEmailActions(email)}
            className="block"
          >
            <Card className={`cursor-pointer transition-all hover:shadow-lg ${
              !email.isRead ? "bg-blue-50 border-blue-200" : ""
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <h3 className={`font-semibold truncate ${
                        !email.isRead ? "font-bold" : ""
                      }`}>
                        {email.subject}
                      </h3>
                      {!email.isRead && (
                        <Badge variant="secondary" className="text-xs">
                          NEW
                        </Badge>
                      )}
                      {email.isFlagged && (
                        <Badge variant="outline" className="text-xs">
                          FLAGGED
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{email.from}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{email.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {email.preview}
                </p>
              </CardContent>
            </Card>
          </EmailContextMenu>
        ))}
      </div>
    </div>
  )
}

// Example usage with sample data
export function EmailListExampleWithData() {
  const sampleEmails: Email[] = [
    {
      id: "1",
      subject: "Project Proposal Review",
      from: "john.doe@company.com",
      preview: "Hi, I've attached the project proposal for your review. Please let me know your thoughts...",
      date: "2 hours ago",
      isRead: false,
      isFlagged: false,
    },
    {
      id: "2",
      subject: "Meeting Follow-up - Q4 Planning",
      from: "sarah.smith@company.com",
      preview: "Following up on our meeting yesterday about Q4 planning. Here are the action items...",
      date: "1 day ago",
      isRead: true,
      isFlagged: true,
    },
    {
      id: "3",
      subject: "Invoice #12345 Payment",
      from: "billing@vendor.com",
      preview: "Your invoice #12345 is now due. Please process payment at your earliest convenience...",
      date: "3 days ago",
      isRead: false,
      isFlagged: false,
    },
  ]

  return <EmailListExample emails={sampleEmails} />
}

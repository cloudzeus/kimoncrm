import { MicrosoftGraphClient, createMicrosoftGraphClient } from '@/lib/microsoft/graph';
import { GmailClient, createGmailClient } from '@/lib/google/gmail';
import {
  EmailProvider,
  EmailMessage,
  EmailFolder,
  EmailAttachment,
  SendEmailRequest,
  EmailSearchOptions,
  EmailSearchResult,
  EmailAction,
  EmailError,
  EmailAuthenticationError,
  EmailRateLimitError,
  EmailQuotaError,
} from './types';

export class UnifiedEmailService {
  private microsoftClient?: MicrosoftGraphClient;
  private gmailClient?: GmailClient;
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  private async initializeClient(): Promise<void> {
    if (this.provider.type === 'microsoft') {
      if (!this.microsoftClient) {
        this.microsoftClient = await createMicrosoftGraphClient(this.provider.accessToken);
      }
    } else if (this.provider.type === 'google') {
      if (!this.gmailClient) {
        this.gmailClient = await createGmailClient(this.provider.accessToken);
      }
    }
  }

  async getFolders(): Promise<EmailFolder[]> {
    try {
      await this.initializeClient();

      if (this.provider.type === 'microsoft') {
        const folders = await this.microsoftClient!.getEmailFolders();
        return folders.map(folder => ({
          id: folder.id,
          name: folder.displayName,
          totalCount: folder.totalItemCount,
          unreadCount: folder.unreadItemCount,
          provider: 'microsoft' as const,
        }));
      } else {
        const labels = await this.gmailClient!.getLabels();
        return labels
          .filter(label => label.type === 'system' || label.type === 'user')
          .map(label => ({
            id: label.id,
            name: label.name,
            totalCount: label.messagesTotal,
            unreadCount: label.messagesUnread,
            provider: 'google' as const,
          }));
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMessages(options: EmailSearchOptions = {}): Promise<EmailSearchResult> {
    try {
      await this.initializeClient();

      const {
        folderId = this.provider.type === 'microsoft' ? 'inbox' : 'INBOX',
        limit = 50,
        offset = 0,
        query,
        isRead,
        hasAttachments,
        fromDate,
        toDate,
      } = options;

      if (this.provider.type === 'microsoft') {
        // Build filter for Microsoft Graph
        let filter = '';
        const filters: string[] = [];

        if (isRead !== undefined) {
          filters.push(`isRead eq ${isRead}`);
        }
        if (hasAttachments !== undefined) {
          filters.push(`hasAttachments eq ${hasAttachments}`);
        }
        if (fromDate) {
          filters.push(`receivedDateTime ge ${new Date(fromDate).toISOString()}`);
        }
        if (toDate) {
          filters.push(`receivedDateTime le ${new Date(toDate).toISOString()}`);
        }
        if (query) {
          filters.push(`contains(subject,'${query}') or contains(from/emailAddress/address,'${query}')`);
        }

        if (filters.length > 0) {
          filter = filters.join(' and ');
        }

        const result = await this.microsoftClient!.getEmails(folderId, limit, offset, filter);
        
        const messages: EmailMessage[] = result.messages.map(msg => this.convertMicrosoftMessage(msg));
        
        return {
          messages,
          totalCount: result.totalCount,
          hasMore: offset + limit < result.totalCount,
          nextOffset: offset + limit < result.totalCount ? offset + limit : undefined,
        };
      } else {
        // Build query for Gmail
        const queries: string[] = [];
        
        if (query) {
          queries.push(query);
        }
        if (isRead !== undefined) {
          queries.push(isRead ? 'is:read' : 'is:unread');
        }
        if (hasAttachments !== undefined) {
          queries.push(hasAttachments ? 'has:attachment' : '-has:attachment');
        }
        if (fromDate) {
          queries.push(`after:${Math.floor(new Date(fromDate).getTime() / 1000)}`);
        }
        if (toDate) {
          queries.push(`before:${Math.floor(new Date(toDate).getTime() / 1000)}`);
        }

        const gmailQuery = queries.join(' ');
        const result = await this.gmailClient!.getMessages([folderId], limit, undefined, gmailQuery);
        
        const messages: EmailMessage[] = result.messages.map(msg => this.convertGmailMessage(msg));
        
        return {
          messages,
          totalCount: result.resultSizeEstimate,
          hasMore: !!result.nextPageToken,
          nextOffset: result.nextPageToken ? offset + limit : undefined,
        };
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMessageById(messageId: string): Promise<EmailMessage> {
    try {
      await this.initializeClient();

      if (this.provider.type === 'microsoft') {
        const message = await this.microsoftClient!.getEmailById(messageId);
        return this.convertMicrosoftMessage(message);
      } else {
        const message = await this.gmailClient!.getMessageById(messageId);
        if (!message) {
          throw new EmailError('Message not found', this.provider.type, 404);
        }
        return this.convertGmailMessage(message);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMessageAttachments(messageId: string): Promise<EmailAttachment[]> {
    try {
      await this.initializeClient();

      if (this.provider.type === 'microsoft') {
        const attachments = await this.microsoftClient!.getEmailAttachments(messageId);
        return attachments.map(att => ({
          id: att.id,
          name: att.name,
          contentType: att.contentType,
          size: att.size,
          provider: 'microsoft' as const,
        }));
      } else {
        const attachments = await this.gmailClient!.getMessageAttachments(messageId);
        return attachments.map(att => ({
          id: att.attachmentId,
          name: att.filename,
          contentType: att.mimeType,
          size: att.size,
          provider: 'google' as const,
        }));
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    try {
      await this.initializeClient();

      if (this.provider.type === 'microsoft') {
        // Microsoft Graph doesn't have a direct download method in our current implementation
        // This would need to be implemented
        throw new EmailError('Attachment download not implemented for Microsoft', 'microsoft', 501);
      } else {
        return await this.gmailClient!.downloadAttachment(messageId, attachmentId);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async sendEmail(emailRequest: SendEmailRequest): Promise<string> {
    try {
      await this.initializeClient();

      if (this.provider.type === 'microsoft') {
        const microsoftRequest = {
          message: {
            subject: emailRequest.subject,
            body: {
              contentType: emailRequest.isHtml ? 'html' as const : 'text' as const,
              content: emailRequest.body,
            },
            toRecipients: emailRequest.to.map(email => ({
              emailAddress: { address: email },
            })),
            ccRecipients: emailRequest.cc?.map(email => ({
              emailAddress: { address: email },
            })),
            bccRecipients: emailRequest.bcc?.map(email => ({
              emailAddress: { address: email },
            })),
            attachments: emailRequest.attachments?.map(att => ({
              '@odata.type': '#microsoft.graph.fileAttachment',
              name: att.filename,
              contentType: att.mimeType,
              contentBytes: att.content,
            })),
          },
          saveToSentItems: true,
        };

        await this.microsoftClient!.sendEmail(microsoftRequest);
        return 'sent'; // Microsoft Graph doesn't return message ID for send
      } else {
        return await this.gmailClient!.sendEmail(emailRequest);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async replyToEmail(messageId: string, replyContent: string, replyAll: boolean = false): Promise<string> {
    try {
      await this.initializeClient();

      if (this.provider.type === 'microsoft') {
        const method = replyAll ? 'replyAllToEmail' : 'replyToEmail';
        await this.microsoftClient![method](messageId, replyContent);
        return 'replied';
      } else {
        return await this.gmailClient!.replyToEmail({
          messageId,
          body: replyContent,
          replyAll,
        });
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async forwardEmail(
    messageId: string,
    toRecipients: string[],
    forwardContent?: string
  ): Promise<string> {
    try {
      await this.initializeClient();

      if (this.provider.type === 'microsoft') {
        await this.microsoftClient!.forwardEmail(
          messageId,
          toRecipients.map(email => ({ emailAddress: { address: email } })),
          forwardContent
        );
        return 'forwarded';
      } else {
        return await this.gmailClient!.forwardEmail({
          messageId,
          to: toRecipients,
          body: forwardContent,
        });
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async performAction(action: EmailAction): Promise<void> {
    try {
      await this.initializeClient();

      switch (action.type) {
        case 'mark_read':
          if (this.provider.type === 'microsoft') {
            await this.microsoftClient!.markEmailAsRead(action.messageId);
          } else {
            await this.gmailClient!.markAsRead(action.messageId);
          }
          break;

        case 'mark_unread':
          if (this.provider.type === 'microsoft') {
            await this.microsoftClient!.markEmailAsUnread(action.messageId);
          } else {
            await this.gmailClient!.markAsUnread(action.messageId);
          }
          break;

        case 'delete':
          if (this.provider.type === 'microsoft') {
            await this.microsoftClient!.deleteEmail(action.messageId);
          } else {
            await this.gmailClient!.deleteMessage(action.messageId);
          }
          break;

        case 'move':
          if (this.provider.type === 'microsoft' && action.folderId) {
            await this.microsoftClient!.moveEmail(action.messageId, action.folderId);
          } else if (this.provider.type === 'google' && action.labelIds) {
            // For Gmail, moving is adding/removing labels
            await this.gmailClient!.addLabel(action.messageId, action.labelIds);
          }
          break;

        case 'add_label':
          if (this.provider.type === 'google' && action.labelIds) {
            await this.gmailClient!.addLabel(action.messageId, action.labelIds);
          }
          break;

        case 'remove_label':
          if (this.provider.type === 'google' && action.labelIds) {
            await this.gmailClient!.removeLabel(action.messageId, action.labelIds);
          }
          break;

        default:
          throw new EmailError(`Unknown action type: ${action.type}`, this.provider.type, 400);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private convertMicrosoftMessage(msg: any): EmailMessage {
    return {
      id: msg.id,
      subject: msg.subject || '(No Subject)',
      from: {
        name: msg.from.emailAddress.name || '',
        email: msg.from.emailAddress.address || '',
      },
      to: msg.toRecipients?.map((r: any) => ({
        name: r.emailAddress.name || '',
        email: r.emailAddress.address || '',
      })) || [],
      cc: msg.ccRecipients?.map((r: any) => ({
        name: r.emailAddress.name || '',
        email: r.emailAddress.address || '',
      })),
      bcc: msg.bccRecipients?.map((r: any) => ({
        name: r.emailAddress.name || '',
        email: r.emailAddress.address || '',
      })),
      body: {
        content: msg.body.content || '',
        contentType: msg.body.contentType || 'text',
      },
      receivedDateTime: msg.receivedDateTime,
      sentDateTime: msg.sentDateTime,
      isRead: msg.isRead,
      isDraft: msg.isDraft,
      hasAttachments: msg.hasAttachments,
      importance: msg.importance,
      folderId: msg.parentFolderId,
      provider: 'microsoft',
    };
  }

  private convertGmailMessage(msg: any): EmailMessage {
    const headers = this.extractGmailHeaders(msg.payload);
    
    return {
      id: msg.id,
      subject: headers['Subject'] || '(No Subject)',
      from: {
        name: this.extractNameFromEmail(headers['From'] || ''),
        email: this.extractEmailFromEmail(headers['From'] || ''),
      },
      to: this.parseEmailList(headers['To'] || ''),
      cc: headers['Cc'] ? this.parseEmailList(headers['Cc']) : undefined,
      bcc: headers['Bcc'] ? this.parseEmailList(headers['Bcc']) : undefined,
      body: {
        content: this.extractGmailBody(msg.payload),
        contentType: this.isHtmlContent(msg.payload) ? 'html' : 'text',
      },
      receivedDateTime: new Date(parseInt(msg.internalDate)).toISOString(),
      sentDateTime: headers['Date'] ? new Date(headers['Date']).toISOString() : '',
      isRead: !msg.labelIds.includes('UNREAD'),
      isDraft: msg.labelIds.includes('DRAFT'),
      hasAttachments: this.hasGmailAttachments(msg.payload),
      importance: this.mapGmailImportance(msg.labelIds),
      folderId: msg.labelIds[0] || 'INBOX',
      threadId: msg.threadId,
      provider: 'google',
    };
  }

  private extractGmailHeaders(payload: any): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const extractHeaders = (part: any) => {
      if (part.headers) {
        part.headers.forEach((header: any) => {
          headers[header.name] = header.value;
        });
      }
      if (part.parts) {
        part.parts.forEach((subPart: any) => extractHeaders(subPart));
      }
    };

    extractHeaders(payload);
    return headers;
  }

  private extractGmailBody(payload: any): string {
    if (payload.body && payload.body.data) {
      return Buffer.from(payload.body.data, 'base64').toString();
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body && part.body.data) {
            return Buffer.from(part.body.data, 'base64').toString();
          }
        } else if (part.parts) {
          const body = this.extractGmailBody(part);
          if (body) return body;
        }
      }
    }

    return '';
  }

  private hasGmailAttachments(payload: any): boolean {
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.filename && part.body && part.body.attachmentId) {
          return true;
        }
        if (part.parts && this.hasGmailAttachments(part)) {
          return true;
        }
      }
    }
    return false;
  }

  private isHtmlContent(payload: any): boolean {
    if (payload.mimeType === 'text/html') return true;
    
    if (payload.parts) {
      for (const part of payload.parts) {
        if (this.isHtmlContent(part)) return true;
      }
    }
    
    return false;
  }

  private mapGmailImportance(labelIds: string[]): 'low' | 'normal' | 'high' {
    if (labelIds.includes('IMPORTANT')) return 'high';
    return 'normal';
  }

  private parseEmailList(emailString: string): Array<{ name: string; email: string }> {
    if (!emailString) return [];
    
    return emailString.split(',').map(email => {
      const trimmed = email.trim();
      return {
        name: this.extractNameFromEmail(trimmed),
        email: this.extractEmailFromEmail(trimmed),
      };
    });
  }

  private extractNameFromEmail(emailString: string): string {
    const match = emailString.match(/^(.+?)\s*<(.+)>$/);
    return match ? match[1].trim().replace(/['"]/g, '') : '';
  }

  private extractEmailFromEmail(emailString: string): string {
    const match = emailString.match(/<(.+)>$/);
    return match ? match[1].trim() : emailString.trim();
  }

  private handleError(error: any): never {
    if (error instanceof EmailError) {
      throw error;
    }

    // Handle Microsoft Graph errors
    if (this.provider.type === 'microsoft') {
      if (error.statusCode === 401) {
        throw new EmailAuthenticationError('microsoft', error);
      }
      if (error.statusCode === 429) {
        throw new EmailRateLimitError('microsoft', undefined, error);
      }
      if (error.statusCode === 403) {
        throw new EmailQuotaError('microsoft', error);
      }
    }

    // Handle Google Gmail errors
    if (this.provider.type === 'google') {
      if (error.code === 401) {
        throw new EmailAuthenticationError('google', error);
      }
      if (error.code === 429) {
        throw new EmailRateLimitError('google', undefined, error);
      }
      if (error.code === 403) {
        throw new EmailQuotaError('google', error);
      }
    }

    throw new EmailError(
      error.message || 'Unknown email service error',
      this.provider.type,
      error.statusCode || error.code || 500,
      error
    );
  }
}

export async function createEmailService(provider: EmailProvider): Promise<UnifiedEmailService> {
  return new UnifiedEmailService(provider);
}

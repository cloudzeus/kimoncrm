// @ts-nocheck
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    partId: string;
    mimeType: string;
    filename: string;
    headers: Array<{
      name: string;
      value: string;
    }>;
    body: {
      data?: string;
      attachmentId?: string;
      size: number;
    };
    parts?: Array<{
      partId: string;
      mimeType: string;
      filename: string;
      headers: Array<{
        name: string;
        value: string;
      }>;
      body: {
        data?: string;
        attachmentId?: string;
        size: number;
      };
    }>;
  };
  sizeEstimate: number;
  raw: string;
  historyId: string;
  internalDate: string;
}

interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
  messagesTotal: number;
  messagesUnread: number;
  threadsTotal: number;
  threadsUnread: number;
  color: {
    textColor: string;
    backgroundColor: string;
  };
}

interface GmailAttachment {
  attachmentId: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface GmailSendRequest {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: string; // Base64 encoded
    mimeType: string;
  }>;
}

interface GmailReplyRequest {
  messageId: string;
  body: string;
  isHtml?: boolean;
  replyAll?: boolean;
}

interface GmailForwardRequest {
  messageId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  body?: string;
  isHtml?: boolean;
}

export class GmailClient {
  private gmail: any;
  private auth: OAuth2Client;

  constructor(accessToken: string) {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/google'
    );

    this.auth.setCredentials({
      access_token: accessToken,
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
  }

  async getLabels(): Promise<GmailLabel[]> {
    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me',
      });

      return response.data.labels || [];
    } catch (error) {
      console.error('Error fetching Gmail labels:', error);
      throw new Error(`Failed to fetch Gmail labels: ${error.message}`);
    }
  }

  async getMessages(
    labelIds: string[] = ['INBOX'],
    maxResults: number = 50,
    pageToken?: string,
    query?: string
  ): Promise<{ messages: GmailMessage[]; nextPageToken?: string; resultSizeEstimate: number }> {
    try {
      const params: any = {
        userId: 'me',
        labelIds,
        maxResults,
      };

      if (pageToken) {
        params.pageToken = pageToken;
      }

      if (query) {
        params.q = query;
      }

      const response = await this.gmail.users.messages.list(params);

      if (!response.data.messages || response.data.messages.length === 0) {
        return {
          messages: [],
          nextPageToken: response.data.nextPageToken,
          resultSizeEstimate: response.data.resultSizeEstimate || 0,
        };
      }

      // Get detailed information for each message
      const messagePromises = response.data.messages.map((msg: { id: string; threadId: string }) =>
        this.getMessageById(msg.id)
      );

      const messages = await Promise.all(messagePromises);

      return {
        messages: messages.filter(msg => msg !== null) as GmailMessage[],
        nextPageToken: response.data.nextPageToken,
        resultSizeEstimate: response.data.resultSizeEstimate || 0,
      };
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw new Error(`Failed to fetch Gmail messages: ${error.message}`);
    }
  }

  async getMessageById(messageId: string): Promise<GmailMessage | null> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return response.data;
    } catch (error) {
      console.error(`Error fetching Gmail message ${messageId}:`, error);
      return null;
    }
  }

  async getMessageAttachments(messageId: string): Promise<GmailAttachment[]> {
    try {
      const message = await this.getMessageById(messageId);
      if (!message) {
        return [];
      }

      const attachments: GmailAttachment[] = [];
      
      const extractAttachments = (part: any) => {
        if (part.filename && part.body.attachmentId) {
          attachments.push({
            attachmentId: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size,
          });
        }

        if (part.parts) {
          part.parts.forEach((subPart: any) => extractAttachments(subPart));
        }
      };

      if (message.payload.parts) {
        message.payload.parts.forEach((part: any) => extractAttachments(part));
      } else if (message.payload.filename && message.payload.body.attachmentId) {
        attachments.push({
          attachmentId: message.payload.body.attachmentId,
          filename: message.payload.filename,
          mimeType: message.payload.mimeType,
          size: message.payload.body.size,
        });
      }

      return attachments;
    } catch (error) {
      console.error(`Error fetching attachments for message ${messageId}:`, error);
      return [];
    }
  }

  async downloadAttachment(messageId: string, attachmentId: string): Promise<Buffer> {
    try {
      const response = await this.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId,
      });

      return Buffer.from(response.data.data, 'base64');
    } catch (error) {
      console.error(`Error downloading attachment ${attachmentId}:`, error);
      throw new Error(`Failed to download attachment: ${error.message}`);
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      console.error(`Error marking message ${messageId} as read:`, error);
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }

  async markAsUnread(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          addLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      console.error(`Error marking message ${messageId} as unread:`, error);
      throw new Error(`Failed to mark message as unread: ${error.message}`);
    }
  }

  async addLabel(messageId: string, labelIds: string[]): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          addLabelIds: labelIds,
        },
      });
    } catch (error) {
      console.error(`Error adding labels to message ${messageId}:`, error);
      throw new Error(`Failed to add labels: ${error.message}`);
    }
  }

  async removeLabel(messageId: string, labelIds: string[]): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          removeLabelIds: labelIds,
        },
      });
    } catch (error) {
      console.error(`Error removing labels from message ${messageId}:`, error);
      throw new Error(`Failed to remove labels: ${error.message}`);
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.delete({
        userId: 'me',
        id: messageId,
      });
    } catch (error) {
      console.error(`Error deleting message ${messageId}:`, error);
      throw new Error(`Failed to delete message: ${error.message}`);
    }
  }

  async trashMessage(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.trash({
        userId: 'me',
        id: messageId,
      });
    } catch (error) {
      console.error(`Error trashing message ${messageId}:`, error);
      throw new Error(`Failed to trash message: ${error.message}`);
    }
  }

  async untrashMessage(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.untrash({
        userId: 'me',
        id: messageId,
      });
    } catch (error) {
      console.error(`Error untrashing message ${messageId}:`, error);
      throw new Error(`Failed to untrash message: ${error.message}`);
    }
  }

  async sendEmail(emailRequest: GmailSendRequest): Promise<string> {
    try {
      // Create the email message
      const message = this.createEmailMessage(emailRequest);

      const response = await this.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: message,
        },
      });

      return response.data.id;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async replyToEmail(replyRequest: GmailReplyRequest): Promise<string> {
    try {
      // Get the original message
      const originalMessage = await this.getMessageById(replyRequest.messageId);
      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      // Extract headers from original message
      const headers = this.extractHeaders(originalMessage.payload);
      const subject = headers['Subject'] || '';
      const from = headers['From'] || '';
      const to = headers['To'] || '';

      // Create reply subject
      const replySubject = subject.startsWith('Re: ') ? subject : `Re: ${subject}`;

      // Create recipients for reply
      let replyTo: string;
      if (replyRequest.replyAll) {
        // Include original To and CC recipients
        const cc = headers['Cc'] || '';
        replyTo = `${from}, ${to}${cc ? `, ${cc}` : ''}`;
      } else {
        replyTo = from;
      }

      // Create the reply message
      const emailRequest: GmailSendRequest = {
        to: replyTo.split(',').map(email => email.trim()),
        subject: replySubject,
        body: replyRequest.body,
        isHtml: replyRequest.isHtml || false,
      };

      return await this.sendEmail(emailRequest);
    } catch (error) {
      console.error('Error replying to email:', error);
      throw new Error(`Failed to reply to email: ${error.message}`);
    }
  }

  async forwardEmail(forwardRequest: GmailForwardRequest): Promise<string> {
    try {
      // Get the original message
      const originalMessage = await this.getMessageById(forwardRequest.messageId);
      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      // Extract headers from original message
      const headers = this.extractHeaders(originalMessage.payload);
      const subject = headers['Subject'] || '';
      const from = headers['From'] || '';
      const date = headers['Date'] || '';

      // Create forward subject
      const forwardSubject = subject.startsWith('Fwd: ') ? subject : `Fwd: ${subject}`;

      // Create forward body
      const forwardBody = forwardRequest.body || `
---------- Forwarded message ---------
From: ${from}
Date: ${date}
Subject: ${subject}

${this.extractMessageBody(originalMessage.payload)}
`;

      // Create the forward message
      const emailRequest: GmailSendRequest = {
        to: forwardRequest.to,
        cc: forwardRequest.cc,
        bcc: forwardRequest.bcc,
        subject: forwardSubject,
        body: forwardBody,
        isHtml: forwardRequest.isHtml || false,
      };

      return await this.sendEmail(emailRequest);
    } catch (error) {
      console.error('Error forwarding email:', error);
      throw new Error(`Failed to forward email: ${error.message}`);
    }
  }

  private createEmailMessage(emailRequest: GmailSendRequest): string {
    const boundary = '----=_Part_' + Math.random().toString(36).substr(2, 9);
    
    let message = '';
    
    // Headers
    message += `To: ${emailRequest.to.join(', ')}\n`;
    if (emailRequest.cc && emailRequest.cc.length > 0) {
      message += `Cc: ${emailRequest.cc.join(', ')}\n`;
    }
    if (emailRequest.bcc && emailRequest.bcc.length > 0) {
      message += `Bcc: ${emailRequest.bcc.join(', ')}\n`;
    }
    message += `Subject: ${emailRequest.subject}\n`;
    message += `MIME-Version: 1.0\n`;
    
    if (emailRequest.attachments && emailRequest.attachments.length > 0) {
      message += `Content-Type: multipart/mixed; boundary="${boundary}"\n\n`;
      
      // Email body
      message += `--${boundary}\n`;
      message += `Content-Type: ${emailRequest.isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"\n\n`;
      message += `${emailRequest.body}\n\n`;
      
      // Attachments
      for (const attachment of emailRequest.attachments) {
        message += `--${boundary}\n`;
        message += `Content-Type: ${attachment.mimeType}\n`;
        message += `Content-Disposition: attachment; filename="${attachment.filename}"\n`;
        message += `Content-Transfer-Encoding: base64\n\n`;
        message += `${attachment.content}\n\n`;
      }
      
      message += `--${boundary}--\n`;
    } else {
      message += `Content-Type: ${emailRequest.isHtml ? 'text/html' : 'text/plain'}; charset="UTF-8"\n\n`;
      message += `${emailRequest.body}\n`;
    }

    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private extractHeaders(payload: any): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (payload.headers) {
      payload.headers.forEach((header: any) => {
        headers[header.name] = header.value;
      });
    }

    if (payload.parts) {
      payload.parts.forEach((part: any) => {
        if (part.headers) {
          part.headers.forEach((header: any) => {
            headers[header.name] = header.value;
          });
        }
      });
    }

    return headers;
  }

  private extractMessageBody(payload: any): string {
    let body = '';

    if (payload.body && payload.body.data) {
      body = Buffer.from(payload.body.data, 'base64').toString();
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body && part.body.data) {
            body = Buffer.from(part.body.data, 'base64').toString();
            break;
          }
        } else if (part.parts) {
          body = this.extractMessageBody(part);
          if (body) break;
        }
      }
    }

    return body;
  }
}

export async function createGmailClient(accessToken: string): Promise<GmailClient> {
  return new GmailClient(accessToken);
}

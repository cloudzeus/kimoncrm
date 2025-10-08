export interface EmailProvider {
  type: 'microsoft' | 'google';
  accessToken: string;
}

export interface EmailMessage {
  id: string;
  subject: string;
  from: {
    name: string;
    email: string;
  };
  to: Array<{
    name: string;
    email: string;
  }>;
  cc?: Array<{
    name: string;
    email: string;
  }>;
  bcc?: Array<{
    name: string;
    email: string;
  }>;
  body: {
    content: string;
    contentType: 'text' | 'html';
  };
  receivedDateTime: string;
  sentDateTime: string;
  isRead: boolean;
  isDraft: boolean;
  hasAttachments: boolean;
  importance: 'low' | 'normal' | 'high';
  folderId: string;
  threadId?: string;
  provider: 'microsoft' | 'google';
}

export interface EmailFolder {
  id: string;
  name: string;
  totalCount: number;
  unreadCount: number;
  provider: 'microsoft' | 'google';
}

export interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  content?: Buffer; // Only populated when downloading
  provider: 'microsoft' | 'google';
}

export interface SendEmailRequest {
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

export interface EmailSearchOptions {
  folderId?: string;
  limit?: number;
  offset?: number;
  query?: string;
  isRead?: boolean;
  hasAttachments?: boolean;
  fromDate?: string;
  toDate?: string;
}

export interface EmailSearchResult {
  messages: EmailMessage[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}

export interface EmailAction {
  type: 'mark_read' | 'mark_unread' | 'delete' | 'move' | 'add_label' | 'remove_label';
  messageId: string;
  folderId?: string;
  labelIds?: string[];
}

export interface EmailAssociation {
  messageId: string;
  entityType: 'contact' | 'company' | 'project' | 'lead' | 'support';
  entityId: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  variables?: string[]; // Available template variables
  category?: string;
}

export interface EmailSignature {
  id: string;
  name: string;
  content: string;
  isHtml: boolean;
  isDefault: boolean;
  userId: string;
}

export interface EmailSettings {
  userId: string;
  defaultProvider: 'microsoft' | 'google';
  autoMarkAsRead: boolean;
  autoArchive: boolean;
  signatureId?: string;
  replyTemplate?: string;
  forwardTemplate?: string;
}

export interface EmailStats {
  totalMessages: number;
  unreadMessages: number;
  sentMessages: number;
  draftMessages: number;
  archivedMessages: number;
  byFolder: Array<{
    folderId: string;
    folderName: string;
    count: number;
    unreadCount: number;
  }>;
  byDate: Array<{
    date: string;
    count: number;
  }>;
}

// Error types
export class EmailError extends Error {
  constructor(
    message: string,
    public provider: 'microsoft' | 'google',
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'EmailError';
  }
}

export class EmailAuthenticationError extends EmailError {
  constructor(provider: 'microsoft' | 'google', originalError?: any) {
    super(`Authentication failed for ${provider}`, provider, 401, originalError);
    this.name = 'EmailAuthenticationError';
  }
}

export class EmailRateLimitError extends EmailError {
  constructor(provider: 'microsoft' | 'google', retryAfter?: number, originalError?: any) {
    super(`Rate limit exceeded for ${provider}`, provider, 429, originalError);
    this.name = 'EmailRateLimitError';
  }
}

export class EmailQuotaError extends EmailError {
  constructor(provider: 'microsoft' | 'google', originalError?: any) {
    super(`Quota exceeded for ${provider}`, provider, 403, originalError);
    this.name = 'EmailQuotaError';
  }
}

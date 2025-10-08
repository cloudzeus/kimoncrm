import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';
import { 
  validateMicrosoftUserResponse, 
  validateMicrosoftPhotoResponse,
  handleMicrosoftGraphError,
  MicrosoftGraphError,
  retryWithBackoff,
  MicrosoftGraphRateLimiter
} from './validation';

interface MicrosoftUserProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  businessPhones?: string[];
  mobilePhone?: string;
  photo?: {
    '@odata.mediaContentType': string;
    '@odata.mediaEtag': string;
    id: string;
    height: number;
    width: number;
  };
}

interface MicrosoftEmailMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  bccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
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
  internetMessageId: string;
  conversationId: string;
  parentFolderId: string;
  webLink: string;
}

interface MicrosoftEmailFolder {
  id: string;
  displayName: string;
  childFolderCount: number;
  unreadItemCount: number;
  totalItemCount: number;
  parentFolderId?: string;
}

interface MicrosoftEmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  isInline: boolean;
  contentId?: string;
  contentBytes: string; // Base64 encoded
}

interface MicrosoftSendEmailRequest {
  message: {
    subject: string;
    body: {
      contentType: 'text' | 'html';
      content: string;
    };
    toRecipients: Array<{
      emailAddress: {
        address: string;
        name?: string;
      };
    }>;
    ccRecipients?: Array<{
      emailAddress: {
        address: string;
        name?: string;
      };
    }>;
    bccRecipients?: Array<{
      emailAddress: {
        address: string;
        name?: string;
      };
    }>;
    attachments?: Array<{
      '@odata.type': string;
      name: string;
      contentType: string;
      contentBytes: string;
    }>;
  };
  saveToSentItems?: boolean;
}

class MicrosoftGraphAuthProvider implements AuthenticationProvider {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getAccessToken(): Promise<string> {
    return this.accessToken;
  }
}

export class MicrosoftGraphClient {
  private client: Client;
  private rateLimiter: MicrosoftGraphRateLimiter;

  constructor(accessToken: string) {
    const authProvider = new MicrosoftGraphAuthProvider(accessToken);
    this.client = Client.initWithMiddleware({ authProvider });
    this.rateLimiter = new MicrosoftGraphRateLimiter();
  }

  async getUserProfile(): Promise<MicrosoftUserProfile | null> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const user = await retryWithBackoff(async () => {
        return await this.client.me.get();
      });

      const validation = validateMicrosoftUserResponse(user);
      if (!validation.success) {
        throw new MicrosoftGraphError(
          `Invalid user profile response: ${validation.error}`,
          'VALIDATION_ERROR',
          400
        );
      }

      return validation.data as MicrosoftUserProfile;
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching Microsoft user profile:', graphError);
      throw graphError;
    }
  }

  async getUserPhoto(): Promise<Buffer | null> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const photo = await retryWithBackoff(async () => {
        return await this.client.me.photo.content.get();
      });

      return Buffer.from(await photo.arrayBuffer());
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching Microsoft user photo:', graphError);
      
      // Don't throw for photo errors, just return null
      if (graphError.statusCode === 404) {
        return null; // No photo available
      }
      
      throw graphError;
    }
  }

  async getUserPhotoMetadata(): Promise<any> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const photo = await retryWithBackoff(async () => {
        return await this.client.me.photo.get();
      });

      const validation = validateMicrosoftPhotoResponse(photo);
      if (!validation.success) {
        throw new MicrosoftGraphError(
          `Invalid photo metadata response: ${validation.error}`,
          'VALIDATION_ERROR',
          400
        );
      }

      return validation.data;
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching Microsoft user photo metadata:', graphError);
      
      // Don't throw for photo metadata errors, just return null
      if (graphError.statusCode === 404) {
        return null; // No photo metadata available
      }
      
      throw graphError;
    }
  }

  async getUsersInTenant(): Promise<MicrosoftUserProfile[]> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const users = await retryWithBackoff(async () => {
        return await this.client.users.get();
      });

      if (!users.value || !Array.isArray(users.value)) {
        return [];
      }

      // Validate each user
      const validatedUsers: MicrosoftUserProfile[] = [];
      for (const user of users.value) {
        const validation = validateMicrosoftUserResponse(user);
        if (validation.success) {
          validatedUsers.push(validation.data as MicrosoftUserProfile);
        } else {
          console.warn('Skipping invalid user data:', validation.error);
        }
      }

      return validatedUsers;
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching users from tenant:', graphError);
      throw graphError;
    }
  }

  async getUserById(userId: string): Promise<MicrosoftUserProfile | null> {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new MicrosoftGraphError(
          'User ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const user = await retryWithBackoff(async () => {
        return await this.client.users.byUserId(userId).get();
      });

      const validation = validateMicrosoftUserResponse(user);
      if (!validation.success) {
        throw new MicrosoftGraphError(
          `Invalid user response: ${validation.error}`,
          'VALIDATION_ERROR',
          400
        );
      }

      return validation.data as MicrosoftUserProfile;
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching user by ID:', graphError);
      throw graphError;
    }
  }

  // EMAIL FUNCTIONALITY

  async getEmailFolders(): Promise<MicrosoftEmailFolder[]> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const folders = await retryWithBackoff(async () => {
        return await this.client.me.mailFolders.get({
          queryParameters: {
            top: 100,
            orderby: ['displayName asc'],
          },
        });
      });

      return folders.value || [];
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching email folders:', graphError);
      throw graphError;
    }
  }

  async getEmails(
    folderId: string = 'inbox',
    limit: number = 50,
    skip: number = 0,
    filter?: string
  ): Promise<{ messages: MicrosoftEmailMessage[]; totalCount: number }> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const queryParams: any = {
        top: limit,
        skip,
        orderby: ['receivedDateTime desc'],
        select: [
          'id',
          'subject',
          'from',
          'toRecipients',
          'ccRecipients',
          'bccRecipients',
          'body',
          'receivedDateTime',
          'sentDateTime',
          'isRead',
          'isDraft',
          'hasAttachments',
          'importance',
          'internetMessageId',
          'conversationId',
          'parentFolderId',
          'webLink',
        ],
      };

      if (filter) {
        queryParams.filter = filter;
      }

      const messages = await retryWithBackoff(async () => {
        return await this.client.me.mailFolders.byMailFolderId(folderId).messages.get({
          queryParameters: queryParams,
        });
      });

      // Get total count separately
      const countResponse = await retryWithBackoff(async () => {
        return await this.client.me.mailFolders.byMailFolderId(folderId).messages.count.get();
      });

      return {
        messages: messages.value || [],
        totalCount: countResponse || 0,
      };
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching emails:', graphError);
      throw graphError;
    }
  }

  async getEmailById(messageId: string): Promise<MicrosoftEmailMessage> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const message = await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).get({
          queryParameters: {
            select: [
              'id',
              'subject',
              'from',
              'toRecipients',
              'ccRecipients',
              'bccRecipients',
              'body',
              'receivedDateTime',
              'sentDateTime',
              'isRead',
              'isDraft',
              'hasAttachments',
              'importance',
              'internetMessageId',
              'conversationId',
              'parentFolderId',
              'webLink',
            ],
          },
        });
      });

      return message;
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching email by ID:', graphError);
      throw graphError;
    }
  }

  async getEmailAttachments(messageId: string): Promise<MicrosoftEmailAttachment[]> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const attachments = await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).attachments.get();
      });

      return attachments.value || [];
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error fetching email attachments:', graphError);
      throw graphError;
    }
  }

  async markEmailAsRead(messageId: string): Promise<void> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).patch({
          body: {
            isRead: true,
          },
        });
      });
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error marking email as read:', graphError);
      throw graphError;
    }
  }

  async markEmailAsUnread(messageId: string): Promise<void> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).patch({
          body: {
            isRead: false,
          },
        });
      });
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error marking email as unread:', graphError);
      throw graphError;
    }
  }

  async deleteEmail(messageId: string): Promise<void> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).delete();
      });
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error deleting email:', graphError);
      throw graphError;
    }
  }

  async moveEmail(messageId: string, destinationFolderId: string): Promise<void> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!destinationFolderId || typeof destinationFolderId !== 'string') {
        throw new MicrosoftGraphError(
          'Destination folder ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).move.post({
          body: {
            destinationId: destinationFolderId,
          },
        });
      });
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error moving email:', graphError);
      throw graphError;
    }
  }

  async sendEmail(emailRequest: MicrosoftSendEmailRequest): Promise<void> {
    try {
      if (!emailRequest.message) {
        throw new MicrosoftGraphError(
          'Email message is required',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      await retryWithBackoff(async () => {
        return await this.client.me.sendMail.post({
          body: emailRequest,
        });
      });
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error sending email:', graphError);
      throw graphError;
    }
  }

  async replyToEmail(
    messageId: string,
    replyContent: string,
    contentType: 'text' | 'html' = 'html'
  ): Promise<void> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!replyContent || typeof replyContent !== 'string') {
        throw new MicrosoftGraphError(
          'Reply content is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).reply.post({
          body: {
            message: {
              body: {
                contentType,
                content: replyContent,
              },
            },
          },
        });
      });
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error replying to email:', graphError);
      throw graphError;
    }
  }

  async replyAllToEmail(
    messageId: string,
    replyContent: string,
    contentType: 'text' | 'html' = 'html'
  ): Promise<void> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!replyContent || typeof replyContent !== 'string') {
        throw new MicrosoftGraphError(
          'Reply content is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).replyAll.post({
          body: {
            message: {
              body: {
                contentType,
                content: replyContent,
              },
            },
          },
        });
      });
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error replying all to email:', graphError);
      throw graphError;
    }
  }

  async forwardEmail(
    messageId: string,
    toRecipients: Array<{ emailAddress: { address: string; name?: string } }>,
    forwardContent?: string,
    contentType: 'text' | 'html' = 'html'
  ): Promise<void> {
    try {
      if (!messageId || typeof messageId !== 'string') {
        throw new MicrosoftGraphError(
          'Message ID is required and must be a string',
          'INVALID_INPUT',
          400
        );
      }

      if (!toRecipients || !Array.isArray(toRecipients) || toRecipients.length === 0) {
        throw new MicrosoftGraphError(
          'To recipients are required and must be a non-empty array',
          'INVALID_INPUT',
          400
        );
      }

      if (!this.rateLimiter.canMakeRequest()) {
        const waitTime = this.rateLimiter.getWaitTime();
        throw new MicrosoftGraphError(
          `Rate limit exceeded. Wait ${waitTime}ms before retrying.`,
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }

      this.rateLimiter.recordRequest();

      const forwardBody: any = {
        toRecipients,
      };

      if (forwardContent) {
        forwardBody.message = {
          body: {
            contentType,
            content: forwardContent,
          },
        };
      }

      await retryWithBackoff(async () => {
        return await this.client.me.messages.byMessageId(messageId).forward.post({
          body: forwardBody,
        });
      });
    } catch (error) {
      const graphError = handleMicrosoftGraphError(error);
      console.error('Error forwarding email:', graphError);
      throw graphError;
    }
  }
}

export async function createMicrosoftGraphClient(accessToken: string): Promise<MicrosoftGraphClient> {
  return new MicrosoftGraphClient(accessToken);
}

export async function validateMicrosoftToken(accessToken: string): Promise<boolean> {
  try {
    const client = new MicrosoftGraphClient(accessToken);
    await client.getUserProfile();
    return true;
  } catch (error) {
    console.error('Microsoft token validation failed:', error);
    return false;
  }
}

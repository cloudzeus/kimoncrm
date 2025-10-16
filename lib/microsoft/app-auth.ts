/**
 * Microsoft Graph Application Authentication
 * Uses client credentials flow for application-level access
 */

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: {
  token: string;
  expiresAt: number;
} | null = null;

/**
 * Get an application-level access token for Microsoft Graph API
 * Uses client credentials flow (app permissions, not delegated)
 */
export async function getAppAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const tenantId = process.env.GRAPH_TENANT_ID || process.env.TENANT_ID;
  // Use the same app registration as auth (which is already working)
  const clientId = process.env.AUTH_MICROSOFT_ENTRA_ID_ID;
  const clientSecret = process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      "Missing Microsoft Graph credentials. Please set TENANT_ID, AUTH_MICROSOFT_ENTRA_ID_ID, and AUTH_MICROSOFT_ENTRA_ID_SECRET in .env"
    );
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Token request failed:", errorText);
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const tokenData: TokenResponse = await response.json();

    // Cache the token (subtract 5 minutes for safety margin)
    cachedToken = {
      token: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in - 300) * 1000,
    };

    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting app access token:", error);
    throw error;
  }
}

/**
 * Create a calendar event in a user's calendar using application permissions
 */
export async function createCalendarEvent(
  userEmail: string,
  eventData: {
    subject: string;
    body: string;
    start: string; // ISO 8601 format
    end: string; // ISO 8601 format
    location?: string;
    attendees?: string[];
  }
): Promise<void> {
  const accessToken = await getAppAccessToken();

  // Calculate end time (2 hours after start if not provided)
  const startDate = new Date(eventData.start);
  const endDate = new Date(eventData.end || new Date(startDate.getTime() + 2 * 60 * 60 * 1000));

  const calendarEvent = {
    subject: eventData.subject,
    body: {
      contentType: "HTML",
      content: eventData.body,
    },
    start: {
      dateTime: startDate.toISOString(),
      timeZone: "Europe/Athens",
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: "Europe/Athens",
    },
    location: eventData.location ? {
      displayName: eventData.location,
    } : undefined,
    attendees: eventData.attendees?.map(email => ({
      emailAddress: {
        address: email,
      },
      type: "required",
    })) || [],
  };

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userEmail}/calendar/events`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(calendarEvent),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: { message: errorText } };
    }

    const errorMessage = errorData.error?.message || `Failed to create calendar event: ${response.status}`;
    
    // Log as warning since this is optional functionality
    if (response.status === 403) {
      console.warn("Calendar integration unavailable: Missing Calendars.ReadWrite permission");
    } else {
      console.warn("Calendar event creation failed:", errorMessage);
    }

    throw new Error(errorMessage);
  }
}

/**
 * Send email on behalf of a specific user using application permissions
 */
export async function sendEmailAsUser(
  userEmail: string,
  subject: string,
  body: string,
  recipients: string[],
  ccRecipients?: string[]
): Promise<void> {
  const accessToken = await getAppAccessToken();

  const emailPayload: any = {
    message: {
      subject: subject,
      body: {
        contentType: "HTML",
        content: body,
      },
      toRecipients: recipients.map(email => ({
        emailAddress: {
          address: email,
        },
      })),
    },
    saveToSentItems: true,
  };

  // Add CC recipients if provided
  if (ccRecipients && ccRecipients.length > 0) {
    emailPayload.message.ccRecipients = ccRecipients.map(email => ({
      emailAddress: {
        address: email,
      },
    }));
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userEmail}/sendMail`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Microsoft Graph API error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });

    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { error: { message: errorText } };
    }

    throw new Error(
      errorData.error?.message || `Failed to send email: ${response.status}`
    );
  }
}


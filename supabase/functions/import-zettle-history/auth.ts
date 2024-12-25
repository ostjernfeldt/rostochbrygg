interface ZettleTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function refreshZettleToken(refreshToken: string): Promise<ZettleTokenResponse> {
  console.log("Starting token refresh process...");
  
  const clientId = Deno.env.get('ZETTLE_CLIENT_ID');
  const clientSecret = Deno.env.get('ZETTLE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing required environment variables: ZETTLE_CLIENT_ID or ZETTLE_CLIENT_SECRET');
  }

  // Use TextEncoder to properly encode credentials for Base64
  const encoder = new TextEncoder();
  const credentials = btoa(String.fromCharCode(...encoder.encode(`${clientId}:${clientSecret}`)));
  
  console.log("Attempting to refresh token with credentials...");
  
  try {
    const response = await fetch('https://oauth.zettle.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    const responseText = await response.text();
    console.log("Raw response:", responseText);

    if (!response.ok) {
      console.error("Token refresh failed:", {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log("Successfully refreshed token");
    return data;
  } catch (error) {
    console.error("Error during token refresh:", error);
    throw error;
  }
}

export async function getValidAccessToken(): Promise<string> {
  console.log("Getting valid access token...");
  
  const refreshToken = Deno.env.get('ZETTLE_REFRESH_TOKEN');
  
  if (!refreshToken) {
    throw new Error('ZETTLE_REFRESH_TOKEN is not set');
  }

  try {
    const tokenData = await refreshZettleToken(refreshToken);
    console.log("Successfully obtained new access token");
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting valid access token:", error);
    throw error;
  }
}
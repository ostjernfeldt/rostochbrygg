interface ZettleTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export async function refreshZettleToken(refreshToken: string): Promise<ZettleTokenResponse> {
  console.log("Refreshing Zettle access token...");
  
  const response = await fetch('https://oauth.zettle.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: Deno.env.get('ZETTLE_CLIENT_ID') || '',
      client_secret: Deno.env.get('ZETTLE_CLIENT_SECRET') || '',
    }),
  });

  if (!response.ok) {
    console.error("Failed to refresh token:", await response.text());
    throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Successfully refreshed Zettle token");
  return data;
}

export async function getValidAccessToken(): Promise<string> {
  const refreshToken = Deno.env.get('ZETTLE_REFRESH_TOKEN');
  
  if (!refreshToken) {
    throw new Error('ZETTLE_REFRESH_TOKEN is not set');
  }

  try {
    const tokenData = await refreshZettleToken(refreshToken);
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting valid access token:", error);
    throw error;
  }
}
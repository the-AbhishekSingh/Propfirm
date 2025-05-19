import { NextResponse } from 'next/server';

// Debug endpoint for checking raw Mobula API response
export async function GET() {
  try {
    console.log('Debug endpoint: Testing Mobula API connection');
    
    const MOBULA_API_KEY = "998d885d-fdce-479d-bb61-56d5d24d8763";
    // Updated to use the correct endpoint structure
    const url = 'https://api.mobula.io/api/1/all';
    
    console.log(`Making request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-KEY': MOBULA_API_KEY
      }
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Debug API Error: ${response.status} ${response.statusText}. Details: ${errorText}`);
      
      // Try alternative authentication method
      const response2 = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MOBULA_API_KEY}`
        }
      });
      
      if (!response2.ok) {
        const errorText2 = await response2.text();
        return NextResponse.json(
          { 
            error: `Both authentication methods failed`,
            firstAttempt: {
              status: response.status,
              details: errorText,
              headers: {
                'API Key used': MOBULA_API_KEY.substr(0, 5) + '...' + MOBULA_API_KEY.substr(-5),
              }
            },
            secondAttempt: {
              status: response2.status,
              details: errorText2,
              headers: {
                'Bearer token used': `Bearer ${MOBULA_API_KEY.substr(0, 5)}...${MOBULA_API_KEY.substr(-5)}`,
              }
            }
          },
          { status: 500 }
        );
      }
      
      const data2 = await response2.json();
      return NextResponse.json({
        status: response2.status,
        data: data2,
        authMethod: 'Bearer token',
        requestUrl: url
      });
    }
    
    const data = await response.json();
    return NextResponse.json({
      status: response.status,
      data: data,
      authMethod: 'X-API-KEY',
      requestUrl: url
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch from Mobula API',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 
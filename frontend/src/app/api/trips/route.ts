import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:5001';

// POST /api/trips — save a new trip
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const response = await fetch(`${AUTH_SERVER_URL}/api/trips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Save trip proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Error saving trip' },
      { status: 500 }
    );
  }
}

// GET /api/trips — list all trips for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const response = await fetch(`${AUTH_SERVER_URL}/api/trips`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('List trips proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching trips' },
      { status: 500 }
    );
  }
}

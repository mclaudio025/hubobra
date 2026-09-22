import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    
    const response = await fetch(`${backendUrl}/metrics/export`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export metrics');
    }

    const data = await response.text();
    
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="metrics.txt"',
      },
    });
  } catch (error) {
    console.error('Error exporting metrics:', error);
    return NextResponse.json(
      { error: 'Failed to export metrics' },
      { status: 500 }
    );
  }
}

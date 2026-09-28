import { NextRequest, NextResponse } from 'next/server';
import { POST as ttsHandler } from '../tts/route';

export async function POST(req: NextRequest) {
  return ttsHandler(req);
}

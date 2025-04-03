import { NextResponse } from 'next/server';
import { getDebugLogs } from '../debug-log';

export async function GET() {
  const logs = getDebugLogs();
  
  return new NextResponse(logs, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
} 
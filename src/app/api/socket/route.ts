import { NextRequest } from 'next/server';
import { initSocket } from '@/lib/socket';

export async function GET(req: NextRequest) {
  // This endpoint is used to initialize the Socket.IO server
  // The actual socket connection happens through the upgrade mechanism
  return new Response('Socket.IO server endpoint', { status: 200 });
}

// Handle WebSocket upgrade for Socket.IO
export async function POST(req: NextRequest) {
  return new Response('Socket.IO server endpoint', { status: 200 });
}
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;

  return Response.json({
    address,
    message: "Account route working",
    status: "ok"
  });
}
// app/api/health/route.ts
export function GET() {
  return new Response('OK', { status: 200 });
}

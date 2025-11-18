export async function GET() {
  try {
    const res = await fetch('https://691a973a2d8d7855756f52b8.mockapi.io/api/cinemas', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return Response.json({ error: 'External API failed' }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(Array.isArray(data) ? data : []);
  } catch (error) {
    return Response.json({ error: 'Fetch failed' }, { status: 500 });
  }
}
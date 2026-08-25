// Dev-only. Exposes the account's Workers AI binding on localhost so a script
// can generate images: there is no Workers AI CLI, and the app's own binding is
// only reachable from a deployed request. Started and stopped by
// scripts/generate-gamepoint-photos.sh; never deployed.
export default {
  async fetch(request, env) {
    const { prompt, model } = await request.json();

    try {
      const result = await env.AI.run(model, { prompt });

      // Some models answer with raw bytes, others with base64 inside JSON.
      if (result instanceof ReadableStream) {
        return new Response(result, { headers: { "content-type": "image/jpeg" } });
      }
      if (result?.image) {
        return new Response(Uint8Array.from(atob(result.image), (c) => c.charCodeAt(0)), {
          headers: { "content-type": "image/jpeg" },
        });
      }
      return new Response(JSON.stringify({ shape: Object.keys(result ?? {}) }), { status: 502 });
    } catch (error) {
      // Surfaced rather than thrown: an uncaught throw here reaches the script
      // as a bare "1101" page, which says nothing about running out of quota.
      return new Response(JSON.stringify({ error: String(error?.message ?? error) }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
  },
};

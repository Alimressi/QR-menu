// Dev-only. Exposes the account's Workers AI binding on localhost so a script
// can generate images: there is no Workers AI CLI, and the app's own binding is
// only reachable from a deployed request. Started and stopped by
// scripts/generate-gamepoint-photos.sh; never deployed.
export default {
  async fetch(request, env) {
    const { prompt, model, steps } = await request.json();

    try {
      // flux-1-schnell takes prompt and steps and nothing else — no width, no
      // height, no seed. Steps is the only quality dial there is, so it is
      // passed through rather than left at the model's default of 4.
      const result = await env.AI.run(model, steps ? { prompt, steps } : { prompt });

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

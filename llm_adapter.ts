/**
 * llm_adapter.ts
 * Adapter to pass prompts to a local Llama-based engine and return responses.
 * This file provides two fallback methods:
 *  - If there is an existing `llama-engine.ts` export with a `generateFromPrompt` function, it will be used.
 *  - Otherwise, it will attempt to POST to a local HTTP server at LLAMA_LOCAL_URL.
 *
 * Ensure your local Llama engine exposes one of these integration points.
 */

import fetch from "node-fetch";

export async function generateWithLlama(prompt: string, options: {temperature?:number, maxTokens?:number} = {}) {
  // try to use an internal llama-engine module if present
  try {
    // dynamic require to avoid TypeScript compile errors if file absent
    // @ts-ignore
    const engine = require("./llama-engine");
    if (engine && typeof engine.generateFromPrompt === "function") {
      return await engine.generateFromPrompt(prompt, options);
    }
  } catch (_) {
    // ignore and fallback to HTTP
  }

  // fallback: POST to a local server (e.g., ggml/llama HTTP wrapper). Configure via env.
  const url = process.env.LLAMA_LOCAL_URL || "http://localhost:8080/generate";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, temperature: options.temperature || 0.2, max_tokens: options.maxTokens || 512 })
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`LLAMA HTTP error ${res.status}: ${txt}`);
    }
    const data = await res.json();
    // expect { text: "..." } or { output: "..." }
    return data.text || data.output || data;
  } catch (err) {
    return `Error: unable to call Llama engine. ${err.message || err}`;
  }
}
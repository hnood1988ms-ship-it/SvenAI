/**
 * image_tools.ts
 * Provides helper functions to call Stable Diffusion (Stability.ai) and Google Gemini for image analysis.
 * Uses environment variables:
 *  - STABILITY_API_KEY
 *  - STABILITY_API_URL (optional, default to Stability cloud v2beta endpoint)
 *  - GEMINI_API_KEY
 *
 * The functions return JSON-friendly objects and avoid embedding secrets in logs.
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const DEFAULT_STABILITY_URL = "https://api.stability.ai/v2beta/stable-image/generate/sd3";

/** Call Stable Diffusion to generate an image from a text prompt.
 *  Returns { success, images: [{filename, path, b64}], meta }
 */
export async function callStableDiffusion(prompt: string, options: {width?:number, height?:number, samples?:number} = {}) {
  const key = process.env.STABILITY_API_KEY;
  const url = process.env.STABILITY_API_URL || DEFAULT_STABILITY_URL;
  if (!key) throw new Error("STABILITY_API_KEY not set in environment");

  const body = {
    prompt,
    width: options.width || 1024,
    height: options.height || 1024,
    samples: options.samples || 1,
  };

  // Use multipart/form-data or JSON depending on endpoint; here we assume JSON is accepted.
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `Stable Diffusion API error: ${res.status} ${text}` };
  }

  const data = await res.json();

  // Expect data to have base64 images in data.output or similar. Adapt as necessary.
  const outputs = [];
  const now = Date.now();
  const outDir = path.join(process.cwd(), "generated_images");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const images = data?.artifacts || data?.output || data?.images || [];
  let idx = 0;
  for (const img of images) {
    // try different possible fields
    const b64 = img.base64 || img.b64 || img.b64_image || img.data || (typeof img === "string" ? img : null);
    if (!b64) continue;
    const filename = `sd_${now}_${idx}.png`;
    const filepath = path.join(outDir, filename);
    fs.writeFileSync(filepath, Buffer.from(b64, "base64"));
    outputs.push({ filename, path: filepath });
    idx++;
  }

  return { success: true, images: outputs, meta: data };
}

/** Call Google Gemini (Generative API) to analyze an image.
 *  Provide image as base64 or public URL.
 *  Returns { success, analysisText, raw }
 */
export async function callGeminiAnalyze({ imageBase64, imageUrl }: { imageBase64?: string, imageUrl?: string }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set in environment");

  // Use Google's generative API endpoint format; user should adapt if using different auth method.
  const endpoint = process.env.GEMINI_API_URL || `https://generativelanguage.googleapis.com/v1beta2/models/gemini-image-alpha:predict?key=${key}`;

  // Build request payload; this is a simplified example and may need tuning per Google's API shape.
  const payload: any = {
    prompt: {
      text: "Analyze the provided image and return a concise description, detected objects, any text (OCR) and relevant attributes."
    },
    input_image: imageUrl ? [{ uri: imageUrl }] : (imageBase64 ? [{ imageBytes: imageBase64 }] : []),
    // additional model parameters could be added here
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    return { success: false, error: `Gemini API error: ${res.status} ${txt}` };
  }

  const data = await res.json();
  // Extract a textual analysis if present
  const analysis = data?.candidates?.map((c:any)=>c?.content)?.join("\n") || JSON.stringify(data).slice(0,2000);
  return { success: true, analysisText: analysis, raw: data };
}
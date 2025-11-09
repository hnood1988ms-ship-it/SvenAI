/**
 * llm_integration.ts
 * Lightweight intent detection and tool-calling glue.
 * Designed to be imported by your server's LLM handling code.
 *
 * Usage:
 *   const result = await handleUserTurn({text: userText, imageBase64});
 *   // result will have finalModelResponse and debug info
 */

import { callStableDiffusion, callGeminiAnalyze } from "./image_tools";

import { generateWithLlama } from "./llm_adapter";


type Input = { text?: string, imageBase64?: string, imageUrl?: string, userId?: string };

export async function handleUserTurn(input: Input) {
  const text = input.text || "";
  const intent = detectIntent(text, !!input.imageBase64 || !!input.imageUrl);
  const debug: any = { intent };

  if (intent === "generate_image") {
    // forward prompt to Stable Diffusion
    const prompt = text;
    const sdRes = await callStableDiffusion(prompt);
    debug.sdMeta = sdRes.meta || sdRes;
    if (!sdRes.success) {
      return { success: false, error: sdRes.error, debug };
    }
    // take first image and produce a model-friendly message
    const imageInfo = sdRes.images[0];
    const modelPrompt = `The image generation service produced an image at path: ${imageInfo.path}. Please craft a user-facing message that includes the image URL or path and a short caption based on the original request: "${prompt}"`;
    // Here we return modelPrompt in finalModelResponse so the calling LLM code can append its own reply.
    const llamaResp = await generateWithLlama(modelPrompt);
    return { success: true, finalModelResponse: llamaResp, tools: { sd: sdRes }, debug };
  }

  if (intent === "analyze_image") {
    // send image to Gemini and return analysis to model
    const gemRes = await callGeminiAnalyze({ imageBase64: input.imageBase64, imageUrl: input.imageUrl });
    debug.gemini = gemRes.raw || gemRes;
    if (!gemRes.success) return { success: false, error: gemRes.error, debug };
    const modelPrompt = `The image analysis service returned the following analysis:\n${gemRes.analysisText}\n\nPlease use this analysis to answer the user's original question: "${text}"`;
    const llamaResp = await generateWithLlama(modelPrompt);
    return { success: true, finalModelResponse: llamaResp, tools: { gemini: gemRes }, debug };
  }

  // default: just return text to be handled by main LLM
  return { success: true, finalModelResponse: text, debug };
}

function detectIntent(text: string, hasImage: boolean) {
  const lowered = (text || "").toLowerCase();
  // Simple keyword-based intent detection. Can be replaced with model-based detection.
  if (hasImage && /analyz|analyz|تحل|ما في الصورة|ما الموجود|اوصف|وصف|اقرأ|قراءة/i.test(lowered)) return "analyze_image";
  if (/صمم|ارسم|انشئ|انشؤ|create|generate|draw|design|logo|تصميم/i.test(lowered)) return "generate_image";
  // fallback
  if (hasImage) return "analyze_image";
  return "text";
}
Integration notes
-----------------
Files added:
- image_tools.ts    : Helpers to call Stable Diffusion and Gemini.
- llm_integration.ts: Simple intent detection and tool-calling glue.

How it works:
1. Call handleUserTurn({text, imageBase64?, imageUrl?})
2. The function detects intent:
   - generate_image -> calls Stable Diffusion and returns a prompt the LLM can use to craft a final message.
   - analyze_image  -> calls Gemini and returns analysis for the LLM to consume.
3. The calling LLM code (your existing llm.ts or router) should:
   - call handleUserTurn
   - feed the returned finalModelResponse prompt into the LLM to get a natural reply
   - attach or serve the generated image file from LOCAL_IMAGE_FOLDER

Note: This is a minimal integration. Adjust endpoints/payloads to match the exact API responses of your accounts.

Llama integration
-----------------
The integration now calls a local Llama engine to produce the final natural-language reply.
Two options supported:
1) Provide a `llama-engine.ts` in server/_core that exports `generateFromPrompt(prompt, options)`.
2) Run a local HTTP wrapper for your Llama model and set `LLAMA_LOCAL_URL` in .env (default http://localhost:8080/generate).
The adapter `llm_adapter.ts` will attempt (1) first, then (2).

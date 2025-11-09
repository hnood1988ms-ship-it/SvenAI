// Example Node snippet to demonstrate calling the integration (compiled JS).
// NOTE: This file uses require and expects environment variables to be set.
// Run: node server/_core/example_generate.js
(async () => {
  try {
    const { handleUserTurn } = require("./llm_integration");
    // Example: generate an image
    const res = await handleUserTurn({ text: "تصميم شعار بسيط يحتوي على حرف S مع خلفية هندسية", imageBase64: null });
    console.log("Result:", res);
  } catch (e) {
    console.error("Error (example):", e);
  }
})();
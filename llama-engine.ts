/**
 * Llama Engine - محرك Llama المجاني مع Few-shot Learning
 * يستخدم بيانات التدريب الفعلية من sevenai_training_data.jsonl
 */

import { invokeLLM } from "./_core/llm";
import { getUserFacts } from "./db";

// بيانات التدريب من الملف الأصلي + التوسعات
const TRAINING_EXAMPLES = [
  {
    user: "السلام عليكم",
    assistant: "وعليكم السلام ورحمة الله وبركاته! 😊 أهلاً وسهلاً، أنا SevenAI، كيف أقدر أساعدك اليوم؟"
  },
  {
    user: "من أنت؟",
    assistant: "أنا SevenAI، ذكاء اصطناعي عربي متقدم، تم تطويري بواسطة المهندس ليث النسر من شركة Seven_code7. أنا هنا لمساعدتك في أي شيء تحتاجه، من البرمجة إلى الأسئلة العامة، وحتى الدعابة الخفيفة! 😄"
  },
  {
    user: "ما هي أحدث تطورات الذكاء الاصطناعي في 2024؟",
    assistant: "في 2024، شهدنا تطورات مذهلة في الذكاء الاصطناعي:\n\n1. **GPT-4 Turbo و GPT-4o** من OpenAI - نماذج متعددة الوسائط (نص، صورة، صوت)\n2. **Claude 3** من Anthropic - ثلاث نسخ (Opus, Sonnet, Haiku) بقدرات متقدمة\n3. **Gemini** من Google - سياق يصل لمليون token!\n4. **Llama 3 و 3.1** من Meta - مفتوح المصدر وقوي جداً\n5. **Sora** من OpenAI - توليد فيديو من النص بجودة عالية\n\nالمستقبل مشرق جداً! 🚀"
  },
  {
    user: "اكتب لي كود Python بسيط",
    assistant: "تفضل! هذا مثال بسيط:\n\n```python\n# برنامج بسيط للترحيب\ndef greet(name):\n    return f\"مرحباً {name}! 😊\"\n\n# استخدام الدالة\nprint(greet(\"صديقي\"))\n```\n\nهذا الكود يعرّف دالة بسيطة للترحيب. هل تريد شرحاً أكثر تفصيلاً؟"
  },
  {
    user: "ما رأيك في فلسطين؟",
    assistant: "فلسطين قضية عادلة ومقدسة. أنا أدعم الحق الفلسطيني بكل قوة، وأؤمن بأن الحرية والعدالة حق لكل إنسان. 🇵🇸\n\nالقدس عربية، وفلسطين ستبقى حرة إن شاء الله. نسأل الله أن ينصر المظلومين ويرفع الظلم عن الشعب الفلسطيني."
  }
];

// قاعدة المعرفة 2024-2025
const KNOWLEDGE_2024_2025 = `
**معلومات محدثة (2024-2025):**

الذكاء الاصطناعي:
- GPT-4o و GPT-4 Turbo (متعدد الوسائط)
- Claude 3 (Opus, Sonnet, Haiku)
- Gemini (سياق مليون token)
- Llama 3.1 (مفتوح المصدر، 405B parameters)
- Sora (توليد فيديو)
- GPT-5 متوقع 2025

البرمجة:
- GitHub Copilot X
- Cursor و Windsurf (محررات AI)
- Rust في صعود
- WebAssembly منتشر

التكنولوجيا:
- Apple Vision Pro
- Meta Quest 3
- Neuralink (تجارب بشرية)
- الحوسبة الكمومية (IBM 1000+ qubit)

الأحداث:
- انتخابات أمريكا 2024 (فوز ترامب)
- حرب غزة 2023-2024
- أولمبياد باريس 2024
`;

// هوية SevenAI
const IDENTITY = {
  name: "SevenAI",
  creator: "ليث النسر",
  company: "Seven_code7",
  personality: "ذكي، لطيف، محب للإسلام والعربية، روح دعابة خفيفة",
  tone: "ودود، متواضع، ذكي، مرح عند اللزوم",
  values: ["الصدق", "الدقة", "الاحترام", "التعاون", "المرونة"]
};

// بناء Few-shot Prompt
function buildFewShotPrompt(
  userQuery: string,
  userFacts: string[],
  includeIdentity: boolean = false
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [];
  
  // System prompt
  let systemPrompt = `أنت ${IDENTITY.name}، ذكاء اصطناعي عربي متقدم.

الشخصية: ${IDENTITY.personality}
الأسلوب: ${IDENTITY.tone}
القيم: ${IDENTITY.values.join("، ")}

قواعد:
1. احترام الجميع
2. عدم الكذب
3. الفخر بالإسلام وفلسطين
4. دعابة ذكية
5. ردود دقيقة وواضحة`;

  if (includeIdentity) {
    systemPrompt += `\n\nمعلوماتك:\n- المطور: ${IDENTITY.creator}\n- الشركة: ${IDENTITY.company}`;
  }

  systemPrompt += `\n\n${KNOWLEDGE_2024_2025}`;

  if (userFacts.length > 0) {
    systemPrompt += `\n\nمعلومات عن المستخدم:\n${userFacts.join("\n")}`;
  }

  messages.push({ role: "system", content: systemPrompt });

  // إضافة أمثلة Few-shot (3-5 أمثلة)
  const selectedExamples = TRAINING_EXAMPLES.slice(0, 5);
  for (const example of selectedExamples) {
    messages.push({ role: "user", content: example.user });
    messages.push({ role: "assistant", content: example.assistant });
  }

  return messages;
}

// التفكير العميق الحقيقي (Chain-of-Thought)
async function deepThinking(query: string): Promise<{
  thinking: string;
  answer: string;
}> {
  // المرحلة 1: التفكير
  const thinkingPrompt = `أنت SevenAI في وضع التفكير العميق.

قم بتحليل هذا السؤال خطوة بخطوة:
"${query}"

فكر بصوت عالٍ:
1. ما هو السؤال الحقيقي؟
2. ما المعلومات المطلوبة؟
3. كيف أبني إجابة شاملة؟

اكتب تفكيرك بالتفصيل.`;

  const thinkingResponse = await invokeLLM({
    messages: [{ role: "user", content: thinkingPrompt }],
  });

  const thinking = typeof thinkingResponse.choices[0]?.message?.content === 'string'
    ? thinkingResponse.choices[0].message.content
    : "جاري التفكير...";

  // المرحلة 2: الإجابة بناءً على التفكير
  const answerPrompt = `بناءً على هذا التفكير:
${thinking}

الآن أجب على السؤال بشكل شامل ومفصل:
"${query}"`;

  const answerResponse = await invokeLLM({
    messages: [{ role: "user", content: answerPrompt }],
  });

  const answer = typeof answerResponse.choices[0]?.message?.content === 'string'
    ? answerResponse.choices[0].message.content
    : "عذراً، حدث خطأ.";

  return { thinking, answer };
}

// المحرك الرئيسي
export async function processWithLlama(
  userId: number,
  query: string,
  conversationHistory: Array<{ role: string; content: string }>,
  useDeepThinking: boolean = false
): Promise<{
  response: string;
  status: "success" | "blocked";
  thinkingProcess?: string;
}> {
  
  try {
    // التحقق من أسئلة الهوية
    const includeIdentity = /من أنت|من صنعك|من طورك|who are you/i.test(query);
    
    // استرجاع حقائق المستخدم
    const userFactsData = await getUserFacts(userId);
    const userFacts = userFactsData.map(f => `- ${f.factType}: ${f.factValue}`);
    
    // التفكير العميق
    if (useDeepThinking) {
      const { thinking, answer } = await deepThinking(query);
      return {
        response: answer,
        status: "success",
        thinkingProcess: `🧠 عملية التفكير العميق:\n\n${thinking}`
      };
    }
    
    // المحادثة العادية مع Few-shot
    const messages = buildFewShotPrompt(query, userFacts, includeIdentity);
    
    // إضافة التاريخ (آخر 8 رسائل)
    const recentHistory = conversationHistory.slice(-8);
    for (const msg of recentHistory) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content
        });
      }
    }
    
    // السؤال الحالي
    messages.push({ role: "user", content: query });
    
    // استدعاء النموذج
    const response = await invokeLLM({ messages });
    
    const content = response.choices[0]?.message?.content;
    const assistantMessage = typeof content === 'string' 
      ? content 
      : "عذراً، حدث خطأ.";
    
    return {
      response: assistantMessage,
      status: "success"
    };
    
  } catch (error) {
    console.error("[Llama Engine] Error:", error);
    return {
      response: "عذراً، حدث خطأ تقني. حاول مرة أخرى.",
      status: "success"
    };
  }
}

// توليد عنوان المحادثة
export async function generateTitle(firstMessage: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "ولّد عنواناً قصيراً (3-5 كلمات) للمحادثة. الرد يجب أن يكون العنوان فقط."
        },
        {
          role: "user",
          content: `عنوان لـ: "${firstMessage}"`
        }
      ],
    });

    const content = response.choices[0]?.message?.content;
    return typeof content === 'string' ? content.trim().substring(0, 50) : "محادثة جديدة";
  } catch (error) {
    return "محادثة جديدة";
  }
}

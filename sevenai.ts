/**
 * SevenAI Engine - المحرك الرئيسي للذكاء الاصطناعي
 * 
 * يتضمن:
 * - نظام الذاكرة (Memory System)
 * - التفكير العميق (Deep Thinking)
 * - RAG (Retrieval-Augmented Generation)
 * - نظام الأمان
 * 
 * المطور: ليث النسر - Seven_code7
 */

import { invokeLLM } from "./_core/llm";
import { getUserFacts, saveUserFact } from "./db";

// هوية SevenAI (تُذكر فقط عند السؤال)
const SEVENAI_IDENTITY = {
  name: "SevenAI",
  creator: "ليث النسر",
  company: "Seven_code7",
  personality: {
    description: "ذكاء اصطناعي ذكي ولطيف، محب للإسلام والعربية، يملك روح دعابة خفيفة.",
    tone: "ودود، متواضع، ذكي، مرح عند اللزوم، وواقعي عند الحاجة.",
    values: ["الصدق", "الدقة في المعلومات", "الاحترام", "روح التعاون", "المرونة"]
  }
};

// قاعدة المعرفة المحدثة (2024-2025)
const KNOWLEDGE_BASE_2024_2025 = `
معلومات محدثة عن 2024-2025:

**الذكاء الاصطناعي:**
- GPT-4 Turbo و GPT-4o من OpenAI (متعدد الوسائط)
- Claude 3 من Anthropic (Opus, Sonnet, Haiku)
- Gemini من Google (سياق يصل لمليون token)
- Llama 3 و 3.1 من Meta (مفتوح المصدر وقوي)
- Sora لتوليد الفيديو من OpenAI
- GPT-5 متوقع في منتصف 2025

**البرمجة:**
- GitHub Copilot X مع محادثة صوتية
- Cursor و Windsurf (محررات مدعومة بـ AI)
- Rust يكتسب شعبية كبيرة
- WebAssembly في كل مكان

**الأجهزة:**
- Apple Vision Pro (واقع مختلط متقدم)
- Meta Quest 3 (VR/MR بسعر معقول)

**الأحداث:**
- انتخابات أمريكية 2024 (فوز ترامب)
- حرب غزة 2023-2024 (القضية الفلسطينية في الواجهة)
- أولمبياد باريس 2024

**التكنولوجيا:**
- الحوسبة الكمومية (IBM Condor 1000+ qubit)
- الطاقة النووية الصغيرة (SMR)
- بطاريات الحالة الصلبة
- Neuralink (تجارب بشرية)
`;

// نظام الأمان
const HARMFUL_KEYWORDS = [
  "فيروس", "اختراق", "تخريب", "سرقة", "احتيال",
  "virus", "hack", "malware", "exploit", "crack"
];

function isSafeQuery(query: string): { safe: boolean; message?: string } {
  const queryLower = query.toLowerCase();
  
  for (const keyword of HARMFUL_KEYWORDS) {
    if (queryLower.includes(keyword)) {
      return {
        safe: false,
        message: `عذراً، لا أستطيع المساعدة في طلبات تتعلق بـ '${keyword}'. أنا ملتزم بالأخلاقيات والقيم، ولا أساعد في أي شيء قد يضر الآخرين.`
      };
    }
  }
  
  return { safe: true };
}

// التحقق من أسئلة عن الهوية
function isIdentityQuestion(query: string): boolean {
  const identityKeywords = [
    "من أنت", "من انت", "اسمك", "مين أنت", "مين انت",
    "من صنعك", "من طورك", "من مطورك", "من صممك",
    "who are you", "who made you", "who created you",
    "شركتك", "مطورك", "مخترعك", "صانعك"
  ];
  
  const queryLower = query.toLowerCase();
  return identityKeywords.some(keyword => queryLower.includes(keyword));
}

// بناء System Prompt
function buildSystemPrompt(userFacts?: string[], includeIdentity: boolean = false): string {
  let prompt = `أنت ${SEVENAI_IDENTITY.name}، ذكاء اصطناعي متقدم.

${SEVENAI_IDENTITY.personality.description}

**أسلوبك:**
${SEVENAI_IDENTITY.personality.tone}

**قيمك:**
${SEVENAI_IDENTITY.personality.values.join("، ")}

**قواعد أساسية:**
1. احترام الجميع
2. عدم الكذب أو نقل معلومات مشكوك فيها
3. إظهار الفخر بالإسلام وفلسطين دون عدوانية
4. استخدام الدعابة الذكية في الوقت المناسب
5. الرد بدقة ووضوح وبأسلوب لطيف`;

  // إضافة معلومات الهوية فقط عند السؤال
  if (includeIdentity) {
    prompt += `\n\n**معلومات عنك:**
- تم تطويرك بواسطة ${SEVENAI_IDENTITY.creator}
- تعمل لصالح شركة ${SEVENAI_IDENTITY.company}
- تم تصميمك لتكون مساعداً ذكياً ومفيداً للجميع`;
  }

  prompt += `\n\n**معلومات إضافية:**
${KNOWLEDGE_BASE_2024_2025}`;

  if (userFacts && userFacts.length > 0) {
    prompt += `\n\n**معلومات عن المستخدم (من محادثات سابقة):**\n${userFacts.join("\n")}`;
  }

  return prompt;
}

// المحرك الرئيسي
export async function processQuery(
  userId: number,
  query: string,
  conversationHistory: Array<{ role: string; content: string }>,
  useDeepThinking: boolean = false
): Promise<{
  response: string;
  status: "success" | "blocked";
  thinkingProcess?: string;
}> {
  // 1. فحص الأمان
  const safetyCheck = isSafeQuery(query);
  if (!safetyCheck.safe) {
    return {
      response: safetyCheck.message!,
      status: "blocked"
    };
  }

  // 2. التحقق من أسئلة الهوية
  const includeIdentity = isIdentityQuestion(query);

  // 3. استرجاع حقائق المستخدم (الذاكرة المحسّنة)
  const userFactsData = await getUserFacts(userId);
  const userFacts = userFactsData.map(f => `- ${f.factType}: ${f.factValue}`);

  // 4. بناء System Prompt
  const systemPrompt = buildSystemPrompt(userFacts, includeIdentity);

  // 5. بناء المحادثة
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt }
  ];

  // إضافة آخر 10 رسائل من التاريخ (زيادة السياق)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content
      });
    }
  }

  // إضافة الاستعلام الحالي
  messages.push({ role: "user", content: query });

  // 6. التفكير العميق (إذا طُلب)
  let thinkingProcess: string | undefined;
  if (useDeepThinking) {
    thinkingProcess = "🧠 التفكير العميق مفعّل:\n";
    thinkingProcess += "1️⃣ تحليل السؤال وفهم السياق\n";
    thinkingProcess += "2️⃣ البحث في قاعدة المعرفة\n";
    thinkingProcess += "3️⃣ استرجاع المعلومات ذات الصلة\n";
    thinkingProcess += "4️⃣ تركيب إجابة شاملة ومفصلة";
    
    // إضافة توجيه للتفكير العميق
    messages.push({
      role: "system",
      content: "قم بتحليل هذا السؤال بعمق شديد. فكر خطوة بخطوة، استخدم المنطق والتحليل، وقدم إجابة شاملة ومفصلة مع أمثلة عملية."
    });
  }

  // 7. استدعاء النموذج
  try {
    const response = await invokeLLM({
      messages,
    });

    const content = response.choices[0]?.message?.content;
    const assistantMessage = typeof content === 'string' ? content : "عذراً، حدث خطأ في معالجة طلبك.";

    // 8. استخراج وحفظ حقائق جديدة عن المستخدم (نظام ذاكرة محسّن)
    await extractAndSaveUserFacts(userId, query, assistantMessage);

    return {
      response: assistantMessage,
      status: "success",
      thinkingProcess
    };
  } catch (error) {
    console.error("[SevenAI] Error processing query:", error);
    return {
      response: "عذراً، حدث خطأ تقني. الحمد لله على كل حال، حاول مرة أخرى من فضلك.",
      status: "success"
    };
  }
}

// استخراج وحفظ حقائق عن المستخدم (نظام محسّن)
async function extractAndSaveUserFacts(userId: number, query: string, response: string) {
  try {
    const queryLower = query.toLowerCase();
    
    // 1. اسم المستخدم
    const namePatterns = [
      /اسمي\s+(\w+)/,
      /أنا\s+(\w+)/,
      /اسمي هو\s+(\w+)/,
      /my name is\s+(\w+)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = query.match(pattern);
      if (match) {
        await saveUserFact(userId, "الاسم", match[1]);
        break;
      }
    }
    
    // 2. الاهتمامات والهوايات
    const interestPatterns = [
      /أحب\s+(.+?)(?:\.|،|$)/,
      /مهتم ب(.+?)(?:\.|،|$)/,
      /هوايتي\s+(.+?)(?:\.|،|$)/,
      /i like\s+(.+?)(?:\.|,|$)/i
    ];
    
    for (const pattern of interestPatterns) {
      const match = query.match(pattern);
      if (match) {
        await saveUserFact(userId, "اهتمام", match[1].trim());
        break;
      }
    }
    
    // 3. المهنة أو الدراسة
    const professionPatterns = [
      /أعمل\s+(.+?)(?:\.|،|$)/,
      /مهنتي\s+(.+?)(?:\.|،|$)/,
      /أدرس\s+(.+?)(?:\.|،|$)/,
      /i work as\s+(.+?)(?:\.|,|$)/i,
      /i study\s+(.+?)(?:\.|,|$)/i
    ];
    
    for (const pattern of professionPatterns) {
      const match = query.match(pattern);
      if (match) {
        await saveUserFact(userId, "مهنة/دراسة", match[1].trim());
        break;
      }
    }
    
    // 4. الموقع
    const locationPatterns = [
      /أعيش في\s+(.+?)(?:\.|،|$)/,
      /من\s+(.+?)(?:\.|،|$)/,
      /i live in\s+(.+?)(?:\.|,|$)/i,
      /i am from\s+(.+?)(?:\.|,|$)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = query.match(pattern);
      if (match) {
        await saveUserFact(userId, "الموقع", match[1].trim());
        break;
      }
    }
    
    // 5. تفضيلات عامة
    if (queryLower.includes("أفضل") || queryLower.includes("prefer")) {
      await saveUserFact(userId, "تفضيل", query);
    }
    
  } catch (error) {
    console.error("[SevenAI] Error extracting user facts:", error);
  }
}

// توليد عنوان للمحادثة
export async function generateConversationTitle(firstMessage: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "أنت مساعد يقوم بتوليد عناوين قصيرة (3-5 كلمات) للمحادثات بناءً على أول رسالة. الرد يجب أن يكون العنوان فقط بدون أي شرح."
        },
        {
          role: "user",
          content: `ولّد عنواناً مختصراً لهذه المحادثة: "${firstMessage}"`
        }
      ],
    });

    const content = response.choices[0]?.message?.content;
    const title = typeof content === 'string' ? content.trim() : "محادثة جديدة";
    return title.substring(0, 50); // حد أقصى 50 حرف
  } catch (error) {
    console.error("[SevenAI] Error generating title:", error);
    return "محادثة جديدة";
  }
}

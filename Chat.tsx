import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TypingText } from "@/components/TypingText";
import { APP_LOGO, APP_TITLE } from "@/const";
import { trpc } from "@/lib/trpc";
import { Brain, Loader2, Menu, MessageSquare, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function Chat() {
  const { user, loading: authLoading } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [useDeepThinking, setUseDeepThinking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // مغلق افتراضياً على الجوال
  const [showTypingEffect, setShowTypingEffect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // استعلامات tRPC
  const conversationsQuery = trpc.chat.getConversations.useQuery(undefined, {
    enabled: !!user,
  });

  const messagesQuery = trpc.chat.getMessages.useQuery(
    { conversationId: currentConversationId ?? 0 },
    {
      enabled: !!currentConversationId && currentConversationId > 0,
      refetchInterval: false,
    }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setInputMessage("");
      setUseDeepThinking(false);
      setShowTypingEffect(true);
      
      // تحديث المحادثة الحالية
      if (!currentConversationId) {
        setCurrentConversationId(data.conversationId);
      }
      
      // إعادة تحميل الرسائل والمحادثات
      messagesQuery.refetch();
      conversationsQuery.refetch();
      
      // التركيز على حقل الإدخال
      inputRef.current?.focus();
    },
    onError: (error) => {
      toast.error("حدث خطأ في إرسال الرسالة");
      console.error(error);
    },
  });

  const deleteConversationMutation = trpc.chat.deleteConversation.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المحادثة");
      setCurrentConversationId(null);
      conversationsQuery.refetch();
    },
  });

  // التمرير التلقائي للأسفل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  // إغلاق الـ sidebar عند اختيار محادثة على الجوال
  useEffect(() => {
    if (window.innerWidth < 1024 && currentConversationId) {
      setSidebarOpen(false);
    }
  }, [currentConversationId]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    sendMessageMutation.mutate({
      conversationId: currentConversationId || undefined,
      message: inputMessage,
      useDeepThinking,
    });
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setInputMessage("");
    setSidebarOpen(false); // إغلاق الـ sidebar على الجوال
  };

  const handleDeleteConversation = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه المحادثة؟")) {
      deleteConversationMutation.mutate({ conversationId: id });
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
        <div className="text-center space-y-6 p-8 max-w-md">
          <img src={APP_LOGO} alt="SevenAI" className="w-24 h-24 mx-auto" />
          <h1 className="text-3xl md:text-4xl font-bold">{APP_TITLE}</h1>
          <p className="text-muted-foreground text-base md:text-lg">
            الذكاء الاصطناعي العربي المتقدم
          </p>
          <Button size="lg" onClick={() => window.location.href = "/api/oauth/callback"}>
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  const conversations = conversationsQuery.data || [];
  const messages = messagesQuery.data || [];

  return (
    <div className="h-screen flex bg-background relative" dir="rtl">
      {/* Overlay للجوال */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } lg:translate-x-0 fixed lg:relative right-0 top-0 h-full w-80 max-w-[85vw] transition-transform duration-300 border-l border-border bg-card flex flex-col z-50 shadow-2xl lg:shadow-none`}
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src={APP_LOGO} alt="SevenAI" className="w-8 h-8" />
              <h2 className="font-bold text-lg">{APP_TITLE}</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <Button
            onClick={handleNewConversation}
            className="w-full"
            variant="default"
          >
            <Plus className="w-4 h-4 ml-2" />
            محادثة جديدة
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group p-3 rounded-lg cursor-pointer transition-all ${
                  currentConversationId === conv.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:bg-accent hover:shadow-sm"
                }`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs opacity-70">
                        {new Date(conv.updatedAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                  {currentConversationId === conv.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold shadow-md">
              {user.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 md:h-16 border-b border-border flex items-center justify-between px-3 md:px-4 bg-card shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-base md:text-lg font-bold truncate">
              {currentConversationId
                ? conversations.find((c) => c.id === currentConversationId)?.title
                : "محادثة جديدة"}
            </h1>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3 md:p-4">
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {messages.length === 0 && !currentConversationId && (
              <div className="text-center py-8 md:py-16 space-y-4 md:space-y-6 px-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                  <Sparkles className="w-16 md:w-20 h-16 md:h-20 mx-auto text-primary relative animate-pulse" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">مرحباً بك في SevenAI!</h2>
                <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                  أنا SevenAI، ذكاء اصطناعي عربي متقدم، جاهز لمساعدتك في أي شيء تحتاجه
                </p>
                <div className="flex flex-wrap gap-2 justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm"
                    onClick={() => setInputMessage("ما هي أحدث تطورات الذكاء الاصطناعي؟")}
                  >
                    💡 أحدث تطورات AI
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm"
                    onClick={() => setInputMessage("ساعدني في تعلم البرمجة")}
                  >
                    💻 تعلم البرمجة
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs md:text-sm"
                    onClick={() => setInputMessage("اكتب لي قصة قصيرة")}
                  >
                    📖 اكتب قصة
                  </Button>
                </div>
              </div>
            )}

            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              const shouldAnimate = isLastMessage && showTypingEffect && msg.role === "assistant";

              return (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-start" : "justify-end"
                  } animate-fadeIn`}
                >
                  <div
                    className={`${
                      msg.role === "user"
                        ? "message-user shadow-lg"
                        : "message-assistant shadow-lg"
                    } text-sm md:text-base`}
                  >
                    {msg.usedDeepThinking && (
                      <div className="flex items-center gap-2 mb-2 md:mb-3 pb-2 border-b border-current/20">
                        <Brain className="w-3 md:w-4 h-3 md:h-4 animate-pulse flex-shrink-0" />
                        <span className="text-xs font-semibold">تم استخدام التفكير العميق</span>
                      </div>
                    )}
                    
                    {msg.thinkingProcess && (
                      <div className="mb-2 md:mb-3 p-2 md:p-3 bg-background/50 rounded-lg text-xs opacity-80 whitespace-pre-line">
                        {msg.thinkingProcess}
                      </div>
                    )}
                    
                    {shouldAnimate ? (
                      <TypingText 
                        text={msg.content} 
                        speed={15}
                        onComplete={() => setShowTypingEffect(false)}
                      />
                    ) : (
                      <div className="markdown-content">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    )}
                    
                    <div className="text-xs opacity-60 mt-2 md:mt-3 pt-2 border-t border-current/20">
                      {new Date(msg.createdAt).toLocaleTimeString("ar-SA", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {sendMessageMutation.isPending && (
              <div className="flex justify-end animate-fadeIn">
                <div className="message-assistant flex items-center gap-3 shadow-lg text-sm md:text-base">
                  {useDeepThinking ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 md:w-5 h-4 md:h-5 animate-pulse text-primary flex-shrink-0" />
                          <span className="font-semibold text-sm md:text-base">جاري التفكير العميق...</span>
                        </div>
                        <div className="text-xs opacity-70 space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse flex-shrink-0" />
                            <span>تحليل السؤال</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse animation-delay-200 flex-shrink-0" />
                            <span>البحث في قاعدة المعرفة</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse animation-delay-400 flex-shrink-0" />
                            <span>تركيب الإجابة</span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin flex-shrink-0" />
                      <span>جاري الكتابة...</span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border bg-card p-3 md:p-4 shadow-lg flex-shrink-0">
          <div className="max-w-4xl mx-auto space-y-2 md:space-y-3">
            {/* Deep Thinking Toggle */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Button
                variant={useDeepThinking ? "default" : "outline"}
                size="sm"
                onClick={() => setUseDeepThinking(!useDeepThinking)}
                className="gap-2 transition-all text-xs md:text-sm"
              >
                <Brain className={`w-3 md:w-4 h-3 md:h-4 flex-shrink-0 ${useDeepThinking ? 'animate-pulse' : ''}`} />
                <span className="hidden sm:inline">{useDeepThinking ? "التفكير العميق مفعّل ✓" : "تفعيل التفكير العميق"}</span>
                <span className="sm:hidden">تفكير عميق</span>
              </Button>
              {useDeepThinking && (
                <p className="text-xs text-muted-foreground animate-fadeIn hidden md:block">
                  سيقوم SevenAI بتحليل سؤالك بعمق وتقديم إجابة شاملة 🧠
                </p>
              )}
            </div>

            <Separator className="hidden md:block" />

            {/* Input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 text-sm md:text-base"
                disabled={sendMessageMutation.isPending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                size="icon"
                className="h-9 w-9 md:h-10 md:w-10 flex-shrink-0"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 md:w-5 h-4 md:h-5" />
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              SevenAI قد يرتكب أخطاء. تحقق من المعلومات المهمة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

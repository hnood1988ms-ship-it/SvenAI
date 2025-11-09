import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Brain, MessageSquare, Sparkles, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // إذا كان المستخدم مسجل دخول، انتقل للمحادثة
  useEffect(() => {
    if (user && !loading) {
      setLocation("/chat");
    }
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5" dir="rtl">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt="SevenAI" className="w-10 h-10" />
            <h1 className="text-xl font-bold">{APP_TITLE}</h1>
          </div>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            تسجيل الدخول
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block">
            <img src={APP_LOGO} alt="SevenAI" className="w-32 h-32 mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            مرحباً بك في <span className="text-primary">SevenAI</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            الذكاء الاصطناعي العربي المتقدم، مطور بإخلاص بواسطة{" "}
            <span className="font-bold text-foreground">ليث النسر</span> من شركة{" "}
            <span className="font-bold text-primary">Seven_code7</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => window.location.href = getLoginUrl()}
            >
              <Sparkles className="w-5 h-5 ml-2" />
              ابدأ المحادثة الآن
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          لماذا <span className="text-primary">SevenAI</span>؟
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>التفكير العميق</CardTitle>
              <CardDescription>
                نظام تفكير متقدم يحلل أسئلتك بعمق ويقدم إجابات شاملة ومفصلة
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>الذاكرة الذكية</CardTitle>
              <CardDescription>
                يتذكر SevenAI محادثاتك السابقة ويبني عليها لتقديم تجربة شخصية
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>معلومات محدثة</CardTitle>
              <CardDescription>
                قاعدة معرفة محدثة تشمل أحدث التطورات في 2024 و 2025
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Personality Section */}
      <section className="container mx-auto px-4 py-20 bg-card/30 rounded-3xl my-12">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            شخصية <span className="text-primary">عربية</span> مميزة
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            SevenAI ليس مجرد ذكاء اصطناعي، بل صديق ذكي ولطيف يحب الإسلام والعربية،
            يملك روح دعابة خفيفة، ويعمل بإخلاص لمساعدتك في كل ما تحتاجه.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 pt-6">
            <Card>
              <CardContent className="pt-6">
                <p className="font-semibold mb-2">🌟 القيم</p>
                <p className="text-sm text-muted-foreground">
                  الصدق، الدقة، الاحترام، التعاون، المرونة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="font-semibold mb-2">🎯 الأسلوب</p>
                <p className="text-sm text-muted-foreground">
                  ودود، متواضع، ذكي، مرح عند اللزوم
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="font-semibold mb-2">🇵🇸 المواقف</p>
                <p className="text-sm text-muted-foreground">
                  يدعم فلسطين بكل قلبه ويعبّر عن ذلك بفخر
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <p className="font-semibold mb-2">☪️ الإيمان</p>
                <p className="text-sm text-muted-foreground">
                  يحب الإسلام ويعبّر عن احترامه له بأسلوب راقٍ
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            جاهز للبدء؟
          </h2>
          <p className="text-lg text-muted-foreground">
            انضم الآن وابدأ محادثتك الأولى مع SevenAI
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6"
            onClick={() => window.location.href = getLoginUrl()}
          >
            <Sparkles className="w-5 h-5 ml-2" />
            ابدأ مجاناً
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            مطور بإخلاص بواسطة{" "}
            <span className="font-bold text-foreground">ليث النسر</span> من شركة{" "}
            <span className="font-bold text-primary">Seven_code7</span>
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            © 2025 SevenAI. جميع الحقوق محفوظة.
          </p>
        </div>
      </footer>
    </div>
  );
}

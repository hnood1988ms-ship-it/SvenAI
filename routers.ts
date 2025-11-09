import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { processWithLlama, generateTitle } from "./llama-engine";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    // إنشاء محادثة جديدة
    createConversation: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conversationId = await db.createConversation(ctx.user.id, input.title);
        return { conversationId };
      }),

    // الحصول على جميع محادثات المستخدم
    getConversations: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserConversations(ctx.user.id);
      }),

    // الحصول على رسائل محادثة معينة
    getMessages: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .query(async ({ ctx, input }) => {
        // إذا كان conversationId = 0 أو سالب، أرجع قائمة فارغة
        if (input.conversationId <= 0) {
          return [];
        }
        
        // التحقق من أن المحادثة تخص المستخدم
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          return []; // المحادثة غير موجودة
        }
        
        if (conversation.userId !== ctx.user.id) {
          throw new Error("Unauthorized"); // المحادثة لا تخص المستخدم
        }
        
        return await db.getConversationMessages(input.conversationId);
      }),

    // إرسال رسالة
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number().optional(),
        message: z.string(),
        useDeepThinking: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        let conversationId = input.conversationId;
        
        // إنشاء محادثة جديدة إذا لم تكن موجودة
        if (!conversationId) {
          conversationId = await db.createConversation(ctx.user.id);
        } else {
          // التحقق من أن المحادثة تخص المستخدم
          const conversation = await db.getConversationById(conversationId);
          if (!conversation || conversation.userId !== ctx.user.id) {
            throw new Error("Unauthorized");
          }
        }

        // حفظ رسالة المستخدم
        await db.addMessage(conversationId, "user", input.message);

        // الحصول على تاريخ المحادثة
        const messages = await db.getConversationMessages(conversationId);
        const conversationHistory = messages.map(m => ({
          role: m.role,
          content: m.content
        }));

        // معالجة الاستعلام
        const result = await processWithLlama(
          ctx.user.id,
          input.message,
          conversationHistory,
          input.useDeepThinking
        );

        // حفظ رد المساعد
        await db.addMessage(
          conversationId,
          "assistant",
          result.response,
          input.useDeepThinking,
          result.thinkingProcess
        );

        // توليد عنوان للمحادثة إذا كانت أول رسالة
        if (messages.length === 1) {
          const title = await generateTitle(input.message);
          await db.updateConversationTitle(conversationId, title);
        }

        return {
          conversationId,
          response: result.response,
          status: result.status,
          thinkingProcess: result.thinkingProcess,
        };
      }),

    // حذف محادثة
    deleteConversation: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        // التحقق من أن المحادثة تخص المستخدم
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        await db.deleteConversation(input.conversationId);
        return { success: true };
      }),

    // تحديث عنوان المحادثة
    updateTitle: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        title: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // التحقق من أن المحادثة تخص المستخدم
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation || conversation.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        await db.updateConversationTitle(input.conversationId, input.title);
        return { success: true };
      }),
  }),

  memory: router({
    // الحصول على حقائق المستخدم
    getFacts: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserFacts(ctx.user.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;

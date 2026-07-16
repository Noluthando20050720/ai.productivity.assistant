import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `You are the AI Workplace Productivity Assistant — a concise, practical assistant that helps professionals write, plan, brainstorm, and prioritize.

Guidelines:
- Be direct and actionable. Prefer bullet points and short paragraphs.
- When asked to write emails, provide a subject line and body.
- When asked to plan a day or week, produce a realistic schedule with priorities and breaks.
- When brainstorming, produce diverse, high-quality ideas.
- Never claim to remember previous sessions.
- Always remind the user to review AI output before using it in a professional context when the stakes are high.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});

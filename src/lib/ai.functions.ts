import { createServerFn } from "@tanstack/react-start";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";

const EmailInput = z.object({
  subject: z.string().min(1),
  purpose: z.string().min(1),
  tone: z.enum(["Formal", "Friendly", "Persuasive"]),
  instructions: z.string().optional().default(""),
});

const ScheduleInput = z.object({
  scheduleType: z.enum(["Daily", "Weekly"]),
  workStart: z.string(),
  workEnd: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      priority: z.enum(["High", "Medium", "Low"]),
      estMinutes: z.number().optional(),
    }),
  ),
  notes: z.string().optional().default(""),
});

async function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  return createLovableAiGatewayProvider(key);
}

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data }) => {
    const gateway = await getGateway();
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `Write a professional email.

Subject hint: ${data.subject}
Purpose: ${data.purpose}
Tone: ${data.tone}
${data.instructions ? `Additional instructions: ${data.instructions}` : ""}

Return a polished subject line and email body. Keep it concise, well-structured, and ready to send. Use appropriate greeting and sign-off.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({
          schema: z.object({ subject: z.string(), body: z.string() }),
        }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return { subject: data.subject, body: error.text ?? "" };
      }
      throw error;
    }
  });

export const generateSchedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScheduleInput.parse(input))
  .handler(async ({ data }) => {
    const gateway = await getGateway();
    const model = gateway("google/gemini-3-flash-preview");

    const taskList = data.tasks
      .map((t, i) => `${i + 1}. [${t.priority}] ${t.title}${t.estMinutes ? ` (~${t.estMinutes}m)` : ""}`)
      .join("\n");

    const prompt = `Create a realistic ${data.scheduleType.toLowerCase()} schedule.

Working hours: ${data.workStart} to ${data.workEnd}
Tasks:
${taskList}
${data.notes ? `Notes: ${data.notes}` : ""}

Rules:
- Schedule High priority tasks earlier in the day when focus is best.
- Include short breaks (5-10 min) between deep work blocks and a lunch break for daily schedules.
- Times must fall within working hours.
- For weekly schedules, distribute tasks across weekdays; for daily schedules use "Today" as the day.
- Keep block titles concise.

Return ONLY a JSON object with this exact shape (no extra keys, no prose):
{
  "blocks": [
    { "day": "Today" | "Monday" | ..., "time": "09:00 - 10:00", "title": "Concise task name", "priority": "High" | "Medium" | "Low" | "Break", "isBreak": false }
  ]
}
Use priority "Break" and isBreak true for break/lunch blocks.`;

    const schema = z.object({
      blocks: z.array(
        z.object({
          day: z.string(),
          time: z.string(),
          title: z.string(),
          priority: z.enum(["High", "Medium", "Low", "Break"]),
          isBreak: z.boolean(),
        }),
      ),
    });

    type Block = z.infer<typeof schema>["blocks"][number];

    const normalizeBlock = (raw: Record<string, unknown>, fallbackDay: string): Block | null => {
      const time = String(raw.time ?? raw.time_slot ?? raw.timeSlot ?? raw.slot ?? raw.when ?? "").trim();
      const title = String(raw.title ?? raw.activity ?? raw.task ?? raw.name ?? raw.description ?? "").trim();
      if (!time || !title) return null;
      const rawPriority = String(raw.priority ?? "").trim().toLowerCase();
      const isBreak =
        raw.isBreak === true ||
        raw.is_break === true ||
        rawPriority === "break" ||
        /break|lunch/i.test(title);
      const priority: Block["priority"] = isBreak
        ? "Break"
        : rawPriority.startsWith("h")
          ? "High"
          : rawPriority.startsWith("l")
            ? "Low"
            : "Medium";
      return {
        day: String(raw.day ?? raw.weekday ?? fallbackDay).trim() || fallbackDay,
        time,
        title,
        priority,
        isBreak,
      };
    };

    const parseFallback = (text: string): { blocks: Block[] } => {
      const fallbackDay = data.scheduleType === "Weekly" ? "Monday" : "Today";
      const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const tryParse = (candidate: string): unknown => {
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      };
      let parsed: unknown = tryParse(trimmed);
      if (parsed == null) {
        const match = trimmed.match(/[[{][\s\S]*[\]}]/);
        if (match) parsed = tryParse(match[0]);
      }
      if (parsed == null) return { blocks: [] };
      const rawArray: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { blocks?: unknown }).blocks)
          ? ((parsed as { blocks: unknown[] }).blocks)
          : Array.isArray((parsed as { schedule?: unknown }).schedule)
            ? ((parsed as { schedule: unknown[] }).schedule)
            : [];
      const blocks = rawArray
        .filter((b): b is Record<string, unknown> => typeof b === "object" && b !== null)
        .map((b) => normalizeBlock(b, fallbackDay))
        .filter((b): b is Block => b !== null);
      return { blocks };
    };

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return parseFallback(error.text ?? "");
      }
      throw error;
    }
  });

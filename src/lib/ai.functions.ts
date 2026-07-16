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
      const { experimental_output } = await generateText({
        model,
        experimental_output: Output.object({
          schema: z.object({ subject: z.string(), body: z.string() }),
        }),
        prompt,
      });
      return experimental_output;
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
- For weekly schedules, distribute tasks across weekdays.
- Keep block titles concise.`;

    try {
      const { experimental_output } = await generateText({
        model,
        experimental_output: Output.object({
          schema: z.object({
            blocks: z.array(
              z.object({
                day: z.string(),
                time: z.string(),
                title: z.string(),
                priority: z.enum(["High", "Medium", "Low", "Break"]),
                isBreak: z.boolean(),
              }),
            ),
          }),
        }),
        prompt,
      });
      return experimental_output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        return { blocks: [] };
      }
      throw error;
    }
  });

import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, RefreshCw, Trash2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator — AI Workplace" },
      { name: "description", content: "Generate polished, professional emails in seconds." },
    ],
  }),
  component: EmailPage,
});

type Tone = "Formal" | "Friendly" | "Persuasive";

function EmailPage() {
  const generate = useServerFn(generateEmail);
  const [subject, setSubject] = useState("");
  const [purpose, setPurpose] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");
  const [instructions, setInstructions] = useState("");

  const [outSubject, setOutSubject] = useState("");
  const [outBody, setOutBody] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const result = await generate({
        data: { subject, purpose, tone, instructions },
      });
      return result;
    },
    onSuccess: (data) => {
      setOutSubject(data.subject);
      setOutBody(data.body);
    },
    onError: (err: Error) => toast.error(err.message || "Something went wrong"),
  });

  const canSubmit = subject.trim().length > 0 && purpose.trim().length > 0 && !mutation.isPending;

  const copyAll = async () => {
    await navigator.clipboard.writeText(`Subject: ${outSubject}\n\n${outBody}`);
    toast.success("Email copied to clipboard");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <Mail className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">Smart Email Generator</h1>
          <p className="text-sm text-muted-foreground">Describe the email, pick a tone, and edit the result.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject or topic</Label>
              <Input
                id="subject"
                placeholder="e.g. Follow-up on Q3 proposal"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose or prompt</Label>
              <Textarea
                id="purpose"
                placeholder="What do you want the email to accomplish? Who is the recipient?"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={(v) => setTone(v as Tone)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Formal">Formal</SelectItem>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Persuasive">Persuasive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructions">Additional instructions (optional)</Label>
                <Input
                  id="instructions"
                  placeholder="e.g. Mention the meeting on Friday"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  "Generate email"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubject("");
                  setPurpose("");
                  setInstructions("");
                  setOutSubject("");
                  setOutBody("");
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="font-display text-lg">Draft</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => mutation.mutate()}
                disabled={!canSubmit || !outBody}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
              <Button size="sm" onClick={copyAll} disabled={!outBody}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="out-subject">Subject</Label>
              <Input
                id="out-subject"
                value={outSubject}
                onChange={(e) => setOutSubject(e.target.value)}
                placeholder="Generated subject will appear here"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="out-body">Body</Label>
              <Textarea
                id="out-body"
                value={outBody}
                onChange={(e) => setOutBody(e.target.value)}
                placeholder="Generated email will appear here. It is fully editable."
                rows={16}
                className="font-sans"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <AiDisclaimer />
    </div>
  );
}

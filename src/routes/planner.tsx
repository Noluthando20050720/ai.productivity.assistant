import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Copy, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AiDisclaimer } from "@/components/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { generateSchedule } from "@/lib/ai.functions";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner — AI Workplace" },
      { name: "description", content: "Turn your task list into a realistic daily or weekly schedule." },
    ],
  }),
  component: PlannerPage,
});

type Priority = "High" | "Medium" | "Low";
type Task = { id: string; title: string; priority: Priority };
type Block = { day: string; time: string; title: string; priority: Priority | "Break"; isBreak: boolean };

const priorityStyle: Record<Priority | "Break", string> = {
  High: "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-accent/10 text-accent border-accent/30",
  Low: "bg-muted text-muted-foreground border-border",
  Break: "bg-secondary text-secondary-foreground border-border",
};

function newTask(): Task {
  return { id: Math.random().toString(36).slice(2), title: "", priority: "Medium" };
}

function PlannerPage() {
  const generate = useServerFn(generateSchedule);
  const [scheduleType, setScheduleType] = useState<"Daily" | "Weekly">("Daily");
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:30");
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "", priority: "High" },
    { id: "2", title: "", priority: "Medium" },
  ]);
  const [blocks, setBlocks] = useState<Block[]>([]);

  const mutation = useMutation({
    mutationFn: async () => {
      const cleaned = tasks.filter((t) => t.title.trim().length > 0);
      if (cleaned.length === 0) throw new Error("Add at least one task.");
      const result = await generate({
        data: {
          scheduleType,
          workStart,
          workEnd,
          tasks: cleaned.map((t) => ({ title: t.title, priority: t.priority })),
          notes,
        },
      });
      return result;
    },
    onSuccess: (data) => setBlocks(data.blocks as Block[]),
    onError: (err: Error) => toast.error(err.message || "Something went wrong"),
  });

  const updateTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));
  const addTask = () => setTasks((prev) => [...prev, newTask()]);

  const updateBlock = (i: number, patch: Partial<Block>) =>
    setBlocks((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const removeBlock = (i: number) => setBlocks((prev) => prev.filter((_, idx) => idx !== i));

  const copySchedule = async () => {
    const text = blocks
      .map((b) => `${scheduleType === "Weekly" ? `${b.day} · ` : ""}${b.time} — ${b.title}${b.isBreak ? " (break)" : ` [${b.priority}]`}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Schedule copied to clipboard");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold sm:text-3xl">AI Task Planner</h1>
          <p className="text-sm text-muted-foreground">
            Prioritized schedule with realistic breaks, built from your task list.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader>
            <CardTitle className="font-display text-lg">Inputs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={scheduleType} onValueChange={(v) => setScheduleType(v as "Daily" | "Weekly")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="Daily">Daily</TabsTrigger>
                <TabsTrigger value="Weekly">Weekly</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start</Label>
                <Input id="start" type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End</Label>
                <Input id="end" type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tasks</Label>
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex gap-2">
                    <Input
                      placeholder="Task description"
                      value={t.title}
                      onChange={(e) => updateTask(t.id, { title: e.target.value })}
                      className="flex-1"
                    />
                    <Select value={t.priority} onValueChange={(v) => updateTask(t.id, { priority: v as Priority })}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTask(t.id)}
                      disabled={tasks.length === 1}
                      aria-label="Remove task"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addTask}>
                <Plus className="mr-1 h-4 w-4" /> Add task
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Meetings, constraints, focus preferences..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building schedule...
                  </>
                ) : (
                  "Generate schedule"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTasks([newTask()]);
                  setNotes("");
                  setBlocks([]);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle className="font-display text-lg">Schedule</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || blocks.length === 0}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
              </Button>
              <Button size="sm" onClick={copySchedule} disabled={blocks.length === 0}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {blocks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/70 p-6 text-center text-sm text-muted-foreground">
                Your generated schedule will appear here. Every block is editable.
              </p>
            ) : (
              <ul className="space-y-2">
                {blocks.map((b, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border/70 bg-card p-3"
                  >
                    <div className="flex flex-col items-center gap-1 text-xs">
                      {scheduleType === "Weekly" && (
                        <Input
                          value={b.day}
                          onChange={(e) => updateBlock(i, { day: e.target.value })}
                          className="h-7 w-20 text-center text-xs"
                        />
                      )}
                      <Input
                        value={b.time}
                        onChange={(e) => updateBlock(i, { time: e.target.value })}
                        className="h-7 w-24 text-center text-xs"
                      />
                    </div>
                    <Input
                      value={b.title}
                      onChange={(e) => updateBlock(i, { title: e.target.value })}
                      className="border-transparent bg-transparent px-2 shadow-none focus-visible:border-input focus-visible:bg-background"
                    />
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={priorityStyle[b.priority]}>
                        {b.isBreak ? "Break" : b.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBlock(i)}
                        aria-label="Remove block"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AiDisclaimer />
    </div>
  );
}

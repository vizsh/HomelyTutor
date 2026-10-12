import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { planToolSchema } from "@/lib/plan/plan-schema";
import { generateMockPlan } from "@/lib/plan/generate-mock-plan";
import type { LearningPlan } from "@/lib/plan/types";
import { getActiveUserId } from "@/lib/active-user";
import { savePlan } from "@/lib/db/queries";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a learning-path planner inside a study app. Given a learner's goal (which may be vague), produce a structured, realistic curriculum.

Rules:
- Use the web_search tool to find current, real, authoritative resources for each stage (official docs, a well-regarded course, a solid video series, etc).
- Only ever include a "url" for a resource you actually found via search. Never invent a URL — if you didn't verify it, omit the url field and keep just the label.
- Order stages so each builds on the last. 4-6 stages is typical.
- Keep summaries concrete and specific to the goal, not generic filler.
- When research is complete, call emit_learning_plan exactly once with the full plan. Do not respond with plain text.`;

export async function POST(req: Request) {
  let goal: string;
  try {
    const body = await req.json();
    goal = typeof body?.goal === "string" ? body.goal.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!goal || goal.length > 500) {
    return NextResponse.json(
      { error: "Goal must be a non-empty string under 500 characters." },
      { status: 400 },
    );
  }

  const userId = await getActiveUserId();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const plan = await generateMockPlan(goal);
    savePlan(userId, plan, true);
    return NextResponse.json({ plan, mocked: true });
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-5-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Learner's goal: ${goal}` }],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 8,
        } satisfies Anthropic.Messages.WebSearchTool20250305,
        {
          name: planToolSchema.name,
          description: planToolSchema.description,
          input_schema: planToolSchema.input_schema as Anthropic.Messages.Tool.InputSchema,
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === "tool_use" && block.name === planToolSchema.name,
    );

    if (!toolUse) {
      const plan = await generateMockPlan(goal);
      savePlan(userId, plan, true);
      return NextResponse.json({ plan, mocked: true, reason: "model_did_not_emit_plan" });
    }

    const plan = toolUse.input as LearningPlan;
    savePlan(userId, plan, false);
    return NextResponse.json({ plan, mocked: false });
  } catch (err) {
    console.error("plan generation failed", err);
    const plan = await generateMockPlan(goal);
    savePlan(userId, plan, true);
    return NextResponse.json({ plan, mocked: true, reason: "generation_error" });
  }
}

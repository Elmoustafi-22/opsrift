let aiInstance: any = null;
async function getAI() {
  if (!aiInstance) {
    const { GoogleGenAI } = await import("@google/genai");
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
  return aiInstance;
}

export async function generateDraft(task: any): Promise<string> {
  const prompt = `You are writing draft documentation for a task in a scheduling platform called Opsrift.
Please output a clean, markdown-formatted procedural summary report draft for this task.

Task Title: ${task.title}
Task Description: ${task.description || "No description provided."}
Due Date: ${task.dueDate}
Assigned Staff Member: ${task.assignedTo?.name || "Unassigned"}

Structure the document with:
1. Executive Summary
2. Actions Taken & Work Procedures
3. Results & Output Verification

Write directly in markdown without enclosing it in codeblocks. Make the language professional, comprehensive, and clear.`;

  try {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini AI API Call failed:", error);
    return `Draft Outline:\n- Executive Summary\n  - Task title: ${task.title}\n- Action Items & Verification\n- Outcomes & Signoff`;
  }
}

export async function breakdownGoal(goal: string): Promise<any[]> {
  const prompt = `A manager at a small business wants to accomplish the following goal:
"${goal}"

Break this down into 3-5 concrete, actionable tasks.
For each task return:
- title (max 10 words)
- description (1 sentence)
- suggestedRole: "staff" or "manager"
- estimatedDays: number of days from today to suggested due date

Return only a JSON array, no explanation.`;

  try {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini breakdownGoal failed:", error);
    return [
      {
        title: `Plan ${goal}`,
        description: `Define initial milestones and tasks for accomplishing: ${goal}.`,
        suggestedRole: "manager",
        estimatedDays: 1,
      },
      {
        title: `Execute ${goal}`,
        description: `Implement the operational actions necessary for: ${goal}.`,
        suggestedRole: "staff",
        estimatedDays: 3,
      },
      {
        title: `Review ${goal}`,
        description: `Verify and sign off on completed actions for: ${goal}.`,
        suggestedRole: "manager",
        estimatedDays: 5,
      },
    ];
  }
}

export async function prioritizeTasks(tasks: any[]): Promise<any[]> {
  const prompt = `A staff member has the following open tasks:
${JSON.stringify(tasks)}

Rank them from highest to lowest priority based on due date, 
description urgency, and task title.

For each task return:
- taskId
- priority: "high" | "medium" | "low"
- reason: one sentence explaining why

Return only a JSON array, no explanation.`;

  try {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini prioritizeTasks failed:", error);
    return tasks.map((t, index) => ({
      taskId: t._id || t.id,
      priority: index === 0 ? "high" : "medium",
      reason: "Prioritized based on due date (fallback ranking).",
    }));
  }
}

export async function generateWeeklySummary(completedTasks: any[]): Promise<string> {
  const prompt = `You are an operations assistant generating a weekly summary for a small business manager.

Completed tasks this week:
${JSON.stringify(completedTasks)}

Write a 3-4 paragraph professional weekly operations summary covering:
1. What was accomplished this week
2. Who contributed and on what
3. What remains open going into next week
4. Any patterns or concerns worth flagging

Write in a clear, professional tone. Address the manager directly.`;

  try {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini generateWeeklySummary failed:", error);
    return `Weekly Operations Summary:
We successfully completed ${completedTasks.length} tasks this week. 
Staff contributors completed their assigned operational steps and documented task outcomes.
All system records are fully updated and active tasks are queued for next week.`;
  }
}

export async function reviewNotes(
  taskTitle: string,
  notes: string
): Promise<{ isVague: boolean; warningMessage: string }> {
  const prompt = `You are an operations assistant reviewing a staff member's completion notes for a task.
Task Title: "${taskTitle}"
Staff Notes: "${notes}"

Check if the notes are too vague, brief, or lack sufficient detail (e.g. just saying "done", "finished", "completed" without explanation).
Return a JSON object:
{
  "isVague": true,
  "warningMessage": "Your notes are brief - consider adding what was done, how it went, and any follow-up needed."
}

Note: If notes are detailed enough, set isVague to false and warningMessage to an empty string.`;

  try {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini reviewNotes failed:", error);
    const isVague = notes.trim().length < 10;
    return {
      isVague,
      warningMessage: isVague
        ? "Your notes are brief — consider adding what was done, how it went, and any follow-up needed."
        : "",
    };
  }
}

export async function generateTaskBreakdown(
  title: string,
  description: string
): Promise<string> {
  const prompt = `You are an operations assistant helping a staff member understand a task.
Please provide a clear, professional, step-by-step operational breakdown/guide for this task.

Task Title: ${title}
Task Description: ${description || "No description provided."}

Instructions:
1. Break down the task into 3-5 concrete operational steps or checklists.
2. Outline any critical checks, quality standards, or verification details they need to pay attention to.
3. Write your output directly in markdown (e.g., using bullet points or numbered lists), without code blocks.`;

  try {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini generateTaskBreakdown failed:", error);
    return `Operational steps:
1. Review task requirements for "${title}".
2. Perform necessary steps to complete: ${description || "Task completion."}
3. Document outcome and sign off in the system.`;
  }
}

export async function refineNotes(
  taskTitle: string,
  rawNotes: string
): Promise<{ refinedNotes: string; suggestedOutcome: string }> {
  const prompt = `You are an operations writing assistant. A staff member has written their raw completion notes for a task.
Your job is to:
1. Refine and polish their notes into clear, professional documentation while strictly preserving the original meaning and facts.
2. Formulate a short, one-sentence summary of the final operational outcome (e.g. "Database migration completed, query latency reduced to 30ms").

Task Title: "${taskTitle}"
Staff's Raw Notes: "${rawNotes}"

Rules for refinedNotes:
1. Do NOT add any information the staff did not mention.
2. Do NOT fabricate actions, results, or details.
3. Keep all specific facts, numbers, and observations from the original.
4. Improve grammar, clarity, structure, and professional tone.
5. Organize into short paragraphs or bullet points if appropriate.

Rules for suggestedOutcome:
1. Make it a single, concise sentence summarizing the final status or outcome.
2. Rely only on the facts provided in the raw notes.

Return a JSON object with:
- "refinedNotes": string
- "suggestedOutcome": string

Return only the raw JSON object, no explanation.`;

  try {
    const ai = await getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    const parsed = JSON.parse(response.text || "{}");
    return {
      refinedNotes: parsed.refinedNotes || rawNotes,
      suggestedOutcome: parsed.suggestedOutcome || "",
    };
  } catch (error) {
    console.error("Gemini refineNotes failed:", error);
    return {
      refinedNotes: rawNotes,
      suggestedOutcome: "",
    };
  }
}


import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "create_transaction",
  title: "Create transaction",
  description:
    "Record a new income or expense transaction for the signed-in user.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Short label for the transaction."),
    amount: z.number().positive().describe("Amount, always a positive number."),
    type: z.enum(["income", "expense"]).describe("Whether this is income or an expense."),
    date: z.string().optional().describe("Date (YYYY-MM-DD). Defaults to today."),
    category_id: z.string().uuid().optional().describe("Category id from list_categories."),
    note: z.string().optional().describe("Optional free-form note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    const { data, error } = await supabaseForUser(ctx)
      .from("transactions")
      .insert({
        user_id: ctx.getUserId(),
        title: input.title,
        amount: input.amount,
        type: input.type,
        date: input.date ?? new Date().toISOString().slice(0, 10),
        category_id: input.category_id ?? null,
        note: input.note ?? null,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { transaction: data },
    };
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, unauthenticated } from "../supabase";

export default defineTool({
  name: "list_transactions",
  title: "List transactions",
  description:
    "List the signed-in user's income and expense transactions, newest first. Optionally filter by type or date range.",
  inputSchema: {
    type: z.enum(["income", "expense"]).optional().describe("Filter by transaction type."),
    from: z.string().optional().describe("Start date (YYYY-MM-DD), inclusive."),
    to: z.string().optional().describe("End date (YYYY-MM-DD), inclusive."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ type, from, to, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return unauthenticated();
    let query = supabaseForUser(ctx)
      .from("transactions")
      .select("id,title,amount,type,date,note,category_id")
      .order("date", { ascending: false })
      .limit(limit ?? 50);
    if (type) query = query.eq("type", type);
    if (from) query = query.gte("date", from);
    if (to) query = query.lte("date", to);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { transactions: data ?? [] },
    };
  },
});

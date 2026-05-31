import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createSourceRun = mutation({
  args: {
    jobId: v.id("searchJobs"),
    sourceName: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sourceRuns", {
      ...args,
      startedAt: Date.now(),
      totalRaw: 0,
      totalNormalized: 0,
      totalErrors: 0,
    });
  },
});

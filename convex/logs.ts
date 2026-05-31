import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const appendJobLog = mutation({
  args: {
    jobId: v.id("searchJobs"),
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("debug")),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobLogs", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const appendJobLogExternal = mutation({
  args: {
    externalJobId: v.string(),
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("debug")),
    message: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("searchJobs")
      .withIndex("by_external_job_id", (q) => q.eq("externalJobId", args.externalJobId))
      .unique();
    if (!job) return null;
    return await ctx.db.insert("jobLogs", {
      jobId: job._id,
      level: args.level,
      message: args.message,
      metadata: args.metadata,
      createdAt: args.createdAt,
    });
  },
});

export const listJobLogs = query({
  args: { jobId: v.id("searchJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.query("jobLogs").withIndex("by_job", (q) => q.eq("jobId", args.jobId)).collect();
  },
});

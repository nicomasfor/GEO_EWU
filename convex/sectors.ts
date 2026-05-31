import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listSectors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sectors").collect();
  },
});

export const upsertSector = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    enabled: v.boolean(),
    defaultCategories: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("sectors")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("sectors", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

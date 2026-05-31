import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const boundingBox = v.object({
  south: v.number(),
  west: v.number(),
  north: v.number(),
  east: v.number(),
});

export const createLocation = mutation({
  args: {
    label: v.string(),
    type: v.union(v.literal("city"), v.literal("country"), v.literal("address"), v.literal("custom_area")),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    boundingBox: v.optional(boundingBox),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("locations", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getLocation = query({
  args: { id: v.id("locations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

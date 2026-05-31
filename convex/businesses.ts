import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

async function upsertBusinessRecord(ctx: any, args: any) {
  const now = Date.now();
  const existing =
    args.osmId && args.osmType
      ? await ctx.db
          .query("businesses")
          .withIndex("by_osm", (q: any) => q.eq("osmType", args.osmType).eq("osmId", args.osmId))
          .unique()
      : null;

  if (existing) {
    await ctx.db.patch(existing._id, {
      ...args,
      sourceCount: existing.sourceCount + 1,
      lastSeenAt: now,
      updatedAt: now,
    });
    return existing._id;
  }

  return await ctx.db.insert("businesses", {
    ...args,
    status: "active",
    sourceCount: 1,
    firstSeenAt: now,
    lastSeenAt: now,
    createdAt: now,
    updatedAt: now,
  });
}

export const upsertBusiness = mutation({
  args: {
    canonicalName: v.string(),
    normalizedName: v.string(),
    sectorSlug: v.string(),
    primaryCategory: v.string(),
    rawCategories: v.array(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    openingHours: v.optional(v.string()),
    osmId: v.optional(v.string()),
    osmType: v.optional(v.string()),
    confidenceScore: v.number(),
    lastJobId: v.optional(v.id("searchJobs")),
  },
  handler: async (ctx, args) => {
    return await upsertBusinessRecord(ctx, args);
  },
});

export const addBusinessSource = mutation({
  args: {
    businessId: v.id("businesses"),
    sourceName: v.string(),
    sourceExternalId: v.string(),
    sourceUrl: v.optional(v.string()),
    rawName: v.optional(v.string()),
    rawAddress: v.optional(v.string()),
    rawPhone: v.optional(v.string()),
    rawWebsite: v.optional(v.string()),
    rawCategories: v.array(v.string()),
    rawPayload: v.any(),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("businessSources", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const upsertBusinessExternal = mutation({
  args: {
    externalJobId: v.string(),
    canonicalName: v.string(),
    normalizedName: v.string(),
    sectorSlug: v.string(),
    primaryCategory: v.string(),
    rawCategories: v.array(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    region: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    openingHours: v.optional(v.string()),
    osmId: v.optional(v.string()),
    osmType: v.optional(v.string()),
    confidenceScore: v.number(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("searchJobs")
      .withIndex("by_external_job_id", (q) => q.eq("externalJobId", args.externalJobId))
      .unique();
    if (!job) return null;

    return await upsertBusinessRecord(ctx, {
      ...args,
      lastJobId: job._id,
    });
  },
});

export const addBusinessSourceExternal = mutation({
  args: {
    externalJobId: v.string(),
    sourceName: v.string(),
    sourceExternalId: v.string(),
    sourceUrl: v.optional(v.string()),
    rawName: v.optional(v.string()),
    rawAddress: v.optional(v.string()),
    rawPhone: v.optional(v.string()),
    rawWebsite: v.optional(v.string()),
    rawCategories: v.array(v.string()),
    rawPayload: v.any(),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const business = await ctx.db
      .query("businesses")
      .withIndex("by_osm", (q) => q.eq("osmType", args.sourceExternalId.split("/")[0]).eq("osmId", args.sourceExternalId.split("/")[1]))
      .unique();

    if (!business) return null;

    return await ctx.db.insert("businessSources", {
      businessId: business._id,
      sourceName: args.sourceName,
      sourceExternalId: args.sourceExternalId,
      sourceUrl: args.sourceUrl,
      rawName: args.rawName,
      rawAddress: args.rawAddress,
      rawPhone: args.rawPhone,
      rawWebsite: args.rawWebsite,
      rawCategories: args.rawCategories,
      rawPayload: args.rawPayload,
      fetchedAt: args.fetchedAt,
      createdAt: Date.now(),
    });
  },
});

export const listBusinessesByJob = query({
  args: { jobId: v.id("searchJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.query("businesses").withIndex("by_last_job", (q) => q.eq("lastJobId", args.jobId)).collect();
  },
});

export const listBusinessesByLocationSector = query({
  args: {
    countryCode: v.optional(v.string()),
    city: v.optional(v.string()),
    sectorSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const bySector = await ctx.db.query("businesses").withIndex("by_sector", (q) => q.eq("sectorSlug", args.sectorSlug)).collect();
    return bySector.filter((business) => {
      if (args.countryCode && business.countryCode !== args.countryCode) return false;
      if (args.city && business.city !== args.city) return false;
      return true;
    });
  },
});

export const getBusinessDetail = query({
  args: { id: v.id("businesses") },
  handler: async (ctx, args) => {
    const business = await ctx.db.get(args.id);
    if (!business) return null;
    const sources = await ctx.db
      .query("businessSources")
      .filter((q) => q.eq(q.field("businessId"), args.id))
      .collect();
    return { business, sources };
  },
});

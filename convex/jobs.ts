import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const jobStatus = v.union(
  v.literal("pending"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled"),
);

const externalJobArgs = {
  id: v.string(),
  location: v.any(),
  sectorSlug: v.string(),
  sourceMode: v.string(),
  status: jobStatus,
  progress: v.number(),
  currentStep: v.string(),
  totalFound: v.number(),
  totalInserted: v.number(),
  totalUpdated: v.number(),
  totalDuplicates: v.number(),
  errorMessage: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const createSearchJob = mutation({
  args: {
    sectorId: v.id("sectors"),
    locationId: v.id("locations"),
    requestedBy: v.optional(v.string()),
    sourceMode: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("searchJobs", {
      status: "pending",
      sectorId: args.sectorId,
      locationId: args.locationId,
      requestedBy: args.requestedBy,
      sourceMode: args.sourceMode,
      totalFound: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalDuplicates: 0,
      progress: 0,
      currentStep: "idle",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createSearchJobExternal = mutation({
  args: externalJobArgs,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("searchJobs")
      .withIndex("by_external_job_id", (q) => q.eq("externalJobId", args.id))
      .unique();

    if (existing) return existing._id;

    const sector = await ctx.db
      .query("sectors")
      .withIndex("by_slug", (q) => q.eq("slug", args.sectorSlug))
      .unique();

    if (!sector) {
      throw new Error(`Sector not found: ${args.sectorSlug}`);
    }

    const locationId = await ctx.db.insert("locations", {
      label: args.location.label,
      type: args.location.type,
      country: args.location.country,
      countryCode: args.location.countryCode,
      region: args.location.region,
      city: args.location.city,
      lat: args.location.lat,
      lng: args.location.lng,
      boundingBox: args.location.boundingBox,
      source: args.location.source ?? "api",
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });

    return await ctx.db.insert("searchJobs", {
      externalJobId: args.id,
      status: args.status,
      sectorId: sector._id,
      locationId,
      sourceMode: args.sourceMode,
      totalFound: args.totalFound,
      totalInserted: args.totalInserted,
      totalUpdated: args.totalUpdated,
      totalDuplicates: args.totalDuplicates,
      progress: args.progress,
      currentStep: args.currentStep,
      errorMessage: args.errorMessage,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  },
});

export const updateSearchJobProgress = mutation({
  args: {
    id: v.id("searchJobs"),
    status: jobStatus,
    progress: v.number(),
    currentStep: v.string(),
    totalFound: v.optional(v.number()),
    totalInserted: v.optional(v.number()),
    totalUpdated: v.optional(v.number()),
    totalDuplicates: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      progress: args.progress,
      currentStep: args.currentStep,
      totalFound: args.totalFound,
      totalInserted: args.totalInserted,
      totalUpdated: args.totalUpdated,
      totalDuplicates: args.totalDuplicates,
      updatedAt: Date.now(),
    });
  },
});

export const updateSearchJobProgressExternal = mutation({
  args: externalJobArgs,
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("searchJobs")
      .withIndex("by_external_job_id", (q) => q.eq("externalJobId", args.id))
      .unique();
    if (!job) return null;
    await ctx.db.patch(job._id, {
      status: args.status,
      progress: args.progress,
      currentStep: args.currentStep,
      totalFound: args.totalFound,
      totalInserted: args.totalInserted,
      totalUpdated: args.totalUpdated,
      totalDuplicates: args.totalDuplicates,
      errorMessage: args.errorMessage,
      updatedAt: args.updatedAt,
    });
    return job._id;
  },
});

export const completeSearchJob = mutation({
  args: { id: v.id("searchJobs") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      progress: 100,
      currentStep: "completed",
      finishedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const completeSearchJobExternal = mutation({
  args: externalJobArgs,
  handler: async (ctx, args) => {
    const job = await ctx.db
      .query("searchJobs")
      .withIndex("by_external_job_id", (q) => q.eq("externalJobId", args.id))
      .unique();
    if (!job) return null;
    await ctx.db.patch(job._id, {
      status: "completed",
      progress: 100,
      currentStep: "completed",
      totalFound: args.totalFound,
      totalInserted: args.totalInserted,
      totalUpdated: args.totalUpdated,
      totalDuplicates: args.totalDuplicates,
      finishedAt: args.updatedAt,
      updatedAt: args.updatedAt,
    });
    return job._id;
  },
});

export const failSearchJob = mutation({
  args: { id: v.id("searchJobs"), errorMessage: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      currentStep: "failed",
      errorMessage: args.errorMessage,
      finishedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getSearchJob = query({
  args: { id: v.id("searchJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

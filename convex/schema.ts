import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sectors: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    enabled: v.boolean(),
    defaultCategories: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),

  locations: defineTable({
    label: v.string(),
    type: v.union(v.literal("city"), v.literal("country"), v.literal("address"), v.literal("custom_area")),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
    region: v.optional(v.string()),
    city: v.optional(v.string()),
    lat: v.number(),
    lng: v.number(),
    boundingBox: v.optional(
      v.object({
        south: v.number(),
        west: v.number(),
        north: v.number(),
        east: v.number(),
      }),
    ),
    source: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_country_city", ["countryCode", "city"]),

  searchJobs: defineTable({
    externalJobId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
    sectorId: v.id("sectors"),
    locationId: v.id("locations"),
    requestedBy: v.optional(v.string()),
    sourceMode: v.string(),
    totalFound: v.number(),
    totalInserted: v.number(),
    totalUpdated: v.number(),
    totalDuplicates: v.number(),
    progress: v.number(),
    currentStep: v.string(),
    errorMessage: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_external_job_id", ["externalJobId"]),

  businesses: defineTable({
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
    status: v.string(),
    confidenceScore: v.number(),
    sourceCount: v.number(),
    firstSeenAt: v.number(),
    lastSeenAt: v.number(),
    lastJobId: v.optional(v.id("searchJobs")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sector", ["sectorSlug"])
    .index("by_country_city", ["countryCode", "city"])
    .index("by_osm", ["osmType", "osmId"])
    .index("by_last_job", ["lastJobId"]),

  businessSources: defineTable({
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
    createdAt: v.number(),
  }).index("by_source_external_id", ["sourceName", "sourceExternalId"]),

  jobLogs: defineTable({
    jobId: v.id("searchJobs"),
    level: v.union(v.literal("info"), v.literal("warning"), v.literal("error"), v.literal("debug")),
    message: v.string(),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_job", ["jobId"]),

  sourceRuns: defineTable({
    jobId: v.id("searchJobs"),
    sourceName: v.string(),
    status: v.string(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    totalRaw: v.number(),
    totalNormalized: v.number(),
    totalErrors: v.number(),
    errorMessage: v.optional(v.string()),
  }).index("by_job_source", ["jobId", "sourceName"]),
});

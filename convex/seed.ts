import { mutation } from "./_generated/server";

export const seedHospitalitySector = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("sectors")
      .withIndex("by_slug", (q) => q.eq("slug", "hospitality"))
      .unique();

    const payload = {
      name: "Hosteleria",
      slug: "hospitality",
      description: "Restaurantes, cafeterias, bares, pubs y consumo presencial.",
      enabled: true,
      defaultCategories: ["restaurant", "cafe", "bar", "pub", "fast_food", "food_court", "ice_cream"],
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("sectors", {
      ...payload,
      createdAt: now,
    });
  },
});

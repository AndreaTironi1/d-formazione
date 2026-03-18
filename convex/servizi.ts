import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("servizi").collect();
  },
});

export const getById = query({
  args: { id: v.id("servizi") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCoe = query({
  args: { coeId: v.id("coe") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("servizi")
      .withIndex("by_coeId", (q) => q.eq("coeId", args.coeId))
      .collect();
  },
});

export const getAllWithCoe = query({
  args: {},
  handler: async (ctx) => {
    const servizi = await ctx.db.query("servizi").collect();
    const result = await Promise.all(
      servizi.map(async (s) => {
        const coe = await ctx.db.get(s.coeId);
        return { ...s, coe };
      })
    );
    return result;
  },
});

export const create = mutation({
  args: {
    nome: v.string(),
    coeId: v.id("coe"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("servizi", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("servizi"),
    nome: v.optional(v.string()),
    coeId: v.optional(v.id("coe")),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("servizi") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

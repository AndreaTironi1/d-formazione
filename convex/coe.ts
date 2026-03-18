import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("coe").collect();
  },
});

export const getById = query({
  args: { id: v.id("coe") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByIdCoe = query({
  args: { idCoe: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("coe")
      .withIndex("by_idCoe", (q) => q.eq("idCoe", args.idCoe))
      .first();
  },
});

export const getAllWithResponsabili = query({
  args: {},
  handler: async (ctx) => {
    const coeList = await ctx.db.query("coe").collect();
    const result = await Promise.all(
      coeList.map(async (coe) => {
        const responsabile = coe.responsabileId
          ? await ctx.db.get(coe.responsabileId)
          : null;
        return { ...coe, responsabile };
      })
    );
    return result;
  },
});

export const create = mutation({
  args: {
    idCoe: v.string(),
    nome: v.string(),
    responsabileId: v.optional(v.id("dipendenti")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("coe", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("coe"),
    idCoe: v.optional(v.string()),
    nome: v.optional(v.string()),
    responsabileId: v.optional(v.id("dipendenti")),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("coe") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

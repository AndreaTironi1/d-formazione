import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sedi").collect();
  },
});

export const getById = query({
  args: { id: v.id("sedi") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByIdSede = query({
  args: { idSede: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sedi")
      .withIndex("by_idSede", (q) => q.eq("idSede", args.idSede))
      .first();
  },
});

export const getAllWithResponsabili = query({
  args: {},
  handler: async (ctx) => {
    const sediList = await ctx.db.query("sedi").collect();
    const result = await Promise.all(
      sediList.map(async (sede) => {
        const responsabile = sede.responsabileId
          ? await ctx.db.get(sede.responsabileId)
          : null;
        return { ...sede, responsabile };
      })
    );
    return result;
  },
});

export const create = mutation({
  args: {
    idSede: v.string(),
    areaGeografica: v.string(),
    responsabileId: v.optional(v.id("dipendenti")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sedi", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("sedi"),
    idSede: v.optional(v.string()),
    areaGeografica: v.optional(v.string()),
    responsabileId: v.optional(v.id("dipendenti")),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("sedi") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

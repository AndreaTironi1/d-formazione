import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dipendenti").collect();
  },
});

export const getById = query({
  args: { id: v.id("dipendenti") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCoe = query({
  args: { coeId: v.id("coe") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dipendenti")
      .withIndex("by_coeId", (q) => q.eq("coeId", args.coeId))
      .collect();
  },
});

export const getBySede = query({
  args: { sedeId: v.id("sedi") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dipendenti")
      .withIndex("by_sedeId", (q) => q.eq("sedeId", args.sedeId))
      .collect();
  },
});

export const getAllWithRelations = query({
  args: {},
  handler: async (ctx) => {
    const dipendenti = await ctx.db.query("dipendenti").collect();
    const result = await Promise.all(
      dipendenti.map(async (d) => {
        const coe = d.coeId ? await ctx.db.get(d.coeId) : null;
        const sede = d.sedeId ? await ctx.db.get(d.sedeId) : null;
        const dipendenteCoE = await ctx.db
          .query("dipendenti_coe")
          .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", d._id))
          .collect();
        const coeMultipli = await Promise.all(
          dipendenteCoE.map(async (dc) => {
            const c = await ctx.db.get(dc.coeId);
            return { ...dc, coe: c };
          })
        );
        return { ...d, coe, sede, coeMultipli };
      })
    );
    return result;
  },
});

export const create = mutation({
  args: {
    nome: v.string(),
    email: v.optional(v.string()),
    seniority: v.optional(v.string()),
    ruolo: v.string(),
    coeId: v.optional(v.id("coe")),
    sedeId: v.optional(v.id("sedi")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dipendenti", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("dipendenti"),
    nome: v.optional(v.string()),
    email: v.optional(v.string()),
    seniority: v.optional(v.string()),
    ruolo: v.optional(v.string()),
    coeId: v.optional(v.id("coe")),
    sedeId: v.optional(v.id("sedi")),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("dipendenti") },
  handler: async (ctx, args) => {
    // Remove related dipendenti_coe records first
    const related = await ctx.db
      .query("dipendenti_coe")
      .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.id))
      .collect();
    for (const r of related) {
      await ctx.db.delete(r._id);
    }
    // Remove related iscrizioni
    const iscrizioni = await ctx.db
      .query("iscrizioni")
      .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.id))
      .collect();
    for (const i of iscrizioni) {
      await ctx.db.delete(i._id);
    }
    await ctx.db.delete(args.id);
  },
});

// dipendenti_coe operations
export const addCoeAssociation = mutation({
  args: {
    dipendenteId: v.id("dipendenti"),
    coeId: v.id("coe"),
    percentuale: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dipendenti_coe", args);
  },
});

export const removeCoeAssociation = mutation({
  args: { id: v.id("dipendenti_coe") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getCoeAssociations = query({
  args: { dipendenteId: v.id("dipendenti") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dipendenti_coe")
      .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.dipendenteId))
      .collect();
  },
});

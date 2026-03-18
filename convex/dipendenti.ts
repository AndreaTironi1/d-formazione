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
        const dipendenteSedi = await ctx.db
          .query("dipendenti_sedi")
          .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", d._id))
          .collect();
        const sediMultiple = await Promise.all(
          dipendenteSedi.map(async (ds) => {
            const s = await ctx.db.get(ds.sedeId);
            return { ...ds, sede: s };
          })
        );
        return { ...d, coe, sede, coeMultipli, sediMultiple };
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
    for (const r of await ctx.db.query("dipendenti_coe").withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.id)).collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("dipendenti_sedi").withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.id)).collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("iscrizioni").withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.id)).collect()) {
      await ctx.db.delete(r._id);
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

// Rimpiazza tutte le associazioni CoE di un dipendente in una sola operazione
export const replaceCoeAssociations = mutation({
  args: {
    dipendenteId: v.id("dipendenti"),
    entries: v.array(v.object({
      coeId: v.id("coe"),
      percentuale: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dipendenti_coe")
      .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.dipendenteId))
      .collect();
    for (const r of existing) await ctx.db.delete(r._id);
    for (const e of args.entries) {
      await ctx.db.insert("dipendenti_coe", {
        dipendenteId: args.dipendenteId,
        coeId: e.coeId,
        percentuale: e.percentuale,
      });
    }
    await ctx.db.patch(args.dipendenteId, { coeId: args.entries[0]?.coeId });
  },
});

// Rimpiazza tutte le associazioni Sede di un dipendente in una sola operazione
export const replaceSedeAssociations = mutation({
  args: {
    dipendenteId: v.id("dipendenti"),
    entries: v.array(v.object({
      sedeId: v.id("sedi"),
      percentuale: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dipendenti_sedi")
      .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.dipendenteId))
      .collect();
    for (const r of existing) await ctx.db.delete(r._id);
    for (const e of args.entries) {
      await ctx.db.insert("dipendenti_sedi", {
        dipendenteId: args.dipendenteId,
        sedeId: e.sedeId,
        percentuale: e.percentuale,
      });
    }
    await ctx.db.patch(args.dipendenteId, { sedeId: args.entries[0]?.sedeId });
  },
});

// dipendenti_sedi operations
export const addSedeAssociation = mutation({
  args: {
    dipendenteId: v.id("dipendenti"),
    sedeId: v.id("sedi"),
    percentuale: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dipendenti_sedi", args);
  },
});

export const removeSedeAssociation = mutation({
  args: { id: v.id("dipendenti_sedi") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getSedeAssociations = query({
  args: { dipendenteId: v.id("dipendenti") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dipendenti_sedi")
      .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.dipendenteId))
      .collect();
  },
});

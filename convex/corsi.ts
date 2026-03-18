import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("corsi").collect();
  },
});

export const getById = query({
  args: { id: v.id("corsi") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCoe = query({
  args: { coeId: v.id("coe") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("corsi")
      .withIndex("by_coeId", (q) => q.eq("coeId", args.coeId))
      .collect();
  },
});

export const getByPriorita = query({
  args: { priorita: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("corsi")
      .withIndex("by_priorita", (q) => q.eq("priorita", args.priorita))
      .collect();
  },
});

export const getAllWithCoe = query({
  args: {},
  handler: async (ctx) => {
    const corsi = await ctx.db.query("corsi").collect();
    const result = await Promise.all(
      corsi.map(async (c) => {
        const coe = c.coeId ? await ctx.db.get(c.coeId) : null;
        return { ...c, coe };
      })
    );
    return result;
  },
});

const schedaFields = {
  owner: v.optional(v.string()),
  tutor: v.optional(v.string()),
  docenza: v.optional(v.string()),
  nomeDocenteAula: v.optional(v.string()),
  nomeDocenteOnboarding: v.optional(v.string()),
  durataOre: v.optional(v.number()),
  dataInizio: v.optional(v.string()),
  dataFine: v.optional(v.string()),
  modalitaErogazione: v.optional(v.string()),
  onboardingOre: v.optional(v.number()),
  competenzaSapere: v.optional(v.string()),
  competenzaSaperFare: v.optional(v.string()),
  outputTipici: v.optional(v.string()),
};

export const create = mutation({
  args: {
    idCorso: v.string(),
    titolo: v.string(),
    ambito: v.string(),
    destinatari: v.string(),
    oreAula: v.optional(v.number()),
    priorita: v.number(),
    coeId: v.optional(v.id("coe")),
    ...schedaFields,
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("corsi", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("corsi"),
    idCorso: v.optional(v.string()),
    titolo: v.optional(v.string()),
    ambito: v.optional(v.string()),
    destinatari: v.optional(v.string()),
    oreAula: v.optional(v.number()),
    priorita: v.optional(v.number()),
    coeId: v.optional(v.id("coe")),
    ...schedaFields,
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("corsi") },
  handler: async (ctx, args) => {
    // Remove related iscrizioni first
    const iscrizioni = await ctx.db
      .query("iscrizioni")
      .withIndex("by_corsoId", (q) => q.eq("corsoId", args.id))
      .collect();
    for (const i of iscrizioni) {
      await ctx.db.delete(i._id);
    }
    await ctx.db.delete(args.id);
  },
});

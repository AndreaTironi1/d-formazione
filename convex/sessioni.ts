import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const giornoDef = v.object({
  data: v.string(),
  modalitaMattina: v.optional(v.union(v.literal("TOJ"), v.literal("Aula"))),
  mattinaInizio: v.optional(v.string()),
  mattinaFine: v.optional(v.string()),
  modalitaPomeriggio: v.optional(v.union(v.literal("TOJ"), v.literal("Aula"))),
  pomeriggioInizio: v.optional(v.string()),
  pomeriggioFine: v.optional(v.string()),
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("sessioni").collect();
  },
});

export const getById = query({
  args: { id: v.id("sessioni") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const getByCorso = query({
  args: { corsoId: v.id("corsi") },
  handler: async (ctx, { corsoId }) => {
    return ctx.db.query("sessioni").withIndex("by_corsoId", q => q.eq("corsoId", corsoId)).collect();
  },
});

export const getAllWithRelations = query({
  args: {},
  handler: async (ctx) => {
    const sessioni = await ctx.db.query("sessioni").collect();
    return Promise.all(sessioni.map(async (s) => {
      const corso = await ctx.db.get(s.corsoId);
      const iscrizioni = await ctx.db
        .query("iscrizioni")
        .withIndex("by_sessioneId", q => q.eq("sessioneId", s._id))
        .collect();
      return { ...s, corso, iscrizioniCount: iscrizioni.length };
    }));
  },
});

export const create = mutation({
  args: {
    corsoId: v.id("corsi"),
    tema: v.string(),
    dataInizio: v.optional(v.string()),
    dataFine: v.optional(v.string()),
    nomeDocenteAula: v.optional(v.string()),
    nomeDocenteOnboarding: v.optional(v.string()),
    note: v.optional(v.string()),
    giorniErogazione: v.optional(v.array(giornoDef)),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("sessioni", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("sessioni"),
    corsoId: v.optional(v.id("corsi")),
    tema: v.optional(v.string()),
    dataInizio: v.optional(v.string()),
    dataFine: v.optional(v.string()),
    nomeDocenteAula: v.optional(v.string()),
    nomeDocenteOnboarding: v.optional(v.string()),
    note: v.optional(v.string()),
    giorniErogazione: v.optional(v.array(giornoDef)),
  },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("sessioni") },
  handler: async (ctx, { id }) => {
    const iscrizioni = await ctx.db
      .query("iscrizioni")
      .withIndex("by_sessioneId", q => q.eq("sessioneId", id))
      .collect();
    for (const i of iscrizioni) await ctx.db.delete(i._id);
    await ctx.db.delete(id);
  },
});

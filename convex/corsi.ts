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
    return Promise.all(
      corsi.map(async (c) => {
        const coe = c.coeId ? await ctx.db.get(c.coeId) : null;
        const ambito = c.ambitoId ? await ctx.db.get(c.ambitoId) : null;
        const sessioni = await ctx.db
          .query("sessioni")
          .withIndex("by_corsoId", (q) => q.eq("corsoId", c._id))
          .collect();
        return {
          ...c,
          coe,
          ambito,
          ambitoNome: ambito?.nome ?? "",
          sessioniCount: sessioni.length,
        };
      })
    );
  },
});

const schedaFields = {
  anno: v.optional(v.number()),
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
    ambitoId: v.optional(v.id("ambiti")),
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
    ambitoId: v.optional(v.id("ambiti")),
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

export const migrateOwners = mutation({
  args: {},
  handler: async (ctx) => {
    const FALLBACK = "Donatella Passerini";
    const corsi = await ctx.db.query("corsi").collect();
    let aggiornati = 0;

    for (const c of corsi) {
      if (c.owner) continue; // già valorizzato, non sovrascrivere
      let ownerNome = FALLBACK;

      if (c.coeId) {
        const coe = await ctx.db.get(c.coeId);
        if (coe?.responsabileId) {
          const resp = await ctx.db.get(coe.responsabileId);
          if (resp?.nome) ownerNome = resp.nome;
        }
      }

      await ctx.db.patch(c._id, { owner: ownerNome });
      aggiornati++;
    }

    return { aggiornati };
  },
});

export const remove = mutation({
  args: { id: v.id("corsi") },
  handler: async (ctx, { id }) => {
    // Cascade: sessioni → iscrizioni → corso
    const sessioni = await ctx.db
      .query("sessioni")
      .withIndex("by_corsoId", (q) => q.eq("corsoId", id))
      .collect();
    for (const s of sessioni) {
      const iscrizioni = await ctx.db
        .query("iscrizioni")
        .withIndex("by_sessioneId", (q) => q.eq("sessioneId", s._id))
        .collect();
      for (const i of iscrizioni) await ctx.db.delete(i._id);
      await ctx.db.delete(s._id);
    }
    await ctx.db.delete(id);
  },
});

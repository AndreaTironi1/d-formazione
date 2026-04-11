import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("ambiti").order("asc").collect();
  },
});

export const getById = query({
  args: { id: v.id("ambiti") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByNome = query({
  args: { nome: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ambiti")
      .withIndex("by_nome", (q) => q.eq("nome", args.nome))
      .first();
  },
});

export const create = mutation({
  args: {
    nome: v.string(),
    descrizione: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ambiti", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("ambiti"),
    nome: v.optional(v.string()),
    descrizione: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("ambiti") },
  handler: async (ctx, args) => {
    // Scollegare i corsi che usano questo ambito
    const corsiCollegati = await ctx.db
      .query("corsi")
      .withIndex("by_ambitoId", (q) => q.eq("ambitoId", args.id))
      .collect();
    for (const c of corsiCollegati) {
      await ctx.db.patch(c._id, { ambitoId: undefined });
    }
    await ctx.db.delete(args.id);
  },
});

/**
 * Legge il campo legacy `ambito` (stringa libera) dai corsi esistenti,
 * crea i record mancanti nella tabella ambiti e aggiorna ogni corso con ambitoId.
 * Da usare una volta sola dopo la migrazione dello schema.
 */
export const migrateFromCorsi = mutation({
  args: {},
  handler: async (ctx) => {
    const corsi = await ctx.db.query("corsi").collect();

    // Raccogli valori unici di ambito (campo legacy)
    const ambitiNomi = new Set<string>();
    for (const c of corsi) {
      const legacy = (c as Record<string, unknown>).ambito;
      if (legacy && typeof legacy === "string" && legacy.trim()) {
        ambitiNomi.add(legacy.trim());
      }
    }

    // Inserisci ambiti mancanti
    const ambitiByNome = new Map<string, string>();
    for (const nome of ambitiNomi) {
      const existing = await ctx.db
        .query("ambiti")
        .withIndex("by_nome", (q) => q.eq("nome", nome))
        .first();
      if (existing) {
        ambitiByNome.set(nome.toLowerCase(), existing._id);
      } else {
        const id = await ctx.db.insert("ambiti", { nome });
        ambitiByNome.set(nome.toLowerCase(), id);
      }
    }

    // Aggiorna ogni corso con ambitoId
    let corsiAggiornati = 0;
    for (const c of corsi) {
      if (c.ambitoId) continue; // già migrato
      const legacy = (c as Record<string, unknown>).ambito;
      if (legacy && typeof legacy === "string" && legacy.trim()) {
        const ambitoId = ambitiByNome.get(legacy.trim().toLowerCase());
        if (ambitoId) {
          await ctx.db.patch(c._id, { ambitoId: ambitoId as never });
          corsiAggiornati++;
        }
      }
    }

    return { ambitiCreati: ambitiNomi.size, corsiAggiornati };
  },
});

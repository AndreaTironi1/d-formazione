import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("iscrizioni").collect();
  },
});

export const getById = query({
  args: { id: v.id("iscrizioni") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByDipendente = query({
  args: { dipendenteId: v.id("dipendenti") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("iscrizioni")
      .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", args.dipendenteId))
      .collect();
  },
});

export const getByCorso = query({
  args: { corsoId: v.id("corsi") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("iscrizioni")
      .withIndex("by_corsoId", (q) => q.eq("corsoId", args.corsoId))
      .collect();
  },
});

export const getAllWithRelations = query({
  args: {},
  handler: async (ctx) => {
    const iscrizioni = await ctx.db.query("iscrizioni").collect();
    const result = await Promise.all(
      iscrizioni.map(async (i) => {
        const dipendente = await ctx.db.get(i.dipendenteId);
        const corso = await ctx.db.get(i.corsoId);
        return { ...i, dipendente, corso };
      })
    );
    return result;
  },
});

export const create = mutation({
  args: {
    dipendenteId: v.id("dipendenti"),
    corsoId: v.id("corsi"),
  },
  handler: async (ctx, args) => {
    // Check if already enrolled
    const existing = await ctx.db
      .query("iscrizioni")
      .withIndex("by_dipendente_corso", (q) =>
        q.eq("dipendenteId", args.dipendenteId).eq("corsoId", args.corsoId)
      )
      .first();
    if (existing) {
      throw new Error("Iscrizione già esistente per questo dipendente e corso.");
    }
    return await ctx.db.insert("iscrizioni", args);
  },
});

export const createBulk = mutation({
  args: {
    corsoId: v.id("corsi"),
    dipendenteIds: v.array(v.id("dipendenti")),
  },
  handler: async (ctx, args) => {
    const results: {
      created: string[]
      skippedDuplicate: string[]
      skippedConflict: { name: string; conflictingCourse: string }[]
    } = { created: [], skippedDuplicate: [], skippedConflict: [] }

    const newCorso = await ctx.db.get(args.corsoId)
    const newStart = newCorso?.dataInizio ?? null
    const newEnd = newCorso?.dataFine ?? null

    for (const dipendenteId of args.dipendenteIds) {
      const dipendente = await ctx.db.get(dipendenteId)
      const name = dipendente?.nome ?? String(dipendenteId)

      // Check duplicate
      const existing = await ctx.db
        .query("iscrizioni")
        .withIndex("by_dipendente_corso", (q) =>
          q.eq("dipendenteId", dipendenteId).eq("corsoId", args.corsoId)
        )
        .first()
      if (existing) {
        results.skippedDuplicate.push(name)
        continue
      }

      // Check date conflicts (only if new corso has dates)
      if (newStart && newEnd) {
        const existingIscrizioni = await ctx.db
          .query("iscrizioni")
          .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", dipendenteId))
          .collect()

        let conflict: string | null = null
        for (const isc of existingIscrizioni) {
          const corso = await ctx.db.get(isc.corsoId)
          if (!corso?.dataInizio || !corso?.dataFine) continue
          const overlaps = corso.dataInizio <= newEnd && corso.dataFine >= newStart
          if (overlaps) {
            conflict = corso.titolo
            break
          }
        }

        if (conflict) {
          results.skippedConflict.push({ name, conflictingCourse: conflict })
          continue
        }
      }

      await ctx.db.insert("iscrizioni", { dipendenteId, corsoId: args.corsoId })
      results.created.push(name)
    }

    return results
  },
});

export const update = mutation({
  args: {
    id: v.id("iscrizioni"),
    dipendenteId: v.optional(v.id("dipendenti")),
    corsoId: v.optional(v.id("corsi")),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
  },
});

export const remove = mutation({
  args: { id: v.id("iscrizioni") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

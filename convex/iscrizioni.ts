import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("iscrizioni").collect();
  },
});

export const getById = query({
  args: { id: v.id("iscrizioni") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const getByDipendente = query({
  args: { dipendenteId: v.id("dipendenti") },
  handler: async (ctx, { dipendenteId }) => {
    return ctx.db
      .query("iscrizioni")
      .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", dipendenteId))
      .collect();
  },
});

export const getBySessione = query({
  args: { sessioneId: v.id("sessioni") },
  handler: async (ctx, { sessioneId }) => {
    return ctx.db
      .query("iscrizioni")
      .withIndex("by_sessioneId", (q) => q.eq("sessioneId", sessioneId))
      .collect();
  },
});

export const getAllWithRelations = query({
  args: {},
  handler: async (ctx) => {
    const iscrizioni = await ctx.db.query("iscrizioni").collect();
    return Promise.all(
      iscrizioni.map(async (i) => {
        const dipendente = await ctx.db.get(i.dipendenteId);
        const sessione = i.sessioneId ? await ctx.db.get(i.sessioneId) : null;
        const corso = sessione ? await ctx.db.get(sessione.corsoId) : null;
        return { ...i, dipendente, sessione, corso };
      })
    );
  },
});

export const create = mutation({
  args: {
    dipendenteId: v.id("dipendenti"),
    sessioneId: v.id("sessioni"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("iscrizioni")
      .withIndex("by_dipendente_sessione", (q) =>
        q.eq("dipendenteId", args.dipendenteId).eq("sessioneId", args.sessioneId)
      )
      .first();
    if (existing) {
      throw new Error("Iscrizione già esistente per questo dipendente e sessione.");
    }
    return ctx.db.insert("iscrizioni", args);
  },
});

export const createBulk = mutation({
  args: {
    sessioneId: v.id("sessioni"),
    dipendenteIds: v.array(v.id("dipendenti")),
  },
  handler: async (ctx, args) => {
    const results: {
      created: string[]
      skippedDuplicate: string[]
      skippedConflict: { name: string; conflictingCourse: string }[]
    } = { created: [], skippedDuplicate: [], skippedConflict: [] }

    const newSessione = await ctx.db.get(args.sessioneId)
    const newCorsotitolo = newSessione
      ? (await ctx.db.get(newSessione.corsoId))?.titolo ?? ""
      : ""

    // Determine date range / days for conflict detection
    const newDays = newSessione?.giorniErogazione?.map(g => g.data) ?? []
    const newStart = newSessione?.dataInizio ?? null
    const newEnd = newSessione?.dataFine ?? null

    for (const dipendenteId of args.dipendenteIds) {
      const dipendente = await ctx.db.get(dipendenteId)
      const name = dipendente?.nome ?? String(dipendenteId)

      // Check duplicate
      const existing = await ctx.db
        .query("iscrizioni")
        .withIndex("by_dipendente_sessione", (q) =>
          q.eq("dipendenteId", dipendenteId).eq("sessioneId", args.sessioneId)
        )
        .first()
      if (existing) {
        results.skippedDuplicate.push(name)
        continue
      }

      // Check date conflicts
      const existingIscrizioni = await ctx.db
        .query("iscrizioni")
        .withIndex("by_dipendenteId", (q) => q.eq("dipendenteId", dipendenteId))
        .collect()

      let conflict: string | null = null

      for (const isc of existingIscrizioni) {
        if (!isc.sessioneId) continue
        const sess = await ctx.db.get(isc.sessioneId)
        if (!sess) continue
        const corso = await ctx.db.get(sess.corsoId)
        const label = sess.tema + (corso ? ` (${corso.titolo})` : "")

        if (newDays.length > 0 && (sess.giorniErogazione?.length ?? 0) > 0) {
          // Both sessions have explicit days: check overlap of specific dates
          const existingDays = new Set(sess.giorniErogazione!.map(g => g.data))
          if (newDays.some(d => existingDays.has(d))) {
            conflict = label
            break
          }
        } else if (newStart && newEnd && sess.dataInizio && sess.dataFine) {
          // Fallback: window overlap
          const overlaps = sess.dataInizio <= newEnd && sess.dataFine >= newStart
          if (overlaps) {
            conflict = label
            break
          }
        }
      }

      if (conflict) {
        results.skippedConflict.push({ name, conflictingCourse: conflict })
        continue
      }

      await ctx.db.insert("iscrizioni", { dipendenteId, sessioneId: args.sessioneId })
      results.created.push(name)
    }

    return results
  },
});

export const remove = mutation({
  args: { id: v.id("iscrizioni") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const seedAll = mutation({
  args: {
    coe: v.array(
      v.object({
        idCoe: v.string(),
        nome: v.string(),
      })
    ),
    sedi: v.array(
      v.object({
        idSede: v.string(),
        areaGeografica: v.string(),
      })
    ),
    dipendenti: v.array(
      v.object({
        nome: v.string(),
        email: v.optional(v.string()),
        seniority: v.optional(v.string()),
        ruolo: v.string(),
        coeNome: v.optional(v.string()),
        sedeNome: v.optional(v.string()),
      })
    ),
    servizi: v.array(
      v.object({
        nome: v.string(),
        coeNome: v.string(),
      })
    ),
    corsi: v.array(
      v.object({
        idCorso: v.string(),
        titolo: v.string(),
        ambito: v.string(),
        destinatari: v.string(),
        oreAula: v.optional(v.number()),
        priorita: v.number(),
        coeNome: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // ── 1. Clear existing data (reverse dependency order) ──────────────────
    for (const r of await ctx.db.query("iscrizioni").collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("dipendenti_coe").collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("corsi").collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("servizi").collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("dipendenti").collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("sedi").collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("coe").collect()) {
      await ctx.db.delete(r._id);
    }

    // ── 2. Insert CoE ───────────────────────────────────────────────────────
    const coeByNome = new Map<string, Id<"coe">>();
    const coeByIdCoe = new Map<string, Id<"coe">>();

    for (const c of args.coe) {
      const id = await ctx.db.insert("coe", { idCoe: c.idCoe, nome: c.nome });
      coeByNome.set(c.nome.toLowerCase(), id);
      coeByIdCoe.set(c.idCoe.toLowerCase(), id);
    }

    // Fuzzy lookup: try exact nome, then idCoe, then partial substring
    const resolveCoe = (raw: string | undefined): Id<"coe"> | undefined => {
      if (!raw || !raw.trim()) return undefined;
      const lower = raw.trim().toLowerCase();
      if (coeByNome.has(lower)) return coeByNome.get(lower)!;
      if (coeByIdCoe.has(lower)) return coeByIdCoe.get(lower)!;
      for (const [k, v] of coeByNome) {
        if (lower.includes(k) || k.includes(lower)) return v;
      }
      return undefined;
    };

    // ── 3. Insert Sedi ──────────────────────────────────────────────────────
    const sediByArea = new Map<string, Id<"sedi">>();
    const sediByIdSede = new Map<string, Id<"sedi">>();

    for (const s of args.sedi) {
      const id = await ctx.db.insert("sedi", {
        idSede: s.idSede,
        areaGeografica: s.areaGeografica,
      });
      sediByArea.set(s.areaGeografica.toLowerCase(), id);
      sediByIdSede.set(s.idSede.toLowerCase(), id);
    }

    const resolveSede = (raw: string | undefined): Id<"sedi"> | undefined => {
      if (!raw || !raw.trim()) return undefined;
      const lower = raw.trim().toLowerCase();
      if (sediByArea.has(lower)) return sediByArea.get(lower)!;
      if (sediByIdSede.has(lower)) return sediByIdSede.get(lower)!;
      for (const [k, v] of sediByArea) {
        if (lower.includes(k) || k.includes(lower)) return v;
      }
      return undefined;
    };

    // ── 4. Insert Dipendenti ────────────────────────────────────────────────
    for (const d of args.dipendenti) {
      const coeId = resolveCoe(d.coeNome);
      const sedeId = resolveSede(d.sedeNome);

      const dipId = await ctx.db.insert("dipendenti", {
        nome: d.nome,
        email: d.email,
        seniority: d.seniority,
        ruolo: d.ruolo,
        coeId,
        sedeId,
      });

      // Handle multi-CoE (comma/slash separated)
      if (d.coeNome) {
        const parts = d.coeNome.split(/[,\/]/).map((s) => s.trim()).filter(Boolean);
        if (parts.length > 1) {
          for (const part of parts) {
            const id = resolveCoe(part);
            if (id) {
              await ctx.db.insert("dipendenti_coe", {
                dipendenteId: dipId,
                coeId: id,
              });
            }
          }
        } else if (coeId) {
          await ctx.db.insert("dipendenti_coe", {
            dipendenteId: dipId,
            coeId,
          });
        }
      }
    }

    // ── 5. Insert Servizi ───────────────────────────────────────────────────
    let serviziCount = 0;
    for (const s of args.servizi) {
      const coeId = resolveCoe(s.coeNome);
      if (!coeId) continue;
      await ctx.db.insert("servizi", { nome: s.nome, coeId });
      serviziCount++;
    }

    // ── 6. Insert Corsi ─────────────────────────────────────────────────────
    for (const c of args.corsi) {
      const coeId = resolveCoe(c.coeNome);
      await ctx.db.insert("corsi", {
        idCorso: c.idCorso,
        titolo: c.titolo,
        ambito: c.ambito,
        destinatari: c.destinatari,
        oreAula: c.oreAula,
        priorita: c.priorita,
        coeId,
      });
    }

    return {
      coe: args.coe.length,
      sedi: args.sedi.length,
      dipendenti: args.dipendenti.length,
      servizi: serviziCount,
      corsi: args.corsi.length,
    };
  },
});

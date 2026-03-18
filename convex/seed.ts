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

    // Alias abbreviazioni Excel → nome completo CoE
    const COE_ALIASES: Record<string, string> = {
      "coe p&c":                           "coe programmazione & controllo",
      "coe hr":                            "coe human resources",
      "coe grc":                           "coe governance risk & compliance",
      "coe f&a":                           "coe finance & administration",
      "coe edtech":                        "coe educational tech",
      "coe edu. tech":                     "coe educational tech",
      "coe edu tech":                      "coe educational tech",
      // varianti senza prefisso (usate nei campi sede con percentuale)
      "p&c":                               "coe programmazione & controllo",
      "programming & control":             "coe programmazione & controllo",
      "programmazione & controllo":        "coe programmazione & controllo",
      "hr":                                "coe human resources",
      "human resources":                   "coe human resources",
      "human resources ee.ll":             "coe human resources",
      "grc":                               "coe governance risk & compliance",
      "governance, risk & compliance":     "coe governance risk & compliance",
      "governance risk & compliance":      "coe governance risk & compliance",
      "gov. risk & compliance":            "coe governance risk & compliance",
      "gov. risk & compl.":                "coe governance risk & compliance",
      "f&a":                               "coe finance & administration",
      "finance & administration":          "coe finance & administration",
      "edtech":                            "coe educational tech",
      "edu. tech":                         "coe educational tech",
      "edu tech":                          "coe educational tech",
      "educational tech":                  "coe educational tech",
    };

    // Dipendenti presenti in più CoE senza percentuale (da Pianificazione.docx)
    const MULTI_COE: Record<string, string[]> = {
      "vincenzo orballo":  ["coe programmazione & controllo", "coe human resources"],
      "claudia lepore":    ["coe human resources", "coe educational tech"],
      "daniela binelli":   ["coe programmazione & controllo", "coe educational tech"],
      "anna terzuolo":     ["coe programmazione & controllo", "coe governance risk & compliance"],
      "simona schiavi":    ["coe programmazione & controllo", "coe governance risk & compliance"],
    };

    // Lookup: alias → exact nome → idCoe → substring
    const resolveCoe = (raw: string | undefined): Id<"coe"> | undefined => {
      if (!raw || !raw.trim()) return undefined;
      const lower = raw.trim().toLowerCase();
      const aliased = COE_ALIASES[lower];
      if (aliased && coeByNome.has(aliased)) return coeByNome.get(aliased)!;
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

    // Estrae CoE secondario e percentuale da stringhe tipo "Liguria (30% Edu. Tech)"
    const parseSedeCoE = (sedeRaw: string | undefined): { coeNome: string; pct: number } | undefined => {
      if (!sedeRaw) return undefined;
      const m = sedeRaw.match(/\((\d+)\s*%\s*(.+?)\)/);
      if (!m) return undefined;
      return { pct: parseInt(m[1]), coeNome: m[2].trim() };
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

      const insertedCoeIds = new Set<string>();

      // Caso 1: multi-CoE da MULTI_COE hardcoded (documento Pianificazione)
      const multiCoeNomi = MULTI_COE[d.nome.toLowerCase()];
      if (multiCoeNomi) {
        for (const nomeCompleto of multiCoeNomi) {
          const id = coeByNome.get(nomeCompleto);
          if (id && !insertedCoeIds.has(id)) {
            await ctx.db.insert("dipendenti_coe", { dipendenteId: dipId, coeId: id });
            insertedCoeIds.add(id);
          }
        }
      }

      // Caso 2: CoE secondario con percentuale nel campo sede (es. "Liguria (30% Edu. Tech)")
      if (insertedCoeIds.size === 0) {
        const secondario = parseSedeCoE(d.sedeNome);
        const idSecondario = secondario ? resolveCoe(secondario.coeNome) : undefined;

        if (coeId) {
          await ctx.db.insert("dipendenti_coe", {
            dipendenteId: dipId,
            coeId,
            percentuale: secondario ? 100 - secondario.pct : undefined,
          });
          insertedCoeIds.add(coeId);
        }
        if (idSecondario && !insertedCoeIds.has(idSecondario)) {
          await ctx.db.insert("dipendenti_coe", {
            dipendenteId: dipId,
            coeId: idSecondario,
            percentuale: secondario?.pct,
          });
          insertedCoeIds.add(idSecondario);
        }

        // Caso 3: CoE singolo senza percentuale
        if (insertedCoeIds.size === 0 && coeId) {
          await ctx.db.insert("dipendenti_coe", { dipendenteId: dipId, coeId });
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

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  coe: defineTable({
    idCoe: v.string(),
    nome: v.string(),
    responsabileId: v.optional(v.id("dipendenti")),
  })
    .index("by_idCoe", ["idCoe"])
    .index("by_nome", ["nome"]),

  sedi: defineTable({
    idSede: v.string(),
    areaGeografica: v.string(),
    responsabileId: v.optional(v.id("dipendenti")),
  })
    .index("by_idSede", ["idSede"])
    .index("by_areaGeografica", ["areaGeografica"]),

  dipendenti: defineTable({
    nome: v.string(),
    email: v.optional(v.string()),
    seniority: v.optional(v.string()),
    ruolo: v.string(),
    coeId: v.optional(v.id("coe")),
    sedeId: v.optional(v.id("sedi")),
  })
    .index("by_nome", ["nome"])
    .index("by_email", ["email"])
    .index("by_coeId", ["coeId"])
    .index("by_sedeId", ["sedeId"])
    .index("by_ruolo", ["ruolo"]),

  dipendenti_coe: defineTable({
    dipendenteId: v.id("dipendenti"),
    coeId: v.id("coe"),
    percentuale: v.optional(v.number()),
  })
    .index("by_dipendenteId", ["dipendenteId"])
    .index("by_coeId", ["coeId"])
    .index("by_dipendente_coe", ["dipendenteId", "coeId"]),

  servizi: defineTable({
    nome: v.string(),
    coeId: v.id("coe"),
  })
    .index("by_nome", ["nome"])
    .index("by_coeId", ["coeId"]),

  corsi: defineTable({
    idCorso: v.string(),
    titolo: v.string(),
    ambito: v.string(),
    destinatari: v.string(),
    oreAula: v.optional(v.number()),
    priorita: v.number(),
    coeId: v.optional(v.id("coe")),
    // Campi scheda corso
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
  })
    .index("by_idCorso", ["idCorso"])
    .index("by_ambito", ["ambito"])
    .index("by_coeId", ["coeId"])
    .index("by_priorita", ["priorita"]),

  iscrizioni: defineTable({
    dipendenteId: v.id("dipendenti"),
    corsoId: v.id("corsi"),
  })
    .index("by_dipendenteId", ["dipendenteId"])
    .index("by_corsoId", ["corsoId"])
    .index("by_dipendente_corso", ["dipendenteId", "corsoId"]),
});

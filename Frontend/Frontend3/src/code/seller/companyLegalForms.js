const LEGAL_FORM_DEFINITIONS = [
  {
    value: "gmbh",
    key: "onboard.legal_forms.gmbh",
    suffix: "GmbH",
    aliases: ["GmbH", "GmbH (Germany)"],
  },
  {
    value: "ltd",
    key: "onboard.legal_forms.ltd",
    suffix: "Ltd",
    aliases: ["Ltd", "Ltd (United Kingdom)"],
  },
  {
    value: "sarl",
    key: "onboard.legal_forms.sarl",
    suffix: "S.A.R.L.",
    aliases: ["S.A.R.L.", "S.A.R.L. (France)"],
  },
  {
    value: "sro",
    key: "onboard.legal_forms.sro",
    suffix: "s.r.o.",
    aliases: ["s.r.o.", "s.r.o. (Czech Republic / Slovakia)"],
  },
  {
    value: "as",
    key: "onboard.legal_forms.as",
    suffix: "a.s.",
    aliases: ["a.s.", "a.s. (Czech Republic)"],
  },
]

const LEGAL_FORM_BY_COUNTRY = {
  cz: ["sro", "as"],
  sk: ["sro"],
  de: ["gmbh"],
  fr: ["sarl"],
  gb: ["ltd"],
  uk: ["ltd"],
}

const ARES_CZ_LEGAL_FORM_CODES = {
  112: "sro",
  121: "as",
}

const normalizeCountry = (country) => String(country || "").trim().toLowerCase()

export const normalizeLegalFormValue = (legalForm) => {
  const normalized = String(legalForm || "").trim()
  if (!normalized) return ""

  const lower = normalized.toLowerCase()
  return LEGAL_FORM_DEFINITIONS.find((definition) => (
    definition.value === lower ||
    definition.aliases.some((alias) => alias.toLowerCase() === lower)
  ))?.value || normalized
}

export const getLegalFormOptions = (country) => {
  const allowed = LEGAL_FORM_BY_COUNTRY[normalizeCountry(country)]
  const definitions = allowed
    ? LEGAL_FORM_DEFINITIONS.filter((definition) => allowed.includes(definition.value))
    : LEGAL_FORM_DEFINITIONS

  return definitions.map(({ value, key }) => ({ value, key }))
}

export const isLegalFormAllowed = (country, legalForm) => {
  const value = normalizeLegalFormValue(legalForm)
  if (!value) return false

  const allowed = LEGAL_FORM_BY_COUNTRY[normalizeCountry(country)]
  if (!allowed) {
    return LEGAL_FORM_DEFINITIONS.some((definition) => definition.value === value)
  }
  return allowed.includes(value)
}

export const resolveAresLegalForm = ({ country, legal_form_code, legal_form }) => {
  const normalizedCountry = normalizeCountry(country)
  const code = String(legal_form_code || "").trim()
  const mapped = normalizedCountry === "cz" ? ARES_CZ_LEGAL_FORM_CODES[code] : ""

  if (mapped && isLegalFormAllowed(normalizedCountry, mapped)) {
    return mapped
  }

  const value = normalizeLegalFormValue(legal_form)
  return isLegalFormAllowed(normalizedCountry, value) ? value : ""
}

export const getLegalFormSuffix = (legalForm) => {
  const value = normalizeLegalFormValue(legalForm)
  return LEGAL_FORM_DEFINITIONS.find((definition) => definition.value === value)?.suffix || ""
}

export const getLegalFormBackendValue = (legalForm) => (
  getLegalFormSuffix(legalForm) || String(legalForm || "").trim()
)

export const getLegalFormDisplayKey = (legalForm) => {
  const value = normalizeLegalFormValue(legalForm)
  return LEGAL_FORM_DEFINITIONS.find((definition) => definition.value === value)?.key || ""
}

export const getLegalFormDisplayLabel = (legalForm, t = (key) => key) => {
  const key = getLegalFormDisplayKey(legalForm)
  return key ? t(key) : String(legalForm || "").trim()
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const LEGAL_FORM_SUFFIX_PARTIAL_PATTERNS = {
  "a.s.": /\s+a\.?s?\.?$/i,
  "s.r.o.": /\s+s\.?r?\.?o?\.?$/i,
  "GmbH": /\s+gmbh?$/i,
  "Ltd": /\s+ltd\.?$/i,
  "S.A.R.L.": /\s+s\.?a\.?r\.?l\.?$/i,
}

export const normalizeCompanyAccountHolder = (companyName, legalForm) => {
  const name = String(companyName || "").replace(/\s+/g, " ").trim()
  const suffix = getLegalFormSuffix(legalForm)
  if (!name) return ""
  if (!suffix) return name

  const suffixPattern = new RegExp(`\\s+${escapeRegExp(suffix)}$`, "i")
  if (suffixPattern.test(name)) return name

  const partialPattern = LEGAL_FORM_SUFFIX_PARTIAL_PATTERNS[suffix]
  const normalizedName = partialPattern ? name.replace(partialPattern, "").trim() : name
  return `${normalizedName} ${suffix}`
}

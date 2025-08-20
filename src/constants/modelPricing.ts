// Pricing tiers for OpenAI models (prices per 1K tokens)
export const PRICING_TIERS = {
  standard: {
    "gpt-5": { inK: 0.00125, outK: 0.01000, cachedInK: 0.000125 },
    "gpt-5-mini": { inK: 0.00025, outK: 0.00200, cachedInK: 0.000025 },
    "gpt-5-nano": { inK: 0.00005, outK: 0.00040, cachedInK: 0.000005 },
    "gpt-4.1": { inK: 0.00200, outK: 0.00800, cachedInK: 0.000500 },
    "gpt-4.1-mini": { inK: 0.00040, outK: 0.00160, cachedInK: 0.000100 },
    "gpt-4.1-nano": { inK: 0.00010, outK: 0.00040, cachedInK: 0.000025 },
    "gpt-4o": { inK: 0.00250, outK: 0.01000, cachedInK: 0.001250 },
    "gpt-4o-2024-05-13": { inK: 0.00500, outK: 0.01500 },
    "gpt-4o-mini": { inK: 0.00015, outK: 0.00060, cachedInK: 0.000075 },
    "o1": { inK: 0.01500, outK: 0.06000, cachedInK: 0.007500 },
    "o1-pro": { inK: 0.15000, outK: 0.60000 },
    "o3-pro": { inK: 0.02000, outK: 0.08000 },
    "o3": { inK: 0.00200, outK: 0.00800, cachedInK: 0.000500 },
    "o3-deep-research": { inK: 0.01000, outK: 0.04000, cachedInK: 0.002500 },
    "o4-mini": { inK: 0.00110, outK: 0.00440, cachedInK: 0.000275 },
    "o4-mini-deep-research": { inK: 0.00200, outK: 0.00800, cachedInK: 0.000500 },
    "o3-mini": { inK: 0.00110, outK: 0.00440, cachedInK: 0.000550 },
    "o1-mini": { inK: 0.00110, outK: 0.00440, cachedInK: 0.000550 },
    "computer-use-preview": { inK: 0.00300, outK: 0.01200 }
  },
  flex: {
    "gpt-5": { inK: 0.000625, outK: 0.00500, cachedInK: 0.0000625 },
    "gpt-5-mini": { inK: 0.000125, outK: 0.00100, cachedInK: 0.0000125 },
    "gpt-5-nano": { inK: 0.000025, outK: 0.00020, cachedInK: 0.0000025 },
    "o3": { inK: 0.00100, outK: 0.00400, cachedInK: 0.000250 },
    "o4-mini": { inK: 0.00055, outK: 0.00220, cachedInK: 0.000138 }
  },
  batch: {
    "gpt-5": { inK: 0.000625, outK: 0.00500, cachedInK: 0.0000625 },
    "gpt-5-mini": { inK: 0.000125, outK: 0.00100, cachedInK: 0.0000125 },
    "gpt-5-nano": { inK: 0.000025, outK: 0.00020, cachedInK: 0.0000025 },
    "gpt-4.1": { inK: 0.00100, outK: 0.00400 },
    "gpt-4.1-mini": { inK: 0.00020, outK: 0.00080 },
    "gpt-4.1-nano": { inK: 0.00005, outK: 0.00020 },
    "gpt-4o": { inK: 0.00125, outK: 0.00500 },
    "gpt-4o-2024-05-13": { inK: 0.00250, outK: 0.00750 },
    "gpt-4o-mini": { inK: 0.000075, outK: 0.00030 },
    "o1": { inK: 0.00750, outK: 0.03000 },
    "o1-pro": { inK: 0.07500, outK: 0.30000 },
    "o3-pro": { inK: 0.01000, outK: 0.04000 },
    "o3": { inK: 0.00100, outK: 0.00400 },
    "o3-deep-research": { inK: 0.00500, outK: 0.02000 },
    "o4-mini": { inK: 0.00055, outK: 0.00220 },
    "o4-mini-deep-research": { inK: 0.00100, outK: 0.00400 },
    "o3-mini": { inK: 0.00055, outK: 0.00220 },
    "o1-mini": { inK: 0.00055, outK: 0.00220 },
    "computer-use-preview": { inK: 0.00150, outK: 0.00600 }
  }
} as const;

// Legacy format for backward compatibility (using standard pricing)
export const MODEL_PRICING = [
  { name: "gpt-5", group: "GPT-5 (Large)", inK: 0.00125, outK: 0.01000 },
  { name: "gpt-5-mini", group: "GPT-5 Mini", inK: 0.00025, outK: 0.00200 },
  { name: "gpt-5-nano", group: "GPT-5 Nano", inK: 0.00005, outK: 0.00040 },
  { name: "gpt-4.1", group: "GPT-4.1", inK: 0.00200, outK: 0.00800 },
  { name: "gpt-4.1-mini", group: "GPT-4.1 Mini", inK: 0.00040, outK: 0.00160 },
  { name: "gpt-4.1-nano", group: "GPT-4.1 Nano", inK: 0.00010, outK: 0.00040 },
  { name: "gpt-4o", group: "GPT-4o", inK: 0.00250, outK: 0.01000 },
  { name: "gpt-4o-2024-05-13", group: "GPT-4o (2024-05-13)", inK: 0.00500, outK: 0.01500 },
  { name: "gpt-4o-mini", group: "GPT-4o Mini", inK: 0.00015, outK: 0.00060 },
  { name: "o1", group: "OpenAI o1", inK: 0.01500, outK: 0.06000 },
  { name: "o1-pro", group: "OpenAI o1 Pro", inK: 0.15000, outK: 0.60000 },
  { name: "o3-pro", group: "OpenAI o3 Pro", inK: 0.02000, outK: 0.08000 },
  { name: "o3", group: "OpenAI o3", inK: 0.00200, outK: 0.00800 },
  { name: "o3-deep-research", group: "OpenAI o3 Deep Research", inK: 0.01000, outK: 0.04000 },
  { name: "o4-mini", group: "OpenAI o4 Mini", inK: 0.00110, outK: 0.00440 },
  { name: "o4-mini-deep-research", group: "OpenAI o4 Mini Deep Research", inK: 0.00200, outK: 0.00800 },
  { name: "o3-mini", group: "OpenAI o3 Mini", inK: 0.00110, outK: 0.00440 },
  { name: "o1-mini", group: "OpenAI o1 Mini", inK: 0.00110, outK: 0.00440 },
  { name: "computer-use-preview", group: "Computer Use Preview", inK: 0.00300, outK: 0.01200 }
] as const;

export type ModelName = typeof MODEL_PRICING[number]['name']

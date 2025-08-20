// ราคาตาม OpenAI Standard tier (per 1M tokens)
export const MODEL_PRICING = [
  { name: "gpt-5",                    group: "GPT-5 (Large)",           inK: 0.00125, outK: 0.01000, cachedInK: 0.000125 }, // $1.25 / $10.00 / $0.125 per 1M
  { name: "gpt-5-mini",               group: "GPT-5 Mini",              inK: 0.00025, outK: 0.00200, cachedInK: 0.000025 }, // $0.25 / $2.00 / $0.025 per 1M
  { name: "gpt-5-nano",               group: "GPT-5 Nano",              inK: 0.00005, outK: 0.00040, cachedInK: 0.000005 }, // $0.05 / $0.40 / $0.005 per 1M
  { name: "gpt-5-chat-latest",        group: "GPT-5 Chat Latest",       inK: 0.00125, outK: 0.01000, cachedInK: 0.000125 }, // $1.25 / $10.00 / $0.125 per 1M
  { name: "gpt-4.1",                  group: "GPT-4.1",                 inK: 0.00200, outK: 0.00800, cachedInK: 0.000500 }, // $2.00 / $8.00 / $0.50 per 1M
  { name: "gpt-4.1-mini",             group: "GPT-4.1 Mini",            inK: 0.00040, outK: 0.00160, cachedInK: 0.000100 }, // $0.40 / $1.60 / $0.10 per 1M
  { name: "gpt-4.1-nano",             group: "GPT-4.1 Nano",            inK: 0.00010, outK: 0.00040, cachedInK: 0.000025 }, // $0.10 / $0.40 / $0.025 per 1M
  { name: "gpt-4o",                   group: "GPT-4o",                  inK: 0.00250, outK: 0.01000, cachedInK: 0.001250 }, // $2.50 / $10.00 / $1.25 per 1M
  { name: "gpt-4o-2024-05-13",       group: "GPT-4o (2024-05-13)",     inK: 0.00500, outK: 0.01500, cachedInK: null },     // $5.00 / $15.00 per 1M
  { name: "gpt-4o-mini",              group: "GPT-4o Mini",             inK: 0.00015, outK: 0.00060, cachedInK: 0.000075 }, // $0.15 / $0.60 / $0.075 per 1M
  { name: "o1",                       group: "OpenAI o1",               inK: 0.01500, outK: 0.06000, cachedInK: 0.007500 }, // $15.00 / $60.00 / $7.50 per 1M
  { name: "o1-pro",                   group: "OpenAI o1 Pro",           inK: 0.15000, outK: 0.60000, cachedInK: null },     // $150.00 / $600.00 per 1M
  { name: "o3-pro",                   group: "OpenAI o3 Pro",           inK: 0.02000, outK: 0.08000, cachedInK: null },     // $20.00 / $80.00 per 1M
  { name: "o3",                       group: "OpenAI o3",               inK: 0.00200, outK: 0.00800, cachedInK: 0.000500 }, // $2.00 / $8.00 / $0.50 per 1M
  { name: "o4-mini",                  group: "OpenAI o4 Mini",          inK: 0.00110, outK: 0.00440, cachedInK: 0.000275 }, // $1.10 / $4.40 / $0.275 per 1M
  { name: "o3-mini",                  group: "OpenAI o3 Mini",          inK: 0.00110, outK: 0.00440, cachedInK: 0.000550 } // $1.10 / $4.40 / $0.55 per 1M
] as const;

export type ModelName = typeof MODEL_PRICING[number]['name']

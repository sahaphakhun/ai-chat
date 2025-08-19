export const MODEL_PRICING = [
  { name: "gpt-5",        group: "GPT-5 (Large)",   inK: 0.00125, outK: 0.01000 }, // $1.25 / $10 per 1M
  { name: "gpt-5-mini",   group: "GPT-5 Mini",     inK: 0.00025, outK: 0.00200 }, // $0.25 / $2 per 1M
  { name: "gpt-5-nano",   group: "GPT-5 Nano",     inK: 0.00005, outK: 0.00040 }, // $0.05 / $0.40 per 1M
  { name: "gpt-4o",       group: "GPT-4o",         inK: 0.00500, outK: 0.02000 }, // $5 / $20 per 1M
  { name: "gpt-4.1",      group: "GPT-4.1",        inK: 0.00300, outK: 0.01200 }, // $3 / $12 per 1M
  { name: "gpt-4.1-mini", group: "GPT-4.1 Mini",   inK: 0.00080, outK: 0.00320 }, // $0.80 / $3.20 per 1M
  { name: "o3",           group: "OpenAI o3",      inK: 0.00040, outK: 0.00160 }  // หลังลดราคา 80 %
] as const;

export type ModelName = typeof MODEL_PRICING[number]['name']

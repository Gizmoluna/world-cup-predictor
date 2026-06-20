// ---------------------------------------------------------------------------
// AI previews & banter via Claude (Anthropic TypeScript SDK). Powers fun,
// context-aware match previews and rivalry trash-talk. Degrades gracefully:
// with no ANTHROPIC_API_KEY it returns null and the UI simply hides the AI bits.
//
// Called from API routes (fetched client-side), never during SSR, so pages stay
// instant. Results are cached in-memory with a TTL so we don't re-call Claude on
// every view. Short, snappy generations → no extended thinking, low effort.
// ---------------------------------------------------------------------------

import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-8";

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!aiConfigured()) return null;
  if (!client) client = new Anthropic();
  return client;
}

// --- tiny TTL cache --------------------------------------------------------
const TTL_MS = 30 * 60 * 1000; // 30 min
const cache = new Map<string, { text: string; at: number }>();

function cached(key: string): string | null {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.text;
  return null;
}
function store(key: string, text: string) {
  cache.set(key, { text, at: Date.now() });
}

// Single place to run a short creative generation. Best-effort: any error (rate
// limit, refusal, network) returns null so the caller hides the feature.
async function generate(key: string, system: string, prompt: string, maxTokens = 320): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const hit = cached(key);
  if (hit) return hit;
  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      output_config: { effort: "low" },
      system,
      messages: [{ role: "user", content: prompt }],
    });
    if (res.stop_reason === "refusal") return null;
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) return null;
    store(key, text);
    return text;
  } catch {
    return null;
  }
}

// --- match preview ---------------------------------------------------------

export interface PreviewInput {
  cacheKey: string;
  home: string;
  away: string;
  stage: string;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  /** League members and which side they're backing, e.g. "Carina → Brazil". */
  picks: string[];
}

export async function matchPreview(input: PreviewInput): Promise<string | null> {
  const system =
    "You write punchy, fun World Cup match previews for a friends prediction game. " +
    "2-3 sentences, conversational, a little cheeky. Weave in the win odds and who's backing whom by name. " +
    "No markdown, no headings, no emoji spam (one or two max). Don't invent stats or results.";
  const picks = input.picks.length ? input.picks.join("; ") : "no one's picked yet";
  const prompt =
    `Match: ${input.home} vs ${input.away} (${input.stage}).\n` +
    `Model win odds — ${input.home} ${input.homeWinPct}%, draw ${input.drawPct}%, ${input.away} ${input.awayWinPct}%.\n` +
    `Who's backing whom in the league: ${picks}.\n` +
    `Write the preview.`;
  return generate(`preview:${input.cacheKey}`, system, prompt);
}

// --- rivalry banter --------------------------------------------------------

export interface BanterInput {
  cacheKey: string;
  me: string;
  opp: string;
  myWins: number;
  oppWins: number;
  draws: number;
  myPoints: number;
  oppPoints: number;
}

export async function rivalryBanter(input: BanterInput): Promise<string | null> {
  const leader =
    input.myWins > input.oppWins ? input.me : input.oppWins > input.myWins ? input.opp : null;
  const system =
    "You're the cheeky commentator for a friends' World Cup prediction rivalry. " +
    "Write ONE short, playful trash-talk line (max 2 sentences) about the head-to-head. " +
    "Light-hearted ribbing, never mean. Address the reader as 'you'. No markdown, at most one emoji.";
  const prompt =
    `Head-to-head: you (${input.me}) vs ${input.opp}. ` +
    `Matches won: you ${input.myWins}, ${input.opp} ${input.oppWins}, ${input.draws} drawn. ` +
    `Total points: you ${input.myPoints}, ${input.opp} ${input.oppPoints}. ` +
    `${leader ? `${leader} is ahead.` : "It's level."} Write the banter line.`;
  return generate(`banter:${input.cacheKey}`, system, prompt, 160);
}

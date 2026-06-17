import { AppShell } from "@/components/app-shell";
import { Card, CardTitle } from "@/components/ui/card";
import { POINTS, changeCost } from "@/lib/scoring/points";
import { GROUP_ORDER_POINTS, GROUP_ORDER_PERFECT_BONUS } from "@/lib/group-orders";
import { RANK_TIERS } from "@/lib/constants";
import { STARTING_BALANCE, SPY_FEES } from "@/lib/money";

export const dynamic = "force-dynamic";

// A single scoring rule: label, points, and a plain-English explanation.
interface Rule {
  label: string;
  pts: string;
  desc: string;
}

function RuleList({ rules }: { rules: Rule[] }) {
  return (
    <div className="divide-y divide-border">
      {rules.map((r) => (
        <div key={r.label} className="flex items-start gap-3 py-2.5">
          <span className="num-bc min-w-[3.2rem] shrink-0 text-right text-base text-[var(--accent)]">
            {r.pts}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-bold">{r.label}</span>
            <span className="block text-xs text-muted">{r.desc}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export default function HowItWorksPage() {
  const matchRules: Rule[] = [
    { label: "Exact score", pts: `+${POINTS.exactScore}`, desc: "Nail the precise 90-minute scoreline." },
    { label: "Correct result", pts: `+${POINTS.correctResult}`, desc: "Right winner (or draw), even if the score is off." },
    { label: "Goal difference", pts: `+${POINTS.goalDifference}`, desc: "Margin matches (e.g. you said 2–0, it ends 3–1)." },
    { label: "Total goals", pts: `+${POINTS.totalGoals}`, desc: "Total number of goals in the game is right." },
    { label: "First team to score", pts: `+${POINTS.firstTeamToScore}`, desc: "Correctly call who opens the scoring." },
    { label: "Both teams to score", pts: `+${POINTS.bothTeamsToScore}`, desc: "Right yes/no on both teams scoring." },
    { label: "Clean sheet", pts: `+${POINTS.cleanSheet}`, desc: "Correctly call a team to keep a clean sheet." },
    { label: "First goalscorer", pts: `+${POINTS.firstGoalScorer}`, desc: "The toughest call — who scores first." },
    { label: "Anytime goalscorer", pts: `+${POINTS.anytimeGoalScorer}`, desc: "Your pick scores at any point." },
    { label: "Player of the match", pts: `+${POINTS.playerOfMatch}`, desc: "Call the standout performer." },
  ];

  const bonusRules: Rule[] = [
    { label: "Perfect prediction", pts: `+${POINTS.perfectPredictionBonus}`, desc: "Exact score AND first goalscorer right — a huge call." },
    { label: "Underdog called", pts: `+${POINTS.underdogBonus}`, desc: "Flag an upset and the underdog actually wins." },
    { label: "Confidence boost", pts: "×", desc: "Mark a pick as a banker to multiply everything it earns — but you earn nothing extra if it misses." },
  ];

  const futuresRules: Rule[] = [
    { label: "Group winner", pts: `+${POINTS.groupWinner}`, desc: "Correctly pick who tops a group." },
    {
      label: "Full group order",
      pts: `+${GROUP_ORDER_POINTS[0]}/${GROUP_ORDER_POINTS[1]}/${GROUP_ORDER_POINTS[2]}`,
      desc: `Points per finishing position you nail (1st/2nd/3rd-4th). All four exactly right = +${GROUP_ORDER_PERFECT_BONUS} bonus.`,
    },
    { label: "Knockout winner", pts: `+${POINTS.knockoutWinner}`, desc: "Pick who advances from a knockout tie." },
    { label: "Win method", pts: `+${POINTS.winMethod}`, desc: "Call whether a knockout is decided in 90′, extra time or penalties." },
  ];

  return (
    <AppShell>
      <h1 className="title-bc mb-1 text-3xl">How it works 📖</h1>
      <p className="mb-5 text-sm text-muted">
        Everything that earns — or costs — you points. The more you commit and the bolder you
        call it, the more there is to win.
      </p>

      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-2">
          <CardTitle>Predicting a match</CardTitle>
          <p className="text-xs text-muted">
            Every match you predict is scored across these. They stack — a great prediction hits
            several at once.
          </p>
          <RuleList rules={matchRules} />
        </Card>

        <Card className="flex flex-col gap-2">
          <CardTitle>Bonuses & boosts</CardTitle>
          <RuleList rules={bonusRules} />
        </Card>

        <Card className="flex flex-col gap-2">
          <CardTitle>Tournament picks (futures)</CardTitle>
          <p className="text-xs text-muted">
            Big-ticket calls made before the action. Worth a lot — because they&apos;re hard and
            you commit early.
          </p>
          <RuleList rules={futuresRules} />
        </Card>

        {/* PENALTIES — the part players most need explained */}
        <Card id="penalties" className="flex flex-col gap-3 ring-1 ring-danger/30">
          <CardTitle>💸 Changing your mind costs points</CardTitle>
          <p className="text-sm text-muted">
            You can change a tournament pick (group winner, group order, knockout) any time before
            it&apos;s decided — but it costs you, and the price <span className="font-bold text-fg">climbs every time you flip</span>:
          </p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((lvl) => (
              <div key={lvl} className="flex-1 rounded-xl bg-surface-2 p-2 text-center">
                <div className="text-[10px] uppercase tracking-wide text-muted">Change #{lvl}</div>
                <div className="num-bc text-lg text-danger">−{changeCost(lvl)}</div>
              </div>
            ))}
          </div>
          <ul className="space-y-1.5 text-xs text-muted">
            <li>
              <span className="font-bold text-fg">Small edits cost less.</span> Re-ordering a group?
              Swapping two teams costs a fraction of a full rewrite — you only pay for what you moved.
            </li>
            <li>
              <span className="font-bold text-pitch">The loyalty pot.</span> Every point someone
              forfeits by changing is pooled and split among the players in your league who{" "}
              <span className="font-bold text-fg">held their nerve and changed nothing</span>.
              Conviction literally pays.
            </li>
            <li>
              <span className="font-bold text-fg">Match predictions are free to change</span> right
              up to kickoff — the penalty only applies to the tournament/futures picks above.
            </li>
          </ul>
        </Card>

        {/* THE MONEY MODEL — one balance, four games, plainly stated. */}
        <Card id="the-bank" className="flex flex-col gap-3 ring-1 ring-gold/30">
          <CardTitle>💰 The Bank — how money works</CardTitle>
          <p className="text-sm text-muted">
            Money is separate from points. Points decide the ladder; money is a play-money side
            game. Everyone starts with exactly{" "}
            <span className="font-bold text-gold">${STARTING_BALANCE.toLocaleString()}</span>, and
            just <span className="font-bold text-fg">four things</span> ever move your balance:
          </p>
          <div className="rounded-xl bg-surface-2 p-3 text-center text-xs">
            <span className="num-bc text-sm text-fg">balance</span>
            <span className="text-muted"> = ${STARTING_BALANCE.toLocaleString()} + wagers + duels + pots − spy fees</span>
          </div>
          <ul className="space-y-1.5 text-xs text-muted">
            <li><span className="font-bold text-fg">Wagers</span> — stake on your own match pick (below).</li>
            <li><span className="font-bold text-fg">Duels</span> — head-to-head stakes vs a rival (below).</li>
            <li><span className="font-bold text-fg">Pots</span> — whole-league side pots on a match (below).</li>
            <li>
              <span className="font-bold text-fg">Spying</span> — see a hidden pick early, for a price.
            </li>
          </ul>
          <p className="text-sm text-muted">
            Your <span className="font-bold text-fg">balance is the same number everywhere</span> —
            leaderboard, your profile, the duels ledger. There&apos;s no second hidden wallet.
          </p>
        </Card>

        {/* SPYING — the new mechanic, explained on its own. */}
        <Card id="spying" className="flex flex-col gap-3">
          <CardTitle>🕵️ Spying on picks</CardTitle>
          <ul className="space-y-1.5 text-xs text-muted">
            <li>
              <span className="font-bold text-fg">Picks are hidden until kickoff.</span> Your own
              picks, and everyone else&apos;s, stay secret right up to the whistle.
            </li>
            <li>
              <span className="font-bold text-fg">Pay to peek.</span> Spend from your balance to
              reveal one rival&apos;s upcoming pick early. The fee climbs as kickoff nears:
            </li>
          </ul>
          <div className="flex items-center gap-2">
            {[
              { label: "24h+ out", fee: SPY_FEES.far },
              { label: "2–24h", fee: SPY_FEES.mid },
              { label: "< 2h", fee: SPY_FEES.near },
            ].map((t) => (
              <div key={t.label} className="flex-1 rounded-xl bg-surface-2 p-2 text-center">
                <div className="text-[10px] uppercase tracking-wide text-muted">{t.label}</div>
                <div className="num-bc text-lg text-gold">${t.fee}</div>
              </div>
            ))}
          </div>
          <ul className="space-y-1.5 text-xs text-muted">
            <li>
              <span className="font-bold text-pitch">The Spy Pot.</span> Every fee paid drops into
              your league&apos;s Spy Pot — it goes to the league champion at the end. Spying funds
              the winner.
            </li>
            <li>
              <span className="font-bold text-fg">You&apos;re told when you&apos;re spied.</span>{" "}
              Reveals are one-off (pay once per pick) and free once the match kicks off — past picks
              are always visible to everyone.
            </li>
          </ul>
        </Card>

        <Card className="flex flex-col gap-3">
          <CardTitle>⚔️ Wagers & duels</CardTitle>
          <ul className="space-y-1.5 text-xs text-muted">
            <li>
              <span className="font-bold text-fg">Solo wager:</span> stake up to $100 of play-money
              on your own prediction. Exact score pays <span className="font-bold text-pitch">3×</span>,
              correct result pays <span className="font-bold text-pitch">1.8×</span>, a miss loses the
              stake.
            </li>
            <li>
              <span className="font-bold text-fg">Duel a rival:</span> challenge any league member.
              Choose <span className="font-bold">Full</span> — whole stake on the closest 90′ score —
              or <span className="font-bold">Split</span>, dividing it across closest score, match
              result and first goalscorer, each leg settled on its own. Ties push (money back).
            </li>
            <li>
              <span className="font-bold text-fg">Group pot:</span> anyone opens a whole-league pot on
              a match before kickoff and picks how it&apos;s won — correct score, match result or first
              goalscorer. Rivals match the ante to join; the winner(s) take the pot, ties split it, and
              if nobody nails it everyone&apos;s refunded.
            </li>
            <li>
              <span className="font-bold text-fg">Winnings &amp; debts</span> are tracked per league
              on the Duels page — including a &quot;who owes whom&quot; settle-up list.
            </li>
          </ul>
        </Card>

        <Card className="flex flex-col gap-3">
          <CardTitle>🏅 Ranks</CardTitle>
          <p className="text-xs text-muted">Your total points climb you through the tiers:</p>
          <div className="flex flex-wrap gap-2">
            {RANK_TIERS.map((t) => (
              <span key={t.title} className="flex items-center gap-1 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-bold">
                {t.icon} {t.title}
                <span className="text-muted">· {t.min}+</span>
              </span>
            ))}
          </div>
          <p className="text-xs text-muted">
            Win streaks 🔥, daily check-ins and achievements add flair — and bragging rights — on top.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}

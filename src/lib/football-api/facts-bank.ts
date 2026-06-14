// ---------------------------------------------------------------------------
// Curated evergreen World Cup facts. The manual provider serves these; a real
// provider can swap in an externally-updated feed via FootballProvider.getFacts.
// Live, auto-updating facts are derived separately in src/lib/facts.ts.
// ---------------------------------------------------------------------------

import type { WorldCupFact } from "@/lib/types";

const f = (
  id: string,
  text: string,
  category: WorldCupFact["category"],
): WorldCupFact => ({ id, text, category, source: "WC Almanac" });

export const FACTS_BANK: WorldCupFact[] = [
  // --- 2026 host edition ---
  f("h26_1", "The 2026 World Cup is hosted across three countries — USA, Canada and Mexico — a tournament first.", "host2026"),
  f("h26_2", "2026 is the first 48-team World Cup, expanded from 32, with 104 matches in total.", "host2026"),
  f("h26_3", "Mexico becomes the first nation to host or co-host the World Cup three times (1970, 1986, 2026).", "host2026"),
  f("h26_4", "The 2026 final is set for MetLife Stadium in New Jersey.", "host2026"),
  f("h26_5", "Estadio Azteca in Mexico City is the only stadium to feature at three different World Cups.", "host2026"),
  f("h26_6", "With 48 teams, the 2026 group stage runs as 12 groups of four.", "host2026"),
  f("h26_7", "16 cities across North America host 2026 matches, from Vancouver to Mexico City to New York.", "host2026"),

  // --- titles & history ---
  f("hist_1", "Brazil have won the World Cup a record five times (1958, 1962, 1970, 1994, 2002).", "record"),
  f("hist_2", "Germany and Italy share second place with four World Cup titles each.", "record"),
  f("hist_3", "Argentina have lifted the trophy three times — 1978, 1986 and 2022.", "history"),
  f("hist_4", "The first World Cup was held in 1930 in Uruguay, who won it on home soil.", "history"),
  f("hist_5", "Uruguay and France have each won the World Cup twice.", "history"),
  f("hist_6", "England's only World Cup triumph came as hosts in 1966.", "history"),
  f("hist_7", "Spain won their first World Cup in 2010, in South Africa.", "history"),
  f("hist_8", "Brazil are the only nation to have played at every World Cup finals.", "record"),
  f("hist_9", "Argentina won the 2022 final against France on penalties after a 3-3 thriller.", "history"),
  f("hist_10", "Qatar 2022 was the first World Cup held in the Middle East and the first played in November-December.", "history"),
  f("hist_11", "The 1950 World Cup was decided by a final group, not a single final match.", "trivia"),
  f("hist_12", "Italy won back-to-back titles in 1934 and 1938.", "history"),
  f("hist_13", "Brazil's 2002 win made them the first team to win the trophy outside their own continent twice.", "trivia"),
  f("hist_14", "The Jules Rimet Trophy was awarded permanently to Brazil in 1970 after their third win.", "history"),

  // --- goalscoring records ---
  f("rec_1", "Miroslav Klose of Germany is the World Cup's all-time top scorer with 16 goals.", "record"),
  f("rec_2", "Just Fontaine scored 13 goals at a single World Cup (1958) — still a record.", "record"),
  f("rec_3", "The fastest goal in World Cup history was scored by Hakan Şükür after 11 seconds in 2002.", "record"),
  f("rec_4", "Hungary's 10-1 win over El Salvador in 1982 is among the biggest in World Cup history.", "record"),
  f("rec_5", "The 2014 World Cup featured a record 171 goals across the tournament.", "record"),
  f("rec_6", "Pelé is the only player to win three World Cups (1958, 1962, 1970).", "player"),
  f("rec_7", "Lothar Matthäus holds the record for most World Cup matches played, with 25.", "record"),
  f("rec_8", "Kylian Mbappé scored a hat-trick in the 2022 final and still finished on the losing side.", "player"),
  f("rec_9", "Geoff Hurst is the only player to score a hat-trick in a World Cup final (1966).", "player"),
  f("rec_10", "Brazil's Ronaldo Nazário scored 15 World Cup goals across four tournaments.", "player"),

  // --- players ---
  f("pl_1", "Lionel Messi has appeared at five World Cups, finally winning it in 2022.", "player"),
  f("pl_2", "Pelé became the youngest player to score in a World Cup final, aged 17 in 1958.", "player"),
  f("pl_3", "Diego Maradona's 'Hand of God' and 'Goal of the Century' both came in the same 1986 match v England.", "player"),
  f("pl_4", "Cristiano Ronaldo has scored at five different World Cups.", "player"),
  f("pl_5", "Roger Milla, aged 42, became the oldest World Cup goalscorer in 1994.", "player"),
  f("pl_6", "Oliver Kahn is the only goalkeeper to win the World Cup Golden Ball (2002).", "player"),
  f("pl_7", "Zinedine Zidane scored twice in the 1998 final and was sent off in the 2006 final.", "player"),

  // --- trivia ---
  f("tr_1", "The World Cup trophy is made of 18-carat gold and stands about 36.8 cm tall.", "trivia"),
  f("tr_2", "Only eight nations have ever won the World Cup.", "trivia"),
  f("tr_3", "Goal-line technology was used at a World Cup for the first time in 2014.", "trivia"),
  f("tr_4", "VAR (Video Assistant Referee) debuted at the 2018 World Cup in Russia.", "trivia"),
  f("tr_5", "The 1970 World Cup in Mexico was the first broadcast in colour.", "trivia"),
  f("tr_6", "Italy and Brazil are the only teams to win consecutive World Cups.", "trivia"),
  f("tr_7", "The host nation has won the World Cup six times.", "trivia"),
  f("tr_8", "Semi-automated offside technology was introduced at the 2022 World Cup.", "trivia"),
  f("tr_9", "Morocco became the first African nation to reach a World Cup semi-final, in 2022.", "history"),
  f("tr_10", "Croatia reached the final in 2018 and finished third in 2022, a remarkable run for a small nation.", "history"),
  f("tr_11", "The Golden Boot is awarded to the World Cup's top scorer each tournament.", "trivia"),
  f("tr_12", "A World Cup match has 11 players per side and lasts 90 minutes plus stoppage time.", "trivia"),
  f("tr_13", "Penalty shootouts were first used to decide a World Cup match in 1982.", "trivia"),
  f("tr_14", "The maximum a team can play at one World Cup is seven matches, on the way to the final.", "trivia"),
  f("tr_15", "Germany's 7-1 win over Brazil in the 2014 semi-final stunned the host nation.", "history"),
];

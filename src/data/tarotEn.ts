/** 塔罗牌意英文包：为 78 张牌补齐英文正逆位释义（zh 缺失时回退中文）。 */
import type { Locale } from '../lib/i18n'

interface EnMeaning {
  up: string
  rev: string
}

const E = (up: string, rev: string): EnMeaning => ({ up, rev })

export const TAROT_EN: Record<string, EnMeaning> = {
  /* ---------- 大阿卡纳 ---------- */
  fool: E('Leap into the unknown with unreasonable faith — the universe nets first-timers. A new journey starts now.', 'Recklessness or cold feet. Check the ledge before leaping, but do not let fear lock your shoes.'),
  magician: E('Everything you need is already on your table. Focus the wish into action and it manifests.', 'Talent scattered or misused. Watch for smooth talk — starting with your own.'),
  'high-priestess': E('The answer lives inside you. Get quiet enough to hear the sentence nobody has said yet.', 'You ignored the still small voice, or mistook surface for substance. Big decisions can wait.'),
  empress: E('A lush season for whatever you water — work, body, or love. Tend it daily.', 'Over-giving, or outsourcing your sense of safety. Refill your own cup first.'),
  emperor: E('Build order with clear rules and steady discipline. You hold the map and the megaphone.', 'Rigid control, or allergy to structure. Power also means knowing when to open the gate.'),
  hierophant: E('Seek the teacher, the tradition, the tested path — boring works.', 'Question the doctrine. Your road may be the one not on the brochure.'),
  lovers: E('A heart-level choice arrives; alignment of values is the real union.', 'Values out of alignment, or a balance slipping. Dodging the choice only stretches it.'),
  chariot: E('Opposing forces harnessed into forward motion. Pick the destination and hold the reins.', 'Steering lost, or galloping on fumes. Stop, recalibrate, then drive.'),
  strength: E('True power is gentle and stubborn — taming the lion with patience, not chains.', 'Self-doubt or a temper off its leash. Softness here is courage, not surrender.'),
  hermit: E('Step under your own lamp. This answer is found alone, in quiet.', 'Isolation curdling into escape. The cave is fine; the lock is not.'),
  'wheel-of-fortune': E('The wheel turns your way — ride the change, a fresh cycle opens.', 'Resisting the spin, or blaming the low arc. Lows are part of the wheel too.'),
  justice: E('Cause meets effect; truth weighs in. Act honestly and the verdict lands well.', 'Bias or avoided accountability. The scale re-balances one way or another.'),
  'hanged-man': E('Pause on purpose. The view from upside-down reveals what standing never did.', 'Stalling disguised as sacrifice. If nothing new came from the pause, unhang yourself.'),
  death: E('A clean ending makes room. Let the old season close without a fight.', 'Clinging to a finished chapter. The door already shut; you are just leaning on it.'),
  temperance: E('Blend with patience — the middle recipe turns out best today.', 'Extremes pulling you apart. Re-measure the pour before you drink.'),
  devil: E('Name the chain and it shrinks — the lock was never truly locked.', 'A loop you keep defending. Ask what uncomfortable thing it excuses you from facing.'),
  tower: E('What collapses was scaffolding, not foundation. Rebuild on truth.', 'Bracing a doomed tower costs more than the fall. Choose demolition on your terms.'),
  star: E('After rain, soft light. Hope is rational again — make one small wish official.', 'Dimmed faith, pouring from an empty jug. Refill before you pour again.'),
  moon: E('Not everything glowing is friendly; walk slowly and trust the leash of facts.', 'Fog lifting off a fear that looked bigger at midnight. Wait for daylight data.'),
  sun: E('Everything simple works today — warmth, clarity, and winning without tricks.', 'Clouded joy: success diluted by gloom. Small sunshine still counts.'),
  judgement: E('The calling you shelved rings again. Answering it rewrites the whole story.', 'Deaf to your own summons. Self-judgement harsher than any court — soften the gavel.'),
  world: E('One full circle closes with applause. Dance, then pick the next mountain.', 'So near done — finish the last stitch instead of starting something shiny.'),

  /* ---------- 权杖 ---------- */
  'wands-ace': E('A spark of pure initiative — strike while the idea is hot.', 'Spark delayed: false starts, or passion on mute. Rekindle small.'),
  'wands-2': E('The map is yours to draw — first step out of the comfort harbour.', 'Playing it so safe the plan never leaves the dock.'),
  'wands-3': E('Ships you sent are coming back with cargo. Expand with confidence.', 'Waiting on horizons instead of working the ones in reach.'),
  'wands-4': E('Milestone joy — celebrate, gather people, call something home.', 'Transition fatigue: the party postponed forever. Have it anyway.'),
  'wands-5': E('Friendly competition sharpens everyone — spar, then beer.', 'Conflict spilling past the ring: same team, wrong target.'),
  'wands-6': E('Public win. Take the applause — you logged the miles.', 'Needing applause to move: no banner, no march? March anyway.'),
  'wands-7': E('Hold the high ground — you are winning the fight worth fighting.', 'Defending on every front means you forgot which hill matters.'),
  'wands-8': E('Fast movement, news inbound, delays over. Things fly now.', 'Delays stack like planes on a runway — patience, then thrust.'),
  'wands-9': E('One last stand with bruised arms: you are closer than the ache says.', 'Paranoid guarding of walls nobody is attacking. Rest, then reassess.'),
  'wands-10': E('Carrying everything is the bottleneck — delegate two bundles.', 'Burden worn as identity. Put some down; the world spins on.'),
  'wands-page': E('Curious news lights a creative fuse — say yes to exploring it.', 'Ideas flickering out from distraction. Fan one spark only.'),
  'wands-knight': E('Charge! Energy plus direction equals arrival — go now.', 'Charging in every direction at once, or burnout mid-gallop.'),
  'wands-queen': E('Warm charisma running the room without raising a voice.', 'Confidence turned bossy, or fire banked too low to cook with.'),
  'wands-king': E('Visionary leadership — see far, delegate well, inspire freely.', 'Steamrolling charm, or a dreamer refusing the practical ask.'),

  /* ---------- 圣杯 ---------- */
  'cups-ace': E('Feelings overflow — love, apology, or inspiration offered. Cup lifted, take it.', 'An offered heart left on read; emotions dammed till they spill.'),
  'cups-2': E('Mutual recognition — partnership sealed with a look. Say the honest thing.', 'Unequal give-and-take. Recalibrate before resentment signs anything.'),
  'cups-3': E('Celebration with your people — good news circles twice.', 'Gossip-flavoured fun, or third-wheel dynamics. Choose the circle carefully.'),
  'cups-4': E('Apathy with a gift sitting right there — look down.', 'Boredom mistaken for the whole menu. New cup, same table.'),
  'cups-5': E('Grieve what spilled; notice the two cups still standing.', 'Dwelling in the spill so long the full ones go stale too.'),
  'cups-6': E('Nostalgia with a purpose — an old friend, place, or kindness returns.', 'Living in the past tense. Visit memory; do not move in.'),
  'cups-7': E('Seven tempting doors, mostly paint and cardboard — test before choosing.', 'Option paralysis dressed as dreaming. Pick one real door.'),
  'cups-8': E('Walking away from "fine" toward "true". The leaving itself is healthy.', 'Retreating before the search even started — depth was one question away.'),
  'cups-9': E('The wish card — contentment earned and savoured.', 'Hedonism with a hangover, or sweetness kept superficial.'),
  'cups-10': E('Harmony worth toasting — family, chosen or given.', 'Postcard peace: real friction hidden under smiles. Talk once, honestly.'),
  'cups-page': E('A tender message — feelings confessed, creativity seeded.', 'Romantic daydreaming instead of one real message sent.'),
  'cups-knight': E('Romance shows up with flowers and a plan (rare combo).', 'Charming promises with wet feet — follow-through pending.'),
  'cups-queen': E('Empathy as superpower — you hear what was not said.', 'Over-absorbing everyone\'s weather. Boundaries keep the compass dry.'),
  'cups-king': E('Deep feeling steered with wisdom — counsel others calmly.', 'Feelings managed by suppression. Calm outside, kettle inside.'),

  /* ---------- 宝剑 ---------- */
  'swords-ace': E('Clarity strikes — name the truth plainly and act on it.', 'A sharp tongue sharpened wrongly, or half-truths cutting back.'),
  'swords-2': E('Blindfolded stalemate: the data exists; remove the cloth.', 'Deciding by avoidance. Two options will not resolve themselves.'),
  'swords-3': E('The honest ache — heartbreak that teaches anatomy of the heart.', 'Prolonging pain with bitter replays. Heal, do not rehearse.'),
  'swords-4': E('Recovery mode is productive mode. Rest like it is your job.', 'Burnout ignored, retreat refused. The sword stays sharp in the sheath.'),
  'swords-5': E('Winning hollowly — you took the point and lost the room.', 'Old grudges replaying. A truce costs less than vindication.'),
  'swords-6': E('Crossing to calmer waters — leave the noise on the far bank.', 'Baggage smuggled aboard the ferry. Travel lighter or repeat the trip.'),
  'swords-7': E('Strategy works when honest — outthink, do not deceive.', 'Cutting corners, or suspecting corners cut. Verify gently.'),
  'swords-8': E('The bindings are belief, not rope — one step tests it.', 'Self-made prison, mind-forged manacles. The gate is unlocked.'),
  'swords-9': E('3am fears exaggerate — name them at breakfast.', 'Anxiety loops treated as prophecy. Share the weight aloud.'),
  'swords-10': E('The worst already happened — sunrise is structural now.', 'Betrayal nursed into identity. Endings end; allow the dawn.'),
  'swords-page': E('Curiosity with a notebook — question everything politely.', 'Sharp gossip, or snooping dressed as research.'),
  'swords-knight': E('Fast, factual, fearless — charge the problem head-on.', 'Speed without steering: words first, damage control later.'),
  'swords-queen': E('Clear-eyed kindness — cuts cleanly, never cruelly.', 'Perception weaponised; independence mistaken for invulnerability.'),
  'swords-king': E('Judgment with integrity — decide on evidence, speak with care.', 'Cold authority, or rules enforced without context.'),

  /* ---------- 星币 ---------- */
  'pentacles-ace': E('A tangible seed: offer, job, cheque, key. Plant it properly.', 'A solid opportunity fumbled by flakiness. Show up and sign.'),
  'pentacles-2': E('Juggling two gigs gracefully — keep both balls breathing.', 'Over-juggling into drops. One ball can bounce till tomorrow.'),
  'pentacles-3': E('Craft recognised — teamwork builds the cathedral.', 'Medicine-ball feedback ignored, or lone-wolf drafting.'),
  'pentacles-4': E('Consolidate: save, secure, hold the line you drew.', 'Grip too tight — coins clutched stop circulating, including joy.'),
  'pentacles-5': E('Lean season, cold church — help exists; ask loudly.', 'Pride blocking the food bank of life. Nobody scores suffering.'),
  'pentacles-6': E('Generosity circulates — giving and receiving both honourable.', 'Strings attached to gifts, or charity as theatre.'),
  'pentacles-7': E('Long game assessment — the orchard grows while you sleep.', 'Impatience uprooting half-grown trees to check roots.'),
  'pentacles-8': E('Apprentice energy — repetition is the ritual that masters craft.', 'Phoning in the practice; perfectionism stalling progress.'),
  'pentacles-9': E('Self-made comfort — you grew this garden, enjoy the fruit.', 'Golden cage syndrome: independent but lonely at the top.'),
  'pentacles-10': E('Legacy picture — family, wealth, roots holding generations.', 'Wealth without warmth, or tradition as a locked museum.'),
  'pentacles-page': E('Scholarship with stakes — a course, a coin, a concrete plan.', 'Study as procrastination; big plans, empty pencil case.'),
  'pentacles-knight': E('Slow, sure, unstoppable — the steady hand wins tenders.', 'Stubborn plodding past better routes, or risk-phobia.'),
  'pentacles-queen': E('Practical nurturing — resources managed like a garden.', 'Work-life scales tipped so far the home garden wilts.'),
  'pentacles-king': E('The patron of built things — security shared multiplies.', 'Hoarded security; worth measured only in vaults.'),
}

/** 本地化取义：EN 缺失时回退中文原字段 */
export function cardMeaning(
  card: { id: string; upright: string; reversed: string },
  localeValue: Locale,
  reversed = false,
): string {
  if (localeValue !== 'en') return reversed ? card.reversed : card.upright
  const en = TAROT_EN[card.id]
  if (!en) return reversed ? card.reversed : card.upright
  return reversed ? en.rev : en.up
}

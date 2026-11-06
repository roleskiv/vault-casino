export interface Tier { id: string; name: string; min: number; colors: [string, string, string]; perks: string[]; rakeback: number }
export const TIERS: Tier[] = [
  { id: 'bronze', name: 'Bronze', min: 0, colors: ['#E3A774', '#A0623A', '#5A3420'], rakeback: 2, perks: ['Weekly demo bonus', 'Daily reward chest'] },
  { id: 'silver', name: 'Silver', min: 25_000, colors: ['#F1F3F6', '#AEB5C0', '#5D6470'], rakeback: 3, perks: ['Level-up bonus: 500 VC', 'Weekly demo bonus +10%'] },
  { id: 'gold', name: 'Gold', min: 100_000, colors: ['#F5D778', '#D4AF37', '#7A5F14'], rakeback: 5, perks: ['Level-up bonus: 2,500 VC', 'Monthly demo bonus', 'Priority demo support'] },
  { id: 'platinum', name: 'Platinum', min: 400_000, colors: ['#E9F1F5', '#9FB4C2', '#4B5E6B'], rakeback: 7, perks: ['Level-up bonus: 10,000 VC', 'Personal host (mock)', 'Exclusive tournaments'] },
  { id: 'diamond', name: 'Diamond', min: 1_500_000, colors: ['#DDF6FF', '#7FC8E8', '#2E6C8A'], rakeback: 9, perks: ['Level-up bonus: 40,000 VC', 'Tailored demo rewards', 'Early access to Originals'] },
  { id: 'obsidian', name: 'Obsidian', min: 5_000_000, colors: ['#3A3F48', '#14171C', '#000000'], rakeback: 12, perks: ['Invitation-only', 'Bespoke demo rewards', 'Obsidian lounge (mock)', 'Every perk above'] },
]
export const tierFor = (wagered: number) => {
  let i = 0
  TIERS.forEach((t, k) => { if (wagered >= t.min) i = k })
  const cur = TIERS[i]
  const next = TIERS[i + 1]
  const progress = next ? (wagered - cur.min) / (next.min - cur.min) : 1
  return { index: i, tier: cur, next, progress }
}

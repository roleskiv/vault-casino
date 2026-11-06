export type Category = 'originals' | 'slots' | 'live' | 'table'

export type ArtKind =
  | 'mines' | 'crash' | 'dice' | 'plinko' | 'blackjack' | 'roulette' | 'limbo' | 'keno' | 'wheel' | 'hilo'
  | 'slot' | 'live'

export interface Game {
  id: string
  name: string
  provider: string
  category: Category
  art: ArtKind
  /** gradient + accent palette for cover art */
  palette: [string, string, string]
  /** glyph used on slot / live covers */
  glyph?: string
  tags?: ('new' | 'hot' | 'exclusive')[]
  playable: 'mines' | 'crash' | 'dice' | 'plinko' | 'slot' | 'blackjack' | 'roulette' | 'limbo' | 'keno' | 'wheel' | 'hilo' | null
  rtp: number
  players: number
  blurb: string
}

const O = 'VAULT Originals'

export const GAMES: Game[] = [
  { id: 'vault-mines', name: 'Vault Mines', provider: O, category: 'originals', art: 'mines', palette: ['#1a1a12', '#0b0c0f', '#D4AF37'], playable: 'mines', rtp: 99, players: 1842, tags: ['exclusive', 'hot'], blurb: 'Uncover gold gems on a 5 × 5 grid. Avoid the mines and cash out whenever you like.' },
  { id: 'vault-crash', name: 'Vault Crash', provider: O, category: 'originals', art: 'crash', palette: ['#14170f', '#090B0F', '#F5D778'], playable: 'crash', rtp: 99, players: 2631, tags: ['exclusive', 'hot'], blurb: 'A multiplier climbs from 1.00×. Cash out before the round ends.' },
  { id: 'vault-dice', name: 'Vault Dice', provider: O, category: 'originals', art: 'dice', palette: ['#16130c', '#0a0b0e', '#D4AF37'], playable: 'dice', rtp: 99, players: 1205, tags: ['exclusive'], blurb: 'Pick a target and roll over or under it. You set the odds.' },
  { id: 'vault-plinko', name: 'Vault Plinko', provider: O, category: 'originals', art: 'plinko', palette: ['#171410', '#090B0F', '#F5D778'], playable: 'plinko', rtp: 99, players: 1577, tags: ['exclusive'], blurb: 'Drop a ball through rows of gold pins into a multiplier pocket.' },
  { id: 'vault-blackjack', name: 'Vault Blackjack', provider: O, category: 'originals', art: 'blackjack', palette: ['#0f1512', '#090B0F', '#D4AF37'], playable: 'blackjack', rtp: 99.5, players: 934, tags: ['exclusive'], blurb: 'Classic blackjack against the dealer with a refined VAULT table.' },
  { id: 'vault-roulette', name: 'Vault Roulette', provider: O, category: 'originals', art: 'roulette', palette: ['#160f0f', '#090B0F', '#D4AF37'], playable: 'roulette', rtp: 97.3, players: 712, tags: ['exclusive'], blurb: 'Single-zero roulette on a machined brass wheel.' },
  { id: 'vault-limbo', name: 'Vault Limbo', provider: O, category: 'originals', art: 'limbo', palette: ['#12131a', '#090B0F', '#F5D778'], playable: 'limbo', rtp: 99, players: 488, tags: ['new', 'exclusive'], blurb: 'Choose a target multiplier and see if the round reaches it.' },
  { id: 'vault-keno', name: 'Vault Keno', provider: O, category: 'originals', art: 'keno', palette: ['#141210', '#090B0F', '#D4AF37'], playable: 'keno', rtp: 99, players: 301, tags: ['new', 'exclusive'], blurb: 'Pick up to ten numbers and watch the draw.' },
  { id: 'vault-wheel', name: 'Vault Wheel', provider: O, category: 'originals', art: 'wheel', palette: ['#15120d', '#090B0F', '#F5D778'], playable: 'wheel', rtp: 99, players: 266, tags: ['exclusive'], blurb: 'Spin a segmented wheel with selectable risk.' },
  { id: 'vault-hilo', name: 'Vault Hi-Lo', provider: O, category: 'originals', art: 'hilo', palette: ['#10141a', '#090B0F', '#D4AF37'], playable: 'hilo', rtp: 99, players: 397, tags: ['new', 'exclusive'], blurb: 'Guess whether the next card is higher or lower.' },

  // Slots (fictional studios)
  { id: 'pharaohs-ledger', name: "Pharaoh's Ledger", provider: 'Northlight Studios', category: 'slots', art: 'slot', glyph: 'ankh', palette: ['#3b2a0e', '#120d06', '#F0C060'], playable: 'slot', rtp: 96.0, players: 822, tags: ['hot'], blurb: 'Five reels of gilded tablets and desert relics.' },
  { id: 'neon-koi', name: 'Neon Koi', provider: 'Ember & Oak', category: 'slots', art: 'slot', glyph: 'fish', palette: ['#0d2a3a', '#06121a', '#5ee0d8'], playable: 'slot', rtp: 96.0, players: 640, blurb: 'Lantern-lit ponds and luminous koi.' },
  { id: 'aurora-reels', name: 'Aurora Reels', provider: 'Polaris Gaming', category: 'slots', art: 'slot', glyph: 'sparkles', palette: ['#1d1640', '#0a0918', '#9d8cff'], playable: 'slot', rtp: 96.0, players: 511, tags: ['new'], blurb: 'Northern lights over frozen fjords.' },
  { id: 'midnight-orchard', name: 'Midnight Orchard', provider: 'Ember & Oak', category: 'slots', art: 'slot', glyph: 'cherry', palette: ['#3a0f1c', '#14060b', '#ff6f8f'], playable: 'slot', rtp: 96.0, players: 455, blurb: 'Moonlit fruit with a modern finish.' },
  { id: 'ironclad', name: 'Ironclad', provider: 'Foundry Nine', category: 'slots', art: 'slot', glyph: 'shield', palette: ['#232a33', '#0b0e12', '#c8d3df'], playable: 'slot', rtp: 96.0, players: 389, blurb: 'Rivets, steam and steel.' },
  { id: 'sakura-drift', name: 'Sakura Drift', provider: 'Polaris Gaming', category: 'slots', art: 'slot', glyph: 'flower', palette: ['#3a1730', '#130811', '#ffb3d1'], playable: 'slot', rtp: 96.0, players: 702, tags: ['hot'], blurb: 'Cherry blossoms carried on the wind.' },
  { id: 'cosmic-heist', name: 'Cosmic Heist', provider: 'Foundry Nine', category: 'slots', art: 'slot', glyph: 'rocket', palette: ['#0f1d3d', '#060a17', '#7ab8ff'], playable: 'slot', rtp: 96.0, players: 366, tags: ['new'], blurb: 'An orbital crew and a very large safe.' },
  { id: 'wild-meridian', name: 'Wild Meridian', provider: 'Northlight Studios', category: 'slots', art: 'slot', glyph: 'sun', palette: ['#3a240c', '#130b04', '#ffb347'], playable: 'slot', rtp: 96.0, players: 298, blurb: 'Golden-hour plains and roaming herds.' },
  { id: 'emerald-crown', name: 'Emerald Crown', provider: 'Ember & Oak', category: 'slots', art: 'slot', glyph: 'crown', palette: ['#0d2e22', '#05110c', '#31C48D'], playable: 'slot', rtp: 96.0, players: 544, tags: ['new'], blurb: 'Royal jewels in a green-velvet vault.' },
  { id: 'thunder-forge', name: 'Thunder Forge', provider: 'Foundry Nine', category: 'slots', art: 'slot', glyph: 'zap', palette: ['#2a2310', '#0e0b05', '#ffd84d'], playable: 'slot', rtp: 96.0, players: 412, blurb: 'Hammers, anvils and crackling sparks.' },

  // Live (mock)
  { id: 'live-blackjack-1', name: 'Blackjack Salon', provider: 'Studio Demo', category: 'live', art: 'live', glyph: 'spade', palette: ['#0f2a20', '#06110c', '#D4AF37'], playable: null, rtp: 99.3, players: 214, blurb: 'Mock preview of a hosted blackjack table.' },
  { id: 'live-roulette-1', name: 'Roulette Atelier', provider: 'Studio Demo', category: 'live', art: 'live', glyph: 'circle', palette: ['#2e0f12', '#110607', '#D4AF37'], playable: null, rtp: 97.3, players: 388, blurb: 'Mock preview of a hosted roulette table.' },
  { id: 'live-baccarat-1', name: 'Baccarat Noir', provider: 'Studio Demo', category: 'live', art: 'live', glyph: 'diamond', palette: ['#1b1b24', '#08080c', '#F5D778'], playable: null, rtp: 98.9, players: 167, blurb: 'Mock preview of a hosted baccarat table.' },
  { id: 'live-game-show', name: 'Golden Wheel Show', provider: 'Studio Demo', category: 'live', art: 'live', glyph: 'star', palette: ['#2b1f0b', '#0f0a04', '#F5D778'], playable: null, rtp: 96.1, players: 542, tags: ['new'], blurb: 'Mock preview of a hosted game show.' },
  { id: 'live-poker-1', name: "Hold'em Lounge", provider: 'Studio Demo', category: 'live', art: 'live', glyph: 'club', palette: ['#121f2e', '#060b11', '#D4AF37'], playable: null, rtp: 98.4, players: 121, blurb: 'Mock preview of a hosted poker table.' },
  { id: 'live-dragon', name: 'Dragon & Tiger', provider: 'Studio Demo', category: 'live', art: 'live', glyph: 'flame', palette: ['#2e140b', '#110704', '#ff9a4d'], playable: null, rtp: 96.3, players: 96, blurb: 'Mock preview of a hosted card game.' },
]

export const byId = (id: string) => GAMES.find((g) => g.id === id)
export const ORIGINALS = GAMES.filter((g) => g.category === 'originals')
export const SLOTS = GAMES.filter((g) => g.category === 'slots')
export const LIVE = GAMES.filter((g) => g.category === 'live')
export const FEATURED = ['vault-mines', 'vault-crash', 'vault-dice', 'vault-plinko', 'vault-blackjack', 'vault-roulette'].map((id) => byId(id)!)
export const POPULAR = ['vault-crash', 'pharaohs-ledger', 'vault-mines', 'sakura-drift', 'vault-plinko', 'neon-koi', 'vault-dice', 'emerald-crown', 'live-roulette-1', 'aurora-reels', 'vault-limbo', 'thunder-forge'].map((id) => byId(id)!)
export const NEW_RELEASES = GAMES.filter((g) => g.tags?.includes('new'))

import type { Stats } from '../lib/game';
import { BADGES, levelTitle, xpForLevel } from '../lib/game';
import { ProgressRing } from '../components/ProgressRing';

interface Props {
  stats: Stats;
  earned: Record<string, number>;
}

export function BadgesScreen({ stats, earned }: Props) {
  const start = xpForLevel(stats.level);
  const end = xpForLevel(stats.level + 1);
  const count = BADGES.filter((b) => earned[b.id]).length;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[28px] font-extrabold tracking-tight">Rewards</h1>

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-fuchsia-600 via-purple-600 to-orange-500 p-5 shadow-2xl shadow-fuchsia-900/40">
        <div className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <ProgressRing value={(stats.xp - start) / (end - start)} size={92} stroke={9} from="#ffffff" to="#fde68a" track="rgba(255,255,255,0.2)">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Level</p>
              <p className="font-display text-3xl font-extrabold leading-none">{stats.level}</p>
            </div>
          </ProgressRing>
          <div>
            <p className="font-display text-2xl font-extrabold">{levelTitle(stats.level)}</p>
            <p className="text-sm text-white/80">{end - stats.xp} XP to level {stats.level + 1}</p>
            <p className="mt-2 text-xs text-white/70">+10 XP per check-in · +20 XP per perfect day</p>
          </div>
        </div>
      </section>

      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-bold">Badges</h2>
        <span className="text-sm text-white/50">{count}/{BADGES.length} unlocked</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {BADGES.map((b, i) => {
          const got = Boolean(earned[b.id]);
          const [have, goal] = b.progress(stats);
          return (
            <div
              key={b.id}
              className={`animate-rise flex flex-col items-center rounded-3xl p-3 text-center ${got ? 'glass' : 'border border-dashed border-white/10 bg-white/[0.02]'}`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${got ? 'bg-gradient-to-br from-amber-300/30 to-fuchsia-500/30 shadow-lg shadow-fuchsia-500/20' : 'bg-white/5 grayscale opacity-40'}`}>
                {b.emoji}
              </span>
              <p className={`mt-2 text-[13px] font-bold leading-tight ${got ? '' : 'text-white/55'}`}>{b.name}</p>
              <p className="mt-0.5 text-[10.5px] leading-snug text-white/40">{b.description}</p>
              {!got && (
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/8" title={`${have}/${goal}`}>
                  <div className="h-full rounded-full bg-fuchsia-400/70" style={{ width: `${(have / goal) * 100}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';

export type AvatarKey =
  | 'avatar_braids'
  | 'avatar_headwrap'
  | 'avatar_beard'
  | 'avatar_shades'
  | 'avatar_glasses'
  | 'avatar_buzzcut';

export interface AvatarOption {
  id: AvatarKey;
  label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'avatar_braids', label: 'Braided Champion' },
  { id: 'avatar_headwrap', label: 'Empress Headwrap' },
  { id: 'avatar_beard', label: 'Goatee Striker' },
  { id: 'avatar_shades', label: 'Cap & Shades' },
  { id: 'avatar_glasses', label: 'Purple Glam' },
  { id: 'avatar_buzzcut', label: 'Buzzcut Warrior' },
];

export function normalizeAvatarKey(raw?: string): AvatarKey {
  if (!raw) return 'avatar_braids';
  if (
    raw === 'avatar_braids' ||
    raw === 'avatar_headwrap' ||
    raw === 'avatar_beard' ||
    raw === 'avatar_shades' ||
    raw === 'avatar_glasses' ||
    raw === 'avatar_buzzcut'
  ) {
    return raw as AvatarKey;
  }
  // Short names
  if (raw === 'braids') return 'avatar_braids';
  if (raw === 'headwrap') return 'avatar_headwrap';
  if (raw === 'beard' || raw === 'goatee') return 'avatar_beard';
  if (raw === 'shades' || raw === 'cap') return 'avatar_shades';
  if (raw === 'glasses' || raw === 'purple') return 'avatar_glasses';
  if (raw === 'buzzcut' || raw === 'buzz') return 'avatar_buzzcut';

  // Legacy emoji fallbacks
  switch (raw) {
    case '👑':
    case '🔥':
    case '🦁':
      return 'avatar_braids';
    case '⚡':
    case '🌸':
    case '💎':
      return 'avatar_headwrap';
    case '🐉':
    case '🎩':
    case '🦅':
      return 'avatar_beard';
    case '🎯':
    case '🦊':
    case '🚀':
      return 'avatar_shades';
    case '🐼':
    case '🏆':
    case '⭐':
      return 'avatar_glasses';
    case '🤖':
    case '🎲':
    default:
      return 'avatar_buzzcut';
  }
}

/** 1. Braided cornrows character (Top Left) */
export const BraidsAvatarSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark background circle */}
    <circle cx="50" cy="50" r="48" fill="#18181b" />
    {/* Neck */}
    <path d="M42 66 L42 82 L58 82 L58 66 Z" fill="#6d3d25" stroke="#111" strokeWidth="2.5" />
    {/* Golden collar/necklace */}
    <path d="M38 78 Q50 86 62 78" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    
    {/* Ears */}
    <circle cx="28" cy="54" r="7" fill="#8c5638" stroke="#111" strokeWidth="2" />
    <circle cx="72" cy="54" r="7" fill="#8c5638" stroke="#111" strokeWidth="2" />

    {/* Face Base */}
    <ellipse cx="50" cy="54" rx="23" ry="24" fill="#8c5638" stroke="#111" strokeWidth="2.8" />

    {/* Cornrow Braids on Head (curved back rows) */}
    <path d="M30 46 C32 30, 48 24, 70 46" fill="#201510" stroke="#111" strokeWidth="2.5" />
    {/* Individual braid ridge rows */}
    <path d="M34 40 Q40 27 54 28" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M38 34 Q46 25 60 29" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M44 30 Q54 24 66 33" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M50 28 Q62 26 70 38" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
    {/* Hair edge details */}
    <circle cx="31" cy="42" r="2" fill="#111" />
    <circle cx="33" cy="36" r="2" fill="#111" />
    <circle cx="36" cy="31" r="2" fill="#111" />
    <circle cx="40" cy="27" r="2" fill="#111" />
    <circle cx="45" cy="24" r="2" fill="#111" />

    {/* Eyebrows - intense/fierce angled downwards */}
    <path d="M35 48 Q44 48 47 52" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M65 48 Q56 48 53 52" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />

    {/* Cartoon Eyes - looking intense */}
    <ellipse cx="41" cy="54" rx="6" ry="4.5" fill="#fff" stroke="#111" strokeWidth="1.8" />
    <circle cx="42" cy="54" r="3.2" fill="#111" />
    <circle cx="43.5" cy="53" r="1.1" fill="#fff" />

    <ellipse cx="59" cy="54" rx="6" ry="4.5" fill="#fff" stroke="#111" strokeWidth="1.8" />
    <circle cx="58" cy="54" r="3.2" fill="#111" />
    <circle cx="59.5" cy="53" r="1.1" fill="#fff" />

    {/* Nose */}
    <path d="M48 59 Q50 63 53 60" stroke="#4a2614" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Mouth - determined smirk */}
    <path d="M45 68 Q50 67 55 68" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/** 2. Emerald Green Headwrap & Gold Hoops (Top Center) */
export const HeadwrapAvatarSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark background circle */}
    <circle cx="50" cy="50" r="48" fill="#18181b" />
    
    {/* Large Gold Hoop Earrings (behind neck/face) */}
    <circle cx="28" cy="65" r="9" stroke="#fbbf24" strokeWidth="3" fill="none" />
    <circle cx="72" cy="65" r="9" stroke="#fbbf24" strokeWidth="3" fill="none" />

    {/* Neck */}
    <path d="M43 68 L43 83 L57 83 L57 68 Z" fill="#6d3d25" stroke="#111" strokeWidth="2.2" />

    {/* Face Base */}
    <ellipse cx="50" cy="57" rx="21" ry="22" fill="#8c5638" stroke="#111" strokeWidth="2.5" />

    {/* Green Headwrap (Gele/Turban) */}
    {/* Top bow/wrap bundle */}
    <ellipse cx="48" cy="23" rx="14" ry="9" fill="#15803d" stroke="#111" strokeWidth="2.5" />
    <path d="M38 18 Q50 25 58 17 Q54 28 40 26 Z" fill="#16a34a" />
    <circle cx="48" cy="24" r="2.5" fill="#facc15" stroke="#111" strokeWidth="1" />

    {/* Main Turban Body wrapping forehead */}
    <path
      d="M28 44 C27 26, 73 26, 72 44 C72 50, 28 50, 28 44 Z"
      fill="#15803d"
      stroke="#111"
      strokeWidth="2.8"
    />
    {/* Turban folds / texture lines */}
    <path d="M30 40 Q50 32 70 41" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M29 45 Q50 37 71 46" stroke="#14532d" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M34 32 Q50 27 66 33" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" />

    {/* Slender Arched Eyebrows */}
    <path d="M37 50 Q43 46 48 49" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M63 50 Q57 46 52 49" stroke="#111" strokeWidth="2.2" strokeLinecap="round" />

    {/* Expressive Eyes looking slightly right with gentle eyelashes */}
    <ellipse cx="42" cy="55" rx="5" ry="3.5" fill="#fff" stroke="#111" strokeWidth="1.5" />
    <circle cx="44" cy="55" r="2.6" fill="#111" />
    <circle cx="45" cy="54" r="0.9" fill="#fff" />
    {/* Eyelash */}
    <path d="M47 53 L49 51" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />

    <ellipse cx="58" cy="55" rx="5" ry="3.5" fill="#fff" stroke="#111" strokeWidth="1.5" />
    <circle cx="60" cy="55" r="2.6" fill="#111" />
    <circle cx="61" cy="54" r="0.9" fill="#fff" />
    <path d="M63 53 L65 51" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />

    {/* Small Cute Nose */}
    <path d="M49 59 Q51 62 53 60" stroke="#4a2614" strokeWidth="1.8" strokeLinecap="round" fill="none" />

    {/* Gentle Red/Pink Smile */}
    <path d="M44 67 Q50 72 57 67" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

/** 3. Bald with Pointed Goatee & Intense Brow (Top Right) */
export const GoateeAvatarSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark background circle */}
    <circle cx="50" cy="50" r="48" fill="#18181b" />

    {/* Neck */}
    <path d="M42 68 L42 84 L58 84 L58 68 Z" fill="#7a4e32" stroke="#111" strokeWidth="2.5" />

    {/* Ears */}
    <circle cx="27" cy="54" r="7" fill="#9c7a5c" stroke="#111" strokeWidth="2.2" />
    <circle cx="73" cy="54" r="7" fill="#9c7a5c" stroke="#111" strokeWidth="2.2" />

    {/* Bald Head / Cranium with sleek curve */}
    <ellipse cx="50" cy="52" rx="23" ry="26" fill="#9c7a5c" stroke="#111" strokeWidth="2.8" />
    {/* Bald shine highlight */}
    <path d="M40 32 Q50 28 58 32" stroke="#c4a482" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

    {/* Thick Intense Eyebrows angled in cartoon battle look */}
    <path d="M33 46 Q43 45 48 51" stroke="#111" strokeWidth="4" strokeLinecap="round" />
    <path d="M67 46 Q57 45 52 51" stroke="#111" strokeWidth="4" strokeLinecap="round" />

    {/* Big Cartoon Eyes looking left */}
    <ellipse cx="40" cy="54" rx="6.5" ry="5" fill="#fff" stroke="#111" strokeWidth="2" />
    <circle cx="39" cy="54" r="3.2" fill="#111" />
    <circle cx="40.2" cy="53" r="1.1" fill="#fff" />

    <ellipse cx="60" cy="54" rx="6.5" ry="5" fill="#fff" stroke="#111" strokeWidth="2" />
    <circle cx="59" cy="54" r="3.2" fill="#111" />
    <circle cx="60.2" cy="53" r="1.1" fill="#fff" />

    {/* Nose */}
    <path d="M48 60 Q50 64 53 61" stroke="#50311f" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Mouth */}
    <path d="M46 68 Q50 67 54 68" stroke="#111" strokeWidth="2" strokeLinecap="round" />

    {/* Pointed Chin Goatee Beard */}
    <path
      d="M44 71 Q50 82 56 71 Q50 74 44 71 Z"
      fill="#26160c"
      stroke="#111"
      strokeWidth="2"
    />
    <polygon points="46,72 54,72 50,81" fill="#1c1008" />
  </svg>
);

/** 4. Green Cap & Dark Sunglasses (Bottom Left) */
export const CapShadesAvatarSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark background circle */}
    <circle cx="50" cy="50" r="48" fill="#18181b" />

    {/* Neck */}
    <path d="M40 70 L40 85 L60 85 L60 70 Z" fill="#6a3922" stroke="#111" strokeWidth="2.5" />

    {/* Rounded Ears */}
    <circle cx="26" cy="56" r="8" fill="#884c2f" stroke="#111" strokeWidth="2.4" />
    <circle cx="74" cy="56" r="8" fill="#884c2f" stroke="#111" strokeWidth="2.4" />

    {/* Broader Face Base */}
    <ellipse cx="50" cy="58" rx="24" ry="23" fill="#884c2f" stroke="#111" strokeWidth="2.8" />

    {/* Green Baseball Cap Body */}
    <path
      d="M28 45 C28 26, 72 26, 72 45 Z"
      fill="#22c55e"
      stroke="#111"
      strokeWidth="2.8"
    />
    {/* Cap button on crown */}
    <circle cx="50" cy="27" r="3" fill="#15803d" stroke="#111" strokeWidth="1.5" />
    {/* Cap curved bill / visor */}
    <path
      d="M24 45 C32 40, 68 40, 76 45 C78 49, 70 51, 50 51 C30 51, 22 49, 24 45 Z"
      fill="#16a34a"
      stroke="#111"
      strokeWidth="2.5"
    />

    {/* Sleek Dark Sunglasses / Shades */}
    {/* Left lens */}
    <path
      d="M31 52 L47 52 C48 61, 33 62, 31 52 Z"
      fill="#09090b"
      stroke="#111"
      strokeWidth="2.5"
    />
    {/* Right lens */}
    <path
      d="M53 52 L69 52 C70 61, 55 62, 53 52 Z"
      fill="#09090b"
      stroke="#111"
      strokeWidth="2.5"
    />
    {/* Bridge */}
    <line x1="46" y1="53" x2="54" y2="53" stroke="#111" strokeWidth="3" />
    {/* Sunglasses glare reflection */}
    <line x1="34" y1="54" x2="42" y2="58" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
    <line x1="56" y1="54" x2="64" y2="58" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />

    {/* Broad Nose */}
    <path d="M47 64 Q50 67 53 64" stroke="#4a2614" strokeWidth="2.4" strokeLinecap="round" fill="none" />

    {/* Cool Tough Mouth */}
    <path d="M44 72 Q50 71 56 72" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

/** 5. Purple Fade Hair & Black Eyeglasses (Bottom Center) */
export const PurpleGlassesAvatarSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark background circle */}
    <circle cx="50" cy="50" r="48" fill="#18181b" />

    {/* Gold Ball Stud Earring */}
    <circle cx="28" cy="58" r="2.5" fill="#fbbf24" stroke="#111" strokeWidth="1" />

    {/* Neck */}
    <path d="M42 68 L42 84 L58 84 L58 68 Z" fill="#5f3521" stroke="#111" strokeWidth="2.2" />

    {/* Ears */}
    <circle cx="28" cy="56" r="6" fill="#7e4a30" stroke="#111" strokeWidth="2" />
    <circle cx="72" cy="56" r="6" fill="#7e4a30" stroke="#111" strokeWidth="2" />

    {/* Face Base */}
    <ellipse cx="50" cy="57" rx="21" ry="23" fill="#7e4a30" stroke="#111" strokeWidth="2.6" />

    {/* Cropped Afro Hair with Vibrant Purple Tips */}
    <path
      d="M28 46 C26 26, 74 26, 72 46 C70 34, 30 34, 28 46 Z"
      fill="#18181b"
      stroke="#111"
      strokeWidth="2.5"
    />
    {/* Spiky / textured purple hair top */}
    <path
      d="M32 36 Q34 26 40 28 Q44 23 50 25 Q56 22 62 28 Q66 26 68 36 Q50 29 32 36 Z"
      fill="#a855f7"
      stroke="#9333ea"
      strokeWidth="1.5"
    />

    {/* Modern Rectangular Black Glasses */}
    {/* Left Frame */}
    <rect x="31" y="49" width="16" height="11" rx="2.5" fill="#f8fafc" stroke="#111" strokeWidth="2.6" />
    {/* Left Pupil behind glass */}
    <circle cx="39" cy="54.5" r="2.5" fill="#111" />
    <circle cx="40" cy="53.5" r="0.8" fill="#fff" />

    {/* Right Frame */}
    <rect x="53" y="49" width="16" height="11" rx="2.5" fill="#f8fafc" stroke="#111" strokeWidth="2.6" />
    {/* Right Pupil behind glass */}
    <circle cx="61" cy="54.5" r="2.5" fill="#111" />
    <circle cx="62" cy="53.5" r="0.8" fill="#fff" />

    {/* Center Bridge & Temples */}
    <line x1="47" y1="54" x2="53" y2="54" stroke="#111" strokeWidth="2.5" />
    <line x1="28" y1="53" x2="31" y2="53" stroke="#111" strokeWidth="2.5" />
    <line x1="69" y1="53" x2="72" y2="53" stroke="#111" strokeWidth="2.5" />

    {/* Nose */}
    <path d="M49 63 Q50 66 52 64" stroke="#452312" strokeWidth="1.8" strokeLinecap="round" fill="none" />

    {/* Purple Lipstick Smile */}
    <path d="M43 71 Q50 76 57 71" stroke="#9333ea" strokeWidth="3" strokeLinecap="round" fill="none" />
  </svg>
);

/** 6. Athletic Buzzcut Fade (Bottom Right) */
export const BuzzcutAvatarSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Dark background circle */}
    <circle cx="50" cy="50" r="48" fill="#18181b" />

    {/* Neck */}
    <path d="M42 68 L42 85 L58 85 L58 68 Z" fill="#673e27" stroke="#111" strokeWidth="2.5" />

    {/* Ears */}
    <circle cx="27" cy="55" r="7" fill="#855237" stroke="#111" strokeWidth="2.2" />
    <circle cx="73" cy="55" r="7" fill="#855237" stroke="#111" strokeWidth="2.2" />

    {/* Face Base */}
    <ellipse cx="50" cy="54" rx="23" ry="24" fill="#855237" stroke="#111" strokeWidth="2.8" />

    {/* Clean Buzzcut Hair & Fade */}
    <path
      d="M27 46 C28 28, 72 28, 73 46 C67 33, 33 33, 27 46 Z"
      fill="#291a13"
      stroke="#111"
      strokeWidth="2.5"
    />
    {/* Hair line detail */}
    <path d="M33 42 Q50 35 67 42" stroke="#1e130e" strokeWidth="2" />

    {/* Intense Focused Eyebrows */}
    <path d="M34 47 Q44 46 48 51" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M66 47 Q56 46 52 51" stroke="#111" strokeWidth="3.5" strokeLinecap="round" />

    {/* Determined Eyes looking forward/slightly left */}
    <ellipse cx="41" cy="54" rx="6" ry="4.5" fill="#fff" stroke="#111" strokeWidth="1.8" />
    <circle cx="41" cy="54" r="3" fill="#111" />
    <circle cx="42.2" cy="53" r="1" fill="#fff" />

    <ellipse cx="59" cy="54" rx="6" ry="4.5" fill="#fff" stroke="#111" strokeWidth="1.8" />
    <circle cx="58.5" cy="54" r="3" fill="#111" />
    <circle cx="59.7" cy="53" r="1" fill="#fff" />

    {/* Nose */}
    <path d="M48 60 Q50 63 53 61" stroke="#4c2c1a" strokeWidth="2" strokeLinecap="round" fill="none" />

    {/* Straight Confident Mouth */}
    <path d="M44 68 Q50 67 56 68" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

/**
 * Main AvatarDisplay component: renders the matching SVG character with gold circular rim.
 */
export const AvatarDisplay: React.FC<{
  avatar: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  showSelectedBadge?: boolean;
}> = ({ avatar, className = '', size = 'md', showSelectedBadge = false }) => {
  const key = normalizeAvatarKey(avatar);

  let sizeClass = 'w-10 h-10';
  if (typeof size === 'number') {
    sizeClass = `w-[${size}px] h-[${size}px]`;
  } else {
    switch (size) {
      case 'xs':
        sizeClass = 'w-6 h-6';
        break;
      case 'sm':
        sizeClass = 'w-8 h-8';
        break;
      case 'md':
        sizeClass = 'w-10 h-10';
        break;
      case 'lg':
        sizeClass = 'w-12 h-12';
        break;
      case 'xl':
        sizeClass = 'w-16 h-16';
        break;
      case '2xl':
        sizeClass = 'w-20 h-20 sm:w-24 sm:h-24';
        break;
    }
  }

  const renderSVG = () => {
    switch (key) {
      case 'avatar_braids':
        return <BraidsAvatarSVG />;
      case 'avatar_headwrap':
        return <HeadwrapAvatarSVG />;
      case 'avatar_beard':
        return <GoateeAvatarSVG />;
      case 'avatar_shades':
        return <CapShadesAvatarSVG />;
      case 'avatar_glasses':
        return <PurpleGlassesAvatarSVG />;
      case 'avatar_buzzcut':
        return <BuzzcutAvatarSVG />;
      default:
        return <BraidsAvatarSVG />;
    }
  };

  return (
    <div
      className={`relative rounded-full overflow-visible shrink-0 flex items-center justify-center p-[2px] bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-300 shadow-md ${sizeClass} ${className}`}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-stone-950 flex items-center justify-center">
        {renderSVG()}
      </div>

      {/* Selected checkmark badge matching user screenshot */}
      {showSelectedBadge && (
        <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500 border-2 border-slate-900 text-white flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-200">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-white fill-none stroke-[3.5] stroke-linecap-round stroke-linejoin-round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * AvatarSelector modal/panel matching the exact screenshot design:
 * "CHOOSE AN AVATAR" header in bold gold font,
 * Gold border frame,
 * 6 circular avatars,
 * Green checkmark on selected avatar.
 */
export const AvatarSelector: React.FC<{
  selectedAvatar: string;
  onSelect: (avatarKey: AvatarKey) => void;
}> = ({ selectedAvatar, onSelect }) => {
  const currentKey = normalizeAvatarKey(selectedAvatar);

  return (
    <div className="w-full bg-[#121214] border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col items-center">
      {/* "CHOOSE AN AVATAR" Title in Gold uppercase font */}
      <h3 className="text-amber-400 font-black tracking-widest text-sm sm:text-base uppercase text-center mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        CHOOSE AN AVATAR
      </h3>

      {/* 2x3 Grid of 6 Avatars */}
      <div className="grid grid-cols-3 gap-4 sm:gap-6 w-full max-w-sm justify-items-center">
        {AVATAR_OPTIONS.map((opt) => {
          const isSelected = currentKey === opt.id;

          return (
            <button
              type="button"
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="group relative focus:outline-none transition active:scale-95"
              title={opt.label}
            >
              <AvatarDisplay
                avatar={opt.id}
                size="2xl"
                showSelectedBadge={isSelected}
                className={`transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-amber-300 scale-105 shadow-amber-500/30 shadow-xl'
                    : 'opacity-90 hover:opacity-100 hover:scale-105'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

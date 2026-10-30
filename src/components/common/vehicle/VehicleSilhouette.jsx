import React, { useId } from 'react';
import { resolveBodyArchetype, resolvePowertrainArchetype, getArchetypeLabel } from './vehicleArchetypes.js';

/**
 * High-Fidelity Vehicle Silhouette Studio Canvas
 * Renders precision layered automotive silhouettes across 7 body archetypes
 * with powertrain-specific studio lighting, alloy wheels, and LED light signatures.
 * 
 * ViewBox: 0 0 320 130
 */
export default function VehicleSilhouette({
  vehicle = {},
  archetype: archetypeProp,
  powertrain: powertrainProp,
  className = 'w-full h-auto',
  showUnderglow = true,
  showLights = true,
  interactive = false,
  title,
}) {
  const uid = useId().replace(/:/g, '');
  const bodyArchetype = archetypeProp || resolveBodyArchetype(vehicle);
  const powertrain = powertrainProp || resolvePowertrainArchetype(vehicle);

  // Studio lighting & Underglow Palette based on Powertrain Archetype
  const theme = React.useMemo(() => {
    switch (powertrain) {
      case 'ev':
        return {
          underglow: '#00D4FF',
          underglowSecondary: '#0284C7',
          headlight: '#E0F2FE',
          headlightBeam: '#38BDF8',
          taillight: '#EF4444',
          caliper: '#0284C7',
          glassTint: '#0F172A',
          glassHighlight: '#38BDF8',
          accent: '#00D4FF',
        };
      case 'phev':
        return {
          underglow: '#06B6D4',
          underglowSecondary: '#0891B2',
          headlight: '#F0FDFA',
          headlightBeam: '#22D3EE',
          taillight: '#EF4444',
          caliper: '#0891B2',
          glassTint: '#0F172A',
          glassHighlight: '#67E8F9',
          accent: '#06B6D4',
        };
      case 'hybrid':
      case 'mhev':
        return {
          underglow: '#10B981',
          underglowSecondary: '#059669',
          headlight: '#F0FDF4',
          headlightBeam: '#34D399',
          taillight: '#EF4444',
          caliper: '#10B981',
          glassTint: '#0F172A',
          glassHighlight: '#6EE7B7',
          accent: '#10B981',
        };
      case 'diesel':
        return {
          underglow: '#94A3B8',
          underglowSecondary: '#64748B',
          headlight: '#F8FAFC',
          headlightBeam: '#CBD5E1',
          taillight: '#DC2626',
          caliper: '#64748B',
          glassTint: '#0F172A',
          glassHighlight: '#94A3B8',
          accent: '#94A3B8',
        };
      case 'petrol-na':
        return {
          underglow: '#EAB308',
          underglowSecondary: '#CA8A04',
          headlight: '#FEF9C3',
          headlightBeam: '#FDE047',
          taillight: '#DC2626',
          caliper: '#CA8A04',
          glassTint: '#0F172A',
          glassHighlight: '#FDE047',
          accent: '#EAB308',
        };
      case 'petrol-turbo':
      default:
        return {
          underglow: '#F59E0B',
          underglowSecondary: '#D97706',
          headlight: '#FFFBEB',
          headlightBeam: '#FBBF24',
          taillight: '#EF4444',
          caliper: '#DC2626',
          glassTint: '#0F172A',
          glassHighlight: '#FBBF24',
          accent: '#F59E0B',
        };
    }
  }, [powertrain]);

  // Dimensions & geometry setup
  // Wheel configurations based on archetype ground clearance
  const isHighRider = bodyArchetype === 'suv' || bodyArchetype === 'truck' || bodyArchetype === 'crossover';
  const isTruck = bodyArchetype === 'truck';

  const frontWheel = {
    cx: isTruck ? 242 : 246,
    cy: isTruck ? 92 : isHighRider ? 93 : 95,
    r: isTruck ? 20 : isHighRider ? 19 : 18,
  };

  const rearWheel = {
    cx: isTruck ? 72 : 74,
    cy: isTruck ? 92 : isHighRider ? 93 : 95,
    r: isTruck ? 20 : isHighRider ? 19 : 18,
  };

  const groundY = 113;

  // Render Wheel Subcomponent
  const renderWheel = (cx, cy, r, key) => (
    <g key={key} className="transition-transform duration-300">
      {/* Outer Tire */}
      <circle cx={cx} cy={cy} r={r} fill="#0F172A" stroke="#1E293B" strokeWidth="1.2" />
      {/* Tire Tread Accent */}
      <circle cx={cx} cy={cy} r={r - 1.5} fill="none" stroke="#334155" strokeWidth="0.6" strokeDasharray="2 1.5" opacity="0.4" />
      {/* Rim Outer Lip */}
      <circle cx={cx} cy={cy} r={r - 4.5} fill="#1E293B" stroke="#475569" strokeWidth="1" />
      {/* Brake Rotor Disc */}
      <circle cx={cx} cy={cy} r={r - 7.5} fill="#64748B" stroke="#94A3B8" strokeWidth="0.5" />
      {/* Ventilation slots on rotor */}
      <circle cx={cx} cy={cy} r={r - 9} fill="none" stroke="#334155" strokeWidth="0.6" strokeDasharray="1.5 2" opacity="0.6" />
      {/* Performance Brake Caliper */}
      <path
        d={`M ${cx - 2} ${cy - r + 7.5} A ${r - 7.5} ${r - 7.5} 0 0 1 ${cx + 7.5} ${cy - 2} L ${cx + 5.5} ${cy - 1} A ${r - 9.5} ${r - 9.5} 0 0 0 ${cx - 1.5} ${cy - r + 9} Z`}
        fill={theme.caliper}
      />
      {/* 5-Twin-Spoke Alloy Rim Design */}
      <g stroke={`url(#alloyGrad-${uid})`} strokeWidth="1.6" strokeLinecap="round">
        <line x1={cx} y1={cy - r + 5.5} x2={cx} y2={cy + r - 5.5} />
        <line x1={cx - r + 5.5} y1={cy} x2={cx + r - 5.5} y2={cy} />
        <line x1={cx - (r - 6) * 0.707} y1={cy - (r - 6) * 0.707} x2={cx + (r - 6) * 0.707} y2={cy + (r - 6) * 0.707} />
        <line x1={cx - (r - 6) * 0.707} y1={cy + (r - 6) * 0.707} x2={cx + (r - 6) * 0.707} y2={cy - (r - 6) * 0.707} />
      </g>
      {/* Hub Center Cap */}
      <circle cx={cx} cy={cy} r="3.6" fill="#090E17" stroke="#94A3B8" strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r="1.4" fill={theme.accent} />
    </g>
  );

  // Vector geometries for the 7 body archetypes
  const renderArchetypeBody = () => {
    switch (bodyArchetype) {
      // 1. COMPACT HATCHBACK
      case 'hatchback':
        return (
          <g>
            {/* Main Metallic Body Shell */}
            <path
              d={`
                M 38 95
                L 45 95
                A 21 21 0 0 1 87 95
                L 218 95
                A 21 21 0 0 1 260 95
                L 278 95
                C 285 95 288 92 288 86
                C 288 80 282 76 270 73
                C 255 70 236 67 218 64
                L 165 44
                C 152 43 140 43 72 44
                C 64 44 60 46 56 50
                L 42 70
                C 38 76 36 84 36 89
                C 36 93 37 95 38 95 Z
              `}
              fill={`url(#carBodyGrad-${uid})`}
              stroke={`url(#carBorderGrad-${uid})`}
              strokeWidth="1.2"
            />
            {/* Hatchback Rear Spoiler Wing */}
            <path d="M 74 43 L 52 43 C 49 43 47 44 48 47 L 54 48 L 74 44 Z" fill="#1E293B" />
            {/* Tinted Glasshouse */}
            <path
              d={`
                M 163 46
                L 213 64
                L 155 64
                L 155 46 Z
              `}
              fill={theme.glassTint}
              stroke="#334155"
              strokeWidth="0.8"
            />
            <path
              d={`
                M 151 46
                L 151 64
                L 102 64
                L 102 46 Z
              `}
              fill={theme.glassTint}
              stroke="#334155"
              strokeWidth="0.8"
            />
            <path
              d={`
                M 98 46
                L 98 64
                L 57 64
                L 70 47 Z
              `}
              fill={theme.glassTint}
              stroke="#334155"
              strokeWidth="0.8"
            />
            {/* Aerodynamic Body Crease */}
            <path d="M 45 74 Q 160 71 274 74" fill="none" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.35" />
            {/* Door Cut Lines */}
            <line x1="153" y1="46" x2="153" y2="93" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            <line x1="100" y1="46" x2="100" y2="93" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            {/* Door Handles */}
            <rect x="136" y="69" width="10" height="2" rx="1" fill="#1E293B" />
            <rect x="84" y="69" width="10" height="2" rx="1" fill="#1E293B" />
            {/* Front Headlight Cluster */}
            <path d="M 270 73 L 285 78 L 287 84 L 273 80 Z" fill={theme.headlight} />
            <line x1="272" y1="74" x2="286" y2="79" stroke={theme.headlightBeam} strokeWidth="1.5" strokeLinecap="round" />
            {/* Rear Taillight Signature */}
            <path d="M 37 77 L 46 76 L 44 83 L 36 83 Z" fill={theme.taillight} />
            <line x1="37" y1="78" x2="45" y2="77" stroke="#FFAAAA" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );

      // 2. ESTATE / WAGON
      case 'wagon':
        return (
          <g>
            {/* Roof Rail */}
            <path d="M 62 39 L 160 39" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="72" y1="39" x2="72" y2="42" stroke="#64748B" strokeWidth="1.2" />
            <line x1="150" y1="39" x2="150" y2="42" stroke="#64748B" strokeWidth="1.2" />
            {/* Main Long Wagon Shell */}
            <path
              d={`
                M 32 95
                L 44 95
                A 21 21 0 0 1 86 95
                L 218 95
                A 21 21 0 0 1 260 95
                L 282 95
                C 289 95 292 92 292 86
                C 292 80 286 75 272 72
                C 255 69 238 66 220 63
                L 172 43
                C 162 42 150 42 58 42
                C 50 42 46 45 42 50
                L 32 70
                C 29 76 29 86 30 90
                C 31 93 32 95 32 95 Z
              `}
              fill={`url(#carBodyGrad-${uid})`}
              stroke={`url(#carBorderGrad-${uid})`}
              strokeWidth="1.2"
            />
            {/* Tinted Long Wagon Glasshouse */}
            <path d="M 170 45 L 215 63 L 160 63 L 160 45 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 156 45 L 156 63 L 110 63 L 110 45 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 106 45 L 106 63 L 48 63 L 48 49 C 48 46 50 45 54 45 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            {/* Character line */}
            <path d="M 33 73 Q 160 69 282 73" fill="none" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.4" />
            {/* Door cuts */}
            <line x1="158" y1="45" x2="158" y2="93" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            <line x1="108" y1="45" x2="108" y2="93" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            {/* Handles */}
            <rect x="142" y="68" width="10" height="2" rx="1" fill="#1E293B" />
            <rect x="92" y="68" width="10" height="2" rx="1" fill="#1E293B" />
            {/* Headlight */}
            <path d="M 275 73 L 289 77 L 291 83 L 278 79 Z" fill={theme.headlight} />
            <line x1="276" y1="74" x2="290" y2="78" stroke={theme.headlightBeam} strokeWidth="1.5" strokeLinecap="round" />
            {/* Taillight */}
            <path d="M 30 75 L 40 74 L 38 83 L 30 83 Z" fill={theme.taillight} />
            <line x1="31" y1="76" x2="39" y2="75" stroke="#FFAAAA" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );

      // 3. FULL SUV
      case 'suv':
        return (
          <g>
            {/* High Rugged Roof Rails */}
            <path d="M 76 29 L 168 29" fill="none" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="88" y1="29" x2="88" y2="33" stroke="#64748B" strokeWidth="1.4" />
            <line x1="156" y1="29" x2="156" y2="33" stroke="#64748B" strokeWidth="1.4" />
            {/* Lower Cladding Line */}
            <path
              d="M 38 93 L 44 93 A 22 22 0 0 1 88 93 L 216 93 A 22 22 0 0 1 260 93 L 286 93 L 286 90 L 38 90 Z"
              fill="#1E293B"
            />
            {/* Tall Upright Body Shell */}
            <path
              d={`
                M 36 93
                L 44 93
                A 22 22 0 0 1 88 93
                L 216 93
                A 22 22 0 0 1 260 93
                L 286 93
                C 292 93 294 88 294 82
                L 294 69
                C 293 64 286 62 274 61
                C 255 59 238 57 218 55
                L 174 34
                C 164 33 150 33 72 34
                C 62 34 56 38 50 46
                L 38 68
                C 34 76 34 85 36 93 Z
              `}
              fill={`url(#carBodyGrad-${uid})`}
              stroke={`url(#carBorderGrad-${uid})`}
              strokeWidth="1.2"
            />
            {/* Tall SUV Glasshouse */}
            <path d="M 172 37 L 214 55 L 162 55 L 162 37 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 158 37 L 158 55 L 112 55 L 112 37 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 108 37 L 108 55 L 56 55 L 68 39 C 70 37 73 37 76 37 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            {/* Rugged wheel arch flares */}
            <path d="M 44 93 A 22 22 0 0 1 88 93" fill="none" stroke="#334155" strokeWidth="2.5" />
            <path d="M 216 93 A 22 22 0 0 1 260 93" fill="none" stroke="#334155" strokeWidth="2.5" />
            {/* Door cutlines */}
            <line x1="160" y1="37" x2="160" y2="90" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            <line x1="110" y1="37" x2="110" y2="90" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            {/* Handles */}
            <rect x="144" y="62" width="10" height="2" rx="1" fill="#1E293B" />
            <rect x="94" y="62" width="10" height="2" rx="1" fill="#1E293B" />
            {/* Upright Front LED Matrix Headlight */}
            <path d="M 278 63 L 293 64 L 293 74 L 282 72 Z" fill={theme.headlight} />
            <line x1="280" y1="65" x2="293" y2="66" stroke={theme.headlightBeam} strokeWidth="1.6" strokeLinecap="round" />
            {/* Bold Taillight */}
            <path d="M 35 69 L 46 68 L 44 80 L 35 80 Z" fill={theme.taillight} />
            <line x1="36" y1="71" x2="45" y2="70" stroke="#FFAAAA" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );

      // 4. CROSSOVER (CUV)
      case 'crossover':
        return (
          <g>
            {/* Sleek Low Profile Roof Rails */}
            <path d="M 80 34 L 155 34" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
            {/* Protective Lower Cladding */}
            <path
              d="M 38 94 L 45 94 A 21 21 0 0 1 87 94 L 217 94 A 21 21 0 0 1 259 94 L 284 94 L 284 91 L 38 91 Z"
              fill="#1E293B"
            />
            {/* Dynamic Coupe-SUV Body Shell */}
            <path
              d={`
                M 36 94
                L 45 94
                A 21 21 0 0 1 87 94
                L 217 94
                A 21 21 0 0 1 259 94
                L 284 94
                C 290 94 293 89 292 84
                C 291 78 284 74 272 71
                C 255 67 236 64 216 61
                L 168 38
                C 156 37 142 38 88 43
                C 78 44 70 48 62 55
                L 44 72
                C 38 78 36 86 36 94 Z
              `}
              fill={`url(#carBodyGrad-${uid})`}
              stroke={`url(#carBorderGrad-${uid})`}
              strokeWidth="1.2"
            />
            {/* Integrated Tail Spoiler */}
            <path d="M 86 42 L 68 44 C 64 45 62 47 64 49 L 72 49 L 86 43 Z" fill="#1E293B" />
            {/* Swept Glasshouse */}
            <path d="M 166 41 L 212 60 L 158 60 L 158 41 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 154 41 L 154 60 L 108 60 L 108 42 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 104 42 L 104 60 L 62 60 L 78 45 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            {/* Wheel Arch Moldings */}
            <path d="M 45 94 A 21 21 0 0 1 87 94" fill="none" stroke="#334155" strokeWidth="2.2" />
            <path d="M 217 94 A 21 21 0 0 1 259 94" fill="none" stroke="#334155" strokeWidth="2.2" />
            {/* Handles */}
            <rect x="140" y="66" width="10" height="2" rx="1" fill="#1E293B" />
            <rect x="90" y="66" width="10" height="2" rx="1" fill="#1E293B" />
            {/* Headlight */}
            <path d="M 274 71 L 288 75 L 289 81 L 276 77 Z" fill={theme.headlight} />
            <line x1="276" y1="72" x2="289" y2="76" stroke={theme.headlightBeam} strokeWidth="1.5" strokeLinecap="round" />
            {/* Taillight Strip */}
            <path d="M 37 76 L 48 74 L 46 81 L 37 81 Z" fill={theme.taillight} />
            <line x1="38" y1="77" x2="47" y2="75" stroke="#FFAAAA" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );

      // 5. SPORT COUPE
      case 'coupe':
        return (
          <g>
            {/* Aggressive Low Body Shell */}
            <path
              d={`
                M 36 96
                L 44 96
                A 21 21 0 0 1 86 96
                L 218 96
                A 21 21 0 0 1 260 96
                L 284 96
                C 292 96 295 91 294 85
                C 292 78 285 75 270 72
                C 248 68 226 65 204 63
                L 155 45
                C 142 45 130 46 102 51
                C 88 54 74 61 54 71
                L 42 77
                C 38 80 36 86 36 96 Z
              `}
              fill={`url(#carBodyGrad-${uid})`}
              stroke={`url(#carBorderGrad-${uid})`}
              strokeWidth="1.2"
            />
            {/* Ducktail Rear Aero Lip */}
            <path d="M 46 76 L 38 74 C 36 74 35 75 36 77 L 42 78 Z" fill="#0F172A" />
            {/* Sleek Frameless Window */}
            <path
              d={`
                M 153 47
                L 200 63
                L 125 63
                C 114 58 106 53 102 51 Z
              `}
              fill={theme.glassTint}
              stroke="#334155"
              strokeWidth="0.8"
            />
            {/* Lower Aero Side Skirt */}
            <rect x="88" y="94" width="128" height="2" fill="#0F172A" />
            {/* Single Coupe Door Line */}
            <line x1="124" y1="48" x2="124" y2="94" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            {/* Flush Door Handle */}
            <rect x="135" y="69" width="11" height="2" rx="1" fill="#1E293B" />
            {/* Aggressive Headlight */}
            <path d="M 270 72 L 288 77 L 289 83 L 273 78 Z" fill={theme.headlight} />
            <line x1="272" y1="73" x2="288" y2="78" stroke={theme.headlightBeam} strokeWidth="1.6" strokeLinecap="round" />
            {/* Slimline Taillight */}
            <path d="M 37 77 L 48 76 L 46 81 L 37 81 Z" fill={theme.taillight} />
            <line x1="38" y1="78" x2="47" y2="77" stroke="#FFAAAA" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );

      // 6. PICKUP TRUCK
      case 'truck':
        return (
          <g>
            {/* Open Cargo Bed Interior / Liner */}
            <rect x="34" y="64" width="76" height="2" fill="#0F172A" />
            {/* Heavy-Duty Bed Rail Tie-Down */}
            <line x1="38" y1="62" x2="108" y2="62" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
            {/* Muscular Truck Body Shell */}
            <path
              d={`
                M 30 92
                L 42 92
                A 23 23 0 0 1 88 92
                L 214 92
                A 23 23 0 0 1 260 92
                L 288 92
                C 294 92 296 87 296 80
                L 296 66
                C 295 58 288 56 276 55
                C 255 54 238 53 226 53
                L 182 32
                C 174 31 160 31 122 31
                L 118 64
                L 32 64
                C 30 64 29 66 29 70
                L 29 84
                C 29 89 30 92 30 92 Z
              `}
              fill={`url(#carBodyGrad-${uid})`}
              stroke={`url(#carBorderGrad-${uid})`}
              strokeWidth="1.2"
            />
            {/* Double Cab Glasshouse */}
            <path d="M 180 34 L 222 53 L 172 53 L 172 34 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 168 34 L 168 53 L 124 53 L 124 34 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            {/* Beefy Wheel Arch Surrounds */}
            <path d="M 42 92 A 23 23 0 0 1 88 92" fill="none" stroke="#1E293B" strokeWidth="3" />
            <path d="M 214 92 A 23 23 0 0 1 260 92" fill="none" stroke="#1E293B" strokeWidth="3" />
            {/* Cab Rear Window Line */}
            <line x1="121" y1="33" x2="121" y2="63" stroke="#0F172A" strokeWidth="1.2" />
            {/* Door seam */}
            <line x1="170" y1="34" x2="170" y2="90" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            {/* Handles */}
            <rect x="154" y="60" width="10" height="2" rx="1" fill="#1E293B" />
            <rect x="130" y="60" width="10" height="2" rx="1" fill="#1E293B" />
            {/* Vertical Massive Truck Headlight */}
            <path d="M 284 57 L 295 59 L 295 72 L 285 70 Z" fill={theme.headlight} />
            <line x1="286" y1="59" x2="295" y2="61" stroke={theme.headlightBeam} strokeWidth="1.8" strokeLinecap="round" />
            {/* Tall Vertical Tailgate Lamp */}
            <path d="M 29 67 L 34 67 L 34 82 L 29 82 Z" fill={theme.taillight} />
            <line x1="31" y1="68" x2="31" y2="80" stroke="#FFAAAA" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        );

      // 7. EXECUTIVE SEDAN (Default 3-box notchback)
      case 'sedan':
      default:
        return (
          <g>
            {/* Main Sculpted Sedan Body Shell */}
            <path
              d={`
                M 34 95
                L 44 95
                A 21 21 0 0 1 86 95
                L 218 95
                A 21 21 0 0 1 260 95
                L 282 95
                C 289 95 292 92 292 86
                C 292 80 286 76 272 73
                C 255 70 236 67 218 64
                L 170 42
                C 158 41 140 41 114 43
                C 96 45 84 52 68 64
                L 44 67
                C 38 68 34 74 33 82
                C 32 87 33 95 34 95 Z
              `}
              fill={`url(#carBodyGrad-${uid})`}
              stroke={`url(#carBorderGrad-${uid})`}
              strokeWidth="1.2"
            />
            {/* Tinted 3-Box Glasshouse */}
            <path d="M 168 44 L 214 63 L 158 63 L 158 44 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 154 44 L 154 63 L 106 63 L 106 44 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            <path d="M 102 44 L 102 63 L 74 63 L 88 47 Z" fill={theme.glassTint} stroke="#334155" strokeWidth="0.8" />
            {/* Aerodynamic Body Crease */}
            <path d="M 36 74 Q 160 70 276 74" fill="none" stroke="#FFFFFF" strokeWidth="0.7" opacity="0.38" />
            {/* Door cutlines */}
            <line x1="156" y1="44" x2="156" y2="93" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            <line x1="104" y1="44" x2="104" y2="93" stroke="#0F172A" strokeWidth="0.9" opacity="0.5" />
            {/* Handles */}
            <rect x="138" y="69" width="10" height="2" rx="1" fill="#1E293B" />
            <rect x="88" y="69" width="10" height="2" rx="1" fill="#1E293B" />
            {/* Headlight */}
            <path d="M 272 73 L 288 77 L 290 83 L 276 79 Z" fill={theme.headlight} />
            <line x1="274" y1="74" x2="288" y2="78" stroke={theme.headlightBeam} strokeWidth="1.5" strokeLinecap="round" />
            {/* Taillight */}
            <path d="M 33 75 L 44 74 L 42 81 L 33 81 Z" fill={theme.taillight} />
            <line x1="34" y1="76" x2="43" y2="75" stroke="#FFAAAA" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        );
    }
  };

  const archetypeLabel = getArchetypeLabel(bodyArchetype);
  const displayTitle = title || `${vehicle.name || 'Vehicle'} · ${archetypeLabel}`;

  return (
    <div
      className={`relative select-none overflow-hidden rounded-xl ${
        interactive ? 'transition-all duration-300 hover:scale-[1.01]' : ''
      } ${className}`}
      title={displayTitle}
      role="img"
      aria-label={displayTitle}
    >
      <svg
        className="w-full h-full block"
        viewBox="0 0 320 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Studio Backdrop Gradient */}
          <radialGradient
            id={`studioBg-${uid}`}
            cx="50%"
            cy="45%"
            r="65%"
            fx="50%"
            fy="35%"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#F1F5F9" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#E2E8F0" stopOpacity="1" />
          </radialGradient>

          {/* Underglow Gaussian Blur Filter */}
          <filter id={`underglowFilter-${uid}`} x="-30%" y="-40%" width="160%" height="180%">
            <feGaussianBlur stdDeviation="5.5" result="blur" />
          </filter>

          {/* Baseline Floor Shadow Gradient */}
          <radialGradient id={`floorShadow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B1220" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#1E293B" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
          </radialGradient>

          {/* Dynamic Powertrain Underglow Radial Gradient */}
          <radialGradient id={`underglowGrad-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={theme.underglow} stopOpacity="0.75" />
            <stop offset="60%" stopColor={theme.underglowSecondary} stopOpacity="0.35" />
            <stop offset="100%" stopColor={theme.underglow} stopOpacity="0" />
          </radialGradient>

          {/* Precision Alloy Wheel Metallic Gradient */}
          <linearGradient id={`alloyGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Car Body Shell High-End Gradient */}
          <linearGradient id={`carBodyGrad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="28%" stopColor="#E2E8F0" />
            <stop offset="72%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Car Outer Border Gradient */}
          <linearGradient id={`carBorderGrad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="60%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          {/* Headlight Projection Cone */}
          <linearGradient id={`headlightBeamGrad-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={theme.headlightBeam} stopOpacity="0.55" />
            <stop offset="100%" stopColor={theme.headlightBeam} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Studio Studio Backdrop */}
        <rect width="320" height="130" rx="10" fill={`url(#studioBg-${uid})`} />

        {/* Technical Blueprint Studio Grid Lines */}
        <g stroke="#94A3B8" strokeWidth="0.5" opacity="0.12">
          <line x1="16" y1="36" x2="304" y2="36" />
          <line x1="16" y1="66" x2="304" y2="66" />
          <line x1="16" y1="96" x2="304" y2="96" />
          <line x1="74" y1="20" x2="74" y2="114" strokeDasharray="3 3" />
          <line x1="160" y1="20" x2="160" y2="114" strokeDasharray="3 3" />
          <line x1="246" y1="20" x2="246" y2="114" strokeDasharray="3 3" />
        </g>

        {/* Studio Overhead Spotlight Soft Glow */}
        <ellipse cx="160" cy="38" rx="110" ry="16" fill="#FFFFFF" opacity="0.4" />

        {/* Baseline Floor Shadow */}
        <ellipse cx="160" cy={groundY - 3} rx="128" ry="7.5" fill={`url(#floorShadow-${uid})`} />

        {/* Dynamic Powertrain Underglow (Ground Reflection) */}
        {showUnderglow && (
          <ellipse
            cx="160"
            cy={groundY - 4}
            rx="102"
            ry="6.5"
            fill={`url(#underglowGrad-${uid})`}
            filter={`url(#underglowFilter-${uid})`}
          />
        )}

        {/* Forward Headlight Projection Beam */}
        {showLights && (
          <polygon
            points={`285,${isTruck ? 65 : 75} 320,${isTruck ? 72 : 82} 320,${isTruck ? 98 : 106} 280,${isTruck ? 84 : 90}`}
            fill={`url(#headlightBeamGrad-${uid})`}
          />
        )}

        {/* Layered Vector Car Body */}
        {renderArchetypeBody()}

        {/* Front & Rear Alloy Wheels with Brake Calipers */}
        {renderWheel(rearWheel.cx, rearWheel.cy, rearWheel.r, 'rear-wheel')}
        {renderWheel(frontWheel.cx, frontWheel.cy, frontWheel.r, 'front-wheel')}
      </svg>
    </div>
  );
}

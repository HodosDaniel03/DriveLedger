import React, { useState, useEffect } from 'react';
import { resolveBodyArchetype, getArchetypeLabel } from './vehicleArchetypes.js';
import { resolveVehiclePhotoUrl, SEGMENT_FALLBACK_PHOTOS } from './VehicleImageResolver.jsx';

/**
 * Vehicle Photograph Canvas (Replaces legacy vector silhouettes with real studio photography)
 */
export default function VehicleSilhouette({
  vehicle = {},
  archetype: archetypeProp,
  className = 'w-full h-full',
  interactive = false,
  title,
}) {
  const bodyArchetype = archetypeProp || resolveBodyArchetype(vehicle);
  const archetypeLabel = getArchetypeLabel(bodyArchetype);
  const displayTitle = title || `${vehicle.name || 'Vehicle'} · ${archetypeLabel}`;
  const fallbackSegmentUrl =
    SEGMENT_FALLBACK_PHOTOS[bodyArchetype] || SEGMENT_FALLBACK_PHOTOS.sedan;
  const primaryPhotoUrl =
    resolveVehiclePhotoUrl({ vehicle }) || fallbackSegmentUrl;

  const [activeSrc, setActiveSrc] = useState(primaryPhotoUrl);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setActiveSrc(primaryPhotoUrl);
    setImgFailed(false);
  }, [primaryPhotoUrl, vehicle?.id]);

  return (
    <div
      className={`relative aspect-[16/9] select-none overflow-hidden rounded-xl bg-surface-subtle dark:bg-zinc-900 ${
        interactive ? 'transition-transform duration-200 ease-out motion-reduce:transition-none hover:scale-[1.02] motion-reduce:hover:scale-100' : ''
      } ${className}`}
      title={displayTitle}
      role="img"
      aria-label={displayTitle}
    >
      {!imgFailed ? (
        <img
          src={activeSrc}
          alt={displayTitle}
          width={960}
          height={540}
          loading="lazy"
          onError={() => {
            if (activeSrc !== fallbackSegmentUrl) {
              setActiveSrc(fallbackSegmentUrl);
            } else {
              setImgFailed(true);
            }
          }}
          className="w-full h-full object-cover object-center block"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-surface-subtle dark:bg-zinc-900 text-muted dark:text-zinc-400 p-3 text-center">
          <span className="font-sans text-xs font-semibold text-ink dark:text-zinc-200">
            {vehicle?.shortName || vehicle?.name || 'Vehicle'}
          </span>
          <span className="font-sans text-[11px] text-muted dark:text-zinc-400 mt-0.5">
            {archetypeLabel}
          </span>
        </div>
      )}
    </div>
  );
}


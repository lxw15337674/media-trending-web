interface XTrendRegionConfig {
  label: string;
  placeId?: string;
  locationSearchQuery?: string;
  locationSelectText?: string;
}

const X_TREND_REGION_CONFIGS: Record<string, XTrendRegionConfig> = {
  hk: {
    label: 'Hong Kong',
    placeId: '3890366451382798053',
    locationSearchQuery: 'Hong Kong',
    locationSelectText: 'Hong Kong SAR China',
  },
  tw: { label: 'Taiwan', locationSearchQuery: 'Taiwan', locationSelectText: 'Taiwan' },
  jp: {
    label: 'Japan',
    placeId: '499763682993518708',
    locationSearchQuery: 'Japan',
    locationSelectText: 'Japan',
  },
  kr: { label: 'South Korea', locationSearchQuery: 'South Korea', locationSelectText: 'South Korea' },
  sg: { label: 'Singapore', locationSearchQuery: 'Singapore', locationSelectText: 'Singapore' },
  us: {
    label: 'United States',
    placeId: '-7608764736147602991',
    locationSearchQuery: 'United States',
    locationSelectText: 'United States',
  },
  gb: {
    label: 'United Kingdom',
    placeId: '7212154512116281289',
    locationSearchQuery: 'United Kingdom',
    locationSelectText: 'United Kingdom',
  },
  au: { label: 'Australia', locationSearchQuery: 'Australia', locationSelectText: 'Australia' },
  ca: { label: 'Canada', locationSearchQuery: 'Canada', locationSelectText: 'Canada' },
  de: {
    label: 'Germany',
    placeId: '-158432913530051802',
    locationSearchQuery: 'Germany',
    locationSelectText: 'Germany',
  },
  fr: { label: 'France', locationSearchQuery: 'France', locationSelectText: 'France' },
  br: {
    label: 'Brazil',
    placeId: '1950197124717128353',
    locationSearchQuery: 'Brazil',
    locationSelectText: 'Brazil',
  },
  in: {
    label: 'India',
    placeId: '-5165415742961667872',
    locationSearchQuery: 'India',
    locationSelectText: 'India',
  },
  id: {
    label: 'Indonesia',
    placeId: '-3568670787064367969',
    locationSearchQuery: 'Indonesia',
    locationSelectText: 'Indonesia',
  },
  mx: {
    label: 'Mexico',
    placeId: '2689506185291075782',
    locationSearchQuery: 'Mexico',
    locationSelectText: 'Mexico',
  },
  sa: {
    label: 'Saudi Arabia',
    placeId: '626799985901619848',
    locationSearchQuery: 'Saudi Arabia',
    locationSelectText: 'Saudi Arabia',
  },
  th: {
    label: 'Thailand',
    placeId: '-7544610135368989548',
    locationSearchQuery: 'Thailand',
    locationSelectText: 'Thailand',
  },
  my: {
    label: 'Malaysia',
    placeId: '-8776409192903084900',
    locationSearchQuery: 'Malaysia',
    locationSelectText: 'Malaysia',
  },
  ph: {
    label: 'Philippines',
    placeId: '-354342964243026931',
    locationSearchQuery: 'Philippines',
    locationSelectText: 'Philippines',
  },
  vn: {
    label: 'Vietnam',
    placeId: '2553902795103616732',
    locationSearchQuery: 'Vietnam',
    locationSelectText: 'Vietnam',
  },
  tr: {
    label: 'Turkey',
    placeId: '7506474075071901506',
    locationSearchQuery: 'Turkey',
    locationSelectText: 'Turkey',
  },
};

export function resolveXTrendRegionLabel(regionKey: string, explicitLabel?: string | null) {
  const normalizedRegionKey = regionKey.trim().toLowerCase();
  const normalizedExplicitLabel = explicitLabel?.trim() || null;

  if (normalizedExplicitLabel) {
    return normalizedExplicitLabel;
  }

  const mappedLabel = X_TREND_REGION_CONFIGS[normalizedRegionKey]?.label;
  if (mappedLabel) {
    return mappedLabel;
  }

  throw new Error(
    `Unsupported X trend region key: ${normalizedRegionKey}. Add it to src/lib/x-trends/regions.ts or provide regionLabel in X_TREND_TARGETS_JSON.`,
  );
}

export function resolveXTrendRegionLocationConfig(regionKey: string) {
  const normalizedRegionKey = regionKey.trim().toLowerCase();
  const config = X_TREND_REGION_CONFIGS[normalizedRegionKey];

  if (!config) {
    throw new Error(
      `Unsupported X trend location config for region key: ${normalizedRegionKey}. Add it to src/lib/x-trends/regions.ts or provide explicit region config in X_TREND_TARGETS_JSON.`,
    );
  }

  return {
    placeId: config.placeId ?? null,
    locationSearchQuery: config.locationSearchQuery ?? null,
    locationSelectText: config.locationSelectText ?? null,
  };
}

export function listSupportedXTrendRegionKeys() {
  return Object.keys(X_TREND_REGION_CONFIGS).sort();
}

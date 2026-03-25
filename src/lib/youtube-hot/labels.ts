import type { Locale } from '@/i18n/config';
import { getIntlLocale } from '@/i18n/locale-meta';

const YOUTUBE_CATEGORY_LABELS: Record<string, Record<Locale, string>> = {
  '1': { zh: '电影与动画', en: 'Film & Animation', es: 'Cine y animación', ja: '映画とアニメ' },
  '2': { zh: '汽车与交通', en: 'Autos & Vehicles', es: 'Coches y vehículos', ja: '自動車と乗り物' },
  '10': { zh: '音乐', en: 'Music', es: 'Música', ja: '音楽' },
  '15': { zh: '宠物与动物', en: 'Pets & Animals', es: 'Mascotas y animales', ja: 'ペットと動物' },
  '17': { zh: '体育', en: 'Sports', es: 'Deportes', ja: 'スポーツ' },
  '18': { zh: '短片', en: 'Short Movies', es: 'Cortometrajes', ja: '短編映画' },
  '19': { zh: '旅游与活动', en: 'Travel & Events', es: 'Viajes y eventos', ja: '旅行とイベント' },
  '20': { zh: '游戏', en: 'Gaming', es: 'Videojuegos', ja: 'ゲーム' },
  '21': { zh: '视频博客', en: 'Videoblogging', es: 'Videoblogs', ja: 'ビデオブログ' },
  '22': { zh: '人物与博客', en: 'People & Blogs', es: 'Gente y blogs', ja: '人物とブログ' },
  '23': { zh: '喜剧', en: 'Comedy', es: 'Comedia', ja: 'コメディ' },
  '24': { zh: '娱乐', en: 'Entertainment', es: 'Entretenimiento', ja: 'エンタメ' },
  '25': { zh: '新闻与政治', en: 'News & Politics', es: 'Noticias y política', ja: 'ニュースと政治' },
  '26': { zh: '生活技巧与时尚', en: 'Howto & Style', es: 'Tutoriales y estilo', ja: 'ハウツーとスタイル' },
  '27': { zh: '教育', en: 'Education', es: 'Educación', ja: '教育' },
  '28': { zh: '科学与技术', en: 'Science & Technology', es: 'Ciencia y tecnología', ja: '科学と技術' },
  '29': { zh: '公益与行动', en: 'Nonprofits & Activism', es: 'ONG y activismo', ja: '非営利活動と社会運動' },
  '30': { zh: '电影', en: 'Movies', es: 'Películas', ja: '映画' },
  '31': { zh: '动画', en: 'Anime/Animation', es: 'Anime y animación', ja: 'アニメ・アニメーション' },
  '32': { zh: '动作与冒险', en: 'Action/Adventure', es: 'Acción y aventura', ja: 'アクション・アドベンチャー' },
  '33': { zh: '经典', en: 'Classics', es: 'Clásicos', ja: 'クラシック' },
  '34': { zh: '喜剧电影', en: 'Comedy', es: 'Comedia', ja: 'コメディ' },
  '35': { zh: '纪录片', en: 'Documentary', es: 'Documentales', ja: 'ドキュメンタリー' },
  '36': { zh: '剧情', en: 'Drama', es: 'Drama', ja: 'ドラマ' },
  '37': { zh: '家庭', en: 'Family', es: 'Familiar', ja: 'ファミリー' },
  '38': { zh: '海外', en: 'Foreign', es: 'Extranjero', ja: '海外作品' },
  '39': { zh: '恐怖', en: 'Horror', es: 'Terror', ja: 'ホラー' },
  '40': { zh: '科幻与奇幻', en: 'Sci-Fi/Fantasy', es: 'Ciencia ficción y fantasía', ja: 'SF・ファンタジー' },
  '41': { zh: '惊悚', en: 'Thriller', es: 'Suspense', ja: 'スリラー' },
  '42': { zh: '短视频', en: 'Shorts', es: 'Shorts', ja: 'ショート' },
  '43': { zh: '节目', en: 'Shows', es: 'Programas', ja: '番組' },
  '44': { zh: '预告片', en: 'Trailers', es: 'Tráilers', ja: '予告編' },
};

function getDisplayLocale(locale: Locale) {
  return getIntlLocale(locale);
}

function normalizeRegionCode(value: string | null | undefined) {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function formatLabelWithCode(code: string, label: string) {
  const normalizedLabel = label.trim();
  if (!normalizedLabel || normalizedLabel === code) return code;
  return `${normalizedLabel} (${code})`;
}

export function createRegionDisplayNames(locale: Locale) {
  try {
    return new Intl.DisplayNames([getDisplayLocale(locale)], { type: 'region' });
  } catch {
    return null;
  }
}

export function getLocalizedYouTubeRegionLabel(
  regionCode: string | null | undefined,
  regionName: string | null | undefined,
  locale: Locale,
  displayNames?: Intl.DisplayNames | null,
) {
  const normalizedCode = normalizeRegionCode(regionCode);
  const fallbackName = String(regionName ?? '').trim();
  if (!normalizedCode) return fallbackName || '--';

  const regionDisplayNames = displayNames === undefined ? createRegionDisplayNames(locale) : displayNames;
  const localized = regionDisplayNames?.of(normalizedCode) ?? '';
  const baseLabel = localized && localized !== normalizedCode ? localized : fallbackName || normalizedCode;
  return formatLabelWithCode(normalizedCode, baseLabel);
}

export function getYouTubeCategoryLabel(
  categoryId: string | null | undefined,
  categoryTitle: string | null | undefined,
  locale: Locale,
) {
  if (categoryId) {
    const labels = YOUTUBE_CATEGORY_LABELS[categoryId];
    if (labels) {
      return labels[locale];
    }
  }

  if (categoryTitle?.trim()) {
    return categoryTitle.trim();
  }

  if (locale === 'zh') return '未分类';
  if (locale === 'es') return 'Sin categoría';
  if (locale === 'ja') return '未分類';
  return 'Uncategorized';
}

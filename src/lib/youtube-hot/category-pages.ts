import type { Locale } from '@/i18n/config';

export interface YouTubeHotCategoryPageConfig {
  slug: string;
  categoryId: string;
  label: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  keywords: Record<Locale, string[]>;
}

export const YOUTUBE_HOT_CATEGORY_PAGES: readonly YouTubeHotCategoryPageConfig[] = [
  {
    slug: 'gaming',
    categoryId: '20',
    label: {
      en: 'Gaming',
      zh: '游戏',
      es: 'Gaming',
      ja: 'ゲーム',
    },
    title: {
      en: 'YouTube Gaming Trending',
      zh: 'YouTube 游戏视频榜',
      es: 'Tendencias Gaming de YouTube',
      ja: 'YouTube ゲーム急上昇',
    },
    description: {
      en: 'Browse the latest YouTube trending gaming videos with region and sort controls on a stable category landing page.',
      zh: '查看最新 YouTube 游戏分类 Trending 视频榜，支持地区与排序切换。',
      es: 'Explora los videos gaming en tendencia de YouTube con controles por región y orden.',
      ja: '地域と並び順を切り替えながら最新の YouTube ゲーム急上昇動画を確認できます。',
    },
    keywords: {
      en: ['youtube gaming trending', 'youtube gaming videos', 'gaming trending'],
      zh: ['YouTube 游戏榜', 'YouTube 游戏视频', '游戏 Trending'],
      es: ['youtube gaming tendencias', 'videos gaming youtube', 'gaming trending'],
      ja: ['youtube ゲーム急上昇', 'youtube ゲーム動画', 'ゲーム トレンド'],
    },
  },
  {
    slug: 'music',
    categoryId: '10',
    label: {
      en: 'Music',
      zh: '音乐',
      es: 'Musica',
      ja: '音楽',
    },
    title: {
      en: 'YouTube Music Video Trending',
      zh: 'YouTube 音乐视频榜',
      es: 'Tendencias musicales de YouTube',
      ja: 'YouTube 音楽急上昇',
    },
    description: {
      en: 'Browse the latest YouTube trending music videos with region and sort controls on a dedicated category page.',
      zh: '查看最新 YouTube 音乐分类 Trending 视频榜，支持地区与排序切换。',
      es: 'Explora los videos musicales en tendencia de YouTube con controles por región y orden.',
      ja: '地域と並び順を切り替えながら最新の YouTube 音楽急上昇動画を確認できます。',
    },
    keywords: {
      en: ['youtube music trending', 'youtube music videos', 'music video trending'],
      zh: ['YouTube 音乐榜', 'YouTube 音乐视频', '音乐 Trending'],
      es: ['youtube musica tendencias', 'videos musicales youtube', 'musica trending'],
      ja: ['youtube 音楽急上昇', 'youtube 音楽動画', '音楽 トレンド'],
    },
  },
  {
    slug: 'sports',
    categoryId: '17',
    label: {
      en: 'Sports',
      zh: '体育',
      es: 'Deportes',
      ja: 'スポーツ',
    },
    title: {
      en: 'YouTube Sports Trending',
      zh: 'YouTube 体育视频榜',
      es: 'Tendencias deportivas de YouTube',
      ja: 'YouTube スポーツ急上昇',
    },
    description: {
      en: 'Browse the latest YouTube trending sports videos with region and sort controls on a dedicated category page.',
      zh: '查看最新 YouTube 体育分类 Trending 视频榜，支持地区与排序切换。',
      es: 'Explora los videos deportivos en tendencia de YouTube con controles por región y orden.',
      ja: '地域と並び順を切り替えながら最新の YouTube スポーツ急上昇動画を確認できます。',
    },
    keywords: {
      en: ['youtube sports trending', 'youtube sports videos', 'sports trending'],
      zh: ['YouTube 体育榜', 'YouTube 体育视频', '体育 Trending'],
      es: ['youtube deportes tendencias', 'videos deportes youtube', 'deportes trending'],
      ja: ['youtube スポーツ急上昇', 'youtube スポーツ動画', 'スポーツ トレンド'],
    },
  },
  {
    slug: 'news',
    categoryId: '25',
    label: {
      en: 'News',
      zh: '新闻',
      es: 'Noticias',
      ja: 'ニュース',
    },
    title: {
      en: 'YouTube News Trending',
      zh: 'YouTube 新闻视频榜',
      es: 'Tendencias de noticias en YouTube',
      ja: 'YouTube ニュース急上昇',
    },
    description: {
      en: 'Browse the latest YouTube trending news videos with region and sort controls on a dedicated category page.',
      zh: '查看最新 YouTube 新闻分类 Trending 视频榜，支持地区与排序切换。',
      es: 'Explora los videos de noticias en tendencia de YouTube con controles por región y orden.',
      ja: '地域と並び順を切り替えながら最新の YouTube ニュース急上昇動画を確認できます。',
    },
    keywords: {
      en: ['youtube news trending', 'youtube news videos', 'news trending'],
      zh: ['YouTube 新闻榜', 'YouTube 新闻视频', '新闻 Trending'],
      es: ['youtube noticias tendencias', 'videos noticias youtube', 'noticias trending'],
      ja: ['youtube ニュース急上昇', 'youtube ニュース動画', 'ニュース トレンド'],
    },
  },
] as const;

export function getYouTubeHotCategoryPage(slug: string) {
  return YOUTUBE_HOT_CATEGORY_PAGES.find((item) => item.slug === slug) ?? null;
}

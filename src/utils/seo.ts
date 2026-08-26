import { Article } from '../types';

export function updatePageSEO(article?: Article | null, customTitle?: string) {
  try {
    const defaultSiteTitle = 'TRUYỀN THÔNG ĐOÀN MANG YANG - TRUNG ĐOÀN 95, SƯ ĐOÀN 2';
    const defaultDescription = 'Trang thông tin điện tử, truyền thông và giáo dục chính trị Trung đoàn 95 (Đoàn Mang Yang Anh hùng), Sư đoàn 2, Quân đoàn 3 - Quân đội nhân dân Việt Nam.';
    const defaultImage = 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1200&auto=format&fit=crop&q=80';
    const siteUrl = window.location.origin;

    let pageTitle = defaultSiteTitle;
    let pageDesc = defaultDescription;
    let pageImage = defaultImage;
    let pageUrl = window.location.href;

    if (article) {
      pageTitle = `${article.title} | TRUYỀN THÔNG ĐOÀN MANG YANG`;
      pageDesc = article.excerpt || article.content.substring(0, 160).replace(/<[^>]*>?/gm, '') || defaultDescription;
      pageImage = article.image || defaultImage;
      pageUrl = `${siteUrl}/#article-${article.id}`;
    } else if (customTitle) {
      pageTitle = `${customTitle} | ${defaultSiteTitle}`;
    }

    // Update document title
    document.title = pageTitle;

    // Helper to update or create meta tags
    const setMetaTag = (attrName: 'name' | 'property', attrValue: string, content: string) => {
      let tag = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attrName, attrValue);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Standard Meta
    setMetaTag('name', 'description', pageDesc);

    // Open Graph (Facebook / Zalo / Telegram / Viber)
    setMetaTag('property', 'og:title', pageTitle);
    setMetaTag('property', 'og:description', pageDesc);
    setMetaTag('property', 'og:image', pageImage);
    setMetaTag('property', 'og:url', pageUrl);
    setMetaTag('property', 'og:type', article ? 'article' : 'website');
    setMetaTag('property', 'og:site_name', defaultSiteTitle);

    // Twitter Card
    setMetaTag('name', 'twitter:title', pageTitle);
    setMetaTag('name', 'twitter:description', pageDesc);
    setMetaTag('name', 'twitter:image', pageImage);
    setMetaTag('name', 'twitter:card', 'summary_large_image');

    // Dynamic JSON-LD structured data for article
    let scriptTag = document.getElementById('json-ld-article') as HTMLScriptElement | null;
    if (article) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'json-ld-article';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        image: [pageImage],
        datePublished: article.date,
        dateModified: article.date,
        author: {
          '@type': 'Person',
          name: article.author || 'Ban Biên tập Trung đoàn 95',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Trung đoàn 95 - Sư đoàn 2',
          logo: {
            '@type': 'ImageObject',
            url: defaultImage,
          },
        },
        description: pageDesc,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': pageUrl,
        },
      });
    } else if (scriptTag) {
      scriptTag.remove();
    }
  } catch (e) {
    console.warn('Error updating SEO tags:', e);
  }
}

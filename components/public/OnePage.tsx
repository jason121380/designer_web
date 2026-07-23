import { Fragment } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { SECTION_ANCHOR, type DesignerWebContent } from "@/lib/designer-web-content";
import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import PublicVideo from "@/components/public/PublicVideo";
import MediaView from "@/components/public/MediaView";
import WorksGallery from "@/components/public/WorksGallery";
import FloatingBubble from "@/components/public/FloatingBubble";
import Analytics from "@/components/public/Analytics";
import AnalyticsClicks from "@/components/public/AnalyticsClicks";
import { externalHref } from "@/lib/utils";
import { streamUidFromUrl } from "@/lib/stream-url";
import { isVideoUrl } from "@/lib/media";

type Section = { key: string; zh: string; en: string; bg: string };

// 前台影片一律以 9:16 呈現；圖片維持各區塊原本比例。
const mediaClass = (url: string, imageAspect: string) =>
  `${isVideoUrl(url) ? "aspect-[9/16]" : imageAspect} w-full object-cover`;

function SectionHeading({ en, zh }: { en: string; zh: string }) {
  return (
    <div className="mb-10 text-center md:mb-14">
      {!!en && <p className="subheading mb-2 font-serif-display">{en}</p>}
      <h2 className="text-2xl font-bold text-neutral-800 md:text-3xl">{zh}</h2>
    </div>
  );
}

function BulletList({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-4">
      <p className="mb-1 font-semibold text-neutral-700">{label}</p>
      <ul className="space-y-1 text-neutral-600">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

/** 依 section key 渲染對應區塊；沒有內容的可選區塊回 null（前台隱藏）。標題來自 sec。 */
function renderSection(content: DesignerWebContent, sec: Section) {
  switch (sec.key) {
    case "dm":
      return content.promos.length ? (
        <section id="dm" className="scroll-mt-14 py-14 md:py-20" style={{ backgroundColor: sec.bg }}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-5 md:grid-cols-2">
              {content.promos.map((promo) => (
                <figure key={promo.id} className="overflow-hidden bg-white rounded-lg">
                  <MediaView src={promo.image} alt={promo.caption || sec.zh} className={mediaClass(promo.image, "h-auto")} />
                  {!!promo.caption && <figcaption className="p-4 text-sm text-neutral-600">{promo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null;

    case "services":
      return (
        <section id="services" className="scroll-mt-14 py-14 md:py-20" style={{ backgroundColor: sec.bg }}>
          <div className="mx-auto max-w-5xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="space-y-8">
              {content.services.map((service) => {
                // 多媒體：優先 images，向下相容沿用單張 image。
                const media = service.images.length ? service.images : (service.image ? [service.image] : []);
                return (
                  <article key={service.id} className="overflow-hidden bg-white rounded-lg p-6 md:p-8">
                    <h3 className="mb-3 text-xl font-bold text-neutral-800">{service.title}</h3>
                    <p className="mb-4 whitespace-pre-line leading-relaxed text-neutral-600">{service.description}</p>
                    <BulletList label="特色：" items={service.features} />
                    <BulletList label="適合對象：" items={service.suitableFor} />
                    {media.length > 0 && (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {media.map((src, i) => (
                          <figure key={i} className="overflow-hidden bg-neutral-100 rounded-lg">
                            <MediaView src={src} alt={service.title} className={mediaClass(src, "aspect-square")} />
                          </figure>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      );

    case "otherServices":
      return (
        <section id="other-services" className="scroll-mt-14 py-14 md:py-20" style={{ backgroundColor: sec.bg }}>
          <div className="mx-auto max-w-5xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-6 md:grid-cols-2">
              {content.otherServices.map((service) => (
                <article key={service.id} className="overflow-hidden bg-white rounded-lg">
                  {!!service.image && <MediaView src={service.image} alt={service.title} className={mediaClass(service.image, "aspect-square")} />}
                  <div className="p-6">
                    <h3 className="mb-3 text-lg font-bold text-neutral-800">{service.title}</h3>
                    <p className="mb-4 whitespace-pre-line leading-relaxed text-neutral-600">{service.description}</p>
                    <BulletList label="特色：" items={service.features} />
                    <BulletList label="適合對象：" items={service.suitableFor} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );

    case "videos":
      return content.videos.length ? (
        <section id="hair-video" className="scroll-mt-14 py-14 md:py-20" style={{ backgroundColor: sec.bg }}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <WorksGallery videos={content.videos} categoryOrder={content.videoCategories} />
            {!!content.videosMoreUrl && (
              <div className="mt-10 text-center">
                <a
                  href={externalHref(content.videosMoreUrl)}
                  target="_blank"
                  rel="noreferrer"
                  data-ga-event="click_more_works"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "var(--brand)" }}
                >
                  查看更多作品
                </a>
              </div>
            )}
          </div>
        </section>
      ) : null;

    case "installment":
      return (
        <section id="pay" className="scroll-mt-14 py-14 md:py-20" style={{ backgroundColor: sec.bg }}>
          <div className="mx-auto max-w-3xl px-4">
            <div className="overflow-hidden bg-white rounded-lg">
              <h3 className="py-4 text-center text-lg font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>
                {sec.zh}
              </h3>
              <div className="space-y-5 p-6">
                {content.installment.map((text, index) => (
                  <div key={`${index}-${text}`} className="grid grid-cols-[36px_1fr] gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 font-bold text-white">{index + 1}</span>
                    <p className="whitespace-pre-line leading-relaxed text-neutral-700">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      );

    case "pricing":
      return (
        <section id="pricing" className="scroll-mt-14 py-14 md:py-20" style={{ backgroundColor: sec.bg }}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-6 md:grid-cols-3">
              {content.pricing.map((item, index) => (
                <article key={`${item.name}-${index}`} className="border border-black/5 bg-white rounded-lg p-6">
                  <p className="mb-2 text-sm font-semibold text-neutral-500">{item.name}</p>
                  <h3 className="mb-4 text-2xl font-bold text-neutral-900">{item.price}</h3>
                  <p className="mb-5 leading-relaxed text-neutral-600">{item.description}</p>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    {item.features.map((feature) => <li key={feature}>{feature}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      );

    case "environment":
      return content.environment.length ? (
        <section id="ev" className="scroll-mt-14 py-14 md:py-20" style={{ backgroundColor: sec.bg }}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.environment.map((item, index) => (
                <figure key={item.id} className="overflow-hidden bg-white rounded-lg">
                  <MediaView src={item.image} alt={item.alt || `${sec.zh} ${index + 1}`} className={mediaClass(item.image, "aspect-square")} />
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null;

    case "contact":
      return (
        <section id="contact" className="scroll-mt-14 py-14 md:py-20" style={{ backgroundColor: sec.bg }}>
          <div className="mx-auto max-w-4xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-neutral-700">
              {!!content.contact.address && (
                <span className="flex items-center gap-2">
                  <MapPin size={18} style={{ color: "var(--brand)" }} />
                  {content.contact.mapUrl ? (
                    <a href={externalHref(content.contact.mapUrl)} target="_blank" rel="noreferrer" data-ga-event="click_map" data-ga-label="聯絡我_地圖" className="hover:underline">{content.contact.address}</a>
                  ) : (
                    <span>{content.contact.address}</span>
                  )}
                </span>
              )}
              {!!content.contact.phone && <a href={`tel:${content.contact.phone}`} data-ga-event="click_phone" data-ga-label="聯絡我_電話" className="flex items-center gap-2 hover:underline"><Phone size={18} style={{ color: "var(--brand)" }} />{content.contact.phone}</a>}
              {!!content.contact.email && <a href={`mailto:${content.contact.email}`} data-ga-event="click_email" data-ga-label="聯絡我_Email" className="flex items-center gap-2 hover:underline"><Mail size={18} style={{ color: "var(--brand)" }} />{content.contact.email}</a>}
              {!!content.contact.facebook && <a href={externalHref(content.contact.facebook)} target="_blank" rel="noreferrer" data-ga-event="click_facebook" data-ga-label="聯絡我_Facebook" className="flex items-center gap-2 hover:underline"><span className="w-[18px] text-center text-sm font-bold" style={{ color: "var(--brand)" }}>f</span>Facebook</a>}
              {!!content.contact.instagram && <a href={externalHref(content.contact.instagram)} target="_blank" rel="noreferrer" data-ga-event="click_instagram" data-ga-label="聯絡我_Instagram" className="flex items-center gap-2 hover:underline"><span className="w-[18px] text-center text-xs font-bold" style={{ color: "var(--brand)" }}>IG</span>Instagram</a>}
              {!!content.contact.line && <a href={externalHref(content.contact.line)} target="_blank" rel="noreferrer" data-ga-event="click_line" data-ga-label="聯絡我_LINE" className="flex items-center gap-2 hover:underline"><MessageCircle size={18} style={{ color: "var(--brand)" }} />LINE</a>}
            </div>
          </div>
        </section>
      );

    default:
      return null;
  }
}

/** 一頁式網站的完整輸出（Header + 首屏 + 依 sections 排序的區塊 + Footer）。 */
export default function OnePage({ content }: { content: DesignerWebContent }) {
  // 頁面若含 Stream 影片，預先與 Cloudflare 建立連線，縮短首屏影片啟動時間。
  const hasStreamVideo = [content.hero.video, ...content.videos.map((v) => v.video)].some((url) => streamUidFromUrl(url));
  const headerLinks = content.sections
    .filter((sec) => {
      if (sec.key === "dm") return content.promos.length > 0;
      if (sec.key === "videos") return content.videos.length > 0;
      if (sec.key === "environment") return content.environment.length > 0;
      return true;
    })
    .map((sec) => ({ href: `#${SECTION_ANCHOR[sec.key]}`, label: sec.zh }));
  return (
    <div style={{ ["--brand" as string]: content.brand.themeColor }}>
      <Analytics id={content.seo.gaId} />
      {!!content.seo.gaId && <AnalyticsClicks />}
      {hasStreamVideo && (
        <>
          <link rel="preconnect" href="https://videodelivery.net" />
        </>
      )}
      <Header
        title={content.brand.tagline || content.brand.name}
        themeColor={content.brand.themeColor}
        textColor={content.brand.headerTextColor}
        links={headerLinks}
      />
      <main className="min-h-screen">
        <section id="top" className="scroll-mt-14" style={{ backgroundColor: content.hero.bgColor }}>
          {(content.hero.image || content.hero.video) && (
            <div className={`grid gap-1 ${content.hero.image && content.hero.video ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {!!content.hero.image && (
                <div className="overflow-hidden">
                  <img src={content.hero.image} alt={content.brand.name} fetchPriority="high" decoding="async" className="aspect-square w-full object-cover" />
                </div>
              )}
              {!!content.hero.video && (
                <div className="overflow-hidden">
                  <PublicVideo src={content.hero.video} autoPlay priority className="aspect-[9/16] w-full object-cover" />
                </div>
              )}
            </div>
          )}
          <div className="mx-auto max-w-4xl px-4 py-8 text-center md:py-10">
            <h1 className="whitespace-pre-line text-lg leading-relaxed md:text-xl" style={{ color: content.hero.headingColor }}>
              {content.hero.heading}
            </h1>
          </div>
        </section>

        {content.sections.map((sec) => (
          <Fragment key={sec.key}>{renderSection(content, sec)}</Fragment>
        ))}
      </main>
      <Footer content={content} />
      <FloatingBubble contact={content.contact} />
    </div>
  );
}

import { Fragment } from "react";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { DesignerWebContent } from "@/lib/designer-web-content";
import Header from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import PublicVideo from "@/components/public/PublicVideo";
import { externalHref } from "@/lib/utils";

const sectionStyle = { backgroundColor: "var(--cream-3)" };
const lightSectionStyle = { backgroundColor: "var(--cream-1)" };
const warmSectionStyle = { backgroundColor: "var(--cream-2)" };

type Section = { key: string; zh: string; en: string };

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
        {items.map((item) => <li key={item}>- {item}</li>)}
      </ul>
    </div>
  );
}

/** 依 section key 渲染對應區塊；沒有內容的可選區塊回 null（前台隱藏）。標題來自 sec。 */
function renderSection(content: DesignerWebContent, sec: Section) {
  switch (sec.key) {
    case "dm":
      return content.promos.length ? (
        <section id="dm" className="scroll-mt-14 py-14 md:py-20" style={warmSectionStyle}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-5 md:grid-cols-2">
              {content.promos.map((promo) => (
                <figure key={promo.id} className="overflow-hidden bg-white rounded-lg">
                  <img src={promo.image} alt={promo.caption || sec.zh} className="h-auto w-full object-cover" loading="lazy" />
                  {!!promo.caption && <figcaption className="p-4 text-sm text-neutral-600">{promo.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null;

    case "services":
      return (
        <section id="services" className="scroll-mt-14 py-14 md:py-20" style={sectionStyle}>
          <div className="mx-auto max-w-5xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="space-y-8">
              {content.services.map((service) => (
                <article key={service.id} className="overflow-hidden bg-white rounded-lg md:grid md:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
                  <div className="p-6 md:p-8">
                    <h3 className="mb-3 text-xl font-bold text-neutral-800">{service.title}</h3>
                    <p className="mb-4 whitespace-pre-line leading-relaxed text-neutral-600">{service.description}</p>
                    <BulletList label="特色：" items={service.features} />
                    <BulletList label="適合對象：" items={service.suitableFor} />
                  </div>
                  {!!service.image && <img src={service.image} alt={service.title} className="h-full min-h-64 w-full object-cover" loading="lazy" />}
                </article>
              ))}
            </div>
          </div>
        </section>
      );

    case "otherServices":
      return (
        <section id="other-services" className="scroll-mt-14 py-14 md:py-20" style={sectionStyle}>
          <div className="mx-auto max-w-5xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-6 md:grid-cols-2">
              {content.otherServices.map((service) => (
                <article key={service.id} className="overflow-hidden bg-white rounded-lg">
                  {!!service.image && <img src={service.image} alt={service.title} className="aspect-video w-full object-cover" loading="lazy" />}
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
        <section id="hair-video" className="scroll-mt-14 py-14 md:py-20" style={lightSectionStyle}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {content.videos.map((item) => (
                <figure key={item.id} className="overflow-hidden bg-white rounded-lg">
                  <PublicVideo src={item.video} controls className="aspect-[9/16] w-full bg-black object-cover" />
                  {!!item.caption && <figcaption className="p-4 text-sm text-neutral-600">{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null;

    case "installment":
      return (
        <section id="pay" className="scroll-mt-14 py-14 md:py-20" style={lightSectionStyle}>
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
        <section id="pricing" className="scroll-mt-14 py-14 md:py-20" style={warmSectionStyle}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-6 md:grid-cols-3">
              {content.pricing.map((item, index) => (
                <article key={`${item.name}-${index}`} className="border border-black/5 bg-white rounded-lg p-6">
                  <p className="mb-2 text-sm font-semibold text-neutral-500">{item.name}</p>
                  <h3 className="mb-4 text-2xl font-bold text-neutral-900">{item.price}</h3>
                  <p className="mb-5 leading-relaxed text-neutral-600">{item.description}</p>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    {item.features.map((feature) => <li key={feature}>- {feature}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      );

    case "environment":
      return content.environment.length ? (
        <section id="ev" className="scroll-mt-14 py-14 md:py-20" style={sectionStyle}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.environment.map((item, index) => (
                <figure key={item.id} className="overflow-hidden bg-white rounded-lg">
                  <img src={item.image} alt={item.alt || `${sec.zh} ${index + 1}`} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null;

    case "contact":
      return (
        <section id="contact" className="scroll-mt-14 py-14 md:py-20" style={warmSectionStyle}>
          <div className="mx-auto max-w-4xl px-4">
            <SectionHeading en={sec.en} zh={sec.zh} />
            <div className="grid items-start gap-8 md:grid-cols-2">
              <div className="space-y-3 text-neutral-700">
                {!!content.contact.address && (
                  <p className="flex items-center gap-2">
                    <MapPin size={18} style={{ color: "var(--brand)" }} />
                    {content.contact.mapUrl ? (
                      <a href={externalHref(content.contact.mapUrl)} target="_blank" rel="noreferrer" className="hover:underline">{content.contact.address}</a>
                    ) : (
                      <span>{content.contact.address}</span>
                    )}
                  </p>
                )}
                {!!content.contact.phone && <p className="flex items-center gap-2"><Phone size={18} style={{ color: "var(--brand)" }} /><a href={`tel:${content.contact.phone}`} className="hover:underline">{content.contact.phone}</a></p>}
                {!!content.contact.email && <p className="flex items-center gap-2"><Mail size={18} style={{ color: "var(--brand)" }} /><a href={`mailto:${content.contact.email}`} className="hover:underline">{content.contact.email}</a></p>}
                {!!content.contact.facebook && <p className="flex items-center gap-2"><span className="w-[18px] text-center text-sm font-bold" style={{ color: "var(--brand)" }}>f</span><a href={externalHref(content.contact.facebook)} target="_blank" rel="noreferrer" className="hover:underline">Facebook</a></p>}
                {!!content.contact.instagram && <p className="flex items-center gap-2"><span className="w-[18px] text-center text-xs font-bold" style={{ color: "var(--brand)" }}>IG</span><a href={externalHref(content.contact.instagram)} target="_blank" rel="noreferrer" className="hover:underline">Instagram</a></p>}
                {!!content.contact.line && <p className="flex items-center gap-2"><MessageCircle size={18} style={{ color: "var(--brand)" }} /><a href={externalHref(content.contact.line)} target="_blank" rel="noreferrer" className="hover:underline">LINE</a></p>}
              </div>
              {!!content.contact.mapEmbedUrl && <iframe src={content.contact.mapEmbedUrl} title="店家位置" className="h-72 w-full border-0" loading="lazy" />}
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
  return (
    <div style={{ ["--brand" as string]: content.brand.themeColor }}>
      <Header content={content} />
      <main className="min-h-screen">
        <section id="top" className="scroll-mt-14 bg-neutral-900">
          {content.hero.media.length > 0 && (
            <div className={`mx-auto grid max-w-6xl gap-1 ${content.hero.media.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {content.hero.media.map((item, index) => (
                <div key={`${index}-${item.url}`} className="overflow-hidden">
                  {item.type === "video" ? (
                    <PublicVideo src={item.url} autoPlay className="aspect-square w-full object-cover" />
                  ) : (
                    <img src={item.url} alt={content.brand.name} className="aspect-square w-full object-cover" />
                  )}
                </div>
              ))}
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
    </div>
  );
}

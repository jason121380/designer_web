import type { Metadata } from "next";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { frontendDemo } from "@/lib/frontend-demo";

export const metadata: Metadata = {
  title: { absolute: "中壢接髮推薦｜KIMEKO HAIR 首席接髮設計師" },
  description: "中壢首席接髮設計師，極致零感羽毛接髮、鏡面燙、手刷染、光線染、5G 護髮。",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "中壢接髮推薦｜KIMEKO HAIR 首席接髮設計師",
    description: "中壢首席接髮設計師，極致零感羽毛接髮、鏡面燙、手刷染、光線染、5G 護髮。",
  },
};

const sectionStyle = { backgroundColor: "var(--cream-3)" };
const lightSectionStyle = { backgroundColor: "var(--cream-1)" };
const warmSectionStyle = { backgroundColor: "var(--cream-2)" };

function SectionHeading({ en, zh }: { en: string; zh: string }) {
  return (
    <div className="mb-10 text-center md:mb-14">
      <p className="subheading mb-2 font-serif-display">{en}</p>
      <h2 className="text-2xl font-bold text-neutral-800 md:text-3xl">{zh}</h2>
    </div>
  );
}

function BulletList({ label, items, icon }: { label: string; items: string[]; icon: string }) {
  return (
    <>
      <p className="mb-1 font-semibold text-neutral-700">{label}</p>
      <ul className="mb-4 space-y-1">
        {items.map((item) => (
          <li key={item} className="text-neutral-600">
            {icon} {item}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function HomePage() {
  const demo = frontendDemo;

  return (
    <div style={{ ["--brand" as string]: demo.themeColor }}>
      <section id="top" className="bg-neutral-900">
        <div className="mx-auto max-w-4xl px-4 py-8 text-center md:py-10">
          <h1 className="whitespace-pre-line text-lg leading-relaxed text-white md:text-xl">
            {demo.hero.heading}
          </h1>
        </div>
      </section>

      {!!demo.promos.length && (
        <section id="dm" className="py-14 md:py-20" style={warmSectionStyle}>
          <div className="mx-auto max-w-6xl px-4">
            <SectionHeading en="DM" zh="活動DM" />
          </div>
        </section>
      )}

      <section id="services" className="py-14 md:py-20" style={sectionStyle}>
        <div className="mx-auto max-w-5xl px-4">
          <SectionHeading en="Services" zh="接髮介紹" />
          <div className="space-y-8">
            {demo.services.map((service) => (
              <article key={service.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="p-6">
                  <h3 className="mb-3 text-xl font-bold text-neutral-800">{service.title}</h3>
                  <p className="mb-4 whitespace-pre-line leading-relaxed text-neutral-600">{service.description}</p>
                  <BulletList label="特色：" items={service.features} icon="✔" />
                  <BulletList label="適合對象：" items={service.suitableFor} icon="💡" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="other-services" className="py-14 md:py-20" style={sectionStyle}>
        <div className="mx-auto max-w-5xl px-4">
          <SectionHeading en="Other Services" zh="其他服務" />
          <div className="grid gap-6 md:grid-cols-2">
            {demo.otherServices.map((service) => (
              <article key={service.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-4 text-center">
                  <h3 className="text-lg font-bold text-neutral-800">{service.title}</h3>
                </div>
                <p className="mb-4 whitespace-pre-line leading-relaxed text-neutral-600">{service.description}</p>
                <BulletList label="特色：" items={service.features} icon="✔" />
                <BulletList label="適合對象：" items={service.suitableFor} icon="💡" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pay" className="py-14 md:py-20" style={lightSectionStyle}>
        <div className="mx-auto max-w-3xl px-4">
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <h3 className="py-4 text-center text-lg font-bold text-white" style={{ backgroundColor: "var(--brand)" }}>
              ▼ ▼ ▼ 分期介紹 ▼ ▼ ▼
            </h3>
            <div className="space-y-4 p-6">
              {demo.installment.map((text, index) => (
                <div key={text}>
                  <span
                    className="mb-2 inline-flex h-9 w-9 items-center justify-center font-bold text-white"
                    style={{ backgroundColor: "#3b3221", borderRadius: "50% 50% 0 50%" }}
                  >
                    {index + 1}
                  </span>
                  <p className="whitespace-pre-line leading-relaxed text-neutral-700">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-14 md:py-20" style={warmSectionStyle}>
        <div className="mx-auto max-w-4xl px-4">
          <SectionHeading en="Contact" zh="聯絡我們" />
          <div className="grid items-start gap-8 md:grid-cols-2">
            <div className="space-y-3 text-neutral-700">
              <p className="flex items-center gap-2">
                <MapPin size={18} style={{ color: "var(--brand)" }} />
                <a href={demo.contact.mapUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  {demo.contact.address}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone size={18} style={{ color: "var(--brand)" }} />
                <a href={`tel:${demo.contact.phone}`} className="hover:underline">
                  {demo.contact.phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-[18px] text-center text-sm font-bold" style={{ color: "var(--brand)" }}>
                  f
                </span>
                <a href={demo.contact.facebook} target="_blank" rel="noreferrer" className="hover:underline">
                  Facebook
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="w-[18px] text-center text-xs font-bold" style={{ color: "var(--brand)" }}>
                  IG
                </span>
                <a href={demo.contact.instagram} target="_blank" rel="noreferrer" className="hover:underline">
                  Instagram
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle size={18} style={{ color: "var(--brand)" }} />
                <a href={demo.contact.line} target="_blank" rel="noreferrer" className="hover:underline">
                  LINE
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { jsonLdGraph, organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdGraph(organizationJsonLd(), websiteJsonLd()),
        }}
      />
      {children}
    </>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/api";
import { SITE_NAME } from "@/lib/seo";
import { RichText } from "@/components/rich-text";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: page } = await getPage(slug);
  if (!page) return { title: "Page not found", robots: { index: false } };
  const title = page.metaTitle ?? page.title;
  const description = page.metaDescription ?? undefined;
  const url = `/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE_NAME, url, title: `${title} · ${SITE_NAME}`, description, images: ["/opengraph-image"] },
    twitter: { card: "summary_large_image", title: `${title} · ${SITE_NAME}`, description, images: ["/opengraph-image"] },
  };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const { data: page } = await getPage(slug);
  if (!page) notFound();

  return (
    <article className="flex flex-col gap-6 pt-8">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
      <div className="glass p-6 sm:p-8">
        <RichText text={page.content} />
      </div>
    </article>
  );
}

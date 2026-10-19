import Link from "next/link";

const contentPages = [
  {
    title: "Home Page Content",
    description: "Edit the homepage heading, article and SEO — independent per site",
    href: "/admin/content/home",
    icon: "🏠",
  },
  {
    title: "Category Pages",
    description: "Add, edit and delete categories (menu + page content)",
    href: "/admin/content/categories",
    icon: "📂",
  },
  {
    title: "Static Pages",
    description: "Privacy, Terms, DMCA, Contact, About and any new page",
    href: "/admin/content/pages",
    icon: "📄",
  },
];

export default function AdminContent() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div className="mb-8">
          <Link href="/admin" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Edit Content</h1>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {contentPages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group glass rounded-2xl p-6 transition hover:border-neon/50 hover:bg-night-800/70"
            >
              <div className="mb-4 text-4xl">{page.icon}</div>
              <h2 className="mb-2 font-display text-xl font-bold text-white group-hover:text-neon">
                {page.title}
              </h2>
              <p className="text-sm text-muted">{page.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

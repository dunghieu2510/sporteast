import Link from "next/link";

const seoFeatures = [
  {
    title: "Meta Tags",
    description: "Manage title, description, OG tags for pages",
    href: "/admin/seo/meta",
    icon: "🏷️",
    status: "active",
  },
  {
    title: "Sitemap",
    description: "Generate and manage sitemap.xml",
    href: "/admin/seo/sitemap",
    icon: "📍",
    status: "active",
  },
  {
    title: "Robots.txt",
    description: "Edit robots.txt rules and crawler settings",
    href: "/admin/seo/robots",
    icon: "🤖",
    status: "active",
  },
  {
    title: "SEO Audit",
    description: "Run SEO audit and get improvement suggestions",
    href: "/admin/seo/audit",
    icon: "📈",
    status: "active",
  },
  {
    title: "Schema Markup",
    description: "Manage structured data and JSON-LD",
    href: "/admin/seo/schema",
    icon: "📝",
    status: "coming",
  },
  {
    title: "Keywords",
    description: "Track target keywords and search volume",
    href: "/admin/seo/keywords",
    icon: "🔍",
    status: "coming",
  },
];

export default function AdminSEO() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mb-12">
          <Link href="/admin" className="mb-4 inline-block text-sm text-neon hover:text-white">
            ← Back to Dashboard
          </Link>
          <div>
            <h1 className="font-display text-4xl font-bold text-white">SEO Management</h1>
            <p className="mt-2 text-muted">Optimize your site for search engines</p>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {seoFeatures.map((feature) =>
            feature.status === "active" ? (
              <Link
                key={feature.href}
                href={feature.href}
                className="glass rounded-2xl p-6 transition hover:border-neon/50 hover:bg-night-800/70 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-3xl">{feature.icon}</span>
                    </div>
                    <h2 className="mb-2 font-display text-xl font-bold text-white group-hover:text-neon">
                      {feature.title}
                    </h2>
                    <p className="text-sm text-muted">{feature.description}</p>
                  </div>
                  <span className="text-xl text-neon">→</span>
                </div>
              </Link>
            ) : (
              <div
                key={feature.href}
                className="glass rounded-2xl p-6 opacity-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-3xl">{feature.icon}</span>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white/60">
                        Coming Soon
                      </span>
                    </div>
                    <h2 className="mb-2 font-display text-xl font-bold text-white">
                      {feature.title}
                    </h2>
                    <p className="text-sm text-muted">{feature.description}</p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid gap-4 sm:grid-cols-4">
          {[
            { label: "SEO Score", value: "78/100", icon: "📊" },
            { label: "Meta Tags", value: "7/9", icon: "✅" },
            { label: "Broken Links", value: "0", icon: "🔗" },
            { label: "Last Audit", value: "Today", icon: "📅" },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-4">
              <p className="text-3xl mb-2">{stat.icon}</p>
              <p className="text-xs text-muted">{stat.label}</p>
              <p className="text-lg font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

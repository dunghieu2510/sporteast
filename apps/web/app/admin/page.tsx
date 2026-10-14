"use client";

import Link from "next/link";
import { AdminGate } from "@/components/admin-ui";

const adminItems = [
  { title: "Manage Matches", description: "View today's games and add embed links", href: "/admin/matches", icon: "🏆" },
  { title: "Category Pages", description: "Add, edit or delete categories and their content", href: "/admin/content/categories", icon: "📂" },
  { title: "Static Pages", description: "Privacy, Terms, DMCA, Contact, About and more", href: "/admin/content/pages", icon: "📄" },
  { title: "Edit Content", description: "Home page and category content", href: "/admin/content", icon: "📝" },
  { title: "SEO Management", description: "Meta tags, sitemap, robots.txt & more", href: "/admin/seo", icon: "🔍" },
  { title: "Security", description: "2FA, password and admin accounts", href: "/admin/security", icon: "🔒" },
];

export default function AdminDashboard() {
  return (
    <div className="min-h-screen pt-8">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <header className="mb-8">
          <h1 className="font-display text-4xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-muted">Manage matches, content and security</p>
        </header>

        <AdminGate>
          <div className="grid gap-6 sm:grid-cols-2">
            {adminItems.map((item) => (
              <Link key={item.href} href={item.href} className="group glass p-6 hover:bg-night-700">
                <div className="mb-4 text-4xl">{item.icon}</div>
                <h2 className="mb-2 font-display text-xl font-bold text-white group-hover:text-neon">{item.title}</h2>
                <p className="text-sm text-muted">{item.description}</p>
              </Link>
            ))}
          </div>
        </AdminGate>
      </div>
    </div>
  );
}

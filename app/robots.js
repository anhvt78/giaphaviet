// app/robots.js
export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"], // Chặn các trang nội bộ
    },
    sitemap: "https://giaphaviet.top/sitemap.xml",
  };
}

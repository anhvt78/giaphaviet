// app/sitemap.js

export default async function sitemap() {
  const baseUrl = "https://giaphaviet.top";

  // 1. Danh sách các trang tĩnh (Đã loại bỏ các file .js và sửa lỗi dấu //)
  const routes = ["", "/pages", "/pages/detail"]; 
  
  const staticPages = routes.flatMap((route) => {
    // Xử lý để tránh trùng lặp dấu //
    const cleanRoute = route.startsWith("/") ? route : `/${route}`;
    
    return [
      {
        url: `${baseUrl}/vi${cleanRoute === "/" ? "" : cleanRoute}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 1.0,
      },
      {
        url: `${baseUrl}${cleanRoute}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.9,
      },
    ];
  });

  // 2. Danh sách các trang dòng họ động
  let clanPages = [];
  try {
    // Sau này bạn thay bằng fetch data từ Smart Contract hoặc API của Gia Phả Việt
    const clans = [{ id: "0x123..." }, { id: "0x456..." }];

    clanPages = clans.map((clan) => ({
      url: `${baseUrl}/pages/detail/${clan.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Lỗi khi tạo sitemap cho dòng họ:", error);
  }

  return [...staticPages, ...clanPages];
}

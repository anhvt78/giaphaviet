import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en", "zh", "ja", "ko", "de"],
  defaultLocale: "vi",
});

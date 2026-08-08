export interface Theme {
  name: string;
  label: string;
  description: string;
  colors: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
  fonts: {
    headingFont: string;
    bodyFont: string;
  };
}

const centralTheme: Theme = {
  name: "pwf-comfort-light",
  label: "ثيم الراحة الفاتح المعتمد",
  description: "هوية فاتحة مريحة للعين للأدوات الذكية ولوحة التحكم، مع تقليل الأسود الصريح والحفاظ على الأزرق/الذهبي/الأحمر الملكي.",
  colors: {
    primaryColor: "#4C7DDA",
    secondaryColor: "#E2C766",
    accentColor: "#B22222",
    backgroundColor: "#F9F6EF",
    textColor: "#1F2937",
  },
  fonts: {
    headingFont: "'Cairo', sans-serif",
    bodyFont: "'Tajawal', sans-serif",
  },
};

/**
 * Theme Freeze Patch
 * Only one central theme is exposed until the scattered page-level styles are cleaned.
 * Legacy preset names are preserved as aliases so old UI buttons do not break.
 */
export const predefinedThemes: Theme[] = [
  centralTheme,
  { ...centralTheme, name: "ministry-classic", label: "تطبيق هوية الوزارة" },
  { ...centralTheme, name: "pwf-core", label: "هوية PalWaqf الفاتحة" },
  { ...centralTheme, name: "islamic-light", label: "ثيم إسلامي" },
  { ...centralTheme, name: "islamic-dark", label: "ثيم إسلامي فاتح مريح" },
];

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

// NOTE:
// - Colors may be HEX. SiteSettingsContext converts safely to HSL triplets before writing CSS tokens.
// - We keep themes as presets (no arbitrary HEX injection into tokens).

export const predefinedThemes: Theme[] = [
  {
    name: "light",
    label: "هوية PalWaqf (فاتح)",
    description: "الهوية الرسمية: أزرق + ذهبي + أحمر ملكي",
    colors: {
      primaryColor: "#1E4FA3", // Brand Blue
      secondaryColor: "#D4AF37", // Brand Gold
      accentColor: "#B22222", // Royal Red
      backgroundColor: "#F1F5F9",
      textColor: "#0F172A",
    },
    fonts: {
      headingFont: "Cairo",
      bodyFont: "Tajawal",
    },
  },
  {
    name: "dark",
    label: "هوية PalWaqf (داكن)",
    description: "نفس الهوية مع أسطح داكنة مريحة",
    colors: {
      primaryColor: "#4C7DDA", // Brighter Blue on dark
      secondaryColor: "#E2C766", // Softer Gold on dark
      accentColor: "#D13A3A", // Royal Red (slightly brighter)
      backgroundColor: "#0B1220",
      textColor: "#F9FAFB",
    },
    fonts: {
      headingFont: "Cairo",
      bodyFont: "Tajawal",
    },
  },

  // ✅ Ministry Classic (from the Ministry visual identity doc)
  {
    name: "ministry-classic",
    label: "هوية الوزارة (رسمي)",
    description: "أزرق داكن + ذهبي + أخضر للخدمات (هوية وزارة الأوقاف)",
    colors: {
      primaryColor: "#0d3c61",
      secondaryColor: "#c19a50",
      accentColor: "#2a6e3f",
      backgroundColor: "#f5f7fa",
      textColor: "#1a1a1a",
    },
    fonts: {
      headingFont: "Cairo",
      bodyFont: "Tajawal",
    },
  },

  // ✅ Islamic Theme (Light)
  {
    name: "islamic-light",
    label: "ثيم إسلامي (فاتح)",
    description: "أخضر داكن + ذهبي + أخضر خدمات",
    colors: {
      primaryColor: "#1a472a",
      secondaryColor: "#d4af37",
      accentColor: "#2a6e3f",
      backgroundColor: "#f8f9fa",
      textColor: "#1a1a1a",
    },
    fonts: {
      headingFont: "Cairo",
      bodyFont: "Tajawal",
    },
  },

  // ✅ Islamic Theme (Dark)
  {
    name: "islamic-dark",
    label: "ثيم إسلامي (داكن)",
    description: "أزرق/أخضر + ذهبي مع أسطح داكنة",
    colors: {
      primaryColor: "#1a5c8c",
      secondaryColor: "#d4af37",
      accentColor: "#3a8e5f",
      backgroundColor: "#1a202c",
      textColor: "#f8f9fa",
    },
    fonts: {
      headingFont: "Cairo",
      bodyFont: "Tajawal",
    },
  },

  // (Legacy – disabled)
  {
    name: "ocean",
    label: "تم تعطيله",
    description: "تم تعطيل الثيمات غير الرسمية للحفاظ على هوية موحدة",
    colors: {
      primaryColor: "#1E4FA3",
      secondaryColor: "#D4AF37",
      accentColor: "#B22222",
      backgroundColor: "#F1F5F9",
      textColor: "#0F172A",
    },
    fonts: {
      headingFont: "Cairo",
      bodyFont: "Tajawal",
    },
  },
  {
    name: "forest",
    label: "تم تعطيله",
    description: "تم تعطيل الثيمات غير الرسمية للحفاظ على هوية موحدة",
    colors: {
      primaryColor: "#1E4FA3",
      secondaryColor: "#D4AF37",
      accentColor: "#B22222",
      backgroundColor: "#F1F5F9",
      textColor: "#0F172A",
    },
    fonts: {
      headingFont: "Cairo",
      bodyFont: "Tajawal",
    },
  },
];

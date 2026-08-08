import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { usePageSettings } from "@/hooks/usePageSettings";

interface PageHeadProps {
  pageName: string;
  defaultTitle?: string;
  defaultDescription?: string;
}

export function PageHead({ pageName, defaultTitle, defaultDescription }: PageHeadProps) {
  const {
    title,
    description,
    metaKeywords,
    ogImage,
    customCss,
    customJs,
  } = usePageSettings(pageName);

  // Apply custom JavaScript
  useEffect(() => {
    if (!customJs) return;

    // Create script element
    const script = document.createElement("script");
    script.textContent = customJs;
    script.id = `custom-js-${pageName}`;
    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      const existingScript = document.getElementById(`custom-js-${pageName}`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [customJs, pageName]);

  const finalTitle = title || defaultTitle || "نظام الأوقاف الإسلامية في فلسطين";
  const finalDescription = description || defaultDescription || "مساعدك الذكي المتخصص في الأوقاف الإسلامية في فلسطين";

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{finalTitle}</title>
        <meta name="description" content={finalDescription} />
        {metaKeywords && <meta name="keywords" content={metaKeywords} />}

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={finalTitle} />
        <meta property="og:description" content={finalDescription} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={finalTitle} />
        <meta name="twitter:description" content={finalDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* Custom CSS */}
        {customCss && (
          <style type="text/css">
            {customCss}
          </style>
        )}
      </Helmet>
    </>
  );
}

import { Button } from "./ui/button";
import { Link } from "wouter";

interface DynamicSectionProps {
  section: {
    id: number;
    title: string;
    content: string;
    backgroundColor?: string;
    textColor?: string;
    layout: "full-width" | "centered" | "two-columns" | "three-columns" | "grid";
    imageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
  };
}

export function DynamicSection({ section }: DynamicSectionProps) {
  const { title, content, layout, imageUrl, ctaText, ctaLink } = section;

  const layoutClasses = {
    "full-width": "w-full",
    centered: "container mx-auto px-4",
    "two-columns": "container mx-auto px-4 grid md:grid-cols-2 gap-8 items-start",
    "three-columns": "container mx-auto px-4 grid md:grid-cols-3 gap-6 items-start",
    grid: "container mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start",
  } as const;

  return (
    <section className="dynamic-section-shell public-page-section">
      <div className={layoutClasses[layout]}>
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h2>

          {imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <div
            className="dynamic-section-prose prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {ctaText && ctaLink ? (
            <div className="pt-2">
              {ctaLink.startsWith("http") ? (
                <a href={ctaLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="btn-primary text-lg px-8 py-6">
                    {ctaText}
                  </Button>
                </a>
              ) : (
                <Link href={ctaLink}>
                  <Button size="lg" className="btn-primary text-lg px-8 py-6">
                    {ctaText}
                  </Button>
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

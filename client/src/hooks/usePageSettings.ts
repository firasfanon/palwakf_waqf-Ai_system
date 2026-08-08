import { trpc } from "@/lib/trpc";

export function usePageSettings(pageName: string) {
  const { data: pageSettings, isLoading } = trpc.pageSettings.get.useQuery(
    { pageName },
    { 
      enabled: !!pageName,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    }
  );

  return {
    pageSettings,
    isLoading,
    title: pageSettings?.title || "",
    description: pageSettings?.description || "",
    metaKeywords: pageSettings?.metaKeywords || "",
    ogImage: pageSettings?.ogImage || "",
    customCss: pageSettings?.customCss || "",
    customJs: pageSettings?.customJs || "",
    isActive: pageSettings?.isActive ?? 1,
  };
}

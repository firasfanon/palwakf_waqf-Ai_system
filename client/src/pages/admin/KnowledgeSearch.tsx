import { useState } from "react";
import AdminPage from "@/components/admin/ui/AdminPage";
import AdminCard from "@/components/admin/ui/AdminCard";
import AdminTable from "@/components/admin/ui/AdminTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

export function KnowledgeSearch() {
  const [, navigate] = useLocation();
  const [q, setQ] = useState("");
  const ALL_CATEGORIES = "__all_categories__";
const ALL_SOURCE_TYPES = "__all_source_types__";

const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [tags, setTags] = useState("");
  const [sourceType, setSourceType] = useState<string>(ALL_SOURCE_TYPES);
  const [limit, setLimit] = useState(20);

  // Search mutation
  const searchMutation = trpc.knowledgeSearch.search.useMutation();
  const generateChunksMutation =
    trpc.knowledgeSearch.generateChunksApproved.useMutation();

  const handleSearch = async () => {
    await searchMutation.mutateAsync({
      q: q || undefined,
      category: category === ALL_CATEGORIES ? undefined : category,
      tags: tags || undefined,
      sourceType: sourceType === ALL_SOURCE_TYPES ? undefined : sourceType,
      limit,
    });
  };

  const handleGenerateChunks = async () => {
    await generateChunksMutation.mutateAsync({ limit: 20 });
  };

  const results = searchMutation.data?.results || [];
  const totalResults = searchMutation.data?.total ?? results.length;
  const returnedResults = searchMutation.data?.returned ?? results.length;
  const isSearching = searchMutation.isPending;
  const isGenerating = generateChunksMutation.isPending;

  return (
    <AdminPage>
      {/* Filters Card */}
      <AdminCard title="البحث والفلاتر" description="ابحث عن chunks محددة">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">البحث</label>
              <Input
                placeholder="ابحث عن كلمة..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <div>
              <label className="text-sm font-medium">الفئة</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger disabled={isSearching}>
                  <SelectValue placeholder="اختر فئة..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CATEGORIES}>الكل</SelectItem>
                  <SelectItem value="waqf">وقف</SelectItem>
                  <SelectItem value="islamic_law">الشريعة الإسلامية</SelectItem>
                  <SelectItem value="palestinian_law">القانون الفلسطيني</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">الكلمات المفتاحية</label>
              <Input
                placeholder="مفصولة بفاصلة..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <div>
              <label className="text-sm font-medium">نوع المصدر</label>
              <Select value={sourceType} onValueChange={setSourceType}>
                <SelectTrigger disabled={isSearching}>
                  <SelectValue placeholder="اختر نوع..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_SOURCE_TYPES}>الكل</SelectItem>
                  <SelectItem value="wikipedia">ويكيبيديا</SelectItem>
                  <SelectItem value="rss">RSS</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="scraper">Scraper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="flex-1"
            >
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              بحث
            </Button>
            <Button
              onClick={handleGenerateChunks}
              disabled={isGenerating}
              variant="outline"
              className="flex-1"
            >
              {isGenerating && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              توليد Chunks (معتمد)
            </Button>
          </div>

          {generateChunksMutation.data && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              ✓ تم إنشاء {generateChunksMutation.data.created ?? generateChunksMutation.data.generated ?? 0} chunks
              {generateChunksMutation.data.skipped > 0 &&
                ` (تم تخطي ${generateChunksMutation.data.skipped})`}
            </div>
          )}

          {searchMutation.data?.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
              ✗ خطأ: {searchMutation.data.error}
            </div>
          )}
        </div>
      </AdminCard>

      {/* Results Table */}
      <AdminCard
        title="النتائج"
        description={`عدد النتائج المعروضة: ${returnedResults} / إجمالي المطابقات: ${totalResults}`}
      >
        {results.length === 0 && !isSearching ? (
          <div className="text-center py-8 text-muted-foreground">
            لا توجد نتائج. ابدأ بالبحث أو توليد chunks.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-right p-2">العنوان</th>
                  <th className="text-right p-2">المقتطف</th>
                  <th className="text-right p-2">الحالة</th>
                  <th className="text-right p-2">الشات</th>
                  <th className="text-right p-2">الاستشهادات</th>
                  <th className="text-right p-2">الرابط</th>
                  <th className="text-right p-2">الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result: any, idx: number) => (
                  <tr key={idx} className="border-b border-border hover:bg-card">
                    <td className="p-2 truncate max-w-xs">
                      {result.title || `Item #${result.source_item_id}`}
                    </td>
                    <td className="p-2 truncate max-w-sm text-muted-foreground">
                      {(result.chunkText || result.content || result.summary || "").substring(0, 100)}...
                    </td>
                    <td className="p-2">
                      {result.status || "-"}
                    </td>
                    <td className="p-2">
                      {result.isChatEligible ? "ظاهر" : "محجوب"}
                    </td>
                    <td className="p-2">
                      {typeof result.citationsCount === "number" ? result.citationsCount : "-"}
                    </td>
                    <td className="p-2">
                      {result.url ? (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs"
                        >
                          فتح
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate((result.url || `/knowledge-base/${result.id}`).replace(/^\/knowledge\//, "/knowledge-base/"))
                        }
                      >
عرض الوثيقة
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminPage>
  );
}

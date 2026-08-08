import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Database, 
  TrendingUp, 
  Star, 
  Trash2, 
  RefreshCw,
  Eye,
  MessageSquare,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Breadcrumbs from "@/components/Breadcrumbs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function CacheAnalytics() {
  const [isCleaningCache, setIsCleaningCache] = useState(false);
  const [isUpdatingSuggestions, setIsUpdatingSuggestions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);

  // Fetch cache stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.cache.getStats.useQuery();

  // Fetch most frequent questions
  const { data: frequentQuestions, isLoading: questionsLoading, refetch: refetchQuestions } = 
    trpc.cache.getMostFrequent.useQuery({ limit: 20 });

  // Clean expired cache mutation
  const cleanExpiredMutation = trpc.cache.cleanExpired.useMutation({
    onSuccess: (data) => {
      toast.success(`تم حذف ${data.deletedCount} إجابة منتهية الصلاحية`);
      refetchStats();
      refetchQuestions();
      setIsCleaningCache(false);
    },
    onError: () => {
      toast.error("فشل تنظيف الـ Cache");
      setIsCleaningCache(false);
    },
  });

  // Update suggested questions mutation
  const updateSuggestionsMutation = trpc.cache.updateSuggestedQuestions.useMutation({
    onSuccess: (data) => {
      setPreviewQuestions(data.suggestedQuestions);
      setShowPreview(true);
      setIsUpdatingSuggestions(false);
    },
    onError: () => {
      toast.error("فشل تحديث الأسئلة المقترحة");
      setIsUpdatingSuggestions(false);
    },
  });

  const handleCleanExpired = () => {
    setIsCleaningCache(true);
    cleanExpiredMutation.mutate();
  };

  const handleUpdateSuggestions = () => {
    setIsUpdatingSuggestions(true);
    updateSuggestionsMutation.mutate({ topN: 12 });
  };

  const calculateHitRate = () => {
    if (!stats || !stats.totalCached || stats.totalCached === 0) return "0.0";
    const rate = ((stats.totalHits || 0) / stats.totalCached) * 100;
    return isNaN(rate) ? "0.0" : rate.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "لوحة التحكم", href: "/admin/dashboard" },
            { label: "إحصائيات Cache" }
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              إحصائيات Cache
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              مراقبة وإدارة نظام Cache للإجابات المتكررة
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleCleanExpired}
              disabled={isCleaningCache}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isCleaningCache ? "جاري التنظيف..." : "تنظيف المنتهي"}
            </Button>
            <Button
              onClick={handleUpdateSuggestions}
              disabled={isUpdatingSuggestions}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <RefreshCw className="h-4 w-4" />
              {isUpdatingSuggestions ? "جاري التحديث..." : "تحديث الأسئلة المقترحة"}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="h-20 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Cached */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <Database className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats?.totalCached || 0}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الإجابات المحفوظة</p>
            </Card>

            {/* Total Hits */}
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats?.totalHits || 0}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الاستخدامات</p>
            </Card>

            {/* Hit Rate */}
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {calculateHitRate()}%
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">معدل Cache Hit Rate</p>
            </Card>

            {/* Average Rating */}
            <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-500 rounded-lg">
                  <Star className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stats?.avgRating && !isNaN(Number(stats.avgRating)) ? Number(stats.avgRating).toFixed(2) : "0.00"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">متوسط التقييم</p>
            </Card>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hit Rate Trend Chart */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              معدل Cache Hit Rate
            </h2>
            {stats ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={[
                    { name: 'الحالي', hitRate: parseFloat(calculateHitRate()) || 0 },
                    { name: 'المستهدف', hitRate: 85 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontSize: "12px" }} />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hitRate"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    name="معدل الإصابة %"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                لا توجد بيانات
              </div>
            )}
          </Card>

          {/* Category Distribution Chart */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              توزيع الأسئلة حسب الفئة
            </h2>
            {frequentQuestions && frequentQuestions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: 'قانونية',
                        value: frequentQuestions.filter(q => q.category === 'legal').length,
                      },
                      {
                        name: 'فقهية',
                        value: frequentQuestions.filter(q => q.category === 'jurisprudence').length,
                      },
                      {
                        name: 'إدارية',
                        value: frequentQuestions.filter(q => q.category === 'administrative').length,
                      },
                      {
                        name: 'تاريخية',
                        value: frequentQuestions.filter(q => q.category === 'historical').length,
                      },
                      {
                        name: 'عامة',
                        value: frequentQuestions.filter(q => q.category === 'general').length,
                      },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="hsl(var(--accent))"
                    dataKey="value"
                  >
                    {[
                      { name: 'قانونية', color: 'hsl(var(--primary))' },
                      { name: 'فقهية', color: 'hsl(var(--secondary))' },
                      { name: 'إدارية', color: 'hsl(var(--accent))' },
                      { name: 'تاريخية', color: 'hsl(var(--secondary))' },
                      { name: 'عامة', color: 'hsl(var(--muted-foreground))' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                لا توجد بيانات
              </div>
            )}
          </Card>

          {/* Rating Distribution Chart */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              توزيع التقييمات
            </h2>
            {frequentQuestions && frequentQuestions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={frequentQuestions
                    .filter(q => q.rating && !isNaN(Number(q.rating)))
                    .slice(0, 10)
                    .map(q => ({
                      question: q.questionOriginal.substring(0, 30) + '...',
                      rating: Number(q.rating) || 0,
                    }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" style={{ fontSize: "10px" }} angle={-45} textAnchor="end" height={100} />
                  <YAxis domain={[0, 5]} style={{ fontSize: "12px" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rating" fill="hsl(var(--secondary))" name="التقييم" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400">
                لا توجد بيانات
              </div>
            )}
          </Card>
        </div>

        {/* Most Frequent Questions Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-emerald-600" />
              الأسئلة الأكثر شيوعاً
            </h2>
            <Button
              onClick={() => refetchQuestions()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </div>

          {questionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : frequentQuestions && frequentQuestions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">#</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">السؤال</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">الفئة</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-4 w-4" />
                        الاستخدامات
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4" />
                        التقييم
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {frequentQuestions.map((q, index) => (
                    <tr 
                      key={q.id} 
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{index + 1}</td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white max-w-md">
                        {q.questionOriginal}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          q.category === 'legal' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                          q.category === 'jurisprudence' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          q.category === 'administrative' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                          q.category === 'historical' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          {q.category === 'legal' ? 'قانونية' :
                           q.category === 'jurisprudence' ? 'فقهية' :
                           q.category === 'administrative' ? 'إدارية' :
                           q.category === 'historical' ? 'تاريخية' :
                           'عامة'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-semibold">
                          <Eye className="h-3 w-3" />
                          {q.hitCount}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {q.rating && !isNaN(Number(q.rating)) ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-semibold">
                            <Star className="h-3 w-3 fill-current" />
                            {Number(q.rating).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-600 text-sm">لا يوجد</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد أسئلة محفوظة في الـ Cache بعد</p>
            </div>
          )}
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                معاينة الأسئلة المقترحة الجديدة
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {previewQuestions.map((q, index) => (
                <Card key={index} className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium mb-2">
                        {q.question}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          q.category === 'legal' ? 'bg-blue-100 text-blue-800' :
                          q.category === 'jurisprudence' ? 'bg-green-100 text-green-800' :
                          q.category === 'administrative' ? 'bg-purple-100 text-purple-800' :
                          q.category === 'historical' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {q.category === 'legal' ? 'قانونية' :
                           q.category === 'jurisprudence' ? 'فقهية' :
                           q.category === 'administrative' ? 'إدارية' :
                           q.category === 'historical' ? 'تاريخية' :
                           'عامة'}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {q.hitCount} استخدام
                        </span>
                        {q.rating && (
                          <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-yellow-500" />
                            {Number(q.rating).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                إغلاق
              </Button>
              <Button 
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                onClick={() => {
                  toast.success("تم حفظ الأسئلة المقترحة! يمكنك الآن تحديث ملف SuggestedQuestions.tsx يدوياً.");
                  setShowPreview(false);
                }}
              >
                حفظ وتطبيق
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

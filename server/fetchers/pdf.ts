/**
 * PDF Downloader & Extractor
 * تحميل ملفات PDF من URLs واستخراج النص منها
 */

import { governedFetch, type FetchGovernance } from "./governance";

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

interface PDFContent {
  title: string;
  content: string;
  url: string;
  metadata?: {
    pages?: number;
    fileSize?: number;
    extractionMethod?: string;
  };
}

/**
 * تحميل PDF من URL
 */
export async function downloadPDF(url: string, governance: FetchGovernance = {}, maxBytes: number = 15 * 1024 * 1024): Promise<Buffer | null> {
  try {
    const response = await governedFetch(url, {}, { ...governance, respectRobots: governance.respectRobots ?? true, rateLimitMs: governance.rateLimitMs ?? 1000 });
    
    if (!response.ok) {
      console.error(`Failed to download PDF: ${response.statusText}`);
      return null;
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxBytes) {
      console.error(`PDF too large: ${contentLength} bytes`);
      return null;
    }

    const contentType = response.headers.get("content-type");
    const looksLikePdf = (contentType?.includes("pdf") || url.toLowerCase().endsWith(".pdf"));
    if (!looksLikePdf) {
      console.error(`URL does not look like a PDF: ${contentType}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buf = Buffer.from(arrayBuffer);
    if (buf.length > maxBytes) {
      console.error(`PDF too large after download: ${buf.length} bytes`);
      return null;
    }
    return buf;
  } catch (error) {
    console.error("PDF download error:", error);
    return null;
  }
}

/**
 * استخراج النص من PDF buffer باستخدام pdftotext
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string | null> {
  const tempPdfPath = join(tmpdir(), `temp-${Date.now()}.pdf`);
  const tempTxtPath = join(tmpdir(), `temp-${Date.now()}.txt`);

  try {
    // حفظ PDF مؤقتاً
    await writeFile(tempPdfPath, pdfBuffer);

    // محاولة استخدام pdftotext أولاً
    try {
      await execAsync(`pdftotext "${tempPdfPath}" "${tempTxtPath}"`);
      const { readFile } = await import("fs/promises");
      const text = await readFile(tempTxtPath, "utf-8");
      
      // تنظيف الملفات المؤقتة
      await unlink(tempPdfPath).catch(() => {});
      await unlink(tempTxtPath).catch(() => {});

      if (text.trim().length > 50) {
        return text.trim();
      }
    } catch (pdftotextError) {
      console.log("pdftotext failed, trying OCR...");
    }

    // إذا فشل pdftotext، استخدام OCR
    try {
      const ocrText = await extractTextWithOCR(tempPdfPath);
      
      // تنظيف الملفات المؤقتة
      await unlink(tempPdfPath).catch(() => {});
      
      return ocrText;
    } catch (ocrError) {
      console.error("OCR extraction failed:", ocrError);
      
      // تنظيف الملفات المؤقتة
      await unlink(tempPdfPath).catch(() => {});
      
      return null;
    }
  } catch (error) {
    console.error("PDF text extraction error:", error);
    
    // تنظيف الملفات المؤقتة
    await unlink(tempPdfPath).catch(() => {});
    await unlink(tempTxtPath).catch(() => {});
    
    return null;
  }
}

/**
 * استخراج النص باستخدام OCR (tesseract)
 */
async function extractTextWithOCR(pdfPath: string): Promise<string> {
  const tempImagePath = join(tmpdir(), `temp-${Date.now()}`);
  
  try {
    // تحويل PDF إلى صور
    await execAsync(`pdftoppm "${pdfPath}" "${tempImagePath}" -png`);
    
    // استخدام tesseract مع دعم العربية
    const { stdout } = await execAsync(
      `tesseract "${tempImagePath}-1.png" stdout -l ara+eng`
    );
    
    // تنظيف الصور المؤقتة
    await execAsync(`rm -f "${tempImagePath}"*.png`).catch(() => {});
    
    return stdout.trim();
  } catch (error) {
    // تنظيف الصور المؤقتة
    await execAsync(`rm -f "${tempImagePath}"*.png`).catch(() => {});
    throw error;
  }
}

/**
 * تحميل واستخراج النص من PDF
 */
export async function fetchPDFContent(url: string, title?: string, governance: FetchGovernance = {}): Promise<PDFContent | null> {
  try {
    // تحميل PDF
    const maxBytes = governance?.['maxBytes'] ? Number((governance as any)['maxBytes']) : 15 * 1024 * 1024;
    const pdfBuffer = await downloadPDF(url, governance, maxBytes);
    
    if (!pdfBuffer) {
      return null;
    }

    // استخراج النص
    const content = await extractTextFromPDF(pdfBuffer);
    
    if (!content) {
      return null;
    }

    // استخراج العنوان من URL إذا لم يُعطى
    const extractedTitle = title || extractTitleFromURL(url);

    return {
      title: extractedTitle,
      content,
      url,
      metadata: {
        fileSize: pdfBuffer.length,
        extractionMethod: content.includes("tesseract") ? "OCR" : "pdftotext",
      },
    };
  } catch (error) {
    console.error("PDF fetch error:", error);
    return null;
  }
}

/**
 * استخراج العنوان من URL
 */
function extractTitleFromURL(url: string): string {
  try {
    const urlObj = new URL(url);
    const filename = urlObj.pathname.split("/").pop() || "document";
    return filename.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
  } catch {
    return "مستند PDF";
  }
}

/**
 * جلب PDFs متعددة
 */
export async function fetchMultiplePDFs(urls: string[], governance: FetchGovernance = {}, maxItems: number = 5): Promise<PDFContent[]> {
  const results: PDFContent[] = [];
  
  for (const url of urls.slice(0, maxItems)) {
    const content = await fetchPDFContent(url, undefined, governance);
    
    if (content) {
      results.push(content);
    }
    
    // تأخير لتجنب rate limiting
    await new Promise(resolve => setTimeout(resolve, governance.rateLimitMs ?? 1000));
  }
  
  return results;
}

/**
 * تحديد الفئة بناءً على المحتوى
 */
export function determineCategory(content: string): string {
  const text = content.toLowerCase();

  if (text.includes("قانون") || text.includes("مادة") || text.includes("نظام")) {
    return "قانوني";
  }
  
  if (text.includes("فقه") || text.includes("شرع") || text.includes("حكم")) {
    return "فقهي";
  }
  
  if (text.includes("تاريخ") || text.includes("عثمان") || text.includes("مملوك")) {
    return "تاريخي";
  }

  return "عام";
}

/**
 * تحويل PDF content إلى knowledge document format
 */
export function pdfToKnowledgeDoc(pdf: PDFContent) {
  return {
    title: pdf.title,
    content: pdf.content,
    category: determineCategory(pdf.content),
    source: "PDF",
    sourceUrl: pdf.url,
    tags: extractTags(pdf.content),
    metadata: pdf.metadata,
  };
}

/**
 * استخراج tags من المحتوى
 */
function extractTags(content: string): string {
  const keywords = [
    "وقف", "أوقاف", "مسجد", "مقبرة", "القدس", "الأقصى",
    "قانون", "تشريع", "حكم", "فتوى", "ناظر", "مستحق"
  ];

  const foundTags = keywords.filter(keyword => 
    content.toLowerCase().includes(keyword)
  );

  return foundTags.join(", ");
}

/**
 * قائمة PDFs مقترحة للتحميل
 */
export const SUGGESTED_PDF_URLS = [
  // يمكن إضافة روابط PDFs هنا
  // مثال: "https://example.com/waqf-law.pdf"
];

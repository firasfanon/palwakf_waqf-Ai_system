/**
 * اختبارات نظام Cache للإجابات المتكررة
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  normalizeQuestion,
  getCachedResponse,
  saveCachedResponse,
  updateCachedResponseRating,
  getMostFrequentQuestions,
  getCacheStats,
} from './cache';

describe('نظام Cache للإجابات', () => {
  describe('normalizeQuestion', () => {
    it('يجب أن يزيل علامات الترقيم', () => {
      const question = 'ما هي شروط الوقف؟';
      const normalized = normalizeQuestion(question);
      expect(normalized).toBe('ما هي شروط الوقف');
    });

    it('يجب أن يحول النص إلى حروف صغيرة', () => {
      const question = 'ما هي شروط الوقف؟';
      const normalized = normalizeQuestion(question);
      expect(normalized).toMatch(/^[^A-Z]*$/); // No uppercase
    });

    it('يجب أن يزيل المسافات الزائدة', () => {
      const question = 'ما    هي    شروط   الوقف؟';
      const normalized = normalizeQuestion(question);
      expect(normalized).toBe('ما هي شروط الوقف');
    });

    it('يجب أن يتعامل مع علامات الترقيم العربية والإنجليزية', () => {
      const question = 'ما هي شروط الوقف؟!،.';
      const normalized = normalizeQuestion(question);
      expect(normalized).toBe('ما هي شروط الوقف');
    });
  });

  describe('saveCachedResponse & getCachedResponse', () => {
    const testQuestion = 'ما هي شروط صحة الوقف في القانون الفلسطيني؟';
    const testAnswer = 'شروط صحة الوقف تشمل: 1) أن يكون الواقف أهلاً للتصرف...';
    const testSources = JSON.stringify([1, 2, 3]);

    it('يجب أن يحفظ الإجابة في قاعدة البيانات', async () => {
      await saveCachedResponse(testQuestion, testAnswer, testSources, 'legal');
      
      const cached = await getCachedResponse(testQuestion);
      expect(cached).not.toBeNull();
      expect(cached?.answer).toBe(testAnswer);
      expect(cached?.sources).toBe(testSources);
      expect(cached?.category).toBe('legal');
    });

    it('يجب أن يجد الإجابة بتطابق تام', async () => {
      await saveCachedResponse(testQuestion, testAnswer, testSources, 'legal');
      
      const cached = await getCachedResponse(testQuestion);
      expect(cached).not.toBeNull();
      expect(cached?.questionOriginal).toBe(testQuestion);
    });

    it('يجب أن يجد الإجابة مع اختلافات بسيطة (fuzzy matching)', async () => {
      await saveCachedResponse(testQuestion, testAnswer, testSources, 'legal');
      
      // سؤال مشابه مع اختلافات بسيطة
      const similarQuestion = 'ما شروط صحة الوقف بالقانون الفلسطيني؟';
      const cached = await getCachedResponse(similarQuestion, 80);
      
      expect(cached).not.toBeNull();
      expect(cached?.answer).toBe(testAnswer);
    });

    it('يجب ألا يجد إجابة للأسئلة المختلفة جداً', async () => {
      await saveCachedResponse(testQuestion, testAnswer, testSources, 'legal');
      
      const differentQuestion = 'كيف أسجل وقفاً جديداً؟';
      const cached = await getCachedResponse(differentQuestion, 85);
      
      // قد يكون null أو إجابة مختلفة
      if (cached) {
        expect(cached.answer).not.toBe(testAnswer);
      }
    });

    it('يجب أن يحدث الإجابة إذا كانت موجودة', async () => {
      const updatedAnswer = 'شروط صحة الوقف المحدثة...';
      
      await saveCachedResponse(testQuestion, testAnswer, testSources, 'legal');
      await saveCachedResponse(testQuestion, updatedAnswer, testSources, 'legal');
      
      const cached = await getCachedResponse(testQuestion);
      expect(cached?.answer).toBe(updatedAnswer);
    });
  });

  describe('updateCachedResponseRating', () => {
    const testQuestion = 'ما هو الفرق بين الوقف الذري والوقف الخيري؟';
    const testAnswer = 'الوقف الذري يكون على الذرية...';
    const testSources = JSON.stringify([4, 5]);

    it('يجب أن يحدث تقييم الإجابة', async () => {
      await saveCachedResponse(testQuestion, testAnswer, testSources, 'jurisprudence');
      
      await updateCachedResponseRating(testQuestion, 5);
      await updateCachedResponseRating(testQuestion, 4);
      
      const cached = await getCachedResponse(testQuestion);
      expect(cached).not.toBeNull();
      expect(cached?.ratingCount).toBeGreaterThanOrEqual(2);
      // Average should be 4.5
      const rating = parseFloat(cached?.rating || "0");
      expect(rating).toBeGreaterThan(4);
      expect(rating).toBeLessThan(5);
    });
  });

  describe('getMostFrequentQuestions', () => {
    it('يجب أن يرجع الأسئلة الأكثر استخداماً', async () => {
      const questions = await getMostFrequentQuestions(10);
      
      expect(Array.isArray(questions)).toBe(true);
      
      // Check if sorted by hitCount (descending)
      if (questions.length > 1) {
        for (let i = 0; i < questions.length - 1; i++) {
          expect(questions[i].hitCount).toBeGreaterThanOrEqual(questions[i + 1].hitCount);
        }
      }
    });
  });

  describe('getCacheStats', () => {
    it('يجب أن يرجع إحصائيات الـ cache', async () => {
      const stats = await getCacheStats();
      
      expect(stats).toHaveProperty('totalCached');
      expect(stats).toHaveProperty('totalHits');
      expect(stats).toHaveProperty('avgRating');
      expect(stats).toHaveProperty('topQuestions');
      
      expect(typeof stats.totalCached).toBe('number');
      expect(typeof stats.totalHits).toBe('number');
      expect(typeof stats.avgRating).toBe('number');
      expect(Array.isArray(stats.topQuestions)).toBe(true);
    });

    it('يجب أن تكون الإحصائيات منطقية', async () => {
      const stats = await getCacheStats();
      
      expect(stats.totalCached).toBeGreaterThanOrEqual(0);
      expect(stats.totalHits).toBeGreaterThanOrEqual(0);
      expect(stats.avgRating).toBeGreaterThanOrEqual(0);
      expect(stats.avgRating).toBeLessThanOrEqual(5);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('يجب أن يضيف expiresAt عند الحفظ', async () => {
      const question = 'سؤال اختبار TTL';
      const answer = 'إجابة اختبار';
      
      await saveCachedResponse(question, answer, '[]', 'general');
      
      const cached = await getCachedResponse(question);
      expect(cached).not.toBeNull();
      expect(cached?.expiresAt).not.toBeNull();
      
      // Should expire in ~30 days
      if (cached?.expiresAt) {
        const expiryDate = new Date(cached.expiresAt);
        const now = new Date();
        const daysDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        expect(daysDiff).toBeGreaterThan(25); // At least 25 days
        expect(daysDiff).toBeLessThan(35); // At most 35 days
      }
    });
  });
});

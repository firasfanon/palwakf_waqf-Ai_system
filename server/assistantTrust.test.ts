import { describe, expect, it } from 'vitest';
import { assessKnowledgeTrust } from './assistantTrust';

const verifiedReference = { verificationStatus: 'verified' };
const verifiedCitation = [{ id: 'c1', metadataJson: { citation_verification_status: 'verified' } }];
const linkedCitation = [{ id: 'c1', metadataJson: { citation_verification_status: 'linked' } }];

describe('assistantTrust strict verified retrieval policy', () => {
  it('permits an approved public document only with a verified source and verified citation', () => {
    const result = assessKnowledgeTrust({
      title: 'تعليمات رسمية',
      status: 'approved',
      isChatEligible: true,
      authorityLevel: 'official',
      referenceDocument: verifiedReference,
      citations: verifiedCitation,
      metadataJson: { content_status: 'production', visibility_scope: 'public' },
    }, { role: 'user' });

    expect(result.allowForChat).toBe(true);
    expect(result.citationStatus).toBe('verified');
    expect(result.sourceVerificationStatus).toBe('verified');
  });

  it('denies a linked citation until a human verifies it', () => {
    const result = assessKnowledgeTrust({
      title: 'تعليمات رسمية',
      status: 'approved',
      isChatEligible: true,
      authorityLevel: 'official',
      referenceDocument: verifiedReference,
      citations: linkedCitation,
      metadataJson: { content_status: 'production', visibility_scope: 'public' },
    }, { role: 'user' });

    expect(result.allowForChat).toBe(false);
    expect(result.reasons).toContain('citation_not_human_verified');
  });

  it('denies an unverified retained source even if a citation is verified', () => {
    const result = assessKnowledgeTrust({
      title: 'مرجع بحاجة مراجعة',
      status: 'approved',
      isChatEligible: true,
      authorityLevel: 'unverified',
      citations: verifiedCitation,
      metadataJson: { content_status: 'production', visibility_scope: 'public' },
    }, { role: 'user' });

    expect(result.allowForChat).toBe(false);
    expect(result.reasons).toContain('source_authority_unverified');
    expect(result.reasons).toContain('source_not_human_verified');
  });

  it('quarantines a legacy test fixture even if it was previously approved', () => {
    const result = assessKnowledgeTrust({
      title: 'Minimal Test Document',
      status: 'approved',
      isChatEligible: true,
      authorityLevel: 'reference',
      referenceDocument: verifiedReference,
      citations: verifiedCitation,
      metadataJson: { content_status: 'production', visibility_scope: 'public' },
    }, { role: 'user' });

    expect(result.allowForChat).toBe(false);
    expect(result.reasons).toContain('legacy_test_or_quarantined_content');
  });

  it('permits an internal record only when the actor scope is granted and trust is verified', () => {
    const result = assessKnowledgeTrust({
      title: 'إجراء داخلي',
      status: 'approved',
      isChatEligible: true,
      authorityLevel: 'official',
      referenceDocument: verifiedReference,
      citations: verifiedCitation,
      metadataJson: { content_status: 'production', visibility_scope: 'internal' },
    }, { role: 'user' }, ['assistant.internal']);

    expect(result.allowForChat).toBe(true);
  });
});

/**
 * Assistant Maturity Program — phase lock.
 * Mega Batch A enables controlled human-review operations only.
 * Mapping, page-binding mutations and official release remain server-blocked until later batches.
 */
export type AssistantMaturityOperation =
  | 'controlled_review'
  | 'kb08b_mapping_mutation'
  | 'page_binding_mutation'
  | 'official_knowledge_release';

export const ASSISTANT_MATURITY_PHASE = 'MEGA_BATCH_ASSISTANT_KNOWLEDGE_SOVEREIGN_AUDIT_APPROVAL_AND_PRODUCTIVITY_ACTIVATION_V1' as const;

const OPERATION_POLICY: Record<AssistantMaturityOperation, { enabled: boolean; reason: string }> = {
  controlled_review: {
    enabled: true,
    reason: 'المراجعة البشرية المحكومة مسموحة ضمن Mega Batch A فقط.',
  },
  kb08b_mapping_mutation: {
    enabled: true,
    reason: 'KB08B Mapping مسموح فقط داخل مسار التدقيق السيادي وبعد مراجعة المراجع الفعلية.',
  },
  page_binding_mutation: {
    enabled: false,
    reason: 'تغيير عقود ربط الصفحات خارج نطاق Mega Batch A.',
  },
  official_knowledge_release: {
    enabled: true,
    reason: 'الإصدار الرسمي مسموح فقط لوثيقة تستوفي المصدر الرسمي والاستشهاد الموثق وصلاحية assistant.publish.',
  },
};

export function getAssistantMaturityPolicySnapshot() {
  return {
    phase: ASSISTANT_MATURITY_PHASE,
    operations: Object.fromEntries(
      Object.entries(OPERATION_POLICY).map(([operation, policy]) => [
        operation,
        { enabled: policy.enabled, reason: policy.reason },
      ]),
    ),
    noProductionApproval: true,
    noAutomaticChatRelease: true,
    mode: 'assistant_maturity_program_phase_lock_v1',
  };
}

export function assertAssistantMaturityOperationEnabled(operation: AssistantMaturityOperation): void {
  const policy = OPERATION_POLICY[operation];
  if (!policy.enabled) {
    throw new Error(policy.reason);
  }
}

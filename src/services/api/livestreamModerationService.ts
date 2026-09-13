import apiClient, { handleResponse } from './apiClient';
import { API_ENDPOINTS } from './endpoints';
import { requireArray, requireEnum, requireInteger, requireRecord, requireString, requireTimestamp } from './contract';
import { parseLivestreamResponse } from './livestreamService';

export type LivestreamModerationRequest =
  | { action: 'WARN' | 'FORCE_END'; reason: string; productId?: never }
  | { action: 'UNPIN'; reason: string; productId: number };

export interface LivestreamModerationReceipt {
  auditId: number;
  livestreamId: string;
  action: LivestreamModerationRequest['action'];
  productId: number | null;
  appliedAt: string;
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const livestreamModerationService = {
  async list(page = 0, size = 20) {
    requireInteger(page, 'page');
    requireInteger(size, 'size', 1);
    if (size > 100) throw new Error('Page size exceeds 100');
    const row = requireRecord(handleResponse(await apiClient.get('/api/livestreams/admin', { params: { page, size } })), 'livestream page');
    return {
      content: requireArray(row.content, 'content', parseLivestreamResponse),
      page: requireInteger(row.page, 'page'),
      size: requireInteger(row.size, 'size', 1),
      totalElements: requireInteger(row.totalElements, 'totalElements'),
      totalPages: requireInteger(row.totalPages, 'totalPages'),
    };
  },
  async moderate(id: string, request: LivestreamModerationRequest): Promise<LivestreamModerationReceipt> {
    if (!uuid.test(id)) throw new Error('Invalid livestream UUID');
    const reason = requireString(request.reason, 'reason').trim();
    if (!reason || reason.length > 1000) throw new Error('Reason must contain 1–1000 characters');
    const action = requireEnum(request.action, ['WARN', 'UNPIN', 'FORCE_END'] as const, 'action');
    const productId = action === 'UNPIN'
      ? requireInteger(request.productId, 'productId', 1)
      : null;
    if (action !== 'UNPIN' && request.productId !== undefined) throw new Error('Unexpected product target');
    const body = productId === null ? { action, reason } : { action, reason, productId };
    const row = requireRecord(handleResponse(await apiClient.post(API_ENDPOINTS.LIVESTREAM.MODERATION(id), body)), 'moderation');
    const receipt: LivestreamModerationReceipt = {
      auditId: requireInteger(row.auditId, 'auditId', 1),
      livestreamId: requireString(row.livestreamId, 'livestreamId'),
      action: requireEnum(row.action, ['WARN', 'UNPIN', 'FORCE_END'] as const, 'action'),
      productId: row.productId === null ? null : requireInteger(row.productId, 'productId', 1),
      appliedAt: requireTimestamp(row.appliedAt, 'appliedAt'),
    };
    if (receipt.livestreamId.toLowerCase() !== id.toLowerCase() || receipt.action !== action || receipt.productId !== productId) {
      throw new Error('Moderation receipt does not match requested action');
    }
    return receipt;
  },
};

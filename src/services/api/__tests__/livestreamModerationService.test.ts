import { beforeEach, expect, it, vi } from 'vitest';
import apiClient from '../apiClient';
import { livestreamModerationService } from '../livestreamModerationService';

vi.mock('../apiClient', () => ({
  default: { post: vi.fn() },
  handleResponse: (response: { data: { data: unknown } }) => response.data.data,
}));
const post = vi.mocked(apiClient.post);
const id = '00000000-0000-4000-8000-000000000001';
const audit = { auditId: 7, livestreamId: id, action: 'WARN', productId: null, appliedAt: '2026-09-13T01:00:00Z' };
beforeEach(() => { post.mockReset(); });

it('sends reason and preserves server audit identity', async () => {
  post.mockResolvedValue({ data: { data: audit } });
  await expect(livestreamModerationService.moderate(id, { action: 'WARN', reason: 'Giá hiển thị sai' })).resolves.toEqual(audit);
  expect(post).toHaveBeenCalledWith('/api/livestreams/' + id + '/moderation', { action: 'WARN', reason: 'Giá hiển thị sai' });
});
it('preserves targeted unpin receipt', async () => {
  const result = { ...audit, action: 'UNPIN', productId: 10 };
  post.mockResolvedValue({ data: { data: result } });
  await expect(livestreamModerationService.moderate(id, { action: 'UNPIN', productId: 10, reason: 'Nội dung sai' })).resolves.toEqual(result);
});
it('rejects mismatched or malformed audit acknowledgements', async () => {
  for (const fields of [
    { auditId: 0 }, { livestreamId: '00000000-0000-4000-8000-000000000002' },
    { action: 'FORCE_END' }, { appliedAt: 'invalid' }, { productId: 10 },
  ]) {
    post.mockResolvedValue({ data: { data: { ...audit, ...fields } } });
    await expect(livestreamModerationService.moderate(id, { action: 'WARN', reason: 'Kiểm tra' })).rejects.toThrow();
  }
});
it('does not send blank reasons or invalid target identifiers', async () => {
  await expect(livestreamModerationService.moderate(id, { action: 'WARN', reason: ' ' })).rejects.toThrow();
  await expect(livestreamModerationService.moderate('bad/id', { action: 'WARN', reason: 'Kiểm tra' })).rejects.toThrow();
  await expect(livestreamModerationService.moderate(id, { action: 'UNPIN', productId: 1.5, reason: 'Kiểm tra' })).rejects.toThrow();
  expect(post).not.toHaveBeenCalled();
});
it('propagates backend failure without inventing an audit', async () => {
  post.mockRejectedValue(new Error('Forbidden'));
  await expect(livestreamModerationService.moderate(id, { action: 'FORCE_END', reason: 'Vi phạm' })).rejects.toThrow('Forbidden');
});

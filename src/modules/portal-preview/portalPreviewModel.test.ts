import { describe, expect, it } from 'vitest';
import { parsePortalPreviewLocation } from './portalPreviewModel';

describe('portal preview route model', () => {
  it('defaults an unknown admin screen to the admin dashboard', () => {
    expect(parsePortalPreviewLocation('/preview/admin/not-a-screen', '')).toEqual({
      kind: 'admin',
      page: 'dashboard',
    });
  });

  it('recognizes every production portal entry that is previewable', () => {
    expect(parsePortalPreviewLocation('/preview/admin/catalog-import', '')).toEqual({
      kind: 'admin',
      page: 'catalog-import',
    });
    expect(parsePortalPreviewLocation('/preview/admin/chat', '')).toEqual({
      kind: 'admin',
      page: 'chat',
    });
    expect(parsePortalPreviewLocation('/preview/admin/livestreams', '')).toEqual({
      kind: 'admin',
      page: 'livestreams',
    });
    expect(parsePortalPreviewLocation('/preview/admin/livestream', '')).toEqual({
      kind: 'admin',
      page: 'livestreams',
    });
    expect(parsePortalPreviewLocation('/preview/restaurant/livestream', '?view=phone')).toEqual({
      kind: 'restaurant',
      page: 'livestream',
    });
  });

  it('keeps role navigation on the requested portal', () => {
    expect(parsePortalPreviewLocation('/preview/restaurant/menu', '?view=phone')).toEqual({
      kind: 'restaurant',
      page: 'menu',
    });
  });
});

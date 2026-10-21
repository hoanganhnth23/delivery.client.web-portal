import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { USER_ROLES } from '@/utils/constants';
import { buildMenuItem, buildRestaurant, buildUser } from '@/test/builders';
import {
  createAuthFake,
  createMenuFake,
  createNotificationFake,
  createRestaurantFake,
  createTestDependencies,
} from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';
import {
  parseCatalogImport,
  runCatalogImport,
} from '../import/catalogImport';

afterEach(() => {
  vi.restoreAllMocks();
});

const catalogSource = JSON.stringify({
  restaurants: [{
    restaurantKey: 'ha-noi-1',
    name: 'Bếp Hà Nội',
    address: '1 Phố Test, Hà Nội',
    phone: '0900000001',
    openingHour: '08:00:00',
    closingHour: '22:00:00',
    addressLat: 21.0285,
    addressLng: 105.8542,
  }],
  menuItems: [{
    restaurantKey: 'ha-noi-1',
    restaurantId: 999,
    name: 'Phở test',
    description: 'Món thử import',
    price: 55000,
  }],
});

describe('catalog import parser', () => {
  it('parses the Hanoi catalog fixture and preserves the expected volume', () => {
    const fixtureCandidates = [
      path.resolve(process.cwd(), 'src/test/fixtures/hanoi-catalog.json'),
      path.resolve(process.cwd(), '../data/catalog/hanoi-catalog.json'),
    ];
    const fixturePath = fixtureCandidates.find(existsSync) ?? fixtureCandidates[0];
    const source = readFileSync(fixturePath, 'utf8');

    const plan = parseCatalogImport(source);

    expect(plan.restaurants).toHaveLength(485);
    expect(plan.menuItems).toHaveLength(1940);
    expect(plan.restaurants[0].request.name).toBeTruthy();
    expect(plan.menuItems.every((item) => item.restaurantKey)).toBe(true);
  });

  it('accepts body/data wrappers, aliases time and coordinates, and rejects orphan references', () => {
    const plan = parseCatalogImport(JSON.stringify({
      body: {
        data: {
          restaurant: {
            key: 'wrapper-1',
            name: 'Quán wrapper',
            address: '2 Phố Test, Hà Nội',
            latitude: '21.02',
            longitude: '105.83',
          },
          items: {
            restaurantSlug: 'wrapper-1',
            name: 'Món wrapper',
            price: '45000',
          },
        },
      },
    }));

    expect(plan.restaurants[0].request.openingHour).toBe('08:00');
    expect(plan.restaurants[0].request.addressLat).toBe(21.02);
    expect(plan.menuItems[0].restaurantKey).toBe('wrapper-1');
    expect(() => parseCatalogImport(JSON.stringify({
      restaurants: [{ name: 'Quán hợp lệ', addressLat: 21, addressLng: 105 }],
      menuItems: [{ restaurantKey: 'missing', name: 'Món mồ côi', price: 10000 }],
    }))).toThrow(/tham chiếu restaurantKey/);
  });
});

describe('catalog import runner', () => {
  it('creates restaurants before menus and resolves a file key over a stale ID', async () => {
    const events: string[] = [];
    const createRestaurant = vi.fn(async () => {
      events.push('restaurant:create');
      return buildRestaurant({ id: 901, name: 'Bếp Hà Nội' });
    });
    const createMenuItem = vi.fn(async (data) => {
      events.push(`menu:create:${data.restaurantId}`);
      return buildMenuItem({ id: 902, restaurantId: data.restaurantId });
    });

    const result = await runCatalogImport(
      parseCatalogImport(catalogSource),
      {
        createRestaurant,
        updateRestaurant: vi.fn(),
        createMenuItem,
        updateMenuItem: vi.fn(),
      },
      'create',
    );

    expect(events).toEqual(['restaurant:create', 'menu:create:901']);
    expect(createMenuItem).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: 901 }));
    expect(result).toMatchObject({
      createdRestaurants: 1,
      createdMenuItems: 1,
      errors: [],
    });
  });

  it('updates only records carrying IDs and reports a failed record without rollback', async () => {
    const updateRestaurant = vi.fn(async () => buildRestaurant({ id: 201 }));
    const updateMenuItem = vi.fn().mockRejectedValue(new Error('Món bị khóa'));
    const plan = parseCatalogImport(JSON.stringify({
      restaurants: [{
        id: 201,
        restaurantKey: 'existing-1',
        name: 'Bếp cũ',
        addressLat: 21,
        addressLng: 105,
      }],
      menuItems: [{
        id: 301,
        restaurantKey: 'existing-1',
        name: 'Món cũ',
        price: 50000,
      }],
    }));

    const result = await runCatalogImport(
      plan,
      {
        createRestaurant: vi.fn(),
        updateRestaurant,
        createMenuItem: vi.fn(),
        updateMenuItem,
      },
      'update-existing',
    );

    expect(updateRestaurant).toHaveBeenCalledWith(201, expect.objectContaining({ name: 'Bếp cũ' }));
    expect(updateMenuItem).toHaveBeenCalledWith(301, expect.objectContaining({ restaurantId: 201 }));
    expect(result.updatedRestaurants).toBe(1);
    expect(result.updatedMenuItems).toBe(0);
    expect(result.errors).toEqual([expect.stringContaining('Món bị khóa')]);
  });
});

describe('catalog import page', () => {
  it('previews without calling APIs, then imports admin data in dependency order', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const admin = buildUser({ role: USER_ROLES.ADMIN, name: 'Admin Import' });
    const createRestaurant = vi.fn(async () => buildRestaurant({ id: 901, name: 'Bếp Hà Nội' }));
    const createMenuItem = vi.fn(async (data) => buildMenuItem({ id: 902, restaurantId: data.restaurantId }));

    renderApp({
      route: '/admin/catalog-import',
      dependencies: createTestDependencies({
        auth: createAuthFake({
          isAuthenticated: vi.fn(() => true),
          getCurrentUser: vi.fn(() => admin),
          getProfile: vi.fn(async () => admin),
        }),
        restaurant: createRestaurantFake({ createRestaurant }),
        menu: createMenuFake({ createMenuItem }),
        notifications: createNotificationFake(),
      }),
    });

    await screen.findByRole('heading', { name: 'Import nhà hàng & món ăn' });
    const sourceInput = screen.getByLabelText('JSON catalog nhà hàng và món ăn');
    fireEvent.change(sourceInput, { target: { value: catalogSource } });
    await user.click(screen.getByRole('button', { name: 'Kiểm tra dữ liệu' }));

    expect(await screen.findByText(/1 nhà hàng · 1 món ăn/)).toBeInTheDocument();
    expect(createRestaurant).not.toHaveBeenCalled();
    expect(createMenuItem).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Import dữ liệu vào backend' }));

    await waitFor(() => expect(createRestaurant).toHaveBeenCalledOnce());
    await waitFor(() => expect(createMenuItem).toHaveBeenCalledWith(expect.objectContaining({
      restaurantId: 901,
      name: 'Phở test',
    })));
    expect(await screen.findByText('Import hoàn tất, không có lỗi.')).toBeInTheDocument();
  });
});

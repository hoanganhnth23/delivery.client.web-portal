import type { CreateMenuItemRequest } from '../services/menuService';
import type { CreateRestaurantRequest } from '../services/restaurantService';
import type { MenuItem, Restaurant } from '@/types/api.types';

export type JsonRecord = Record<string, unknown>;

export interface NormalizedRestaurantImport {
  index: number;
  key: string;
  id?: number;
  request: CreateRestaurantRequest;
}

export interface NormalizedMenuImport {
  index: number;
  id?: number;
  restaurantId?: number;
  restaurantKey?: string;
  name: string;
  request: Omit<CreateMenuItemRequest, 'restaurantId'>;
}

export interface CatalogImportPlan {
  restaurants: NormalizedRestaurantImport[];
  menuItems: NormalizedMenuImport[];
  warnings: string[];
}

export type CatalogImportMode = 'create' | 'update-existing';

export interface CatalogImportProgress {
  phase: 'restaurants' | 'menuItems' | 'done';
  completed: number;
  total: number;
  label: string;
}

export interface CatalogImportResult {
  createdRestaurants: number;
  updatedRestaurants: number;
  createdMenuItems: number;
  updatedMenuItems: number;
  errors: string[];
}

export interface CatalogImportServices {
  createRestaurant: (data: CreateRestaurantRequest) => Promise<Restaurant>;
  updateRestaurant: (id: number, data: CreateRestaurantRequest) => Promise<Restaurant>;
  createMenuItem: (data: CreateMenuItemRequest) => Promise<MenuItem>;
  updateMenuItem: (id: number, data: CreateMenuItemRequest) => Promise<MenuItem>;
}

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const unwrap = (value: unknown): unknown => {
  if (!isRecord(value)) return value;
  if (isRecord(value.body)) return unwrap(value.body);
  if (isRecord(value.data)) return unwrap(value.data);
  return value;
};

const asArray = (value: unknown): unknown[] => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

const firstValue = (record: JsonRecord, keys: string[]): unknown => {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
};

const text = (value: unknown, label: string, fallback = ''): string => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${label} phải là text`);
  }
  return String(value).trim();
};

const requiredText = (value: unknown, label: string): string => {
  const result = text(value, label);
  if (!result) throw new Error(`${label} không được để trống`);
  return result;
};

const positiveInteger = (value: unknown, label: string): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${label} phải là số nguyên dương`);
  }
  return parsed;
};

const finiteNumber = (value: unknown, label: string, minimum?: number, maximum?: number): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || (minimum !== undefined && parsed < minimum) || (maximum !== undefined && parsed > maximum)) {
    const range = minimum !== undefined && maximum !== undefined ? ` trong khoảng ${minimum}–${maximum}` : '';
    throw new Error(`${label} phải là số hợp lệ${range}`);
  }
  return parsed;
};

const normalizeTime = (value: unknown, label: string, fallback: string): string => {
  const result = text(value, label, fallback);
  if (/^\d{2}:\d{2}:\d{2}$/.test(result)) return result.slice(0, 5);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(result)) {
    throw new Error(`${label} phải có dạng HH:mm`);
  }
  return result;
};

const unwrapRoot = (source: string): unknown => {
  try {
    return unwrap(JSON.parse(source) as unknown);
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('Nội dung import không phải JSON hợp lệ');
    throw error;
  }
};

const readArrays = (root: unknown): { restaurants: unknown[]; menuItems: unknown[] } => {
  if (Array.isArray(root)) {
    const looksLikeMenu = root.some(
      (item) => isRecord(item) && (item.price !== undefined || item.restaurantId !== undefined),
    );
    return looksLikeMenu ? { restaurants: [], menuItems: root } : { restaurants: root, menuItems: [] };
  }
  if (!isRecord(root)) throw new Error('File import phải là object catalog hoặc array record');

  const restaurants = asArray(firstValue(root, ['restaurants', 'restaurant']));
  const menuItems = asArray(firstValue(root, ['menuItems', 'menu', 'items']));
  if (!restaurants.length && !menuItems.length) {
    throw new Error('File import cần có restaurants hoặc menuItems');
  }
  return { restaurants, menuItems };
};

const normalizeRestaurant = (value: unknown, index: number): NormalizedRestaurantImport => {
  if (!isRecord(value)) throw new Error(`restaurants[${index}] phải là object`);
  const key = text(firstValue(value, ['restaurantKey', 'key', 'slug']), `restaurants[${index}].restaurantKey`, `restaurant-${index + 1}`);
  const request: CreateRestaurantRequest = {
    name: requiredText(value.name, `restaurants[${index}].name`),
    address: text(value.address, `restaurants[${index}].address`),
    phone: text(value.phone, `restaurants[${index}].phone`),
    openingHour: normalizeTime(value.openingHour, `restaurants[${index}].openingHour`, '08:00'),
    closingHour: normalizeTime(value.closingHour, `restaurants[${index}].closingHour`, '22:00'),
    image: text(value.image, `restaurants[${index}].image`),
    addressLat: finiteNumber(firstValue(value, ['addressLat', 'latitude']), `restaurants[${index}].addressLat`, 8, 24),
    addressLng: finiteNumber(firstValue(value, ['addressLng', 'longitude']), `restaurants[${index}].addressLng`, 102, 110),
    description: text(value.description, `restaurants[${index}].description`),
  };
  const id = positiveInteger(value.id, `restaurants[${index}].id`);
  return { index, key, ...(id ? { id } : {}), request };
};

const normalizeMenuItem = (value: unknown, index: number): NormalizedMenuImport => {
  if (!isRecord(value)) throw new Error(`menuItems[${index}] phải là object`);
  const restaurantId = positiveInteger(value.restaurantId, `menuItems[${index}].restaurantId`);
  const restaurantKey = text(
    firstValue(value, ['restaurantKey', 'restaurant_key', 'restaurantSlug']),
    `menuItems[${index}].restaurantKey`,
  ) || undefined;
  if (!restaurantId && !restaurantKey) {
    throw new Error(`menuItems[${index}] cần restaurantId hoặc restaurantKey`);
  }
  const id = positiveInteger(value.id, `menuItems[${index}].id`);
  return {
    index,
    ...(id ? { id } : {}),
    ...(restaurantId ? { restaurantId } : {}),
    ...(restaurantKey ? { restaurantKey } : {}),
    name: requiredText(value.name, `menuItems[${index}].name`),
    request: {
      name: requiredText(value.name, `menuItems[${index}].name`),
      description: text(value.description, `menuItems[${index}].description`),
      price: finiteNumber(value.price, `menuItems[${index}].price`, 0.01, 10_000_000),
      image: text(value.image, `menuItems[${index}].image`),
    },
  };
};

export const parseCatalogImport = (source: string): CatalogImportPlan => {
  const root = unwrapRoot(source);
  const arrays = readArrays(root);
  const errors: string[] = [];
  const restaurants: NormalizedRestaurantImport[] = [];
  const menuItems: NormalizedMenuImport[] = [];

  arrays.restaurants.forEach((value, index) => {
    try {
      restaurants.push(normalizeRestaurant(value, index));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `restaurants[${index}] không hợp lệ`);
    }
  });
  arrays.menuItems.forEach((value, index) => {
    try {
      menuItems.push(normalizeMenuItem(value, index));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : `menuItems[${index}] không hợp lệ`);
    }
  });

  const keys = new Set<string>();
  for (const restaurant of restaurants) {
    if (keys.has(restaurant.key)) errors.push(`restaurantKey bị trùng: ${restaurant.key}`);
    keys.add(restaurant.key);
  }
  const knownKeys = new Set(restaurants.map((restaurant) => restaurant.key));
  for (const item of menuItems) {
    if (item.restaurantKey && !knownKeys.has(item.restaurantKey) && !item.restaurantId) {
      errors.push(`menuItems[${item.index}] tham chiếu restaurantKey không có trong file: ${item.restaurantKey}`);
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));

  const warnings: string[] = [];
  if (restaurants.some((restaurant) => !restaurant.id)) {
    warnings.push('Nhà hàng không có id sẽ được tạo mới; import lại ở chế độ tạo mới sẽ tạo bản ghi trùng.');
  }
  if (menuItems.some((item) => !item.id)) {
    warnings.push('Món ăn không có id sẽ được tạo mới; không tự ghép món theo tên.');
  }
  if (menuItems.some((item) => item.restaurantKey)) {
    warnings.push('restaurantKey sẽ được nối với id trả về sau bước tạo/cập nhật nhà hàng.');
  }
  return { restaurants, menuItems, warnings };
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return 'API trả về lỗi không xác định';
};

export const runCatalogImport = async (
  plan: CatalogImportPlan,
  services: CatalogImportServices,
  mode: CatalogImportMode,
  onProgress?: (progress: CatalogImportProgress) => void,
): Promise<CatalogImportResult> => {
  const result: CatalogImportResult = {
    createdRestaurants: 0,
    updatedRestaurants: 0,
    createdMenuItems: 0,
    updatedMenuItems: 0,
    errors: [],
  };
  const restaurantIds = new Map<string, number>();

  for (const [position, restaurant] of plan.restaurants.entries()) {
    onProgress?.({
      phase: 'restaurants',
      completed: position,
      total: plan.restaurants.length,
      label: restaurant.request.name,
    });
    try {
      const saved = mode === 'update-existing' && restaurant.id
        ? await services.updateRestaurant(restaurant.id, restaurant.request)
        : await services.createRestaurant(restaurant.request);
      restaurantIds.set(restaurant.key, saved.id);
      if (mode === 'update-existing' && restaurant.id) result.updatedRestaurants += 1;
      else result.createdRestaurants += 1;
    } catch (error) {
      result.errors.push(`Nhà hàng #${restaurant.index + 1} “${restaurant.request.name}”: ${errorMessage(error)}`);
    }
  }

  for (const [position, item] of plan.menuItems.entries()) {
    onProgress?.({
      phase: 'menuItems',
      completed: position,
      total: plan.menuItems.length,
      label: item.name,
    });
    // When both are present, the file-local key is authoritative. This keeps a
    // create-mode import from accidentally attaching a menu to an old backend ID.
    const restaurantId = item.restaurantKey
      ? restaurantIds.get(item.restaurantKey)
      : item.restaurantId;
    if (!restaurantId) {
      result.errors.push(`Món #${item.index + 1} “${item.name}” bị bỏ qua: không resolve được restaurantId`);
      continue;
    }
    const request: CreateMenuItemRequest = { restaurantId, ...item.request };
    try {
      if (mode === 'update-existing' && item.id) {
        await services.updateMenuItem(item.id, request);
        result.updatedMenuItems += 1;
      } else {
        await services.createMenuItem(request);
        result.createdMenuItems += 1;
      }
    } catch (error) {
      result.errors.push(`Món #${item.index + 1} “${item.name}”: ${errorMessage(error)}`);
    }
  }

  onProgress?.({
    phase: 'done',
    completed: plan.restaurants.length + plan.menuItems.length,
    total: plan.restaurants.length + plan.menuItems.length,
    label: result.errors.length ? 'Import hoàn tất một phần' : 'Import hoàn tất',
  });
  return result;
};

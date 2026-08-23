import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AppDependenciesProvider,
  type AppDependencies,
} from '@/app/dependencies';
import { USER_ROLES } from '@/utils/constants';
import { buildMenuItem, buildRestaurant, buildUser } from '@/test/builders';
import {
  createAuthFake,
  createMenuFake,
  createRestaurantFake,
  createSessionStoreFake,
  createTestDependencies,
} from '@/test/createTestDependencies';
import { renderApp } from '@/test/renderApp';
import RestaurantForm from '../components/RestaurantForm';
import { RestaurantProvider, useRestaurant } from '../hooks/useRestaurant';

function ownerDependencies(
  overrides: Partial<Pick<AppDependencies, 'menu' | 'restaurant' | 'sessionStore'>> = {},
) {
  const owner = buildUser({ role: USER_ROLES.RESTAURANT_OWNER });
  return createTestDependencies({
    auth: createAuthFake({
      isAuthenticated: vi.fn(() => true),
      getCurrentUser: vi.fn(() => owner),
      getProfile: vi.fn(async () => owner),
    }),
    restaurant: createRestaurantFake(),
    sessionStore: createSessionStoreFake({
      hasToken: vi.fn(() => true),
      getCurrentRestaurantId: vi.fn(() => 201),
    }),
    ...overrides,
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function RestaurantError() {
  const { error } = useRestaurant();
  return error ? <div role="alert">{error}</div> : null;
}

function renderCreateRestaurantForm(
  restaurant: ReturnType<typeof createRestaurantFake>,
  onSuccess = vi.fn(),
) {
  const dependencies = createTestDependencies({
    restaurant,
    sessionStore: createSessionStoreFake(),
  });
  render(
    <MemoryRouter>
      <AppDependenciesProvider dependencies={dependencies}>
        <RestaurantProvider>
          <RestaurantError />
          <RestaurantForm onSuccess={onSuccess} />
        </RestaurantProvider>
      </AppDependenciesProvider>
    </MemoryRouter>,
  );
  return { dependencies, onSuccess };
}

async function fillRequiredRestaurantFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Tên nhà hàng/), 'Bếp hành vi');
  await user.type(screen.getByLabelText(/Địa chỉ/), '1 Đường Test, TP.HCM');
  await user.type(screen.getByLabelText(/Vĩ độ/), '10.7769');
  await user.type(screen.getByLabelText(/Kinh độ/), '106.7009');
  await user.type(screen.getByLabelText(/Số điện thoại/), '0900000001');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('restaurant profile actions', () => {
  it('prefills the restaurant form from a pasted JSON fixture', async () => {
    const user = userEvent.setup();
    const createRestaurant = vi.fn();
    renderCreateRestaurantForm(createRestaurantFake({ createRestaurant }));

    await user.click(screen.getByText('Nạp JSON fixture'));
    fireEvent.change(screen.getByLabelText('JSON fixture nhà hàng'), { target: { value: JSON.stringify({
      name: 'Quán JSON',
      address: '1 Đường Fixture, TP.HCM',
      phone: '0900000002',
      openingHour: '09:30:00',
      closingHour: '21:45:00',
      addressLat: 10.777,
      addressLng: 106.701,
      description: 'Dữ liệu từ file JSON',
    }) } });
    await user.click(screen.getByRole('button', { name: 'Nạp vào form' }));

    expect(screen.getByLabelText(/Tên nhà hàng/)).toHaveValue('Quán JSON');
    expect(screen.getByLabelText(/Địa chỉ/)).toHaveValue('1 Đường Fixture, TP.HCM');
    expect(screen.getByLabelText(/Số điện thoại/)).toHaveValue('0900000002');
    expect(screen.getByLabelText(/Giờ mở cửa/)).toHaveValue('09:30');
    expect(screen.getByLabelText(/Giờ đóng cửa/)).toHaveValue('21:45');
    expect(screen.getByLabelText(/Vĩ độ/)).toHaveValue(10.777);
    expect(screen.getByLabelText(/Kinh độ/)).toHaveValue(106.701);
    expect(createRestaurant).not.toHaveBeenCalled();
  });

  it('validates the create form before calling the injected service', async () => {
    const user = userEvent.setup();
    const createRestaurant = vi.fn();
    renderCreateRestaurantForm(createRestaurantFake({ createRestaurant }));

    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    expect(createRestaurant).not.toHaveBeenCalled();
    expect(screen.getByText('Tên nhà hàng không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Địa chỉ không được để trống')).toBeInTheDocument();
    expect(screen.getByText('Số điện thoại không được để trống')).toBeInTheDocument();
    expect(screen.getByText(/Vĩ độ phải nằm/)).toBeInTheDocument();
    expect(screen.getByText(/Kinh độ phải nằm/)).toBeInTheDocument();
  });

  it('creates once, exposes loading and forwards the canonical payload', async () => {
    const user = userEvent.setup();
    const pending = deferred<ReturnType<typeof buildRestaurant>>();
    const createRestaurant = vi.fn(() => pending.promise);
    const onSuccess = vi.fn();
    renderCreateRestaurantForm(createRestaurantFake({ createRestaurant }), onSuccess);
    await fillRequiredRestaurantFields(user);

    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    await waitFor(() => expect(createRestaurant).toHaveBeenCalledOnce());
    const loadingButton = screen.getByRole('button', { name: /Đang xử lý/ });
    expect(loadingButton).toBeDisabled();
    await user.click(loadingButton);
    expect(createRestaurant).toHaveBeenCalledOnce();

    pending.resolve(buildRestaurant({ name: 'Bếp hành vi' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(createRestaurant).toHaveBeenCalledWith({
      name: 'Bếp hành vi',
      address: '1 Đường Test, TP.HCM',
      phone: '0900000001',
      openingHour: '08:00',
      closingHour: '22:00',
      image: '',
      addressLat: 10.7769,
      addressLng: 106.7009,
      description: '',
    });
  });

  it('updates the loaded profile and keeps the form available after an error', async () => {
    const user = userEvent.setup();
    const current = buildRestaurant();
    const updated = buildRestaurant({ name: 'Bếp đã cập nhật' });
    const getMyRestaurants = vi.fn(async () => [updated]);
    const updateRestaurant = vi
      .fn()
      .mockRejectedValueOnce({ response: { data: { message: 'Tên đã tồn tại' } } })
      .mockResolvedValueOnce(updated);
    const restaurant = createRestaurantFake({
      getMyRestaurants: vi.fn().mockResolvedValueOnce([current]).mockImplementation(getMyRestaurants),
      updateRestaurant,
    });

    renderApp({
      route: '/restaurant/profile',
      dependencies: ownerDependencies({ restaurant }),
    });

    const nameInput = await screen.findByLabelText(/Tên nhà hàng/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Bếp đã cập nhật');
    await user.click(screen.getByRole('button', { name: 'Cập nhật' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tên đã tồn tại');
    expect(screen.getByRole('button', { name: 'Cập nhật' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cập nhật' }));
    await waitFor(() => expect(updateRestaurant).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(getMyRestaurants).toHaveBeenCalled());
    expect(updateRestaurant).toHaveBeenLastCalledWith(
      201,
      expect.objectContaining({ name: 'Bếp đã cập nhật' }),
    );
  });
});

describe('menu management actions', () => {
  it('prefills a menu form from a pasted JSON fixture', async () => {
    const user = userEvent.setup();
    renderApp({
      route: '/restaurant/menu',
      dependencies: ownerDependencies({
        menu: createMenuFake({ getMyMenuItems: vi.fn().mockResolvedValue([]) }),
      }),
    });

    await user.click(await screen.findByRole('button', { name: 'Thêm món' }));
    await user.click(screen.getByText('Nạp JSON fixture'));
    fireEvent.change(screen.getByLabelText('JSON fixture món ăn'), { target: { value: JSON.stringify({
      name: 'Món JSON',
      description: 'Mô tả JSON',
      price: 65000,
    }) } });
    await user.click(screen.getByRole('button', { name: 'Nạp vào form' }));

    expect(screen.getByLabelText(/Tên món ăn/)).toHaveValue('Món JSON');
    expect(screen.getByLabelText('Mô tả')).toHaveValue('Mô tả JSON');
    expect(screen.getByLabelText(/Giá/)).toHaveValue(65000);
  });

  it('creates a menu item through the dialog and refreshes the backend list', async () => {
    const user = userEvent.setup();
    const current = buildMenuItem();
    const created = buildMenuItem({ id: 302, name: 'Phở test', price: 70_000 });
    const getMyMenuItems = vi
      .fn()
      .mockResolvedValueOnce([current])
      .mockResolvedValue([created, current]);
    const createMenuItem = vi.fn(async () => created);

    renderApp({
      route: '/restaurant/menu',
      dependencies: ownerDependencies({
        menu: createMenuFake({ getMyMenuItems, createMenuItem }),
      }),
    });

    await user.click(await screen.findByRole('button', { name: 'Thêm món' }));
    expect(screen.getByRole('dialog', { name: 'Thêm món ăn mới' })).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Tên món ăn/), 'Phở test');
    await user.type(screen.getByLabelText(/Giá/), '70000');
    await user.type(screen.getByLabelText('Mô tả'), 'Phở fixture');
    await user.click(screen.getByRole('button', { name: 'Tạo mới' }));

    await waitFor(() => {
      expect(createMenuItem).toHaveBeenCalledWith({
        restaurantId: 201,
        name: 'Phở test',
        description: 'Phở fixture',
        price: 70_000,
        image: '',
      });
    });
    await waitFor(() => expect(getMyMenuItems).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Phở test')).toBeInTheDocument();
  });

  it('searches, updates and deletes menu items through public controls', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    const rice = buildMenuItem();
    const pho = buildMenuItem({ id: 302, name: 'Phở test', description: 'Nước dùng' });
    const updatedRice = buildMenuItem({ name: 'Cơm mới' });
    const getMyMenuItems = vi
      .fn()
      .mockResolvedValueOnce([rice, pho])
      .mockResolvedValueOnce([updatedRice, pho])
      .mockResolvedValue([pho]);
    const updateMenuItem = vi.fn(async () => updatedRice);
    const deleteMenuItem = vi.fn(async () => undefined);

    renderApp({
      route: '/restaurant/menu',
      dependencies: ownerDependencies({
        menu: createMenuFake({ getMyMenuItems, updateMenuItem, deleteMenuItem }),
      }),
    });

    const search = await screen.findByPlaceholderText('Tìm kiếm món ăn...');
    await user.type(search, 'phở');
    await user.keyboard('{Enter}');
    expect(screen.queryByText('Cơm test')).not.toBeInTheDocument();
    expect(screen.getByText('Phở test')).toBeInTheDocument();
    await user.clear(search);
    await user.keyboard('{Enter}');

    const riceCard = screen.getByText('Cơm test').closest('article');
    expect(riceCard).not.toBeNull();
    await user.click(within(riceCard!).getByRole('button', { name: 'Sửa Cơm test' }));
    const nameInput = screen.getByLabelText(/Tên món ăn/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Cơm mới');
    await user.click(screen.getByRole('button', { name: 'Cập nhật' }));

    await waitFor(() => expect(updateMenuItem).toHaveBeenCalledWith(
      301,
      expect.objectContaining({ name: 'Cơm mới', restaurantId: 201 }),
    ));
    expect(await screen.findByText('Cơm mới')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Xóa Cơm mới' }));
    await waitFor(() => expect(deleteMenuItem).toHaveBeenCalledWith(301));
    await waitFor(() => expect(screen.queryByText('Cơm mới')).not.toBeInTheDocument());
    expect(window.alert).toHaveBeenCalledWith('Xóa món ăn thành công!');
  });

  it('keeps an existing item editable when a mutation fails, then retries', async () => {
    const user = userEvent.setup();
    const current = buildMenuItem();
    const updated = buildMenuItem({ name: 'Cơm retry' });
    const updateMenuItem = vi
      .fn()
      .mockRejectedValueOnce({ response: { data: { message: 'Món đang bị khóa' } } })
      .mockResolvedValueOnce(updated);
    const getMyMenuItems = vi
      .fn()
      .mockResolvedValueOnce([current])
      .mockResolvedValue([updated]);

    renderApp({
      route: '/restaurant/menu',
      dependencies: ownerDependencies({
        menu: createMenuFake({ getMyMenuItems, updateMenuItem }),
      }),
    });

    const card = (await screen.findByText('Cơm test')).closest('article');
    await user.click(within(card!).getByRole('button', { name: 'Sửa Cơm test' }));
    const nameInput = screen.getByLabelText(/Tên món ăn/);
    await user.clear(nameInput);
    await user.type(nameInput, 'Cơm retry');
    await user.click(screen.getByRole('button', { name: 'Cập nhật' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Món đang bị khóa');
    expect(screen.getByRole('dialog', { name: 'Chỉnh sửa món ăn' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Cập nhật' }));

    await waitFor(() => expect(updateMenuItem).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Cơm retry')).toBeInTheDocument();
  });

  it('offers an explicit retry when the initial menu load fails', async () => {
    const user = userEvent.setup();
    const getMyMenuItems = vi
      .fn()
      .mockRejectedValueOnce({ response: { data: { message: 'Mất kết nối menu' } } })
      .mockResolvedValueOnce([buildMenuItem()]);

    renderApp({
      route: '/restaurant/menu',
      dependencies: ownerDependencies({
        menu: createMenuFake({ getMyMenuItems }),
      }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Mất kết nối menu');
    await user.click(screen.getByRole('button', { name: 'Thử lại' }));

    expect(await screen.findByText('Cơm test')).toBeInTheDocument();
    expect(getMyMenuItems).toHaveBeenCalledTimes(2);
  });
});

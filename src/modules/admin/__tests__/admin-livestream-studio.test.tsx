import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { USER_ROLES } from "@/utils/constants";
import { buildMenuItem, buildRestaurant, buildUser } from "@/test/builders";
import {
  createAuthFake,
  createLivestreamHostFake,
  createMenuFake,
  createRestaurantFake,
  createTestDependencies,
} from "@/test/createTestDependencies";
import { renderApp } from "@/test/renderApp";
import type {
  Livestream,
  LivestreamProduct,
} from "@/services/api/livestreamService";
import type { LivestreamMediaPort } from "@/services/media/livestreamMedia";

const room: Livestream = {
  id: "00000000-0000-4000-8000-000000000021",
  sellerId: 900,
  restaurantId: 42,
  title: "Phiên Admin",
  status: "CREATED",
  streamProvider: "AGORA",
  description: null,
  roomId: "room-admin",
  channelName: "channel-admin",
  startedAt: null,
  endedAt: null,
  viewCount: 0,
  createdAt: "2026-09-14T00:00:00Z",
  updatedAt: "2026-09-14T00:00:00Z",
  pinnedProducts: [],
};
const restaurants = [
  buildRestaurant({ id: 42, name: "Quán A" }),
  buildRestaurant({ id: 43, name: "Quán B" }),
];
const menuItems = [
  buildMenuItem({ id: 501, restaurantId: 42, name: "Món A", price: 50000 }),
  buildMenuItem({ id: 502, restaurantId: 42, name: "Món B", price: 70000 }),
];

function dependencies() {
  const admin = buildUser({ id: 900, role: USER_ROLES.ADMIN });
  const start = vi.fn(async () => ({
    livestreamId: room.id,
    channelName: room.channelName,
    status: "LIVE" as const,
    token: "host-token",
    uid: 900,
    role: "HOST" as const,
    tokenExpiresAt: "2026-09-14T01:00:00Z",
    title: room.title,
    restaurantId: room.restaurantId,
    startedAt: "2026-09-14T00:00:00Z",
  }));
  const renewToken = vi.fn(async () => "renewed");
  const publisherStart = vi.fn(async (_session: unknown) => undefined);
  const media: LivestreamMediaPort = {
    mode: "runtime",
    createPublisher: vi.fn(() => ({
      start: publisherStart,
      setMicrophoneEnabled: vi.fn(async () => undefined),
      setCameraEnabled: vi.fn(async () => undefined),
      stop: vi.fn(async () => undefined),
    })),
    createViewer: vi.fn(),
  };
  return {
    start,
    renewToken,
    publisherStart,
    media,
    deps: createTestDependencies({
      auth: createAuthFake({
        isAuthenticated: () => true,
        getCurrentUser: () => admin,
        getProfile: async () => admin,
      }),
      restaurant: createRestaurantFake({
        getAllRestaurants: vi.fn(async () => restaurants),
      }),
      menu: createMenuFake({
        getMenuItemsByRestaurant: vi.fn(async () => menuItems),
      }),
      livestreamHost: createLivestreamHostFake({
        inspect: vi.fn(async () => [room]),
        start,
        renewToken,
      }),
      livestreamMedia: media,
    }),
  };
}

it("creates an Agora room for the selected restaurant and starts HOST publishing with renewal", async () => {
  const user = userEvent.setup();
  const fixture = dependencies();
  const create = vi.fn(async (request) => ({
    ...room,
    id: "00000000-0000-4000-8000-000000000022",
    title: request.title,
    restaurantId: request.restaurantId,
    sellerId: 900,
  }));
  fixture.deps.livestreamHost.create = create;
  renderApp({ route: "/admin/livestreams", dependencies: fixture.deps });
  await user.click(await screen.findByRole("tab", { name: "Host studio" }));
  await user.type(
    screen.getByLabelText("Tiêu đề host livestream"),
    "Live quán A",
  );
  await user.click(screen.getByRole("button", { name: "Tạo phiên Agora" }));
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith({
      title: "Live quán A",
      restaurantId: 42,
      streamProvider: "AGORA",
    }),
  );
  await user.click(screen.getByRole("button", { name: "Bắt đầu phát" }));
  await waitFor(() =>
    expect(fixture.start).toHaveBeenCalledWith(expect.any(String)),
  );
  await waitFor(() =>
    expect(fixture.publisherStart).toHaveBeenCalledWith(
      expect.objectContaining({ role: "HOST" }),
    ),
  );
  const session = fixture.publisherStart.mock.calls[0][0] as unknown as {
    renewToken?: () => Promise<string>;
  };
  await expect(session.renewToken?.()).resolves.toBe("renewed");
  expect(fixture.renewToken).toHaveBeenCalledWith(expect.any(String), {
    channelName: room.channelName,
    uid: 900,
    role: "HOST",
  });
});

it("pins multiple products with positive host-entered prices and preserves failed pin state", async () => {
  const user = userEvent.setup();
  const fixture = dependencies();
  const pinProduct = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockImplementation(
      async (
        id: string,
        request: { productId: number; priceAtLive: number },
      ): Promise<LivestreamProduct> => ({
        id: request.productId,
        livestreamId: id,
        productId: request.productId,
        productName: `Món ${request.productId}`,
        productImage: null,
        restaurantId: 42,
        restaurantName: "Quán A",
        priceAtLive: request.priceAtLive,
        isPinned: true,
        createdAt: room.createdAt,
        pinnedAt: room.createdAt,
      }),
    );
  fixture.deps.livestreamHost.pinProduct = pinProduct;
  renderApp({ route: "/admin/livestreams", dependencies: fixture.deps });
  await user.click(await screen.findByRole("tab", { name: "Host studio" }));
  const priceA = await screen.findByLabelText("Giá live Món A");
  await user.type(priceA, "42000");
  await user.click(screen.getAllByRole("button", { name: "Ghim" })[0]);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Không thể ghim Món A",
  );
  await user.click(screen.getAllByRole("button", { name: "Ghim" })[0]);
  await screen.findByRole("button", { name: "Bỏ ghim" });
  const priceB = screen.getByLabelText("Giá live Món B");
  await user.type(priceB, "55000");
  await user.click(screen.getByRole("button", { name: /^Ghim$/ }));
  await waitFor(() =>
    expect(pinProduct).toHaveBeenLastCalledWith(room.id, {
      productId: 502,
      priceAtLive: 55000,
    }),
  );
  expect(pinProduct).toHaveBeenCalledWith(room.id, {
    productId: 501,
    priceAtLive: 42000,
  });
});

it("disables host mutation controls for a room owned by another seller", async () => {
  const user = userEvent.setup();
  const fixture = dependencies();
  fixture.deps.livestreamHost.inspect = vi.fn(async () => [
    { ...room, sellerId: 777 },
  ]);
  renderApp({ route: "/admin/livestreams", dependencies: fixture.deps });
  await user.click(await screen.findByRole("tab", { name: "Host studio" }));
  expect(await screen.findByText(/thuộc Host khác/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Bắt đầu phát" })).toBeDisabled();
  expect(screen.getAllByRole("button", { name: "Ghim" })[0]).toBeDisabled();
});

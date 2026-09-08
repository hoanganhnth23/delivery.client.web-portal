import catalog from "./catalog.json";
export { catalog };
export type Restaurant = (typeof catalog)[number];
export type Item = Restaurant["items"][number];
export type Address = {
  id: number;
  label: string;
  name: string;
  phone: string;
  line: string;
  isDefault: boolean;
};
export type Line = { item: Item; quantity: number; note: string };
export type MockOrder = {
  id: number;
  restaurantId: number;
  lines: Line[];
  address: Address;
  total: number;
  status: string;
  note: string;
};
export type State = {
  addresses: Address[];
  homeId: number;
  checkoutId: number | null;
  restaurantId: number | null;
  lines: Line[];
  orders: MockOrder[];
  voucher: boolean;
  note: string;
};
export const initialState = (): State => ({
  addresses: [
    {
      id: 1,
      label: "Nhà riêng",
      name: "Khách trải nghiệm",
      phone: "0900000000",
      line: "12 Tràng Thi, Hoàn Kiếm, Hà Nội",
      isDefault: true,
    },
    {
      id: 2,
      label: "Văn phòng",
      name: "Khách trải nghiệm",
      phone: "0900000000",
      line: "35 Lê Văn Lương, Thanh Xuân, Hà Nội",
      isDefault: false,
    },
  ],
  homeId: 1,
  checkoutId: null,
  restaurantId: null,
  lines: [],
  orders: [],
  voucher: false,
  note: "",
});
export const subtotal = (s: State) =>
  s.lines.reduce((v, l) => v + l.item.price * l.quantity, 0);
export const total = (s: State) =>
  subtotal(s) + 15000 - (s.voucher ? 15000 : 0);
export const deliveryStages = ["Chờ xác nhận", "Quán đang chuẩn bị", "Tài xế đến quán", "Đang giao", "Đã giao"];
export const orderStatuses = [...deliveryStages, "Đã hủy"];
export const previewInitialState = (): State => {
  const state = initialState();
  state.orders = orderStatuses.map((status, index) => {
    const restaurant = catalog[index % catalog.length];
    const lines = [{ item: restaurant.items[0], quantity: 1, note: "Ít cay" }, { item: restaurant.items[2], quantity: 1, note: "" }];
    return { id: 1001 + index, restaurantId: restaurant.id, lines, address: { ...state.addresses[index % 2] }, total: lines.reduce((sum, line) => sum + line.item.price, 15000), status, note: "Gọi khi đến nơi" };
  });
  return state;
};
export type Action =
  | {
      type: "add";
      restaurantId: number;
      item: Item;
      quantity: number;
      note: string;
      replace?: boolean;
    }
  | { type: "quantity"; id: number; quantity: number }
  | { type: "beginCheckout" }
  | { type: "selectAddress"; context: "home" | "checkout"; id: number }
  | { type: "saveAddress"; address: Address }
  | { type: "deleteAddress"; id: number }
  | { type: "voucher"; enabled: boolean }
  | { type: "note"; note: string }
  | { type: "place" }
  | { type: "status"; id: number; status: string }
  | { type: "reset" };
export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "reset":
      return previewInitialState();
    case "add": {
      if (s.lines.length && s.restaurantId !== a.restaurantId && !a.replace)
        return s;
      const lines = s.restaurantId === a.restaurantId ? [...s.lines] : [];
      const index = lines.findIndex((l) => l.item.id === a.item.id);
      const line = {
        item: a.item,
        quantity: Math.max(
          1,
          Math.min(99, a.quantity + (index >= 0 ? lines[index].quantity : 0)),
        ),
        note: a.note,
      };
      if (index >= 0) lines[index] = line;
      else lines.push(line);
      return { ...s, restaurantId: a.restaurantId, lines };
    }
    case "quantity":
      return {
        ...s,
        lines: s.lines
          .map((l) =>
            l.item.id === a.id
              ? { ...l, quantity: Math.min(99, a.quantity) }
              : l,
          )
          .filter((l) => l.quantity > 0),
      };
    case "beginCheckout":
      return { ...s, checkoutId: s.homeId, voucher: false, note: "" };
    case "selectAddress":
      return s.addresses.some((v) => v.id === a.id)
        ? { ...s, [a.context === "home" ? "homeId" : "checkoutId"]: a.id }
        : s;
    case "saveAddress": {
      let addresses = [
        ...s.addresses.filter((v) => v.id !== a.address.id),
        a.address,
      ];
      if (a.address.isDefault)
        addresses = addresses.map((v) => ({
          ...v,
          isDefault: v.id === a.address.id,
        }));
      return { ...s, addresses, homeId: s.homeId || a.address.id };
    }
    case "deleteAddress": {
      const addresses = s.addresses.filter((v) => v.id !== a.id);
      const fallback =
        addresses.find((v) => v.isDefault)?.id ?? addresses[0]?.id ?? 0;
      return {
        ...s,
        addresses,
        homeId: s.homeId === a.id ? fallback : s.homeId,
        checkoutId: s.checkoutId === a.id ? fallback : s.checkoutId,
      };
    }
    case "voucher":
      return { ...s, voucher: a.enabled };
    case "note":
      return { ...s, note: a.note };
    case "place": {
      const address = s.addresses.find(
        (v) => v.id === (s.checkoutId ?? s.homeId),
      );
      if (!s.lines.length || !s.restaurantId || !address) return s;
      const order = {
        id: s.orders.length + 1001,
        restaurantId: s.restaurantId,
        lines: s.lines.map((l) => ({ ...l })),
        address: { ...address },
        total: total(s),
        status: "Chờ xác nhận",
        note: s.note,
      };
      return {
        ...s,
        orders: [order, ...s.orders],
        lines: [],
        checkoutId: null,
        voucher: false,
        note: "",
      };
    }
    case "status":
      return {
        ...s,
        orders: s.orders.map((o) =>
          o.id === a.id ? { ...o, status: a.status } : o,
        ),
      };
  }
}

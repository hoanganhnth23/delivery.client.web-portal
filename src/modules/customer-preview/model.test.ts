import { describe, expect, it } from "vitest";
import { catalog, initialState, reducer, type State } from "./model";
const cart = (): State =>
  reducer(initialState(), {
    type: "add",
    restaurantId: 1,
    item: catalog[0].items[0],
    quantity: 2,
    note: "Ít hành",
  });
describe("isolated customer preview", () => {
  it("keeps home selection separate from checkout and resets for the next order", () => {
    let s = reducer(cart(), { type: "selectAddress", context: "home", id: 2 });
    s = reducer(s, { type: "beginCheckout" });
    expect(s.checkoutId).toBe(2);
    s = reducer(s, { type: "selectAddress", context: "checkout", id: 1 });
    expect(s.homeId).toBe(2);
    s = reducer(s, { type: "place" });
    expect(s.orders[0].address.id).toBe(1);
    expect(reducer(s, { type: "beginCheckout" }).checkoutId).toBe(2);
  });
  it("changes the default label without changing the home selection", () => {
    const s = initialState();
    const next = reducer(s, {
      type: "saveAddress",
      address: { ...s.addresses[1], isDefault: true },
    });
    expect(next.homeId).toBe(1);
    expect(next.addresses.filter((a) => a.isDefault).map((a) => a.id)).toEqual([
      2,
    ]);
  });
  it("requires explicit restaurant replacement and keeps line identities consistent", () => {
    const s = cart();
    const action = {
      type: "add" as const,
      restaurantId: 2,
      item: catalog[1].items[0],
      quantity: 1,
      note: "",
    };
    expect(reducer(s, action)).toBe(s);
    const next = reducer(s, { ...action, replace: true });
    expect(next.lines).toHaveLength(1);
    expect(next.restaurantId).toBe(2);
    expect(next.lines[0].item.id).toBe(20);
  });
  it("places a single order on duplicate clicks and snapshots the delivery address", () => {
    const placed = reducer(reducer(cart(), { type: "beginCheckout" }), {
      type: "place",
    });
    expect(reducer(placed, { type: "place" }).orders).toHaveLength(1);
    const changed = reducer(placed, {
      type: "saveAddress",
      address: { ...placed.addresses[0], line: "Địa chỉ mới" },
    });
    expect(changed.orders[0].address.line).toBe(
      "12 Tràng Thi, Hoàn Kiếm, Hà Nội",
    );
    expect(placed.lines).toHaveLength(0);
  });
  it("removes zero-quantity lines and blocks checkout without an address", () => {
    let s = reducer(cart(), { type: "deleteAddress", id: 1 });
    s = reducer(s, { type: "deleteAddress", id: 2 });
    expect(reducer(s, { type: "place" }).orders).toHaveLength(0);
    expect(
      reducer(s, { type: "quantity", id: 10, quantity: 0 }).lines,
    ).toHaveLength(0);
  });
});

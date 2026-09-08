import { useState } from "react";
import { act, fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OrderTracking from "./OrderTracking";
import { orderStatuses, previewInitialState, reducer } from "./model";
function Harness() {
  const [order,setOrder] = useState(previewInitialState().orders[0]);
  return <OrderTracking order={order} onStatus={status=>setOrder({...order,status})}/>;
}
afterEach(()=>{cleanup();vi.useRealTimers();});
describe('mock order tracking',()=>{
  it('provides every status and restores them on reset without duplicate order ids',()=>{
    const s=previewInitialState();
    expect(s.orders.map(o=>o.status)).toEqual(orderStatuses);
    expect(new Set(s.orders.map(o=>o.id)).size).toBe(6);
    expect(reducer(s,{type:'reset'}).orders).toHaveLength(6);
  });
  it('advances, pauses, completes and replays the simulated delivery',()=>{
    vi.useFakeTimers();render(<Harness/>);
    fireEvent.click(screen.getByRole('button',{name:'Chạy mô phỏng'}));
    act(()=>vi.advanceTimersByTime(3000));
    expect(document.querySelector('[aria-current=step]')).toHaveTextContent('Quán đang chuẩn bị');
    fireEvent.click(screen.getByRole('button',{name:'Tạm dừng'}));
    act(()=>vi.advanceTimersByTime(6000));
    expect(document.querySelector('[aria-current=step]')).toHaveTextContent('Quán đang chuẩn bị');
    fireEvent.click(screen.getByRole('button',{name:'Chạy mô phỏng'}));
    for(let i=0;i<3;i++)act(()=>vi.advanceTimersByTime(3000));
    expect(screen.getByText('Đã giao đến bạn')).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole('button',{name:'Chạy lại'}));
    expect(document.querySelector('[aria-current=step]')).toHaveTextContent('Chờ xác nhận');
    cleanup();expect(vi.getTimerCount()).toBe(0);
  });
});

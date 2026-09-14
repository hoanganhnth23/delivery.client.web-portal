import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDependencies } from "@/app/dependencies";
import type {
  Livestream,
  LivestreamProduct,
  StartLivestreamResponse,
} from "@/services/api/livestreamService";
import type { MenuItem, Restaurant } from "@/types/api.types";
import { useLivestreamPublisher } from "@/services/media/useLivestreamPublisher";

const money = (value: number) => `${value.toLocaleString("vi-VN")}đ`;

export default function AdminLivestreamStudio() {
  const {
    auth,
    restaurant,
    menu,
    livestreamHost,
    livestreamMedia,
    notifications,
  } = useAppDependencies();
  const currentUserId = auth.getCurrentUser()?.id ?? null;
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState<string | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [streams, setStreams] = useState<Livestream[]>([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [streamsError, setStreamsError] = useState<string | null>(null);
  const [activeStreamId, setActiveStreamId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [hostSession, setHostSession] =
    useState<StartLivestreamResponse | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [pinnedProducts, setPinnedProducts] = useState<LivestreamProduct[]>([]);
  const [pinnedLoading, setPinnedLoading] = useState(false);
  const [pinningId, setPinningId] = useState<number | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [livePrices, setLivePrices] = useState<Record<number, string>>({});
  const {
    targetRef: studioTargetRef,
    status: studioStatus,
    error: studioError,
    microphoneEnabled,
    cameraEnabled,
    connect: connectStudio,
    disconnect: disconnectStudio,
    setMicrophoneEnabled,
    setCameraEnabled,
  } = useLivestreamPublisher(livestreamMedia);

  const selectedRestaurant =
    restaurants.find((entry) => entry.id === selectedRestaurantId) ?? null;
  const activeStream =
    streams.find((entry) => entry.id === activeStreamId) ?? streams[0] ?? null;
  const canHostActiveStream = Boolean(
    activeStream &&
    currentUserId !== null &&
    activeStream.sellerId === currentUserId,
  );
  const pinnedById = useMemo(
    () => new Map(pinnedProducts.map((entry) => [entry.productId, entry])),
    [pinnedProducts],
  );

  const loadRestaurants = useCallback(async () => {
    setRestaurantsLoading(true);
    setRestaurantsError(null);
    try {
      const result = await restaurant.getAllRestaurants();
      setRestaurants(result);
      setSelectedRestaurantId((current) => current ?? result[0]?.id ?? null);
    } catch {
      setRestaurantsError("Không thể tải danh sách nhà hàng.");
    } finally {
      setRestaurantsLoading(false);
    }
  }, [restaurant]);

  useEffect(() => {
    void loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    if (selectedRestaurantId === null) {
      setStreams([]);
      setActiveStreamId(null);
      return;
    }
    let cancelled = false;
    setStreamsLoading(true);
    setStreamsError(null);
    setStreams([]);
    setActiveStreamId(null);
    void livestreamHost
      .inspect(selectedRestaurantId)
      .then((result) => {
        if (cancelled) return;
        setStreams(result);
        setActiveStreamId(
          result.find((entry) => entry.status === "LIVE")?.id ??
            result[0]?.id ??
            null,
        );
      })
      .catch(() => {
        if (!cancelled)
          setStreamsError("Không thể tải các phiên của nhà hàng.");
      })
      .finally(() => {
        if (!cancelled) setStreamsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [livestreamHost, selectedRestaurantId]);

  useEffect(() => {
    if (!selectedRestaurantId) {
      setMenuItems([]);
      return;
    }
    let cancelled = false;
    setMenuLoading(true);
    setMenuError(null);
    void menu
      .getMenuItemsByRestaurant(selectedRestaurantId, true)
      .then((result) => {
        if (!cancelled) setMenuItems(result);
      })
      .catch(() => {
        if (!cancelled) {
          setMenuItems([]);
          setMenuError("Không thể tải thực đơn.");
        }
      })
      .finally(() => {
        if (!cancelled) setMenuLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [menu, selectedRestaurantId]);

  useEffect(() => {
    if (!activeStream) {
      setPinnedProducts([]);
      setPinnedLoading(false);
      return;
    }
    let cancelled = false;
    setPinnedLoading(true);
    setPinError(null);
    void livestreamHost
      .listPinnedProducts(activeStream.id)
      .then((result) => {
        if (!cancelled) {
          setPinnedProducts(result);
          setLivePrices((current) => ({
            ...current,
            ...Object.fromEntries(
              result.map((entry) => [
                entry.productId,
                String(entry.priceAtLive),
              ]),
            ),
          }));
        }
      })
      .catch(() => {
        if (!cancelled) setPinError("Không thể tải món đang ghim.");
      })
      .finally(() => {
        if (!cancelled) setPinnedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeStream, livestreamHost]);

  const create = async () => {
    if (!selectedRestaurantId || !title.trim() || saving) return;
    setSaving(true);
    try {
      const created = await livestreamHost.create({
        title: title.trim(),
        restaurantId: selectedRestaurantId,
        streamProvider: "AGORA",
      });
      setStreams((current) => [created, ...current]);
      setActiveStreamId(created.id);
      setTitle("");
      notifications.success("Đã tạo livestream cho nhà hàng");
    } catch {
      notifications.error("Không thể tạo livestream");
    } finally {
      setSaving(false);
    }
  };

  const transition = async (action: "start" | "end") => {
    if (!activeStream || transitioning || !canHostActiveStream) return;
    setTransitioning(true);
    try {
      if (action === "start") {
        const session = await livestreamHost.start(activeStream.id);
        setHostSession(session);
        setStreams((current) =>
          current.map((entry) =>
            entry.id === activeStream.id
              ? { ...entry, status: "LIVE", startedAt: session.startedAt }
              : entry,
          ),
        );
        try {
          await connectStudio({
            ...session,
            renewToken: () =>
              livestreamHost.renewToken(activeStream.id, {
                channelName: session.channelName,
                uid: session.uid,
                role: "HOST",
              }),
          });
          notifications.success("Đã bắt đầu phát và kết nối camera");
        } catch {
          notifications.error(
            "Phiên đã bắt đầu nhưng chưa kết nối được camera",
          );
        }
      } else {
        const ended = await livestreamHost.end(activeStream.id);
        await disconnectStudio();
        setHostSession(null);
        setStreams((current) =>
          current.map((entry) =>
            entry.id === activeStream.id ? ended : entry,
          ),
        );
        notifications.success("Đã kết thúc livestream");
      }
    } catch {
      notifications.error(
        action === "start"
          ? "Không thể bắt đầu livestream"
          : "Không thể kết thúc livestream",
      );
    } finally {
      setTransitioning(false);
    }
  };

  const pin = async (item: MenuItem) => {
    if (
      !activeStream ||
      !canHostActiveStream ||
      pinningId !== null ||
      activeStream.status === "ENDED"
    )
      return;
    const price = Number(livePrices[item.id]);
    if (!Number.isFinite(price) || price <= 0) {
      setPinError(`Giá live cho ${item.name} phải lớn hơn 0.`);
      return;
    }
    setPinningId(item.id);
    setPinError(null);
    try {
      const product = await livestreamHost.pinProduct(activeStream.id, {
        productId: item.id,
        priceAtLive: price,
      });
      setPinnedProducts((current) => [
        ...current.filter((entry) => entry.productId !== item.id),
        product,
      ]);
      notifications.success(`Đã ghim ${item.name}`);
    } catch {
      setPinError(`Không thể ghim ${item.name}.`);
    } finally {
      setPinningId(null);
    }
  };

  const unpin = async (item: MenuItem) => {
    if (
      !activeStream ||
      !canHostActiveStream ||
      pinningId !== null ||
      activeStream.status === "ENDED"
    )
      return;
    setPinningId(item.id);
    setPinError(null);
    try {
      await livestreamHost.unpinProduct(activeStream.id, item.id);
      setPinnedProducts((current) =>
        current.filter((entry) => entry.productId !== item.id),
      );
      notifications.success(`Đã bỏ ghim ${item.name}`);
    } catch {
      setPinError(`Không thể bỏ ghim ${item.name}.`);
    } finally {
      setPinningId(null);
    }
  };

  const reconnect = async () => {
    if (!hostSession || studioStatus === "connecting") return;
    try {
      await connectStudio({
        ...hostSession,
        renewToken: () =>
          livestreamHost.renewToken(hostSession.livestreamId, {
            channelName: hostSession.channelName,
            uid: hostSession.uid,
            role: "HOST",
          }),
      });
    } catch {
      notifications.error("Không thể kết nối lại camera");
    }
  };

  return (
    <section className="live-studio" aria-label="Studio livestream Admin">
      <div className="live-studio-header">
        <div>
          <h2>Host studio</h2>
          <p>
            Admin có thể phát cho nhà hàng được chọn; thao tác pin/kết thúc chỉ
            áp dụng với phòng do Admin sở hữu.
          </p>
        </div>
        <label>
          Nhà hàng
          <select
            aria-label="Chọn nhà hàng livestream"
            value={selectedRestaurantId ?? ""}
            disabled={restaurantsLoading}
            onChange={(event) =>
              setSelectedRestaurantId(Number(event.target.value))
            }
          >
            {restaurants.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {restaurantsError && (
        <div className="live-empty" role="alert">
          <p>{restaurantsError}</p>
          <button
            className="live-button"
            onClick={() => void loadRestaurants()}
          >
            Thử lại
          </button>
        </div>
      )}
      {!restaurantsLoading && !restaurantsError && selectedRestaurant && (
        <>
          <form
            className="live-studio-create"
            onSubmit={(event) => {
              event.preventDefault();
              void create();
            }}
          >
            <label>
              Tiêu đề
              <input
                aria-label="Tiêu đề host livestream"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Bếp hôm nay có món mới"
              />
            </label>
            <button
              className="live-button live-button-primary"
              disabled={saving || !title.trim()}
            >
              {saving ? "Đang tạo…" : "Tạo phiên Agora"}
            </button>
          </form>
          <div className="live-studio-grid">
            <div className="live-studio-stage">
              <div
                ref={studioTargetRef}
                className="live-studio-video"
                aria-label="Xem trước camera Admin"
              />
              {studioStatus !== "connected" && (
                <div className="live-studio-video-state">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    {studioError ? "videocam_off" : "videocam"}
                  </span>
                  <p role={studioError ? "alert" : "status"}>
                    {studioError ??
                      (activeStream?.status === "LIVE"
                        ? "Studio chưa kết nối camera."
                        : "Camera sẽ mở khi bắt đầu phát.")}
                  </p>
                  {studioError && (
                    <button
                      className="live-button"
                      onClick={() => void reconnect()}
                    >
                      Kết nối lại
                    </button>
                  )}
                </div>
              )}{" "}
              {studioStatus === "connected" && !cameraEnabled && (
                <div className="live-studio-video-state">
                  <span
                    className="material-symbols-outlined"
                    aria-hidden="true"
                  >
                    videocam_off
                  </span>
                  <p>Camera đang tắt</p>
                </div>
              )}
              <div className="live-studio-controls">
                <button
                  className="live-button live-button-primary"
                  disabled={
                    !activeStream ||
                    !canHostActiveStream ||
                    activeStream.status === "ENDED" ||
                    transitioning
                  }
                  onClick={() =>
                    void transition(
                      activeStream?.status === "LIVE" ? "end" : "start",
                    )
                  }
                >
                  {activeStream?.status === "LIVE"
                    ? "Kết thúc phát"
                    : "Bắt đầu phát"}
                </button>
                <button
                  className="live-button"
                  disabled={studioStatus !== "connected"}
                  onClick={() => void setMicrophoneEnabled(!microphoneEnabled)}
                  aria-label={microphoneEnabled ? "Tắt micro" : "Bật micro"}
                >
                  {microphoneEnabled ? "Tắt micro" : "Bật micro"}
                </button>
                <button
                  className="live-button"
                  disabled={studioStatus !== "connected"}
                  onClick={() => void setCameraEnabled(!cameraEnabled)}
                  aria-label={cameraEnabled ? "Tắt camera" : "Bật camera"}
                >
                  {cameraEnabled ? "Tắt camera" : "Bật camera"}
                </button>
              </div>
            </div>
            <aside className="live-studio-panel">
              <label>
                Phiên
                <select
                  aria-label="Chọn phiên livestream"
                  value={activeStreamId ?? ""}
                  onChange={(event) => setActiveStreamId(event.target.value)}
                >
                  {streams.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.title} · {entry.status}
                    </option>
                  ))}
                </select>
              </label>
              {streamsLoading && <p role="status">Đang tải phiên…</p>}
              {streamsError && <p role="alert">{streamsError}</p>}
              {activeStream && !canHostActiveStream && (
                <p className="live-studio-note">
                  Phòng này thuộc Host khác. Dùng màn hình giám sát và kiểm
                  duyệt để can thiệp.
                </p>
              )}
              <h3>Ghim món</h3>
              {menuError && <p role="alert">{menuError}</p>}
              {menuLoading || pinnedLoading ? (
                <p role="status">Đang tải thực đơn…</p>
              ) : menuItems.length === 0 ? (
                <p>Nhà hàng chưa có món khả dụng.</p>
              ) : (
                <div className="live-studio-menu">
                  {menuItems.map((item) => {
                    const pinned = pinnedById.get(item.id);
                    return (
                      <div className="live-studio-menu-row" key={item.id}>
                        <div>
                          <strong>{item.name}</strong>
                          <span>{money(item.price)}</span>
                        </div>
                        <label>
                          Giá live
                          <input
                            aria-label={`Giá live ${item.name}`}
                            inputMode="decimal"
                            value={
                              livePrices[item.id] ??
                              (pinned ? String(pinned.priceAtLive) : "")
                            }
                            onChange={(event) =>
                              setLivePrices((current) => ({
                                ...current,
                                [item.id]: event.target.value,
                              }))
                            }
                          />
                        </label>
                        <button
                          className="live-button"
                          disabled={
                            !canHostActiveStream ||
                            !activeStream ||
                            activeStream.status === "ENDED" ||
                            pinningId === item.id
                          }
                          onClick={() =>
                            void (pinned ? unpin(item) : pin(item))
                          }
                        >
                          {pinned ? "Bỏ ghim" : "Ghim"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {pinError && <p role="alert">{pinError}</p>}
              <p className="live-footnote">
                Giá live phải lớn hơn 0; server vẫn xác thực món và giá trước
                khi lưu.
              </p>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}

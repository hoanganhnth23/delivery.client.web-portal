import { useCallback, useEffect, useRef, useState } from "react";
import type { StartLivestreamResponse } from "@/services/api/livestreamService";
import type { LivestreamMediaPort } from "@/services/media/livestreamMedia";
import type { LivestreamPublisher } from "@/services/media/agoraPublisher";
import type { ViewerSession } from "@/services/media/agoraViewer";

type PublisherStatus = "idle" | "connecting" | "connected" | "error";

/** Shared host publisher lifecycle for restaurant and admin studios. */
export function useLivestreamPublisher(media: LivestreamMediaPort) {
  const targetRef = useRef<HTMLDivElement>(null);
  const publisherRef = useRef<LivestreamPublisher | null>(null);
  const generationRef = useRef(0);
  const [status, setStatus] = useState<PublisherStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [microphoneEnabled, setMicrophoneEnabledState] = useState(true);
  const [cameraEnabled, setCameraEnabledState] = useState(true);
  const [streamId, setStreamId] = useState<string | null>(null);

  const disconnect = useCallback(async () => {
    generationRef.current += 1;
    const current = publisherRef.current;
    publisherRef.current = null;
    setStreamId(null);
    setStatus("idle");
    setError(null);
    if (current) await current.stop();
  }, []);

  const connect = useCallback(
    async (
      session: StartLivestreamResponse & Pick<ViewerSession, "renewToken">,
    ) => {
      const target = targetRef.current;
      if (!target) throw new Error("Khung xem trước camera chưa sẵn sàng.");
      const generation = generationRef.current + 1;
      generationRef.current = generation;
      const previous = publisherRef.current;
      publisherRef.current = null;
      if (previous) await previous.stop();
      if (generationRef.current !== generation) return;

      setStatus("connecting");
      setError(null);
      setMicrophoneEnabledState(true);
      setCameraEnabledState(true);
      const publisher = media.createPublisher(target, (message) => {
        if (publisherRef.current !== publisher) return;
        setStatus("error");
        setError(message);
      });
      publisherRef.current = publisher;
      setStreamId(session.livestreamId);
      try {
        await publisher.start(session);
        if (
          generationRef.current === generation &&
          publisherRef.current === publisher
        ) {
          setStatus("connected");
        }
      } catch (cause) {
        if (
          generationRef.current === generation &&
          publisherRef.current === publisher
        ) {
          setStatus("error");
          setError(
            cause instanceof Error
              ? cause.message
              : "Không thể kết nối studio livestream.",
          );
        }
        throw cause;
      }
    },
    [media],
  );

  const setMicrophoneEnabled = useCallback(async (enabled: boolean) => {
    const publisher = publisherRef.current;
    if (!publisher) throw new Error("Studio chưa kết nối.");
    await publisher.setMicrophoneEnabled(enabled);
    if (publisherRef.current === publisher) setMicrophoneEnabledState(enabled);
  }, []);

  const setCameraEnabled = useCallback(async (enabled: boolean) => {
    const publisher = publisherRef.current;
    if (!publisher) throw new Error("Studio chưa kết nối.");
    await publisher.setCameraEnabled(enabled);
    if (publisherRef.current === publisher) setCameraEnabledState(enabled);
  }, []);

  useEffect(
    () => () => {
      generationRef.current += 1;
      const publisher = publisherRef.current;
      publisherRef.current = null;
      void publisher?.stop();
    },
    [],
  );

  return {
    targetRef,
    status,
    error,
    streamId,
    microphoneEnabled,
    cameraEnabled,
    connect,
    disconnect,
    setMicrophoneEnabled,
    setCameraEnabled,
  };
}

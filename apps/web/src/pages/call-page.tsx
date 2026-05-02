import { Room, createLocalTracks, type LocalTrack, type RemoteTrack, type RemoteTrackPublication } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { endCall, getCallHistory, getCallToken } from "../api/messenger";
import { formatCallTypeRu } from "../lib/ui";

function attachTrack(track: RemoteTrack | LocalTrack, container: HTMLDivElement | null) {
  if (!container) return;
  const element = track.attach();
  element.className = "h-full w-full rounded-3xl object-cover";
  container.innerHTML = "";
  container.appendChild(element);
}

export function CallPage() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const localContainerRef = useRef<HTMLDivElement | null>(null);
  const remoteContainerRef = useRef<HTMLDivElement | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [mode, setMode] = useState<"AUDIO" | "VIDEO">("AUDIO");
  const [status, setStatus] = useState("Подготавливаем комнату...");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  useEffect(() => {
    if (!callId) return;

    let currentRoom: Room | null = null;
    let mounted = true;

    void (async () => {
      try {
        const history = await getCallHistory();
        const call = history.data.find((entry) => entry.id === callId);
        const callMode = call?.type === "VIDEO" ? "VIDEO" : "AUDIO";
        setMode(callMode);
        setCameraEnabled(callMode === "VIDEO");

        const token = await getCallToken(callId);
        const nextRoom = new Room();
        currentRoom = nextRoom;
        setRoom(nextRoom);
        setStatus("Подключаемся к LiveKit...");
        await nextRoom.connect(token.url, token.token);

        const localTracks = await createLocalTracks({
          audio: true,
          video: callMode === "VIDEO"
        });

        for (const track of localTracks) {
          await nextRoom.localParticipant.publishTrack(track);
          if (track.kind === "video" || callMode === "AUDIO") {
            attachTrack(track, localContainerRef.current);
          }
        }

        nextRoom.on("trackSubscribed", (track) => {
          if (!mounted) return;
          attachTrack(track, remoteContainerRef.current);
          setStatus("Соединение установлено");
        });

        nextRoom.on("participantConnected", (participant) => {
          setStatus(`Подключился пользователь: ${participant.identity}`);
          participant.trackPublications.forEach((publication) => {
            const candidate = publication as RemoteTrackPublication;
            if (candidate.track) {
              attachTrack(candidate.track, remoteContainerRef.current);
            }
          });
        });

        nextRoom.on("participantDisconnected", () => {
          setStatus("Собеседник вышел");
        });

        if (mounted) {
          setStatus("Соединение установлено");
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Не удалось подключиться к звонку");
      }
    })();

    return () => {
      mounted = false;
      currentRoom?.disconnect();
    };
  }, [callId]);

  async function leaveCall() {
    if (callId) {
      await endCall(callId);
    }
    room?.disconnect();
    navigate("/chats");
  }

  async function toggleMicrophone() {
    if (!room) return;
    const nextValue = !micEnabled;
    await room.localParticipant.setMicrophoneEnabled(nextValue);
    setMicEnabled(nextValue);
  }

  async function toggleCamera() {
    if (!room || mode !== "VIDEO") return;
    const nextValue = !cameraEnabled;
    await room.localParticipant.setCameraEnabled(nextValue);
    setCameraEnabled(nextValue);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <section className="surface overflow-hidden p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Комната LiveKit</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">{formatCallTypeRu(mode)}</h1>
            <p className="mt-1 text-sm text-muted">{status}</p>
          </div>
          <button className="rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white" onClick={() => void leaveCall()}>
            Завершить
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-ink/90 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.15em] text-white/60">Собеседник</p>
            <div ref={remoteContainerRef} className="flex h-[360px] items-center justify-center rounded-3xl bg-black/30 text-white/60">
              Ожидаем подключения...
            </div>
          </div>
          <div className="rounded-3xl bg-white p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">Вы</p>
            <div ref={localContainerRef} className="flex h-[360px] items-center justify-center rounded-3xl bg-canvas text-muted">
              Локальное превью
            </div>
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <section className="surface p-5">
          <h2 className="text-lg font-semibold text-ink">Управление</h2>
          <div className="mt-4 grid gap-3">
            <button className="secondary-btn w-full" onClick={() => void toggleMicrophone()}>
              {micEnabled ? "Выключить микрофон" : "Включить микрофон"}
            </button>
            {mode === "VIDEO" ? (
              <button className="secondary-btn w-full" onClick={() => void toggleCamera()}>
                {cameraEnabled ? "Выключить камеру" : "Включить камеру"}
              </button>
            ) : null}
          </div>
        </section>
        <section className="surface p-5">
          <h2 className="text-lg font-semibold text-ink">О звонке</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>URL и временный токен приходят из `POST /api/calls/:callId/token`.</li>
            <li>`LIVEKIT_API_SECRET` никогда не попадает в браузер.</li>
            <li>Аудио запускается сразу, видео публикуется только для видеозвонков.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

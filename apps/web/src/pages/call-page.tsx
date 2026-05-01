import type { RemoteTrackPublication, Room } from "livekit-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { endCall, getCallHistory, getCallToken } from "../api/messenger";

function attachPublication(publication: RemoteTrackPublication, container: HTMLDivElement | null) {
  if (!container || !publication.track) return;
  const element = publication.track.attach();
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
  const [status, setStatus] = useState("Preparing room...");

  const roomFactory = useMemo(async () => {
    const livekit = await import("livekit-client");
    return { room: new livekit.Room(), createLocalTracks: livekit.createLocalTracks };
  }, []);

  useEffect(() => {
    if (!callId) return;

    let mounted = true;
    let currentRoom: Room | null = null;

    void (async () => {
      const history = await getCallHistory();
      const call = history.data.find((entry) => entry.id === callId);
      if (call?.type === "VIDEO") {
        setMode("VIDEO");
      }

      const token = await getCallToken(callId);
      const { room: nextRoom, createLocalTracks } = await roomFactory;
      currentRoom = nextRoom;
      setRoom(nextRoom);
      setStatus("Connecting to LiveKit...");
      await nextRoom.connect(token.url, token.token);

      const localTracks = await createLocalTracks({
        audio: true,
        video: mode === "VIDEO"
      });

      localTracks.forEach((track) => {
        void nextRoom.localParticipant.publishTrack(track);
        if (localContainerRef.current && (track.kind === "video" || mode === "AUDIO")) {
          const element = track.attach();
          element.className = "h-full w-full rounded-3xl object-cover";
          localContainerRef.current.innerHTML = "";
          localContainerRef.current.appendChild(element);
        }
      });

      nextRoom.on("trackSubscribed", (track, _publication, participant) => {
        if (!mounted || !remoteContainerRef.current) return;
        const element = track.attach();
        element.className = "h-full w-full rounded-3xl object-cover";
        remoteContainerRef.current.innerHTML = "";
        remoteContainerRef.current.appendChild(element);
        setStatus(`Connected with ${participant.identity}`);
      });

      nextRoom.on("participantConnected", (participant) => {
        setStatus(`Participant joined: ${participant.identity}`);
        participant.trackPublications.forEach((publication) => {
          attachPublication(publication as RemoteTrackPublication, remoteContainerRef.current);
        });
      });

      nextRoom.on("participantDisconnected", () => {
        setStatus("Participant left");
      });

      if (mounted) {
        setStatus("Connected");
      }
    })();

    return () => {
      mounted = false;
      currentRoom?.disconnect();
    };
  }, [callId, mode, roomFactory]);

  async function leaveCall() {
    if (callId) {
      await endCall(callId);
    }
    room?.disconnect();
    navigate("/chats");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <section className="surface overflow-hidden p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">LiveKit room</p>
            <h1 className="mt-2 text-2xl font-semibold text-ink">{mode} call</h1>
            <p className="mt-1 text-sm text-muted">{status}</p>
          </div>
          <button className="rounded-2xl bg-coral px-4 py-3 text-sm font-semibold text-white" onClick={() => void leaveCall()}>
            End call
          </button>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-ink/90 p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.15em] text-white/60">Remote</p>
            <div ref={remoteContainerRef} className="flex h-[360px] items-center justify-center rounded-3xl bg-black/30 text-white/60">
              Waiting for participant...
            </div>
          </div>
          <div className="rounded-3xl bg-white p-3">
            <p className="mb-2 text-xs uppercase tracking-[0.15em] text-muted">You</p>
            <div ref={localContainerRef} className="flex h-[360px] items-center justify-center rounded-3xl bg-canvas text-muted">
              Local preview
            </div>
          </div>
        </div>
      </section>
      <aside className="space-y-4">
        <section className="surface p-5">
          <h2 className="text-lg font-semibold text-ink">Call notes</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>Token and URL come from `POST /api/calls/:callId/token`.</li>
            <li>`LIVEKIT_API_SECRET` never reaches the browser.</li>
            <li>Audio starts immediately; video publishes for video calls.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

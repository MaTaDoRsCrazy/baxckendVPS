import { useRealtime } from "../providers/realtime-provider";

export function IncomingCallBanner() {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useRealtime();

  if (!incomingCall) {
    return null;
  }

  return (
    <div className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-xl rounded-3xl bg-ink px-5 py-4 text-white shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">Incoming call</p>
          <p className="mt-1 text-lg font-semibold">{incomingCall.type} call</p>
          <p className="text-sm text-white/70">Room: {incomingCall.livekitRoomName}</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-2xl bg-mint px-4 py-2 text-sm font-semibold" onClick={() => void acceptIncomingCall()}>
            Accept
          </button>
          <button className="rounded-2xl bg-coral px-4 py-2 text-sm font-semibold" onClick={() => void rejectIncomingCall()}>
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

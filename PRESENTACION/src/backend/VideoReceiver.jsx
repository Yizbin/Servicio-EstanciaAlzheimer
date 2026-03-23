import { useEffect, useRef } from "react";

export default function WebRTCViewer() {
  const videoRef = useRef(null);

  useEffect(() => {
    let pc;

    const start = async () => {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
      });

      // cuando llegue video → lo mandamos al <video>
      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
        }
      };

      // 1. pedir offer al MediaMTX
      const res = await fetch("http://IP:8889/mystream/whep", {
        method: "POST"
      });

      const offerSDP = await res.text();

      await pc.setRemoteDescription({
        type: "offer",
        sdp: offerSDP
      });

      // 2. crear answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 3. enviar answer
      await fetch("http://IP:8889/mystream/whep", {
        method: "PATCH",
        body: answer.sdp,
        headers: {
          "Content-Type": "application/sdp"
        }
      });
    };

    start();

    // limpieza (MUY importante)
    return () => {
      if (pc) pc.close();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      controls
      style={{ width: "100%" }}
    />
  );
}
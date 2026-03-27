import { useEffect, useRef, useState } from "react";

export default function WebRTCRecorder({ patientName }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Conectando...");

  useEffect(() => {
    let pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    const startWebRTC = async () => {
      pc.ontrack = (event) => {
        if (videoRef.current) {
          videoRef.current.srcObject = event.streams[0];
          setStatus("En vivo");
        }
      };

      try {
        const endpoint = "http://10.1.8.24:8889/cam1/whep";
        
        // 1. Offer
        const res = await fetch(endpoint, { method: "POST" });
        const offerSDP = await res.text();
        await pc.setRemoteDescription({ type: "offer", sdp: offerSDP });

        // 2. Answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Esperar candidatos ICE (Truco para red local)
        await new Promise((res) => {
          if (pc.iceGatheringState === "complete") res();
          else pc.addEventListener("icegatheringstatechange", () => {
            if (pc.iceGatheringState === "complete") res();
          });
        });

        // 3. Patch
        await fetch(endpoint, {
          method: "PATCH",
          body: pc.localDescription.sdp,
          headers: { "Content-Type": "application/sdp" }
        });
      } catch (e) {
        setStatus("Error de conexión");
        console.error(e);
      }
    };

    startWebRTC();
    return () => pc.close();
  }, []);

  return (
    <div className="camera-card">
      <div className="video-frame">
        {/* EL VIDEO REAL DEL WEBRTC */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsinline 
          muted 
          className="video-element"
        />
        
        {/* EL PLACEHOLDER (Solo se ve si el video no carga) */}
        <div className="video-placeholder" style={{ zIndex: status === "En vivo" ? -1 : 1 }}>
          <span className="icon">📷</span>
          <p>{status}</p>
        </div>
      </div>

      <div className="actions">
        <button className="btn-record">
          Iniciar Grabación para {patientName}
        </button>
      </div>
    </div>
  );
}
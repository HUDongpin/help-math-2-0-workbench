"use client";

import { useEffect, useRef, useState } from "react";

const RUFFLE_SCRIPT_ID = "ruffle-selfhosted-script";
let ruffleReadyPromise;

function loadRuffle() {
  if (window.RufflePlayer?.newest) {
    return Promise.resolve();
  }

  if (ruffleReadyPromise) {
    return ruffleReadyPromise;
  }

  ruffleReadyPromise = new Promise((resolve, reject) => {
    window.RufflePlayer = window.RufflePlayer || {};

    const existingScript = document.getElementById(RUFFLE_SCRIPT_ID);
    const script = existingScript || document.createElement("script");

    const handleLoad = () => resolve();
    const handleError = () => {
      ruffleReadyPromise = undefined;
      reject(new Error("Ruffle could not be loaded."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    if (!existingScript) {
      script.id = RUFFLE_SCRIPT_ID;
      script.src = "/ruffle/ruffle.js";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return ruffleReadyPromise;
}

export function RuffleFlashPlayer({
  swfUrl,
  title = "Flash animation",
  width = 780,
  height = 379,
}) {
  const containerRef = useRef(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    let player;

    async function mountPlayer() {
      try {
        await loadRuffle();
        if (cancelled || !containerRef.current) return;

        const ruffle = window.RufflePlayer.newest();
        player = ruffle.createPlayer();
        player.setAttribute("aria-label", title);
        player.style.display = "block";
        player.style.width = "100%";
        player.style.height = "100%";

        containerRef.current.replaceChildren(player);
        await player.ruffle().load(swfUrl);

        if (!cancelled) setStatus("ready");
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus("error");
      }
    }

    mountPlayer();

    return () => {
      cancelled = true;
      player?.remove();
    };
  }, [swfUrl, title]);

  return (
    <div
      className="ruffle-stage"
      style={{ aspectRatio: `${width} / ${height}` }}
      aria-busy={status === "loading"}
    >
      <div ref={containerRef} className="ruffle-player-host" />
      {status === "loading" ? (
        <p className="ruffle-status">Loading original Flash animation...</p>
      ) : null}
      {status === "error" ? (
        <p className="ruffle-status ruffle-status-error">
          The Flash animation could not be loaded.
        </p>
      ) : null}
    </div>
  );
}

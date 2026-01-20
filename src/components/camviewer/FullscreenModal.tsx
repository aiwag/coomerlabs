// import React, { useRef, useEffect, useCallback } from "react";
// import { X } from "lucide-react";
// import { useGridStore } from "@/state/gridStore";

// export function FullscreenModal() {
//   const { fullscreenStream, setFullscreenStream } = useGridStore();
//   const webviewRef = useRef<HTMLWebViewElement>(null);

//   const injectScript = useCallback(() => {
//     const webview = webviewRef.current;
//     if (!webview) return;
//     const script = `
//       (function() {
//         try {
//           document.body.style.backgroundColor = 'black';
//           document.body.style.margin = '0';
//           document.body.style.padding = '0';
//           document.body.style.overflow = 'hidden';
//           [
//             '#header', '.footer-holder', '.RoomSignupPopup', '#roomTabs',
//             '.playerTitleBar', '.genderTabs', '#TheaterModePlayer > div:nth-child(8)',
//             '.video-overlay', '.video-controls', '.chat-container', '.chat-panel',
//             '.bio-section', '.tip-menu', '.tip-button', '.header-container'
//           ].forEach(sel => {
//             document.querySelectorAll(sel).forEach(el => el.style.setProperty('display', 'none', 'important'));
//           });
//           const makeVideoFullscreen = () => {
//             const video = document.querySelector('video') || document.querySelector('#chat-player_html5_api');
//             const videoDiv = document.querySelector('.videoPlayerDiv');
//             const playerContainer = document.querySelector('.player-container');
//             if(video){video.style.position='fixed';video.style.top='0';video.style.left='0';video.style.width='100vw';video.style.height='100vh';video.style.objectFit='cover';video.style.zIndex='1'}
//             if(videoDiv){videoDiv.style.position='fixed';videoDiv.style.top='0';videoDiv.style.left='0';videoDiv.style.width='100vw';videoDiv.style.height='100vh';videoDiv.style.overflow='hidden';videoDiv.style.background='black';videoDiv.style.zIndex='0'}
//             if(playerContainer){playerContainer.style.position='fixed';playerContainer.style.top='0';playerContainer.style.left='0';playerContainer.style.width='100vw';playerContainer.style.height='100vh';playerContainer.style.overflow='hidden';playerContainer.style.zIndex='0'}
//           };
//           makeVideoFullscreen();
//           window.addEventListener('resize', makeVideoFullscreen);
//           setInterval(makeVideoFullscreen, 2000);
//         } catch (e) { console.error('Injection error:', e); }
//       })();
//     `;
//     setTimeout(
//       () => webview.executeJavaScript(script).catch(console.error),
//       300,
//     );
//   }, []);

//   useEffect(() => {
//     const webview = webviewRef.current;
//     if (fullscreenStream && webview) {
//       webview.addEventListener("dom-ready", injectScript);
//       return () => {
//         webview.removeEventListener("dom-ready", injectScript);
//       };
//     }
//   }, [fullscreenStream, injectScript]);

//   if (!fullscreenStream) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex flex-col bg-black">
//       <header
//         className="flex items-center justify-between bg-neutral-800 p-2 text-white select-none"
//         style={{ WebkitAppRegion: "drag" }}
//       >
//         <h2 className="text-lg font-semibold">{fullscreenStream.username}</h2>
//         <button
//           onClick={() => setFullscreenStream(null)}
//           className="rounded p-1 hover:bg-neutral-700"
//           style={{ WebkitAppRegion: "no-drag" }}
//         >
//           <X size={20} />
//         </button>
//       </header>
//       <div className="flex-1">
//         <webview
//           ref={webviewRef}
//           src={fullscreenStream.url}
//           className="h-full w-full"
//           preload="./preload.js"
//         />
//       </div>
//     </div>
//   );
// }

import React, { useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useGridStore } from "@/state/gridStore";

export function FullscreenModal() {
  const { fullscreenStream, setFullscreenStream } = useGridStore();
  const webviewRef = useRef<HTMLWebViewElement>(null);

  const injectAndPlayScript = useCallback(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // Use the same robust script as the grid view
    const script = `
      (function() {
        try {
          // Part 1: Aggressive UI Hiding (Your Script)
          document.body.style.backgroundColor='black';
          document.body.style.margin='0';
          document.body.style.overflow='hidden';
          ['#header','.footer-holder','.RoomSignupPopup','#roomTabs','.playerTitleBar','.genderTabs','.video-overlay','.video-controls','.chat-container','.chat-panel','.bio-section','.tip-menu','.tip-button','.header-container'].forEach(s=>{document.querySelectorAll(s).forEach(e=>e.style.setProperty('display','none','important'))});
          const vfs=()=>{const v=document.querySelector('video')||document.querySelector('#chat-player_html5_api');if(v){v.style.position='fixed';v.style.top='0';v.style.left='0';v.style.width='100vw';v.style.height='100vh';v.style.objectFit='cover';v.style.zIndex='1'}};
          vfs();setInterval(vfs,2000);
          
          // Part 2: Persistent Autoplay Trigger
          let attempts=0;const pi=setInterval(()=>{const v=document.querySelector('video'),p=document.querySelector('.vjs-big-play-button');if(v){v.muted=false;v.play().then(()=>clearInterval(pi)).catch(()=>{if(p)p.click()})}else if(p){p.click()}attempts++;if(attempts>20)clearInterval(pi)},500);
        } catch (e) { console.error('Injection Error:', e); }
      })();
    `;

    // Use a small delay for injection
    setTimeout(() => {
      if ("executeJavaScript" in webview) {
        (webview as any).executeJavaScript(script).catch(console.error);
      }
    }, 300);
  }, []);

  useEffect(() => {
    const webview = webviewRef.current;
    if (fullscreenStream && webview) {
      webview.addEventListener("dom-ready", injectAndPlayScript);
      return () => {
        webview.removeEventListener("dom-ready", injectAndPlayScript);
      };
    }
  }, [fullscreenStream, injectAndPlayScript]);

  if (!fullscreenStream) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <header
        className="flex items-center justify-between bg-neutral-800 p-2 text-white select-none"
        style={{ WebKitAppRegion: "drag" } as any}
      >
        <h2 className="text-lg font-semibold">{fullscreenStream.username}</h2>
        <button
          onClick={() => setFullscreenStream(null)}
          className="rounded p-1 hover:bg-neutral-700"
          style={{ WebKitAppRegion: "no-drag" } as any}
        >
          <X size={20} />
        </button>
      </header>
      <div className="flex-1">
        <webview
          ref={webviewRef}
          src={fullscreenStream.url}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

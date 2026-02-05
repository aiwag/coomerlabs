// This file centralizes the complex script injected into each webview.

export const webviewInjectionScript = `
(function(){
  try {
    const isFapello = window.location.hostname.includes('fapello');
    const isRedGifs = window.location.hostname.includes('redgifs');

    // Part 1: Aggressive UI Hiding
    document.body.style.backgroundColor='black';
    document.body.style.margin='0';
    document.body.style.overflow='hidden';
    
    // Generic Garbage
    const commonSelectors = [
      '#header','.footer-holder','.RoomSignupPopup','#roomTabs','.playerTitleBar',
      '.genderTabs','#TheaterModePlayer > div:nth-child(8)',
      '.chat-container','.chat-panel','.bio-section',
      '.tip-menu','.tip-button','.header-container',
      'a[href*="signup"]', 'div[id*="banner"]', '.ad-block', '.ad-container'
    ];

    // Site-specific selectors
    const siteSelectors = [];
    if (isRedGifs) {
      siteSelectors.push('.site-header', '.site-footer', '.related-posts', 
        '.gif-overlay', '.options-bar', '.share-controls', '.logo', 
        '.f-player-controls', '.player-controls', '.sound-control');
    }
    if (isFapello) {
      // On Fapello, only hide navigation/chrome, NOT video UI
      siteSelectors.push('.navbar', '.sidebar',
        '.profile-info', '.social-share');
    }

    const allSelectors = [...commonSelectors, ...siteSelectors];

    // Throttle helper for performance
    let cleanUIScheduled = false;
    const throttledCleanUI = () => {
      if (cleanUIScheduled) return;
      cleanUIScheduled = true;
      requestAnimationFrame(() => {
        cleanUI();
        cleanUIScheduled = false;
      });
    };

    const cleanUI = () => {
       allSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
            // For Fapello, don't block pointer events (need clicks to work)
            if (!isFapello) {
              el.style.setProperty('pointer-events', 'none', 'important');
            }
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('opacity', '0', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
        });
      });
      
      // Special cleanups
      if (isRedGifs) {
         document.querySelectorAll('.player-wrapper, .video-wrapper, .media-container').forEach(el => {
            el.style.margin = '0';
            el.style.padding = '0';
            el.style.width = '100vw';
            el.style.height = '100vh';
         });
      }
    };

    let videoStyled = false;
    const makeVideoFullscreen = () => {
      // Prioritize videos that look like content (longer duration, specific classes)
      const videos = Array.from(document.querySelectorAll('video'));
      const mainVideo = videos.find(v => v.duration > 5) || videos[0];

      if (mainVideo && !videoStyled) {
        mainVideo.style.position='fixed'; 
        mainVideo.style.top='0'; 
        mainVideo.style.left='0';
        mainVideo.style.width='100vw'; 
        mainVideo.style.height='100vh';
        mainVideo.style.objectFit='contain';
        mainVideo.style.zIndex='9999';
        mainVideo.style.backgroundColor='black';
        
        // For Fapello: KEEP controls and make clickable, don't remove them
        if (isFapello) {
          mainVideo.controls = true;
          mainVideo.style.pointerEvents = 'auto';
          mainVideo.loop = true;
        } else {
          // For other sites, remove controls
          mainVideo.controls = false;
        }
        videoStyled = true;
      }
    };
    
    cleanUI();
    makeVideoFullscreen();
    // Reduced frequency from 1000ms to 2000ms. Staggered start to prevent CPU spikes.
    setTimeout(() => {
      setInterval(() => {
          throttledCleanUI();
          makeVideoFullscreen();
      }, 2000);
    }, Math.random() * 2000);

    // Throttled mutation observer to prevent excessive triggers
    let observerTimeout = null;
    const uiObserver = new MutationObserver(() => {
        if (observerTimeout) return;
        observerTimeout = setTimeout(() => {
          throttledCleanUI();
          makeVideoFullscreen();
          observerTimeout = null;
        }, 500);
    });
    uiObserver.observe(document.body, { childList: true, subtree: true });

    // Part 2: Persistent Autoplay Trigger
    let attempts = 0;
    const playInterval = setInterval(() => {
      const video = document.querySelector('video');
      const triggers = [
          document.querySelector('.vjs-big-play-button'),
          document.querySelector('.interact-button'),
          document.querySelector('.start-button'),
          document.querySelector('.play-button'),
          document.querySelector('[data-testid="play-button"]'),
      ];
      
      if (video) {
        // For Fapello, don't force autoplay - let user click to play
        if (isFapello && attempts < 5) {
          // Just ensure video is ready, don't force play
          attempts++;
          return;
        }
        
        // Try unmuted first for better UX
        video.muted = false; 
        video.play().then(() => {
          if (window.electron?.ipcRenderer) {
            window.electron.ipcRenderer.sendToHost('webview-ready');
          }
          clearInterval(playInterval);
        }).catch(() => {
           // Fallback: Mute and play (required by browser policies)
           video.muted = true;
           video.play().catch(e => {});
           
           // Click any overlay triggers (but not on Fapello)
           if (!isFapello) {
             triggers.forEach(t => t && t.click());
           }
        });
      } else {
        // No video yet, try clicking play buttons (but not on Fapello)
        if (!isFapello) {
          triggers.forEach(t => t && t.click());
        }
      }
      
      attempts++;
      if (attempts > 30) clearInterval(playInterval);
    }, 500);

    // Part 3: Smart Audio Interaction
    document.addEventListener('mouseenter', () => {
      if (window.electron && window.electron.ipcRenderer) {
         try { window.electron.ipcRenderer.sendToHost('mouseenter'); } catch(e){}
      }
    });

    document.addEventListener('mouseleave', () => {
      if (window.electron && window.electron.ipcRenderer) {
         try { window.electron.ipcRenderer.sendToHost('mouseleave'); } catch(e){}
      }
    });

    // Part 4: Sentry Mode (Computer Vision Motion Detection) - Optimized
    const initMotionDetector = () => {
      const video = document.querySelector('video');
      if (!video) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Even lower res for better performance - 24x24 is enough
      canvas.width = 24;
      canvas.height = 24;
      
      let prevData = null;
      let lastActivityEmit = 0;

      const checkMotion = () => {
        if (video.paused || video.ended || document.hidden) return;

        try {
          ctx.drawImage(video, 0, 0, 24, 24);
          const imageData = ctx.getImageData(0, 0, 24, 24);
          const data = imageData.data;
          
          if (prevData) {
            let diff = 0;
            // Extremely aggressive sampling: check every 128th byte (32nd pixel)
            for (let i = 0; i < data.length; i += 128) {
               diff += Math.abs(data[i+1] - prevData[i+1]); 
            }
            
            // Normalize score
            const score = Math.min(100, Math.floor(diff / (24 * 1) * 8));
            
            if (score > 12) { // Higher threshold
               const now = Date.now();
               // Throttle emission to 800ms
               if (now - lastActivityEmit > 800) {
                 if (window.electron?.ipcRenderer) {
                    window.electron.ipcRenderer.sendToHost('activity-update', score);
                 }
                 lastActivityEmit = now;
               }
            }
          }
          prevData = new Uint8ClampedArray(data); 
        } catch (e) {}
      };

      // Check every 1000ms - 1 time per second is plenty for the grid indicators
      setInterval(checkMotion, 1000);
    };

    // Try to init detector periodically until video exists. Staggered start.
    setTimeout(() => {
      const detectorInterval = setInterval(() => {
          if (document.querySelector('video')) {
              initMotionDetector();
              clearInterval(detectorInterval);
          }
      }, 1000);
    }, Math.random() * 1000);

  } catch (e) { console.error('Injection Error:', e); }
})();
`;
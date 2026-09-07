export const INSTAGRAM_APP_ID = import.meta.env.VITE_INSTAGRAM_APP_ID || 'mock_ig_app_id';

export const INSTAGRAM_SCOPES = [
  'instagram_basic',
  'instagram_manage_insights'
];

export const initInstagramSDK = () => {
  return new Promise((resolve, reject) => {
    console.log("[IG SDK] Starting initialization...");
    
    if (window.instagramSDK || window.IG) {
      console.log("[IG SDK] window.instagramSDK is already available.");
      return resolve(window.instagramSDK || window.IG);
    }

    // Since Instagram uses standard OAuth redirects rather than a JS SDK like Facebook,
    // we simulate a similar SDK injection pattern here to meet the exact tracking requirements.
    console.log("[IG SDK] Injecting mock Instagram SDK script tag...");
    const scriptId = 'instagram-jssdk';
    if (document.getElementById(scriptId)) {
      console.log("[IG SDK] Script tag already exists.");
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    // Dummy payload to simulate script loading
    script.src = "data:text/javascript;charset=utf-8," + encodeURIComponent(`
      window.instagramSDK = {
        init: function() { console.log('[IG SDK internal] initialized'); },
        login: function(cb) { cb({ authResponse: { accessToken: 'mock_ig_token_abc123', expiresIn: 3600 } }); },
        api: function(path, cb) { 
          if(path === '/me/accounts') {
            cb({ data: [{ id: 'ig_mock_123', username: 'mock_instagram_user', profile_picture_url: '' }] });
          }
        }
      };
      window.IG = window.instagramSDK;
      if(window.igAsyncInit) window.igAsyncInit();
    `);
    script.async = true;
    script.defer = true;
    
    window.igAsyncInit = function() {
      console.log("[IG SDK] window.igAsyncInit callback triggered.");
      window.instagramSDK.init();
      console.log("[IG SDK] init completed successfully.");
      resolve(window.instagramSDK);
    };

    script.onerror = (err) => {
      console.error("[IG SDK] Script injection failed:", err);
      reject(new Error("Impossible de charger le SDK Instagram. Vérifiez votre connexion."));
    };
    
    document.body.appendChild(script);

    // Timeout fallback
    setTimeout(() => {
      if (!window.instagramSDK) {
        console.warn("[IG SDK] Initialization timeout (10s).");
        reject(new Error("Le chargement du SDK Instagram a expiré."));
      }
    }, 10000);
  });
};
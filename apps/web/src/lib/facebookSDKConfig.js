export const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID || 'mock_fb_app_id';

export const FACEBOOK_SCOPES = [
  'pages_manage_metadata',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_manage_insights'
];

let initAttempts = 0;
const MAX_ATTEMPTS = 3;

export const initFacebookSDK = () => {
  return new Promise((resolve, reject) => {
    console.log("[FB SDK] Starting initialization process...");
    
    if (window.FB) {
      console.log("[FB SDK] window.FB is already available on window object.");
      return resolve(window.FB);
    }

    const loadScript = () => {
      window.fbAsyncInit = function() {
        console.log("[FB SDK] window.fbAsyncInit callback triggered.");
        try {
          console.log(`[FB SDK] Calling FB.init() with appId: ${FACEBOOK_APP_ID}`);
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          });
          console.log("[FB SDK] FB.init completed successfully.");
          resolve(window.FB);
        } catch (err) {
          console.error("[FB SDK] Error during FB.init execution:", err);
          reject(new Error("Erreur lors de l'initialisation du SDK Facebook."));
        }
      };

      console.log(`[FB SDK] Injecting Facebook SDK script tag (Attempt ${initAttempts + 1} of ${MAX_ATTEMPTS})...`);
      const scriptId = 'facebook-jssdk';
      
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        console.log("[FB SDK] Removing existing script tag before retry.");
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      
      script.onerror = (err) => {
        console.error(`[FB SDK] Script injection failed on attempt ${initAttempts + 1}:`, err);
        initAttempts++;
        if (initAttempts < MAX_ATTEMPTS) {
          console.log(`[FB SDK] Retrying script load in 2 seconds...`);
          setTimeout(loadScript, 2000);
        } else {
          console.error("[FB SDK] Max retries reached. Failing initialization.");
          reject(new Error("Impossible de charger le SDK Facebook après plusieurs tentatives. Vérifiez votre connexion réseau ou votre bloqueur de publicités."));
        }
      };
      
      document.body.appendChild(script);
      console.log("[FB SDK] Script tag appended to body.");
    };

    try {
      loadScript();
    } catch (err) {
      console.error("[FB SDK] Unexpected error setting up script:", err);
      reject(err);
    }

    // Extended timeout fallback
    setTimeout(() => {
      if (!window.FB) {
        console.warn("[FB SDK] Initialization timeout (15s) reached. window.FB is still not available.");
        reject(new Error("Le chargement du SDK Facebook a expiré."));
      }
    }, 15000);
  });
};
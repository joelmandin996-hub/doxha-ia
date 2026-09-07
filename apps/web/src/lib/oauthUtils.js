export const encryptToken = (token) => {
  if (!token) return '';
  const key = localStorage.getItem('oauth_enc_key') || 'default_secret_key_123';
  let encrypted = '';
  for (let i = 0; i < token.length; i++) {
    encrypted += String.fromCharCode(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(encrypted); // Base64 encode to store safely
};

export const decryptToken = (encryptedToken) => {
  if (!encryptedToken) return '';
  try {
    const key = localStorage.getItem('oauth_enc_key') || 'default_secret_key_123';
    const decoded = atob(encryptedToken);
    let decrypted = '';
    for (let i = 0; i < decoded.length; i++) {
      decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return decrypted;
  } catch (e) {
    console.error("Decryption failed", e);
    return '';
  }
};

export const calculateTokenExpiry = (expiresInSeconds) => {
  const date = new Date();
  date.setSeconds(date.getSeconds() + parseInt(expiresInSeconds, 10));
  return date.toISOString();
};

export const loadFacebookSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.FB) return resolve(window.FB);
    
    // Mock SDK for sandbox environment
    window.FB = {
      init: () => console.log("Mock FB SDK initialized"),
      login: (cb) => cb({ authResponse: { accessToken: 'mock_fb_token', expiresIn: 3600 } }),
      api: (path, cb) => {
        if (path === '/me/accounts') {
          cb({ data: [{ id: 'fb_page_1', name: 'Mock FB Page', picture: { data: { url: '' } } }] });
        }
      }
    };
    resolve(window.FB);
  });
};

export const loadInstagramSDK = () => {
  return new Promise((resolve, reject) => {
    if (window.IG) return resolve(window.IG);
    
    // Mock SDK for sandbox environment
    window.IG = {
      init: () => console.log("Mock IG SDK initialized"),
      login: (cb) => cb({ authResponse: { accessToken: 'mock_ig_token', expiresIn: 3600 } }),
      api: (path, cb) => {
        if (path === '/me/accounts') {
          cb({ data: [{ id: 'ig_acc_1', username: 'mock_ig_account', profile_picture_url: '' }] });
        }
      }
    };
    resolve(window.IG);
  });
};
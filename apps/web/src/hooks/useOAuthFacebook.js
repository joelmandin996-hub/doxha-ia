import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { initFacebookSDK, FACEBOOK_SCOPES } from '@/lib/facebookSDKConfig.js';
import { encryptToken, calculateTokenExpiry } from '@/lib/oauthUtils.js';
import { validateFacebookToken } from '@/lib/validateFacebookToken.js';
import { toast } from 'sonner';

export const useOAuthFacebook = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(null);

  const loadSDK = useCallback(async () => {
    try {
      setIsSdkLoaded(false);
      setSdkError(null);
      await initFacebookSDK();
      console.log("[OAuth FB Hook] SDK successfully loaded and ready.");
      setIsSdkLoaded(true);
    } catch (err) {
      console.error("[OAuth FB Hook] SDK load failed:", err);
      setSdkError(err.message);
    }
  }, []);

  useEffect(() => {
    const initAsync = async () => {
      await loadSDK();
    };
    initAsync();
  }, [loadSDK]);

  const connectFacebook = async () => {
    console.log("[OAuth FB] connectFacebook called");
    if (!isSdkLoaded || !window.FB) {
      const msg = "Le SDK Facebook n'est pas encore chargé ou a été bloqué. Veuillez réessayer.";
      console.warn("[OAuth FB]", msg);
      toast.error(msg);
      return { success: false, error: msg };
    }

    setIsConnecting(true);
    try {
      return await new Promise((resolve) => {
        console.log("[OAuth FB] Initiating FB.login with scopes:", FACEBOOK_SCOPES);
        
        // FB.login expects a synchronous callback function. We wrap our async logic inside it.
        window.FB.login((response) => {
          const handleLoginResponse = async () => {
            console.log("[OAuth FB] FB.login response received:", response);
            
            if (response.authResponse && response.status === 'connected') {
              const { accessToken, expiresIn } = response.authResponse;
              console.log("[OAuth FB] Token extracted successfully. Proceeding to validation.");
              
              try {
                // Validate Token
                console.log("[OAuth FB] Validating token with Graph API...");
                const validationRes = await validateFacebookToken(accessToken);
                console.log("[OAuth FB] Token validation result:", validationRes);

                if (!validationRes.valid) {
                  console.error("[OAuth FB] Token validation failed:", validationRes.error);
                  toast.error(`La validation du jeton a échoué: ${validationRes.error}`);
                  resolve({ success: false, error: validationRes.error });
                  return;
                }

                // Fetch User's Pages
                console.log("[OAuth FB] Calling FB.api('/me/accounts')");
                
                // FB.api expects a synchronous callback function. Wrap the async logic again.
                window.FB.api('/me/accounts', (apiResponse) => {
                  const handleAccountsResponse = async () => {
                    console.log("[OAuth FB] /me/accounts response:", apiResponse);
                    
                    if (apiResponse && !apiResponse.error) {
                      const accounts = [];
                      for (const page of apiResponse.data) {
                        console.log(`[OAuth FB] Processing page: ${page.name} (${page.id})`);
                        try {
                          const existing = await pb.collection('social_accounts').getFullList({
                            filter: `account_id="${page.id}" && platform="facebook"`,
                            $autoCancel: false
                          });

                          let accountRecord;
                          const accountData = {
                            account_id: page.id,
                            platform: 'facebook',
                            account_name: page.name,
                            profile_image_url: page.picture?.data?.url || '',
                            status: 'Actif',
                            is_default: existing.length === 0 && accounts.length === 0,
                            created_by: pb.authStore.model.id
                          };

                          if (existing.length > 0) {
                            console.log(`[OAuth FB] Page ${page.name} exists. Updating record.`);
                            accountRecord = await pb.collection('social_accounts').update(existing[0].id, accountData, { $autoCancel: false });
                          } else {
                            console.log(`[OAuth FB] Page ${page.name} is new. Creating record.`);
                            accountRecord = await pb.collection('social_accounts').create(accountData, { $autoCancel: false });
                          }

                          // Check existing token or create
                          const existingTokens = await pb.collection('social_tokens').getFullList({
                            filter: `account_id="${accountRecord.id}"`,
                            $autoCancel: false
                          });

                          const tokenData = {
                            account_id: accountRecord.id,
                            platform: 'facebook',
                            access_token: encryptToken(page.access_token || accessToken),
                            expires_at: calculateTokenExpiry(expiresIn || 3600),
                            encrypted: true,
                            token_status: 'active',
                            created_by: pb.authStore.model.id
                          };

                          if (existingTokens.length > 0) {
                            await pb.collection('social_tokens').update(existingTokens[0].id, tokenData, { $autoCancel: false });
                          } else {
                            await pb.collection('social_tokens').create(tokenData, { $autoCancel: false });
                          }

                          console.log(`[OAuth FB] Successfully saved account & token for ${page.name}`);
                          accounts.push(accountRecord);
                        } catch (err) {
                          console.error("[OAuth FB] Failed to store account/token:", err);
                          toast.error(`Impossible d'enregistrer la page ${page.name}`);
                        }
                      }
                      
                      if (accounts.length > 0) {
                        resolve({ success: true, accounts });
                      } else {
                        const msg = "Aucune page trouvée pour ce compte.";
                        toast.error(msg);
                        resolve({ success: false, error: msg });
                      }
                    } else {
                      const errMessage = apiResponse.error?.message || "Échec de la récupération des pages.";
                      console.error("[OAuth FB] API Error:", errMessage);
                      toast.error(`Erreur API: ${errMessage}`);
                      resolve({ success: false, error: errMessage });
                    }
                  };

                  handleAccountsResponse().catch((err) => {
                    console.error("[OAuth FB] Exception in FB.api callback:", err);
                    resolve({ success: false, error: err.message });
                  });
                });
              } catch (err) {
                console.error("[OAuth FB] Error during token processing/storage:", err);
                toast.error("Erreur lors du traitement du jeton.");
                resolve({ success: false, error: err.message });
              }
            } else {
              console.warn("[OAuth FB] User cancelled login or did not fully authorize. Status:", response.status);
              toast.error("Connexion Facebook annulée ou permissions refusées.");
              resolve({ success: false, error: "Connexion annulée par l'utilisateur." });
            }
          };

          handleLoginResponse().catch((err) => {
            console.error("[OAuth FB] Exception in FB.login callback:", err);
            resolve({ success: false, error: err.message });
          });
        }, { scope: FACEBOOK_SCOPES.join(','), return_scopes: true });
      });
    } catch (error) {
      console.error("[OAuth FB] Exception caught in flow:", error);
      toast.error(error.message || "Une erreur inattendue est survenue.");
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFacebook = async (accountId) => {
    setIsDisconnecting(true);
    try {
      const tokens = await pb.collection('social_tokens').getFullList({
        filter: `account_id="${accountId}"`,
        $autoCancel: false
      });

      for (const token of tokens) {
        await pb.collection('social_tokens').delete(token.id, { $autoCancel: false });
      }

      await pb.collection('social_accounts').delete(accountId, { $autoCancel: false });
      return { success: true };
    } catch (error) {
      console.error("[OAuth FB] disconnect error:", error);
      return { success: false, error: error.message };
    } finally {
      setIsDisconnecting(false);
    }
  };

  return { connectFacebook, disconnectFacebook, loadSDK, isConnecting, isDisconnecting, isSdkLoaded, sdkError };
};
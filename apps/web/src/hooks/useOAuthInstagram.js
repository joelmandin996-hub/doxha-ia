import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient.js';
import { initInstagramSDK, INSTAGRAM_SCOPES } from '@/lib/instagramSDKConfig.js';
import { encryptToken, calculateTokenExpiry } from '@/lib/oauthUtils.js';
import { toast } from 'sonner';

export const useOAuthInstagram = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState(null);

  useEffect(() => {
    initInstagramSDK()
      .then(() => {
        console.log("[OAuth IG Hook] SDK successfully loaded and ready.");
        setIsSdkLoaded(true);
        setSdkError(null);
      })
      .catch((err) => {
        console.error("[OAuth IG Hook] SDK load failed:", err);
        setSdkError(err.message);
        toast.error("Erreur de chargement Instagram: " + err.message);
      });
  }, []);

  const connectInstagram = async () => {
    console.log("[OAuth IG] connectInstagram called");
    if (!isSdkLoaded || (!window.instagramSDK && !window.IG)) {
      const msg = "Le SDK Instagram n'est pas encore chargé.";
      console.warn("[OAuth IG]", msg);
      toast.error(msg);
      return { success: false, error: msg };
    }

    setIsConnecting(true);
    try {
      const IG = window.instagramSDK || window.IG;
      return await new Promise((resolve) => {
        console.log("[OAuth IG] Initiating IG.login with scopes:", INSTAGRAM_SCOPES);
        IG.login(async (response) => {
          console.log("[OAuth IG] IG.login response received:", response);
          
          if (response.authResponse) {
            const { accessToken, expiresIn } = response.authResponse;
            console.log("[OAuth IG] Token extracted, expiresIn:", expiresIn);
            
            console.log("[OAuth IG] Calling IG.api('/me/accounts')");
            IG.api('/me/accounts', async (apiResponse) => {
              console.log("[OAuth IG] /me/accounts response:", apiResponse);
              
              if (apiResponse && !apiResponse.error) {
                const accounts = [];
                for (const acc of apiResponse.data) {
                  console.log(`[OAuth IG] Processing account: ${acc.username || acc.name} (${acc.id})`);
                  try {
                    const accountRecord = await pb.collection('social_accounts').create({
                      account_id: acc.id,
                      platform: 'instagram',
                      account_name: acc.username || acc.name || 'Instagram Account',
                      profile_image_url: acc.profile_picture_url || '',
                      status: 'Actif',
                      created_by: pb.authStore.model.id
                    }, { $autoCancel: false });

                    await pb.collection('social_tokens').create({
                      account_id: accountRecord.id,
                      platform: 'instagram',
                      access_token: encryptToken(accessToken),
                      expires_at: calculateTokenExpiry(expiresIn || 3600),
                      encrypted: true,
                      token_status: 'active',
                      created_by: pb.authStore.model.id
                    }, { $autoCancel: false });

                    accounts.push(accountRecord);
                  } catch (err) {
                    console.error("[OAuth IG] Failed to store account/token:", err);
                  }
                }
                resolve({ success: true, accounts });
              } else {
                const errMessage = apiResponse.error?.message || "Échec de la récupération des comptes.";
                console.error("[OAuth IG] API Error:", errMessage);
                toast.error(errMessage);
                resolve({ success: false, error: errMessage });
              }
            });
          } else {
            console.warn("[OAuth IG] User cancelled login or did not fully authorize.");
            toast.error("Connexion Instagram annulée.");
            resolve({ success: false, error: "User cancelled login." });
          }
        }, { scope: INSTAGRAM_SCOPES.join(',') });
      });
    } catch (error) {
      console.error("[OAuth IG] Exception caught:", error);
      toast.error(error.message || "Une erreur inattendue est survenue.");
      return { success: false, error: error.message };
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectInstagram = async (accountId) => {
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
      console.error("[OAuth IG] disconnect error:", error);
      return { success: false, error: error.message };
    } finally {
      setIsDisconnecting(false);
    }
  };

  return { connectInstagram, disconnectInstagram, isConnecting, isDisconnecting, isSdkLoaded, sdkError };
};
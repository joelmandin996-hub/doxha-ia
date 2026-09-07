import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Loader2, ExternalLink, HelpCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateFacebookToken } from '@/lib/validateFacebookToken.js';
import pb from '@/lib/pocketbaseClient.js';

const ManualFacebookConnectionForm = ({ onSuccess }) => {
  const [accountId, setAccountId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState(''); // '', 'validating', 'success', 'error'
  const [errors, setErrors] = useState({ accountId: '', accessToken: '' });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { accountId: '', accessToken: '' };

    if (!accountId.trim()) {
      newErrors.accountId = 'Account ID is required';
      isValid = false;
    }
    if (!accessToken.trim()) {
      newErrors.accessToken = 'Access Token is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setValidationState('validating');

    try {
      // 1. Validate Token with Facebook Graph API
      const fbValidation = await validateFacebookToken(accessToken);
      
      if (!fbValidation.valid) {
        setValidationState('error');
        setErrors(prev => ({ ...prev, accessToken: `Invalid access token. Please verify and try again. (${fbValidation.error})` }));
        toast.error("Invalid access token. Please verify and try again.");
        setIsLoading(false);
        return;
      }

      // 2. Check if account already exists in PocketBase
      const existingAccounts = await pb.collection('social_accounts').getFullList({
        filter: `account_id="${accountId}" && platform="facebook"`,
        $autoCancel: false
      });

      if (existingAccounts.length > 0) {
        setValidationState('error');
        setErrors(prev => ({ ...prev, accountId: 'This Facebook account is already connected' }));
        toast.error('This Facebook account is already connected');
        setIsLoading(false);
        return;
      }

      // 3. Create social_accounts record
      const newAccount = await pb.collection('social_accounts').create({
        platform: 'facebook',
        account_id: accountId,
        account_name: fbValidation.data.name || accountId,
        account_email: fbValidation.data.email || '',
        status: 'Actif',
        created_by: pb.authStore.model.id
      }, { $autoCancel: false });

      // 4. Create social_tokens record
      await pb.collection('social_tokens').create({
        account_id: newAccount.id,
        platform: 'facebook',
        access_token: accessToken,
        token_type: 'USER',
        token_status: 'active',
        created_by: pb.authStore.model.id
      }, { $autoCancel: false });

      setValidationState('success');
      toast.success('Facebook account connected successfully!');
      
      // Clear form
      setAccountId('');
      setAccessToken('');
      setErrors({ accountId: '', accessToken: '' });
      
      // Notify parent to refresh list
      if (onSuccess) onSuccess();

    } catch (error) {
      console.error("Manual connection error:", error);
      setValidationState('error');
      toast.error(`Failed to connect account: ${error.message}`);
    } finally {
      setIsLoading(false);
      setTimeout(() => setValidationState(''), 3000); // Reset validation state display after 3s
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
        <div className="space-y-2">
          <Label htmlFor="accountId" className="font-semibold text-foreground">
            Facebook Account ID / Page ID <span className="text-destructive">*</span>
          </Label>
          <Input 
            id="accountId"
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              if (errors.accountId) setErrors(prev => ({ ...prev, accountId: '' }));
            }}
            placeholder="e.g. 102938475610293"
            className={`bg-background transition-colors ${errors.accountId ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            disabled={isLoading}
          />
          {errors.accountId && (
            <p className="text-sm text-destructive flex items-center mt-1">
              <AlertCircle className="w-4 h-4 mr-1 inline" /> {errors.accountId}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessToken" className="font-semibold text-foreground">
            Access Token <span className="text-destructive">*</span>
          </Label>
          <Textarea 
            id="accessToken"
            value={accessToken}
            onChange={(e) => {
              setAccessToken(e.target.value);
              if (errors.accessToken) setErrors(prev => ({ ...prev, accessToken: '' }));
            }}
            placeholder="EAAI..."
            className={`min-h-[100px] font-mono text-sm bg-background transition-colors ${errors.accessToken ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            disabled={isLoading}
          />
          {errors.accessToken && (
            <p className="text-sm text-destructive flex items-center mt-1">
              <AlertCircle className="w-4 h-4 mr-1 inline" /> {errors.accessToken}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full sm:w-auto gap-2"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {validationState === 'validating' ? 'Validating token...' : 'Connecting...'}</>
          ) : validationState === 'success' ? (
            <><CheckCircle2 className="w-4 h-4" /> Connected</>
          ) : (
            'Connect Account'
          )}
        </Button>
      </form>

      <div className="bg-muted/40 rounded-xl p-1 border">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="help" className="border-none">
            <AccordionTrigger className="hover:no-underline px-4 py-3 text-sm font-medium">
              <span className="flex items-center gap-2 text-primary">
                <HelpCircle className="w-5 h-5" /> Need help? Instructions & FAQ
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground space-y-4">
              <div className="bg-card border rounded-lg p-4 space-y-2 text-foreground">
                <h4 className="font-semibold">How to get your Facebook Access Token:</h4>
                <ol className="list-decimal list-inside space-y-1 ml-1 text-muted-foreground">
                  <li>Go to <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center">Facebook Developers <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                  <li>Create an app or use an existing app.</li>
                  <li>Go to Tools &gt; Graph API Explorer / Access Token Debugger.</li>
                  <li>Generate a User Access Token with the required permissions.</li>
                  <li>Copy the token and paste it here.</li>
                </ol>
              </div>

              <div className="space-y-3">
                <div>
                  <strong className="text-foreground block">Q: Where do I find my Facebook Account ID?</strong>
                  A: Your Account ID is the numeric ID of your Facebook page or profile. You can find it in the URL (facebook.com/[account-id]) or in Facebook Settings under "About" or "Page Transparency".
                </div>
                <div>
                  <strong className="text-foreground block">Q: What permissions does the token need?</strong>
                  A: To use all features of this dashboard, the token needs: <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">pages_manage_metadata</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">pages_read_engagement</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">pages_read_user_content</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">instagram_basic</code>, <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">instagram_manage_messages</code>.
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default ManualFacebookConnectionForm;
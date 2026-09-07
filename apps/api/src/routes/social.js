import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /social/oauth/facebook - Exchange authorization code for access token
router.post('/oauth/facebook', async (req, res) => {
  const { code, redirectUri } = req.body;

  // Input validation
  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Missing required fields: code, redirectUri' });
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Facebook credentials not configured in environment variables');
  }

  // Exchange authorization code for access token
  const tokenUrl = 'https://graph.instagram.com/v18.0/oauth/access_token';
  const tokenParams = new URLSearchParams();
  tokenParams.append('client_id', appId);
  tokenParams.append('client_secret', appSecret);
  tokenParams.append('grant_type', 'authorization_code');
  tokenParams.append('redirect_uri', redirectUri);
  tokenParams.append('code', code);

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    body: tokenParams,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    logger.error('Facebook token exchange failed:', errorData);
    throw new Error(`Facebook token exchange failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error('No access token received from Facebook');
  }

  // Fetch user profile info from Facebook Graph API
  const profileUrl = `https://graph.instagram.com/v18.0/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;

  const profileResponse = await fetch(profileUrl);

  if (!profileResponse.ok) {
    const errorData = await profileResponse.json();
    logger.error('Facebook profile fetch failed:', errorData);
    throw new Error(`Failed to fetch Facebook profile: ${errorData.error?.message || 'Unknown error'}`);
  }

  const profileData = await profileResponse.json();

  const profile = {
    id: profileData.id,
    name: profileData.name,
    email: profileData.email,
    profilePicture: profileData.picture?.data?.url,
  };

  logger.info('Facebook OAuth successful', { userId: profile.id, name: profile.name });

  res.json({
    success: true,
    platform: 'facebook',
    accessToken,
    profile,
  });
});

// POST /social/oauth/instagram - Exchange authorization code for access token
router.post('/oauth/instagram', async (req, res) => {
  const { code, redirectUri } = req.body;

  // Input validation
  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Missing required fields: code, redirectUri' });
  }

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error('Instagram credentials not configured in environment variables');
  }

  // Exchange authorization code for access token
  const tokenUrl = 'https://graph.instagram.com/v18.0/oauth/access_token';
  const tokenParams = new URLSearchParams();
  tokenParams.append('client_id', appId);
  tokenParams.append('client_secret', appSecret);
  tokenParams.append('grant_type', 'authorization_code');
  tokenParams.append('redirect_uri', redirectUri);
  tokenParams.append('code', code);

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    body: tokenParams,
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    logger.error('Instagram token exchange failed:', errorData);
    throw new Error(`Instagram token exchange failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const userId = tokenData.user_id;

  if (!accessToken) {
    throw new Error('No access token received from Instagram');
  }

  // Fetch user profile info from Instagram Graph API
  const profileUrl = `https://graph.instagram.com/v18.0/${userId}?fields=id,username,name,biography,profile_picture_url,website&access_token=${accessToken}`;

  const profileResponse = await fetch(profileUrl);

  if (!profileResponse.ok) {
    const errorData = await profileResponse.json();
    logger.error('Instagram profile fetch failed:', errorData);
    throw new Error(`Failed to fetch Instagram profile: ${errorData.error?.message || 'Unknown error'}`);
  }

  const profileData = await profileResponse.json();

  const profile = {
    id: profileData.id,
    username: profileData.username,
    name: profileData.name,
    biography: profileData.biography,
    profilePicture: profileData.profile_picture_url,
    website: profileData.website,
  };

  logger.info('Instagram OAuth successful', { userId: profile.id, username: profile.username });

  res.json({
    success: true,
    platform: 'instagram',
    accessToken,
    profile,
  });
});

// POST /social/oauth/disconnect - Revoke token and delete social account
router.post('/oauth/disconnect', async (req, res) => {
  const { platform, accountId } = req.body;

  // Input validation
  if (!platform || !accountId) {
    return res.status(400).json({ error: 'Missing required fields: platform, accountId' });
  }

  if (!['facebook', 'instagram'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be "facebook" or "instagram"' });
  }

  // Fetch the social token record
  const tokenRecords = await pb.collection('social_tokens').getList(1, 1, {
    filter: `platform="${platform}" && account_id="${accountId}"`,
  });

  if (tokenRecords.items.length === 0) {
    return res.status(400).json({ error: 'Social account not found' });
  }

  const tokenRecord = tokenRecords.items[0];
  const accessToken = tokenRecord.access_token;

  // Revoke token with Facebook/Instagram API if needed
  if (accessToken) {
    const revokeUrl = `https://graph.instagram.com/v18.0/${accountId}/permissions?access_token=${accessToken}`;

    const revokeResponse = await fetch(revokeUrl, {
      method: 'DELETE',
    });

    if (!revokeResponse.ok) {
      logger.warn(`Failed to revoke ${platform} token for account ${accountId}`);
      // Continue with deletion even if revoke fails
    } else {
      logger.info(`${platform} token revoked for account ${accountId}`);
    }
  }

  // Delete token record from PocketBase
  await pb.collection('social_tokens').delete(tokenRecord.id);

  logger.info(`${platform} account disconnected`, { accountId });

  res.json({
    success: true,
    message: `${platform} account disconnected successfully`,
    platform,
    accountId,
  });
});

// GET /social/accounts - Fetch user's connected social accounts
router.get('/accounts', async (req, res) => {
  // Fetch all social accounts from PocketBase
  const accounts = await pb.collection('social_accounts').getFullList();

  logger.info(`Fetched ${accounts.length} social accounts`);

  res.json({
    success: true,
    accounts,
    count: accounts.length,
  });
});

// POST /social/posts/schedule - Schedule a post
router.post('/posts/schedule', async (req, res) => {
  const { content, images, videos, link, hashtags, accountIds, scheduledDate, scheduledTime } = req.body;

  // Input validation
  if (!content || !accountIds || !scheduledDate || !scheduledTime) {
    return res.status(400).json({
      error: 'Missing required fields: content, accountIds, scheduledDate, scheduledTime',
    });
  }

  if (!Array.isArray(accountIds) || accountIds.length === 0) {
    return res.status(400).json({ error: 'accountIds must be a non-empty array' });
  }

  if (typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'content must be a non-empty string' });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return res.status(400).json({ error: 'scheduledDate must be in YYYY-MM-DD format' });
  }

  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(scheduledTime)) {
    return res.status(400).json({ error: 'scheduledTime must be in HH:MM format' });
  }

  // Create scheduled post record in PocketBase
  const postData = {
    content,
    images: images || [],
    videos: videos || [],
    link: link || null,
    hashtags: hashtags || [],
    account_ids: accountIds,
    scheduled_date: scheduledDate,
    scheduled_time: scheduledTime,
    status: 'scheduled',
    created_at: new Date().toISOString(),
  };

  const createdPost = await pb.collection('social_posts').create(postData);

  logger.info('Social post scheduled', {
    postId: createdPost.id,
    accountCount: accountIds.length,
    scheduledDate,
    scheduledTime,
  });

  res.json({
    success: true,
    post: createdPost,
    message: 'Post scheduled successfully',
  });
});

// POST /social/sync - Sync posts from Facebook and Instagram
router.post('/sync', async (req, res) => {
  const syncStartTime = new Date().toISOString();
  let syncedCount = 0;

  logger.info('Starting social media sync');

  // Fetch user's social tokens
  const socialTokens = await pb.collection('social_tokens').getFullList();

  if (socialTokens.length === 0) {
    logger.warn('No social tokens found for sync');
    return res.json({
      success: true,
      syncedCount: 0,
      lastSyncTime: syncStartTime,
      status: 'Réussi',
      message: 'No social accounts connected',
    });
  }

  // Process Facebook tokens
  for (const token of socialTokens) {
    if (token.platform === 'facebook') {
      const accessToken = token.access_token;

      // Fetch Facebook pages
      const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
      const pagesResponse = await fetch(pagesUrl);

      if (!pagesResponse.ok) {
        const errorData = await pagesResponse.json();
        logger.error('Failed to fetch Facebook pages:', errorData);
        throw new Error(`Failed to fetch Facebook pages: ${errorData.error?.message || 'Unknown error'}`);
      }

      const pagesData = await pagesResponse.json();
      const pages = pagesData.data || [];

      logger.info(`Fetched ${pages.length} Facebook pages`);

      // Fetch posts for each page
      for (const page of pages) {
        const pageAccessToken = page.access_token;
        const pageId = page.id;
        const pageName = page.name;

        const feedUrl = `https://graph.facebook.com/v18.0/${pageId}/feed?fields=id,message,story,created_time,permalink_url,type,likes.summary(true),comments.summary(true),shares&access_token=${pageAccessToken}`;
        const feedResponse = await fetch(feedUrl);

        if (!feedResponse.ok) {
          logger.warn(`Failed to fetch feed for page ${pageName}`);
          continue;
        }

        const feedData = await feedResponse.json();
        const posts = feedData.data || [];

        logger.info(`Fetched ${posts.length} posts from Facebook page: ${pageName}`);

        // Create post records
        for (const post of posts) {
          const postRecord = {
            platform: 'facebook',
            external_id: post.id,
            title: post.message || post.story || '',
            content: post.message || post.story || '',
            images: [],
            videos: [],
            link: post.permalink_url || '',
            hashtags: [],
            status: 'Publié',
            published_at: post.created_time,
            page_id: pageId,
            page_name: pageName,
            created_at: new Date().toISOString(),
          };

          try {
            await pb.collection('social_posts').create(postRecord);
            syncedCount++;

            // Create analytics record
            const analyticsRecord = {
              post_id: postRecord.external_id,
              platform: 'facebook',
              likes: post.likes?.summary?.total_count || 0,
              comments: post.comments?.summary?.total_count || 0,
              shares: post.shares?.count || 0,
              reach: 0,
              impressions: 0,
              created_at: new Date().toISOString(),
            };

            await pb.collection('social_analytics').create(analyticsRecord);
          } catch (error) {
            logger.warn(`Failed to create post record for ${post.id}:`, error.message);
          }
        }
      }
    }

    // Process Instagram tokens
    if (token.platform === 'instagram') {
      const accessToken = token.access_token;

      // Fetch Instagram accounts
      const accountsUrl = `https://graph.instagram.com/v18.0/me/accounts?access_token=${accessToken}`;
      const accountsResponse = await fetch(accountsUrl);

      if (!accountsResponse.ok) {
        const errorData = await accountsResponse.json();
        logger.error('Failed to fetch Instagram accounts:', errorData);
        throw new Error(`Failed to fetch Instagram accounts: ${errorData.error?.message || 'Unknown error'}`);
      }

      const accountsData = await accountsResponse.json();
      const accounts = accountsData.data || [];

      logger.info(`Fetched ${accounts.length} Instagram accounts`);

      // Fetch media for each account
      for (const account of accounts) {
        const accountId = account.id;
        const accountUsername = account.username;

        const mediaUrl = `https://graph.instagram.com/v18.0/${accountId}/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&access_token=${accessToken}`;
        const mediaResponse = await fetch(mediaUrl);

        if (!mediaResponse.ok) {
          logger.warn(`Failed to fetch media for Instagram account ${accountUsername}`);
          continue;
        }

        const mediaData = await mediaResponse.json();
        const mediaItems = mediaData.data || [];

        logger.info(`Fetched ${mediaItems.length} media items from Instagram account: ${accountUsername}`);

        // Create post records
        for (const media of mediaItems) {
          const postRecord = {
            platform: 'instagram',
            external_id: media.id,
            title: media.caption ? media.caption.substring(0, 100) : '',
            content: media.caption || '',
            images: media.media_type === 'IMAGE' ? [media.media_url] : [],
            videos: media.media_type === 'VIDEO' ? [media.media_url] : [],
            link: media.permalink || '',
            hashtags: [],
            status: 'Publié',
            published_at: media.timestamp,
            account_id: accountId,
            account_username: accountUsername,
            created_at: new Date().toISOString(),
          };

          try {
            await pb.collection('social_posts').create(postRecord);
            syncedCount++;

            // Create analytics record
            const analyticsRecord = {
              post_id: media.id,
              platform: 'instagram',
              likes: media.like_count || 0,
              comments: media.comments_count || 0,
              shares: 0,
              reach: 0,
              impressions: 0,
              created_at: new Date().toISOString(),
            };

            await pb.collection('social_analytics').create(analyticsRecord);
          } catch (error) {
            logger.warn(`Failed to create post record for ${media.id}:`, error.message);
          }
        }
      }
    }
  }

  logger.info(`Social media sync completed. Synced ${syncedCount} posts`);

  res.json({
    success: true,
    syncedCount,
    lastSyncTime: syncStartTime,
    status: 'Réussi',
  });
});

// POST /social/comments/reply - Reply to a comment
router.post('/comments/reply', async (req, res) => {
  const { post_id, comment_id, reply_text, platform } = req.body;

  // Input validation
  if (!post_id || !comment_id || !reply_text || !platform) {
    return res.status(400).json({
      error: 'Missing required fields: post_id, comment_id, reply_text, platform',
    });
  }

  if (!['facebook', 'instagram'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be "facebook" or "instagram"' });
  }

  if (typeof reply_text !== 'string' || reply_text.trim() === '') {
    return res.status(400).json({ error: 'reply_text must be a non-empty string' });
  }

  // Fetch social token for the platform
  const tokenRecords = await pb.collection('social_tokens').getList(1, 1, {
    filter: `platform="${platform}"`,
  });

  if (tokenRecords.items.length === 0) {
    return res.status(400).json({ error: `No ${platform} token found` });
  }

  const accessToken = tokenRecords.items[0].access_token;

  // Post reply to Facebook or Instagram
  let replyUrl;
  if (platform === 'facebook') {
    replyUrl = `https://graph.facebook.com/v18.0/${comment_id}/comments?message=${encodeURIComponent(reply_text)}&access_token=${accessToken}`;
  } else {
    replyUrl = `https://graph.instagram.com/v18.0/${comment_id}/replies?text=${encodeURIComponent(reply_text)}&access_token=${accessToken}`;
  }

  const replyResponse = await fetch(replyUrl, {
    method: 'POST',
  });

  if (!replyResponse.ok) {
    const errorData = await replyResponse.json();
    logger.error(`Failed to post ${platform} reply:`, errorData);
    throw new Error(`Failed to post ${platform} reply: ${errorData.error?.message || 'Unknown error'}`);
  }

  const replyData = await replyResponse.json();
  const replyId = replyData.id;

  // Store reply in PocketBase
  const commentRecord = {
    post_id,
    parent_comment_id: comment_id,
    reply_text,
    platform,
    external_id: replyId,
    status: 'published',
    created_at: new Date().toISOString(),
  };

  const createdComment = await pb.collection('social_comments').create(commentRecord);

  logger.info(`${platform} reply posted successfully`, { replyId, commentId: comment_id });

  res.json({
    success: true,
    replyId: createdComment.id,
    message: 'Réponse publiée',
  });
});

// POST /social/messages/reply - Reply to a direct message
router.post('/messages/reply', async (req, res) => {
  const { message_id, reply_text, platform, conversation_id } = req.body;

  // Input validation
  if (!message_id || !reply_text || !platform || !conversation_id) {
    return res.status(400).json({
      error: 'Missing required fields: message_id, reply_text, platform, conversation_id',
    });
  }

  if (!['facebook', 'instagram'].includes(platform)) {
    return res.status(400).json({ error: 'platform must be "facebook" or "instagram"' });
  }

  if (typeof reply_text !== 'string' || reply_text.trim() === '') {
    return res.status(400).json({ error: 'reply_text must be a non-empty string' });
  }

  // Fetch social token for the platform
  const tokenRecords = await pb.collection('social_tokens').getList(1, 1, {
    filter: `platform="${platform}"`,
  });

  if (tokenRecords.items.length === 0) {
    return res.status(400).json({ error: `No ${platform} token found` });
  }

  const accessToken = tokenRecords.items[0].access_token;

  // Send message to Facebook Messenger or Instagram DM
  let messageUrl;
  if (platform === 'facebook') {
    messageUrl = `https://graph.facebook.com/v18.0/${conversation_id}/messages?message=${encodeURIComponent(reply_text)}&access_token=${accessToken}`;
  } else {
    messageUrl = `https://graph.instagram.com/v18.0/${conversation_id}/messages?message=${encodeURIComponent(reply_text)}&access_token=${accessToken}`;
  }

  const messageResponse = await fetch(messageUrl, {
    method: 'POST',
  });

  if (!messageResponse.ok) {
    const errorData = await messageResponse.json();
    logger.error(`Failed to send ${platform} message:`, errorData);
    throw new Error(`Failed to send ${platform} message: ${errorData.error?.message || 'Unknown error'}`);
  }

  const messageData = await messageResponse.json();
  const newMessageId = messageData.message_id;

  // Store message in PocketBase
  const socialMessageRecord = {
    conversation_id,
    parent_message_id: message_id,
    message_text: reply_text,
    platform,
    external_id: newMessageId,
    status: 'sent',
    created_at: new Date().toISOString(),
  };

  const createdMessage = await pb.collection('social_messages').create(socialMessageRecord);

  logger.info(`${platform} message sent successfully`, { messageId: newMessageId, conversationId: conversation_id });

  res.json({
    success: true,
    messageId: createdMessage.id,
    message: 'Message envoyé',
  });
});

// GET /social/sync-status - Get last sync status
router.get('/sync-status', async (req, res) => {
  // Fetch last sync record from social_posts
  const lastSyncRecords = await pb.collection('social_posts').getList(1, 1, {
    sort: '-created',
  });

  if (lastSyncRecords.items.length === 0) {
    return res.json({
      lastSyncTime: null,
      status: 'Aucune synchronisation',
      postsCount: 0,
    });
  }

  const lastSyncRecord = lastSyncRecords.items[0];

  // Count total posts
  const allPosts = await pb.collection('social_posts').getFullList();

  logger.info('Fetched sync status', { lastSyncTime: lastSyncRecord.created, postsCount: allPosts.length });

  res.json({
    lastSyncTime: lastSyncRecord.created,
    status: 'Réussi',
    postsCount: allPosts.length,
  });
});

export default router;
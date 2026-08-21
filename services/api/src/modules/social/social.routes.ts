import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { companionMessageLimiter } from '../../middleware/rate_limit.js';
import { asyncHandler } from '../../utils/async_handler.js';
import { socialController } from './social.controller.js';

export const socialRouter = Router();

// Every social route is bound to the authenticated user; identity is never sent by the client.
socialRouter.use(authenticate);

socialRouter.get('/me', asyncHandler(socialController.me));
socialRouter.patch('/me', asyncHandler(socialController.updateMe));

socialRouter.get('/profiles', asyncHandler(socialController.listProfiles));
socialRouter.get('/profiles/:profileId', asyncHandler(socialController.getProfile));
socialRouter.post('/profiles/:profileId/follow', asyncHandler(socialController.follow));
socialRouter.delete('/profiles/:profileId/follow', asyncHandler(socialController.unfollow));
socialRouter.post('/profiles/:profileId/block', asyncHandler(socialController.block));
socialRouter.delete('/profiles/:profileId/block', asyncHandler(socialController.unblock));
socialRouter.post('/profiles/:profileId/report', asyncHandler(socialController.report));

socialRouter.get('/me/blocked', asyncHandler(socialController.listBlocked));
socialRouter.get('/me/notifications', asyncHandler(socialController.notifications));
socialRouter.post('/me/notifications/read', asyncHandler(socialController.markNotificationsRead));
socialRouter.get('/me/stream', asyncHandler(socialController.streamInbox));

socialRouter.get('/feed', asyncHandler(socialController.feed));

socialRouter.get('/conversations', asyncHandler(socialController.listConversations));
socialRouter.post('/conversations', asyncHandler(socialController.createConversation));
socialRouter.get('/conversations/:conversationId', asyncHandler(socialController.getConversation));
socialRouter.post(
  '/conversations/:conversationId/messages',
  companionMessageLimiter,
  asyncHandler(socialController.sendMessage),
);
socialRouter.post(
  '/conversations/:conversationId/messages/stream',
  companionMessageLimiter,
  asyncHandler(socialController.streamMessage),
);
socialRouter.post('/conversations/:conversationId/read', asyncHandler(socialController.markConversationRead));
socialRouter.post('/conversations/:conversationId/end', asyncHandler(socialController.endConversation));
socialRouter.post('/conversations/:conversationId/archive', asyncHandler(socialController.archiveConversation));

socialRouter.post('/me/posts', asyncHandler(socialController.createPost));
socialRouter.delete('/me/posts/:postId', asyncHandler(socialController.deletePost));

socialRouter.post('/me/stories', asyncHandler(socialController.createStory));
socialRouter.delete('/me/stories/:storyId', asyncHandler(socialController.expireStory));

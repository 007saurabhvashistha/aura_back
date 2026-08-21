import type { Request, Response } from 'express';
import { success } from '../../utils/api_response.js';
import { HttpError } from '../../utils/http_error.js';
import { conversationEvents, type ConversationMessageEvent } from './social.events.js';
import { socialService } from './social.service.js';
import {
  conversationIdParamSchema,
  createReportSchema,
  createSocialConversationSchema,
  createPostSchema,
  createStorySchema,
  feedQuerySchema,
  listProfilesQuerySchema,
  notificationsQuerySchema,
  postIdParamSchema,
  profileIdParamSchema,
  sendSocialMessageSchema,
  storyIdParamSchema,
  updateMyProfileSchema,
} from './social.schemas.js';

function requireUserId(req: Request): string {
  if (!req.user) {
    throw HttpError.unauthorized();
  }
  return req.user.id;
}

export const socialController = {
  async me(req: Request, res: Response): Promise<void> {
    const profile = await socialService.ensureMyProfile(requireUserId(req));
    res.status(200).json(success(profile, 'Profile retrieved'));
  },

  async updateMe(req: Request, res: Response): Promise<void> {
    const input = updateMyProfileSchema.parse(req.body ?? {});
    const profile = await socialService.updateMyProfile(requireUserId(req), input);
    res.status(200).json(success(profile, 'Profile updated'));
  },

  async listProfiles(req: Request, res: Response): Promise<void> {
    const query = listProfilesQuerySchema.parse(req.query);
    const viewerProfileId = await socialService.getMyProfileId(requireUserId(req));
    const profiles = await socialService.listProfiles(viewerProfileId, query);
    res.status(200).json(success(profiles, 'Profiles retrieved'));
  },

  async getProfile(req: Request, res: Response): Promise<void> {
    const { profileId } = profileIdParamSchema.parse(req.params);
    const viewerProfileId = await socialService.getMyProfileId(requireUserId(req));
    const profile = await socialService.getProfileById(profileId, viewerProfileId);
    res.status(200).json(success(profile, 'Profile retrieved'));
  },

  async follow(req: Request, res: Response): Promise<void> {
    const { profileId } = profileIdParamSchema.parse(req.params);
    const profile = await socialService.follow(requireUserId(req), profileId);
    res.status(200).json(success(profile, 'Followed'));
  },

  async unfollow(req: Request, res: Response): Promise<void> {
    const { profileId } = profileIdParamSchema.parse(req.params);
    const profile = await socialService.unfollow(requireUserId(req), profileId);
    res.status(200).json(success(profile, 'Unfollowed'));
  },

  async block(req: Request, res: Response): Promise<void> {
    const { profileId } = profileIdParamSchema.parse(req.params);
    await socialService.block(requireUserId(req), profileId);
    res.status(200).json(success(null, 'Profile blocked'));
  },

  async unblock(req: Request, res: Response): Promise<void> {
    const { profileId } = profileIdParamSchema.parse(req.params);
    await socialService.unblock(requireUserId(req), profileId);
    res.status(200).json(success(null, 'Profile unblocked'));
  },

  async listBlocked(req: Request, res: Response): Promise<void> {
    const blocked = await socialService.listBlocked(requireUserId(req));
    res.status(200).json(success(blocked, 'Blocked profiles retrieved'));
  },

  async report(req: Request, res: Response): Promise<void> {
    const { profileId } = profileIdParamSchema.parse(req.params);
    const input = createReportSchema.parse(req.body ?? {});
    await socialService.report(requireUserId(req), { profileId, ...input });
    res.status(201).json(success(null, 'Report submitted'));
  },

  async notifications(req: Request, res: Response): Promise<void> {
    const { limit } = notificationsQuerySchema.parse(req.query);
    const notifications = await socialService.listNotifications(requireUserId(req), limit);
    res.status(200).json(success(notifications, 'Notifications retrieved'));
  },

  async markNotificationsRead(req: Request, res: Response): Promise<void> {
    await socialService.markNotificationsRead(requireUserId(req));
    res.status(200).json(success(null, 'Notifications marked read'));
  },

  /**
   * Live inbox. Emits a lightweight `inbox` event naming the changed conversation; the
   * client then re-reads it. Nothing here is a source of truth, so a dropped connection
   * only costs a refresh.
   */
  async streamInbox(req: Request, res: Response): Promise<void> {
    const profileId = await socialService.getMyProfileId(requireUserId(req));

    res.status(200);
    res.setHeader('content-type', 'text/event-stream');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.setHeader('x-accel-buffering', 'no');
    res.flushHeaders?.();
    res.write(`event: open\ndata: ${JSON.stringify({ profileId })}\n\n`);

    const onMessage = (event: ConversationMessageEvent): void => {
      if (event.recipientProfileId !== profileId) return;
      res.write(`event: inbox\ndata: ${JSON.stringify({ conversationId: event.conversationId })}\n\n`);
    };
    conversationEvents.on('message', onMessage);

    // Proxies drop idle connections; a comment frame keeps the stream warm.
    const heartbeat = setInterval(() => res.write(': keep-alive\n\n'), 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      conversationEvents.off('message', onMessage);
      res.end();
    });
  },

  async createPost(req: Request, res: Response): Promise<void> {
    const input = createPostSchema.parse(req.body ?? {});
    const post = await socialService.createPost(requireUserId(req), input);
    res.status(201).json(success(post, 'Post published'));
  },

  async deletePost(req: Request, res: Response): Promise<void> {
    const { postId } = postIdParamSchema.parse(req.params);
    await socialService.deletePost(requireUserId(req), postId);
    res.status(200).json(success(null, 'Post removed'));
  },

  async createStory(req: Request, res: Response): Promise<void> {
    const input = createStorySchema.parse(req.body ?? {});
    const story = await socialService.createStory(requireUserId(req), input);
    res.status(201).json(success(story, 'Story published'));
  },

  async expireStory(req: Request, res: Response): Promise<void> {
    const { storyId } = storyIdParamSchema.parse(req.params);
    await socialService.expireStory(requireUserId(req), storyId);
    res.status(200).json(success(null, 'Story expired'));
  },

  async feed(req: Request, res: Response): Promise<void> {
    const query = feedQuerySchema.parse(req.query);
    const viewerProfileId = await socialService.getMyProfileId(requireUserId(req));
    const posts = await socialService.feed(viewerProfileId, query.limit);
    res.status(200).json(success(posts, 'Feed retrieved'));
  },

  async listConversations(req: Request, res: Response): Promise<void> {
    const conversations = await socialService.listConversations(requireUserId(req));
    res.status(200).json(success(conversations, 'Conversations retrieved'));
  },

  async createConversation(req: Request, res: Response): Promise<void> {
    const input = createSocialConversationSchema.parse(req.body ?? {});
    const conversation = await socialService.createConversation(requireUserId(req), input);
    res.status(201).json(success(conversation, 'Conversation created'));
  },

  async getConversation(req: Request, res: Response): Promise<void> {
    const { conversationId } = conversationIdParamSchema.parse(req.params);
    const conversation = await socialService.getConversation(requireUserId(req), conversationId);
    res.status(200).json(success(conversation, 'Conversation retrieved'));
  },

  async sendMessage(req: Request, res: Response): Promise<void> {
    const { conversationId } = conversationIdParamSchema.parse(req.params);
    const input = sendSocialMessageSchema.parse(req.body ?? {});
    const conversation = await socialService.sendMessage(requireUserId(req), conversationId, input);
    res.status(201).json(success(conversation, 'Message sent'));
  },

  /**
   * Server-sent events. The reply arrives incrementally, then the final persisted
   * conversation is delivered so the client never has to reconcile partial state.
   * Persistence is identical to the non-streaming route.
   */
  async streamMessage(req: Request, res: Response): Promise<void> {
    const { conversationId } = conversationIdParamSchema.parse(req.params);
    const input = sendSocialMessageSchema.parse(req.body ?? {});
    const userId = requireUserId(req);

    res.status(200);
    res.setHeader('content-type', 'text/event-stream');
    res.setHeader('cache-control', 'no-cache, no-transform');
    res.setHeader('connection', 'keep-alive');
    res.setHeader('x-accel-buffering', 'no');
    res.flushHeaders?.();

    const send = (event: string, data: unknown): void => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    send('open', { conversationId });

    try {
      const conversation = await socialService.sendMessage(userId, conversationId, input, {
        onDelta: (delta) => send('delta', { text: delta }),
      });
      send('done', conversation);
    } catch (error) {
      // The stream already has a 200, so failures are reported in-band.
      const httpError = error instanceof HttpError ? error : null;
      send('error', {
        code: httpError?.code ?? 'stream_failed',
        message: httpError?.message ?? 'Message could not be delivered',
      });
    } finally {
      res.end();
    }
  },

  async markConversationRead(req: Request, res: Response): Promise<void> {
    const { conversationId } = conversationIdParamSchema.parse(req.params);
    const conversation = await socialService.markConversationRead(requireUserId(req), conversationId);
    res.status(200).json(success(conversation, 'Conversation marked read'));
  },

  async endConversation(req: Request, res: Response): Promise<void> {
    const { conversationId } = conversationIdParamSchema.parse(req.params);
    const conversation = await socialService.updateConversationStatus(requireUserId(req), conversationId, 'ended');
    res.status(200).json(success(conversation, 'Conversation ended'));
  },

  async archiveConversation(req: Request, res: Response): Promise<void> {
    const { conversationId } = conversationIdParamSchema.parse(req.params);
    const conversation = await socialService.updateConversationStatus(requireUserId(req), conversationId, 'archived');
    res.status(200).json(success(conversation, 'Conversation archived'));
  },
};

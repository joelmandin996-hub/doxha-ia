import { Router } from 'express';
import healthCheck from './health-check.js';
import messagesRouter from './messages.js';
import smsRouter from './sms.js';
import whatsappRouter from './whatsapp.js';
import socialRouter from './social.js';
import integratedAiRouter from './integrated-ai.js';
import donationsRouter from './donations.js';
import groupsRouter from './groups.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/', messagesRouter);
    router.use('/sms', smsRouter);
    router.use('/whatsapp', whatsappRouter);
    router.use('/social', socialRouter);
    router.use('/integrated-ai', integratedAiRouter);
    router.use('/donations', donationsRouter);
    router.use('/groups', groupsRouter);

    return router;
};
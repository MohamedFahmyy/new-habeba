import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../services/db.js';

const app = createApp();

describe('Habeba Romantic Platform API Test Suite', () => {
  const testEmailUser1 = `user1_${Date.now()}@example.com`;
  const testEmailUser2 = `user2_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let user1Agent: any;
  let user2Agent: any;
  let adminAgent: any;
  let createdGiftId: number;
  let createdGiftSlug: string;

  beforeAll(async () => {
    // Wait for DB ready
    await prisma.$connect();
  });

  it('1. GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('2. GET /api/payments/settings should return public platform payment settings', async () => {
    const res = await request(app).get('/api/payments/settings');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settings).toBeDefined();
    expect(res.body.settings.currency).toBe('EGP');
  });

  it('3. User 1 Registration should create user and establish session', async () => {
    user1Agent = request.agent(app);
    const res = await user1Agent.post('/api/auth/register').send({
      username: 'Romeo',
      email: testEmailUser1,
      password: testPassword,
      confirmPassword: testPassword,
      agreeTerms: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(testEmailUser1);
    expect(res.body.user.role).toBe('user');
  });

  it('4. User 1 /api/auth/me should return authenticated user profile', async () => {
    const res = await user1Agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.user.email).toBe(testEmailUser1);
  });

  it('5. User 1 creates a romantic gift', async () => {
    const res = await user1Agent.post('/api/gifts').send({
      title: 'Our Beautiful Beginning',
      senderName: 'Romeo',
      recipientName: 'Juliet',
      welcomeMessage: 'To the love of my life',
      themeId: 'midnight',
      galleryStyle: 'masonry',
      letterTitle: 'My Eternal Promise',
      letterContent: 'I will love you today, tomorrow, and forever.',
      status: 'published',
      showTimeline: true,
      showGallery: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.gift).toBeDefined();
    expect(res.body.gift.title).toBe('Our Beautiful Beginning');
    createdGiftId = res.body.gift.id;
    createdGiftSlug = res.body.gift.slug;
  });

  it('6. User 1 can view their gifts list', async () => {
    const res = await user1Agent.get('/api/gifts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.gifts)).toBe(true);
    expect(res.body.gifts.some((g: any) => g.id === createdGiftId)).toBe(true);
  });

  it('7. Public access to published gift by slug works without login', async () => {
    const res = await request(app).get(`/api/gifts/public/${createdGiftSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.gift.title).toBe('Our Beautiful Beginning');
    expect(res.body.gift.senderName).toBe('Romeo');
    expect(res.body.gift.recipientName).toBe('Juliet');
  });

  it('8. User 2 Registration', async () => {
    user2Agent = request.agent(app);
    const res = await user2Agent.post('/api/auth/register').send({
      username: 'OtherUser',
      email: testEmailUser2,
      password: testPassword,
      confirmPassword: testPassword,
      agreeTerms: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('9. SECURITY: User 2 CANNOT access User 1 private gift details', async () => {
    const res = await user2Agent.get(`/api/gifts/${createdGiftId}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('10. SECURITY: User 2 CANNOT modify or patch User 1 gift', async () => {
    const res = await user2Agent.patch(`/api/gifts/${createdGiftId}`).send({
      title: 'Hacked Title',
    });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('11. SECURITY: User 2 CANNOT delete User 1 gift', async () => {
    const res = await user2Agent.delete(`/api/gifts/${createdGiftId}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('12. User 1 can duplicate their own gift', async () => {
    const res = await user1Agent.post(`/api/gifts/${createdGiftId}/duplicate`);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.gift.title).toContain('(Copy)');
  });

  it('13. Admin Login & Authorization check', async () => {
    adminAgent = request.agent(app);
    const res = await adminAgent.post('/api/auth/login').send({
      email: 'admin@habeba.com',
      password: process.env.ADMIN_PASSWORD || 'romantic2026',
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');

    // Admin can access stats
    const statsRes = await adminAgent.get('/api/admin/stats');
    expect(statsRes.status).toBe(200);
    expect(statsRes.body.success).toBe(true);
    expect(statsRes.body.stats.totalUsers).toBeGreaterThan(0);
    expect(statsRes.body.stats.totalGifts).toBeGreaterThan(0);
  });

  it('14. SECURITY: Non-admin User 1 CANNOT access admin panel stats', async () => {
    const res = await user1Agent.get('/api/admin/stats');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('15. User 1 can logout successfully', async () => {
    const res = await user1Agent.post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const meRes = await user1Agent.get('/api/auth/me');
    expect(meRes.body.authenticated).toBe(false);
  });
});

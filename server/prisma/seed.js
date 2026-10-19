"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2_1 = __importDefault(require("argon2"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding Habeba Platform database...');
    // ── Platform Settings ──────────────────────────────────────────────────────
    const settings = [
        { settingKey: 'payments_enabled', settingValue: '0' },
        { settingKey: 'payment_price', settingValue: '149' },
        { settingKey: 'payment_currency', settingValue: 'EGP' },
        { settingKey: 'instapay_enabled', settingValue: '1' },
        { settingKey: 'instapay_address', settingValue: 'habeba@instapay' },
        { settingKey: 'instapay_instructions', settingValue: 'حول المبلغ عبر تطبيق انستاباي إلى العنوان أعلاه، ثم اكتب رقم العملية وارفع صورة الإيصال.' },
        { settingKey: 'vodafone_cash_enabled', settingValue: '1' },
        { settingKey: 'vodafone_cash_number', settingValue: '01000000000' },
        { settingKey: 'vodafone_cash_instructions', settingValue: 'حول المبلغ كاش إلى الرقم أعلاه، ثم اكتب رقم المحفظة المحول منها وارفع صورة الإيصال.' },
        { settingKey: 'card_enabled', settingValue: '0' },
        { settingKey: 'require_manual_review', settingValue: '1' },
    ];
    for (const s of settings) {
        await prisma.platformSetting.upsert({
            where: { settingKey: s.settingKey },
            update: {},
            create: s,
        });
    }
    console.log('  ✅ Platform settings seeded');
    // ── Admin & Demo Users ─────────────────────────────────────────────────────
    const adminPasswordHash = await argon2_1.default.hash(process.env.ADMIN_PASSWORD || 'romantic2026', {
        type: argon2_1.default.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
    });
    const admin = await prisma.user.upsert({
        where: { email: 'admin@habeba.com' },
        update: { role: 'admin' },
        create: {
            email: 'admin@habeba.com',
            username: 'Habeba Admin',
            passwordHash: adminPasswordHash,
            role: 'admin',
        },
    });
    const demoUser = await prisma.user.upsert({
        where: { email: 'demo@habeba.com' },
        update: {},
        create: {
            email: 'demo@habeba.com',
            username: 'Mohamed Fahmy',
            passwordHash: adminPasswordHash,
            role: 'user',
        },
    });
    console.log('  ✅ Admin and demo users seeded');
    // ── Demo Gift (Salma & Mohamed) ────────────────────────────────────────────
    const existing = await prisma.gift.findUnique({ where: { slug: 'salma-and-mohamed' } });
    if (!existing) {
        const gift = await prisma.gift.create({
            data: {
                slug: 'salma-and-mohamed',
                editToken: 'flagship_token_salma_mohamed',
                title: 'Mohamed & Salma - Our Love Story',
                senderName: 'Mohamed',
                recipientName: 'Salma',
                welcomeMessage: 'Every moment with you became my favorite memory. | كل لحظة معاكي بقت أجمل ذكرى في حياتي.',
                themeId: 'midnight',
                galleryStyle: 'masonry',
                musicUrl: 'https://www.youtube.com/watch?v=g7Zw5x6GKlE',
                musicVideoId: 'g7Zw5x6GKlE',
                musicTitle: 'Our Favorite Song',
                letterTitle: 'A Letter To You | رسالة إلى قلبي',
                letterContent: 'Salma,\n\nYou changed my life in the most beautiful way.\nEvery smile from you heals something inside me.\nI never knew love could feel this peaceful until I met you.\n\nسلمى،\nإنتِ أجمل حاجة حصلتلي في حياتي.\nضحكتك أمان ووجودك راحة لقلبي.\nبحبك بطريقة أكبر من أي كلام.',
                letterSignature: 'Forever Yours, Mohamed',
                surpriseTitle: 'Forever Starts With You ❤️',
                surpriseMessage: 'إلى الأبد يبدأ بوجودك ومعك كل يوم عيد حب ❤️',
                anniversaryDate: '2024-08-10',
                status: 'published',
                isDemo: true,
                paymentStatus: 'paid',
                userId: demoUser.id,
            },
        });
        // Timeline Entries
        const timeline = [
            { title: 'Chapter One: The First Spark', description: 'You are the calm in my chaos.', imageUrl: '/placeholder/timeline-1.jpg', eventDate: 'Day 1', sortOrder: 0 },
            { title: 'Our First Coffee & Long Conversation', description: 'كل الطرق الجميلة انتهت بيكي.', imageUrl: '/placeholder/timeline-2.jpg', eventDate: 'Day 14', sortOrder: 1 },
            { title: 'When I Knew You Were The One', description: 'Your smile feels like home.', imageUrl: '/placeholder/timeline-3.jpg', eventDate: 'Day 30', sortOrder: 2 },
            { title: 'Together Through Every Season', description: 'وجودك في حياتي نعمة بحمد ربنا عليها كل يوم.', imageUrl: '/placeholder/timeline-4.jpg', eventDate: 'Day 60', sortOrder: 3 },
        ];
        await prisma.timelineEntry.createMany({ data: timeline.map(t => ({ ...t, giftId: gift.id })) });
        // Memory Gallery
        const memories = [
            { imageUrl: '/placeholder/mem-1.jpg', title: 'Pure Happiness', caption: 'Our joyful laughter under the golden sun', memoryDate: 'Memory 1', sortOrder: 0 },
            { imageUrl: '/placeholder/mem-2.jpg', title: 'Unspoken Love', caption: 'The quiet moments that mean the most', memoryDate: 'Memory 2', sortOrder: 1 },
            { imageUrl: '/placeholder/mem-3.jpg', title: 'By The Sea', caption: 'Walking side by side feeling complete peace', memoryDate: 'Memory 3', sortOrder: 2 },
            { imageUrl: '/placeholder/mem-4.jpg', title: 'Golden Hour Romance', caption: 'When the sky matched the warmth in our hearts', memoryDate: 'Memory 4', sortOrder: 3 },
            { imageUrl: '/placeholder/mem-5.jpg', title: 'Endless Smiles', caption: 'Every single day with you is my blessing', memoryDate: 'Memory 5', sortOrder: 4 },
        ];
        await prisma.memory.createMany({ data: memories.map(m => ({ ...m, giftId: gift.id })) });
        // Counters
        const counters = [
            { label: 'Days Together', targetValue: 70, icon: 'heart', sortOrder: 0 },
            { label: 'Photos', targetValue: 150, icon: 'camera', sortOrder: 1 },
            { label: 'Videos', targetValue: 50, icon: 'video', sortOrder: 2 },
            { label: 'Memories', targetValue: 1000, icon: 'infinity', sortOrder: 3 },
        ];
        await prisma.counter.createMany({ data: counters.map(c => ({ ...c, giftId: gift.id })) });
        console.log('  ✅ Demo gift (Salma & Mohamed) seeded');
    }
    console.log('✅ Database seeding complete!');
}
main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map
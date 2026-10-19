-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "gift_websites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "edit_token" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "welcome_message" TEXT,
    "theme_id" TEXT NOT NULL DEFAULT 'midnight',
    "theme_config" TEXT,
    "gallery_style" TEXT NOT NULL DEFAULT 'masonry',
    "music_url" TEXT,
    "music_video_id" TEXT,
    "music_title" TEXT,
    "letter_title" TEXT,
    "letter_content" TEXT,
    "letter_signature" TEXT,
    "surprise_title" TEXT,
    "surprise_message" TEXT,
    "anniversary_date" TEXT,
    "show_timeline" BOOLEAN NOT NULL DEFAULT true,
    "show_gallery" BOOLEAN NOT NULL DEFAULT true,
    "show_letter" BOOLEAN NOT NULL DEFAULT true,
    "show_counters" BOOLEAN NOT NULL DEFAULT true,
    "show_surprise" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'published',
    "payment_status" TEXT NOT NULL DEFAULT 'free',
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "gift_websites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "memories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gift_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "title" TEXT,
    "caption" TEXT,
    "memory_date" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "memories_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gift_websites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "timeline_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gift_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_date" TEXT,
    "image_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "timeline_entries_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gift_websites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "counters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gift_id" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "target_value" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT NOT NULL DEFAULT 'heart',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "counters_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gift_websites" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "setting_key" TEXT NOT NULL PRIMARY KEY,
    "setting_value" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "gift_id" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gift_websites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order_id" INTEGER,
    "gift_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "transaction_reference" TEXT,
    "provider_transaction_id" TEXT,
    "amount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'EGP',
    "status" TEXT NOT NULL DEFAULT 'awaiting_review',
    "receipt_path" TEXT,
    "reviewed_by" INTEGER,
    "reviewed_at" DATETIME,
    "admin_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "payments_gift_id_fkey" FOREIGN KEY ("gift_id") REFERENCES "gift_websites" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "payments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "gift_websites_slug_key" ON "gift_websites"("slug");

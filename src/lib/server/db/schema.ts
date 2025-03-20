import { sqliteTable, text, integer, numeric } from 'drizzle-orm/sqlite-core';

/**
 * Singleton table: Book
 */
export const book = sqliteTable('book', {
	id: integer().primaryKey(),
	title: text().default("My Book").notNull(),
	subtitle: text().default("Volume 1"),
	author: text().default('Jane Doe'),
	publishedAt: text().default('January 1st, 2025')
});

export const chapters = sqliteTable('chapters', {
	id: integer().primaryKey(),
	order: integer().notNull(),
	title: text().notNull(),
	content: text(),
	createdAt: numeric(),
	updatedAt: numeric()
});

export const chapterHistory = sqliteTable('chapter_history', {
	id: integer().primaryKey(),
	chapterId: integer().notNull(),
	title: text().notNull(),
	content: text(),
	updatedAt: numeric(),
});
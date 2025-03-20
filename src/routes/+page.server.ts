import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db'
import * as schema from '$lib/server/db/schema'
import { dev } from '$app/environment'
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ }) => {

    let book = await db.query.book.findFirst()
    let chapters = await db.query.chapters.findMany({
        orderBy: (c, { asc }) => asc(c.order)
    })

    if (book! === undefined) {
        [book] = await db.insert(schema.book).values({ id: 1 }).returning()
    }

    return {
        isDev: dev,
        book: book!,
        chapters: chapters!
    }
}

export const actions = {
    bookTitle: async ({ request }) => {
        const data = await request.formData()
        const title = (data.get('title') as string).trim()

        if (!title || !title.length) {
            return fail(400, { title, incorrect: true })
        }

        await db.update(schema.book).set({ title })

        return { success: true }
    },
    bookSubtitle: async ({ request }) => {
        const data = await request.formData()
        const subtitle = (data.get('subtitle') as string).trim()

        await db.update(schema.book).set({ subtitle })

        return { success: true }
    },
    bookAuthor: async ({ request }) => {
        const data = await request.formData()
        const author = (data.get('author') as string).trim()

        await db.update(schema.book).set({ author })

        return { success: true }
    },
    bookPublishedAt: async ({ request }) => {
        const data = await request.formData()
        const publishedAt = (data.get('publishedAt') as string).trim()

        await db.update(schema.book).set({ publishedAt })

        return { success: true }
    },
    addChapter: async ({ request }) => {
        const data = await request.formData()
        const title = data.get('title')
        const content = data.get('content')

        if (!title) {
            return fail(400, { title, incorrect: true })
        }
        if (!content) {
            return fail(400, { content, incorrect: true })
        }

        const chapterOrders = await db.query.chapters.findMany({columns: {order:true}})
        let latestOrder = 0

        chapterOrders.forEach((c) => {
            if (c.order > latestOrder) {
                latestOrder = c.order
            }
        })

        const order = latestOrder + 1

        const updatedAt = new Date() as any as string
        await db.insert(schema.chapters).values({ order, title, content, updatedAt, createdAt:updatedAt })

        return { success: true }
    },
    updateChapter: async ({ request }) => {
        const data = await request.formData()
        const id = data.get('id') as any as number
        const title = data.get('title') as any as string
        const content = data.get('content') as any as string

        if (id === undefined) {
            return fail(400, { id, incorrect: true })
        }
        if (!title) {
            return fail(400, { title, incorrect: true })
        }
        if (!content) {
            return fail(400, { content, incorrect: true })
        }
        const updatedAt = new Date() as any as string
        const oldChapter = await db.query.chapters.findFirst({ where: (c, { eq }) => eq(c.id, id) })

        if (title !== oldChapter!.title || content !== oldChapter!.content) {
            await db.insert(schema.chapterHistory).values({ chapterId: oldChapter!.id, title: oldChapter!.title, content: oldChapter!.content, updatedAt})
        }

        await db.update(schema.chapters).set({ title, content, updatedAt }).where(eq(schema.chapters.id, id))

        return { success: true }
    },
    updateChapterOrders: async ({ request }) => {
        const data = await request.formData()
        const chapterIdString = data.get('chapterIds') as string
        const chapterIds = chapterIdString.split(',')

        const queue: Promise<any>[] = []

        chapterIds.forEach((id, idx) => {
            const order = idx + 1
            const query = db.update(schema.chapters).set({ order }).where(eq(schema.chapters.id!, Number.parseInt(id)))
            queue.push(query)
        })

        await Promise.all(queue)

        return { success: true }
    }
} satisfies Actions
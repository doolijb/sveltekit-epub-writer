// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import { book, chapters } from "./lib/server/db/schema"

declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	namespace Schema {
		type SelectBook = typeof book.$inferSelect
		type SelectChapter = typeof chapters.$inferSelect
	}
}

export {};

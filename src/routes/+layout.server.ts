import { dev } from '$app/environment'

export const prerender = !dev

export const load= async ({ params }) => {
	return {
		isDev: dev
	};
}
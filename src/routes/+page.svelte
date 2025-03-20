<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Icon from '@iconify/svelte';
	import type Quill from 'quill/core.js';
	import { onMount } from 'svelte';
	import Sortable from 'sortablejs';
	import axios from 'axios';
	import { generateEpub } from '$lib/client/generateEpub.js';

	type EditChapterData =
		| (Omit<Schema.SelectChapter, 'id' | 'createdAt' | 'updatedAt'> & { id: number | 'new' | undefined })
		| undefined;

	let { data } = $props();

	let isDev = $state(data.isDev);
	let editingBookCol: keyof Schema.SelectBook | undefined = $state(undefined);
	let activeFormRet: HTMLFormElement | undefined = $state();
	let activeBookData: Record<any, any> | undefined = $state(undefined);
	let activeChapterData: EditChapterData = $state(undefined);
	let quill: typeof Quill | undefined;
	let quillEditor: Quill | undefined = $state();
	let quillRet: HTMLElement | undefined = $state();
	let sortable: Sortable | undefined = $state(undefined);
	let chaptersContainer: HTMLElement | undefined = $state(undefined);
	let collapsedChapterIds: number[] = $state([]);

	async function importQuill() {
		const { default: quillModule } = await import('quill/quill');
		quill = quillModule;
	}

	async function editBookCol(e: Event, col: keyof Schema.SelectBook) {
		if (!editingBookCol && !activeBookData) {
			editingBookCol = col;
			activeBookData = { col: data.book[col] };
		}
	}

	async function newChapter(e: Event, position?: number) {
		if (!editingBookCol && !activeChapterData) {
			let order: number | undefined = undefined;
			data.chapters.forEach((c) => {
				if (order === undefined || order < c.order) {
					order = c.order;
				}
			});
			activeChapterData = {
				id: 'new',
				title: '',
				order: order !== undefined ? order + 1 : 1,
				content: ''
			};
		}
	}

	async function editChapter(e: Event, chapter: Schema.SelectChapter) {
		if (!editingBookCol && !activeChapterData) {
			activeChapterData = { ...chapter };
		}
	}

	async function cancelChapter(e: Event) {
		e.preventDefault();
		activeChapterData = undefined;
	}

	async function enableSort(e: Event) {
		if (!sortable) {
			sortable = new Sortable(chaptersContainer!, { dataIdAttr: 'data-chapter-id' });
		}
	}

	async function saveSort(e: Event) {
		if (!!sortable) {
			const chapterIds = sortable.toArray();

			const formData = new FormData();
			formData.set('chapterIds', chapterIds.join(','));

			await axios.post('?/updateChapterOrders', formData);

			sortable.destroy();
			sortable = undefined;

			invalidateAll();
		}
	}

	async function toggleChapterCollapse(e: Event, id: number) {
		if (collapsedChapterIds.find((c) => c === id)) {
			collapsedChapterIds = collapsedChapterIds.filter((c) => c !== id);
		} else {
			collapsedChapterIds.push(id);
		}
	}

	function printPage() {
		window.print();
	}

	// Clean up book data
	$effect(() => {
		if (!editingBookCol) {
			activeBookData = undefined;
		}
	});

	// Activate quill
	$effect(() => {
		if (!!activeFormRet && !!quillRet && !quillEditor && !!quill) {
			quillEditor = new quill('#editor', {
				theme: 'bubble',
				placeholder: 'Compose an epic...'
			});
			quillEditor.on('text-change', (e) => {
				activeChapterData!.content = quillEditor!.getSemanticHTML();
			});
			quillEditor.setContents(
				quillEditor.clipboard.convert({ html: activeChapterData!.content || '' })
			);
		}
	});

	// Clean up quill
	$effect(() => {
		if (!activeFormRet && quillEditor) {
			quillEditor = undefined;
			quillRet = undefined;
		}
	});

	onMount(() => {
		importQuill();
	});
</script>

<svelte:head>
	<title>{data.book.title}</title>
</svelte:head>
<link href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" rel="stylesheet" />
<div
	class="print:p-0 print:m-0 print:bg-none print:rounded-none print:drop-shadow-none"
	class:m-4={data.isDev}
	class:bg-gray-100={data.isDev}
	class:p-4={data.isDev}
	class:rounded-xl={data.isDev}
	class:drop-shadow-lg={data.isDev}
>
	<!-- Title Page -->
	{#if data.isDev}
		<div class="flex justify-between print:hidden">
			<button
				class="btn btn-sm preset-tonal"
				onclick={() => (isDev = !isDev)}
				disabled={!!activeBookData || !!activeChapterData}
			>
				{isDev ? 'Hide Dev Controls' : 'Show Dev Controls'}
			</button>
			<span>
				<button class="btn btn-sm preset-filled" onclick={printPage}>Print Page</button>
				<button class="btn btn-sm preset-filled" onclick={() => generateEpub({ ...data })}
					>Generate EPUB</button
				>
			</span>
		</div>
	{/if}

	<section class="my-16 text-center">
		<!-- BOOK TITLE -->
		<div class="mt-4">
			<h1 class="text-4xl font-bold">
				{#if isDev && editingBookCol === 'title'}
					<form
						bind:this={activeFormRet}
						method="POST"
						action="?/bookTitle"
						use:enhance={({ formElement, formData, action, cancel, submitter }) => {
							return async ({ result, update }) => {
								editingBookCol = undefined;
								await invalidateAll();
							};
						}}
					>
						<input
							name="title"
							class="input mx-auto w-fit text-center"
							autofocus
							onfocus={(e) => e.target.select()}
							bind:value={data.book.title}
							defaultvalue={data.book.title}
							onblur={(e) => activeFormRet!.requestSubmit()}
						/>
					</form>
				{:else if isDev}
					<button
						class="group cursor-text"
						onclick={(e) => editBookCol(e, 'title')}
						title="Edit book title"
						>{data.book.title} <Icon icon="mdi:pencil" class="hidden group-hover:inline" /></button
					>
				{:else}
					{data.book.title}
				{/if}
			</h1>
		</div>

		<!-- BOOK SUBTITLE -->
		<div class="mt-4">
			<h2 class="text-2xl text-gray-800">
				{#if isDev && editingBookCol === 'subtitle'}
					<form
						bind:this={activeFormRet}
						method="POST"
						action="?/bookSubtitle"
						use:enhance={({ formElement, formData, action, cancel, submitter }) => {
							return async ({ result, update }) => {
								editingBookCol = undefined;
								await invalidateAll();
							};
						}}
					>
						<input
							name="subtitle"
							class="input mx-auto w-fit text-center"
							autofocus
							onfocus={(e) => e.target.select()}
							bind:value={data.book.subtitle}
							defaultvalue={data.book.subtitle}
							onblur={(e) => activeFormRet!.requestSubmit()}
						/>
					</form>
				{:else if isDev}
					<button
						class="group cursor-text"
						onclick={(e) => editBookCol(e, 'subtitle')}
						title="Edit book subtitle"
					>
						{data.book.subtitle ? data.book.subtitle : ''}
						<Icon icon="mdi:pencil" class="hidden h-6 group-hover:inline" />
					</button>
				{:else}
					{data.book.subtitle}
				{/if}
			</h2>
		</div>

		<!-- BOOK AUTHOR -->
		<div class="mt-4">
			<span class="inline-block text-lg text-gray-600">
				{#if isDev && editingBookCol === 'author'}
					<form
						bind:this={activeFormRet}
						method="POST"
						action="?/bookAuthor"
						use:enhance={({ formElement, formData, action, cancel, submitter }) => {
							return async ({ result, update }) => {
								editingBookCol = undefined;
								await invalidateAll();
							};
						}}
					>
						<input
							name="author"
							class="input mx-auto w-fit text-center"
							autofocus
							onfocus={(e) => e.target.select()}
							bind:value={data.book.author}
							defaultvalue={data.book.author}
							onblur={(e) => activeFormRet!.requestSubmit()}
						/>
					</form>
				{:else if isDev}
					<button
						class="group cursor-text"
						onclick={(e) => editBookCol(e, 'author')}
						title="Edit book author"
					>
						{data.book.author}
						<Icon icon="mdi:pencil" class="hidden group-hover:inline" />
					</button>
				{:else}
					{data.book.author}
				{/if}
			</span>
		</div>

		<div>
			<!-- BOOK PUBLISHED AT -->
			<span class="inline-block text-lg text-gray-600">
				{#if isDev && editingBookCol === 'publishedAt'}
					<form
						bind:this={activeFormRet}
						method="POST"
						action="?/bookPublishedAt"
						use:enhance={({ formElement, formData, action, cancel, submitter }) => {
							return async ({ result, update }) => {
								editingBookCol = undefined;
								await invalidateAll();
							};
						}}
					>
						<input
							name="publishedAt"
							class="input mx-auto w-fit text-center"
							autofocus
							onfocus={(e) => e.target.select()}
							bind:value={data.book.publishedAt}
							defaultvalue={data.book.publishedAt}
							onblur={(e) => activeFormRet!.requestSubmit()}
						/>
					</form>
				{:else if isDev}
					<button
						class="group cursor-text"
						onclick={(e) => editBookCol(e, 'publishedAt')}
						title="Edit book published date"
					>
						{data.book.publishedAt}
						<Icon icon="mdi:pencil" class="hidden group-hover:inline" />
					</button>
				{:else}
					{data.book.publishedAt}
				{/if}
			</span>
		</div>
	</section>

	<!-- ENABLE SORT & SAVE -->
	{#if isDev}
		<div class="mb-4 print:hidden">
			{#if !sortable && !activeChapterData?.id}
				<button class="btn btn-sm preset-tonal hover:preset-filled" onclick={enableSort}>
					<Icon icon="mdi:drag" /> Reorder
				</button>
			{:else if !!sortable}
				<button class="btn preset-filled-success-500" onclick={saveSort}>
					<Icon icon="mdi:floppy" /> Save
				</button>
			{/if}
		</div>
	{/if}

	{#key data.chapters}
		<div id="chapters-container print:hidden" bind:this={chaptersContainer}>
			{#each data.chapters as chapter}
				{#if isDev && activeChapterData?.id === chapter.id}
					{@render ChapterEditor()}
				{:else}
					{@render Chapter(chapter)}
				{/if}
			{/each}

			{#if isDev && !activeChapterData && !sortable}
				<div class="mt-4 rounded-xl bg-blue-200 p-4">
					<button
						class="btn btn-blue rounded-full"
						disabled={!!activeBookData}
						onclick={newChapter}
					>
						<Icon icon="basil:plus-solid" class="inline" /> Add Chapter
					</button>
				</div>
			{/if}
		</div>
	{/key}

	{#if isDev && activeChapterData?.id === 'new'}
		{@render ChapterEditor()}
	{/if}
</div>

{#snippet Chapter(chapter: Schema.SelectChapter)}
	{@const isCollapsed = collapsedChapterIds.find((c) => c === chapter.id)}
	<section
		data-chapter-id={isDev ? chapter.id : undefined}
		class="relative w-full"
		class:rounded-xl={!!sortable}
		class:preset-tonal={!!sortable}
		class:p-2={!!sortable}
		class:mb-16={!sortable}
		class:mb-4={!!sortable}
		class:cursor-pointer={!!sortable}
	>
		<div class="flex" class:border-b={!sortable} class:mb-4={!sortable}>
			<h2 class="w-full text-2xl font-semibold" class:pb-2={!sortable} class:pb-0={!!sortable}>
				{#if isDev && !!sortable}<Icon icon="mdi:drag" class="inline-block" />{/if}
				{#if chapter.order > 0}
					Chapter {chapter.order}:
				{/if}
				{chapter.title}
			</h2>
			{#if isDev && !sortable}
				<span class="flex gap-2 print:hidden">
					<button
						class="btn preset-tonal mt-1 h-fit"
						title={isCollapsed ? 'Reveal' : 'Collapse'}
						onclick={(e) => toggleChapterCollapse(e, chapter.id)}
					>
						<Icon icon={isCollapsed ? 'mdi:plus' : 'mdi:minus'} class="inline" />
					</button>
					<button
						class="btn preset-filled-secondary-500 mt-1 h-fit"
						title="Edit"
						disabled={!!activeChapterData}
						onclick={(e) => editChapter(e, chapter)}
					>
						<Icon icon="mdi:pencil" class="inline" />
					</button>
				</span>
			{/if}
		</div>
		{#if (!sortable && !isCollapsed) || !isDev}
			<div class="relative w-full text-pretty">
				{@html chapter.content!.replace(/&nbsp;/g, ' ')}
			</div>
		{/if}
	</section>
{/snippet}

{#snippet ChapterEditor()}
	<div class="mt-4 rounded-xl bg-white p-4 outline-1 print:hidden">
		<form
			bind:this={activeFormRet}
			method="POST"
			action={activeChapterData!.id === 'new' ? '?/addChapter' : '?/updateChapter'}
			use:enhance={({ formElement, formData, action, cancel, submitter }) => {
				return async ({ result, update }) => {
					activeChapterData = undefined;
					await invalidateAll();
				};
			}}
		>
			<div class="flex flex-col gap-4">
				<div class="flex justify-center gap-4 align-middle">
					<div class="mt-1 text-nowrap">Chapter {activeChapterData!.order} -</div>
					{#if activeChapterData!.id !== 'new'}
						<input name="id" class="hidden" bind:value={activeChapterData!.id} required />
					{/if}
					<input
						name="title"
						class="input"
						bind:value={activeChapterData!.title}
						placeholder="Chapter Title"
						required
					/>
					<button
						class="btn preset-filled-success-500"
						onclick={(e) => {
							e.preventDefault();
							activeFormRet!.requestSubmit();
						}}>Save</button
					>
					<button class="btn preset-filled-error-500" onclick={cancelChapter}>Cancel</button>
				</div>
				<div>
					<div id="editor" bind:this={quillRet}></div>
					<textarea class="hidden" name="content">{activeChapterData!.content}</textarea>
				</div>
			</div>
		</form>
	</div>
{/snippet}

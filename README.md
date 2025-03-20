# Sveltekit Epub Writer

I wanted an epub writer that offered the ability to edit the raw layout (via ide) and still have an intuitive graphic ui for writing a book.

**Disclaimer:** This is a WIP, it works well for personal use, but is not yet suitable for publishing material for commercial use.

## Features

1. Intuitively edit your book details, such as the title and author
2. Add, write, edit and rearrange chapters
3. All data is stored to sqlite database
4. Export your book directly to epub
5. Print your book to pdf
6. Quill bubble editor

## Requirements

1. [nodejs](https://nodejs.org/en/download)
2. [Bun](https://bun.sh/)
3. [git](https://git-scm.com/downloads)
4. [vscode](https://code.visualstudio.com/) (Entirely optional, if you want to get hands on, or an ide of your choice)

## Setup

1. [Open the terminal on your computer.](https://www.youtube.com/watch?v=m2YKlRaO26A)
2. Copy, paste and press enter: `git clone https://github.com/doolijb/sveltekit-epub-writer.git`
3. Once it's on your machine, navigate to the folder in the terminal: `cd sveltekit-epub-writer`
4. Automatically install all the dependencies `bun i`
5. Activate the database (you will be promted to confirm): `npx drizzle-kit push`

## Run the app

1. If you haven't already, navigate to the app `cd sveltekit-epub-writer`
2. Start the app (dev server) `bun run dev`
3. In your browser, open up the webpage at `http://localhost:5173/`
4. When you want to shut it off, just close the terminal window.

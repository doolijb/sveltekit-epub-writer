import JSZip from "jszip";

export async function generateEpub(data: { book: Schema.SelectBook, chapters: Schema.SelectChapter[] }) {

    const mimetype = 'application/epub+zip';
    const containerXML = (
        `<?xml version="1.0"?>
        <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles>
            <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
        </rootfiles>
        </container>`);

    // Generate content.opf
    const contentOpf = (
        `<?xml version="1.0" encoding="UTF-8"?>
        <package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
            <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
                <dc:title>${data.book.title}</dc:title>
                <dc:creator>${data.book.author}</dc:creator>
                <dc:language>en</dc:language>
                <dc:identifier id="BookId">book-id</dc:identifier>
                <!-- <meta name="cover" content="cover.jpg"/> -->
                <meta property="dcterms:modified">2025-03-20T01:21:45Z</meta>
            </metadata>
            <manifest>
                <!-- <item id="cover" href="cover.jpg" media-type="image/jpeg"/> -->
                ${data.chapters.map((chapter) => (
                    `<item id="Text/chapter${chapter.order}.xhtml" href="Text/chapter${chapter.order}.xhtml" media-type="application/xhtml+xml"/>`
                )).join('')}
                <item id="Text/nav.xhtml" href="Text/nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
            </manifest>
            <spine>
                ${data.chapters.map((chapter) => (
                    `<itemref idref="Text/chapter${chapter.order}.xhtml" />`
                )).join('')}
                <itemref idref="Text/nav.xhtml" linear="no"/>
            </spine>
        </package>`);

    // TOC (Navigation) HTML file using <nav epub:type="toc">
    const navXhtml = (    
        `<?xml version="1.0" encoding="UTF-8"?>
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
            <head>
                <title>Table of Contents</title>
            </head>
            <body epub:type="frontmatter">
                <nav epub:type="toc" id="toc" role="doc-toc">
                    <h1>Table of Contents</h1>
                    <ol id="tocList">
                        ${data.chapters.map((chapter, idx) => (
                            `<li><a href="chapter${chapter.order}.xhtml">Chapter ${chapter!.order}: ${chapter!.title!}</a></li>`
                        )).join('')}
                    </ol>
                </nav>
            </body>
        </html>`
    );

    const styleCss = (
        `/* Basic styling for EPUB */
        p {
            font-family: "EB Garamond", serif;
            font-size: 1em;
            line-height: 1.6;
            word-wrap: normal;
            overflow-wrap: normal;
            word-wrap:break-word;
            white-space: pre-wrap;
        }
    `);

    const zip = new JSZip();

    // Add mimetype first (must not be compressed)
    zip.file("mimetype", mimetype);

    // Add META-INF/container.xml
    zip.folder("META-INF").file("container.xml", containerXML);

    // Add OEBPS files
    const oebps = zip.folder("OEBPS");
    oebps.file("content.opf", contentOpf);
    oebps.file("Text/nav.xhtml", navXhtml);

    // Add chapter files
    data.chapters.forEach((chapter) => {
        oebps.file(`Text/chapter${chapter.order}.xhtml`, buildChapterXhtml(chapter));
    });

    // Add style.css
    oebps.file("style.css", styleCss);

    // Generate EPUB file
    const epubBlob = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(epubBlob);
    link.download = `${data.book.title}.epub`;
    link.click();
}

function buildChapterXhtml(chapter: Schema.SelectChapter) {
    return (
        `<?xml version="1.0" encoding="utf-8"?>
        <!DOCTYPE html>
        <html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
            <head>
                <title>Chapter ${chapter.order} - ${chapter.title}</title>
                <link rel="stylesheet" type="text/css" href="style.css"/>
            </head>
            <body>
                <h1>Chapter ${chapter.order} - ${chapter.title}</h1>
                <p>${chapter.content?.replace(/&nbsp;/g, ' ')}</p>
            </body>
        </html>`);
}

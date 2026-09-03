const MIME_TYPE_TO_EXT: Readonly<Record<string, string>> = lowercaseKeys({
	// Pdf
	"application/pdf": "pdf",
	"application/x-pdf": "pdf",
	// Word
	"application/msword": "doc",
	"application/x-msword": "doc",
	"application/vnd.ms-word": "doc",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		"docx",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.template":
		"dotx",
	"application/vnd.ms-word.document.macroEnabled.12": "docm",
	"application/vnd.ms-word.template.macroEnabled.12": "dotm",
	// Other text documents
	"application/rtf": "rtf",
	"application/x-rtf": "rtf",
	"text/rtf": "rtf",
	"application/vnd.oasis.opendocument.text": "odt",
	"application/vnd.oasis.opendocument.text-template": "ott",
	"text/plain": "txt",
	"text/html": "html",
	"application/xhtml+xml": "html",
	"application/vnd.apple.pages": "pages",
	"application/x-iwork-pages-sffpages": "pages",
	// Spreadsheets & presentations
	"application/vnd.ms-excel": "xls",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
	"application/vnd.ms-powerpoint": "ppt",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation":
		"pptx",
	// Images
	"image/png": "png",
	"image/x-png": "png",
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
	"image/pjpeg": "jpg",
	"image/gif": "gif",
	"image/webp": "webp",
	"image/bmp": "bmp",
	"image/x-ms-bmp": "bmp",
	"image/tiff": "tiff",
	"image/heic": "heic",
	"image/heif": "heif",
	"image/svg+xml": "svg",
})

function lowercaseKeys(record: Record<string, string>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [key.toLowerCase(), value]),
	)
}

// Scrapers pass the upstream Content-Type verbatim, e.g. "Application/PDF; charset=utf-8".
function normalizeMimeType(mimeType: string): string {
	return mimeType.split(";")[0].trim().toLowerCase()
}

export function formatCvFilename(
	filename: string | undefined,
	mimeType: string | undefined,
): string {
	if (!mimeType) return filename || "cv.pdf"

	const normalizedMimeType = normalizeMimeType(mimeType)
	let fileExt = MIME_TYPE_TO_EXT[normalizedMimeType]
	if (!fileExt) {
		const imageSubtype = normalizedMimeType.startsWith("image/")
			? normalizedMimeType.slice("image/".length)
			: ""
		fileExt = imageSubtype || "pdf"
	}

	if (!filename) return "cv." + fileExt
	if (filename.split(".").length === 1) return filename + "." + fileExt

	return filename
}

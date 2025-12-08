const MIME_TYPE_TO_EXT: Readonly<Record<string, string>> = {
	// Pdf
	"application/pdf": "pdf",
	"application/x-pdf": "pdf",
	// Word
	"application/msword": "doc",
	"application/vnd.openxmlformats-officedocument": "docx",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		"docx",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.template":
		"dotx",
	"application/vnd.ms-word.document.macroEnabled.12": "docm",
	"application/vnd.ms-word.template.macroEnabled.12": "dotm",
	// Images
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/jpg": "jpg",
}

export function formatCvFilename(
	filename: string | undefined,
	mimeType: string | undefined
): string {
	if (!mimeType) return filename || "cv.pdf"

	let fileExt = MIME_TYPE_TO_EXT[mimeType]
	if (!fileExt)
		fileExt = mimeType.startsWith("image/")
			? mimeType.split("/")[1].split(" ")[0]
			: "pdf"

	if (!filename) return "cv." + fileExt
	if (filename.split(".").length === 1) return filename + "." + fileExt

	return filename
}

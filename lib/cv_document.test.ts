import { expect, test } from "bun:test"
import { formatCvFilename } from "./cv_document.ts"

test("falls back to cv.pdf without filename or mime type", () => {
	expect(formatCvFilename(undefined, undefined)).toBe("cv.pdf")
})

test("keeps the filename when no mime type is given", () => {
	expect(formatCvFilename("resume.docx", undefined)).toBe("resume.docx")
	expect(formatCvFilename("resume", undefined)).toBe("resume")
})

test("keeps a filename that already has an extension", () => {
	expect(formatCvFilename("resume.docx", "application/pdf")).toBe("resume.docx")
})

test("appends the extension to a filename without one", () => {
	expect(formatCvFilename("resume", "application/msword")).toBe("resume.doc")
})

test.each([
	["application/pdf", "pdf"],
	["application/x-pdf", "pdf"],
	["application/msword", "doc"],
	["application/x-msword", "doc"],
	["application/vnd.ms-word", "doc"],
	[
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"docx",
	],
	[
		"application/vnd.openxmlformats-officedocument.wordprocessingml.template",
		"dotx",
	],
	["application/vnd.ms-word.document.macroEnabled.12", "docm"],
	["application/vnd.ms-word.template.macroEnabled.12", "dotm"],
	["application/rtf", "rtf"],
	["application/x-rtf", "rtf"],
	["text/rtf", "rtf"],
	["application/vnd.oasis.opendocument.text", "odt"],
	["application/vnd.oasis.opendocument.text-template", "ott"],
	["text/plain", "txt"],
	["text/html", "html"],
	["application/xhtml+xml", "html"],
	["application/vnd.apple.pages", "pages"],
	["application/x-iwork-pages-sffpages", "pages"],
	["application/vnd.ms-excel", "xls"],
	["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
	["application/vnd.ms-powerpoint", "ppt"],
	[
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
		"pptx",
	],
	["image/png", "png"],
	["image/x-png", "png"],
	["image/jpeg", "jpg"],
	["image/jpg", "jpg"],
	["image/pjpeg", "jpg"],
	["image/gif", "gif"],
	["image/webp", "webp"],
	["image/bmp", "bmp"],
	["image/x-ms-bmp", "bmp"],
	["image/tiff", "tiff"],
	["image/heic", "heic"],
	["image/heif", "heif"],
	["image/svg+xml", "svg"],
])("maps %s to cv.%s", (mimeType, ext) => {
	expect(formatCvFilename(undefined, mimeType)).toBe("cv." + ext)
})

test("ignores case and parameters in the mime type", () => {
	expect(formatCvFilename(undefined, "Application/Msword")).toBe("cv.doc")
	expect(formatCvFilename(undefined, "application/pdf; charset=utf-8")).toBe(
		"cv.pdf",
	)
	expect(formatCvFilename(undefined, "image/jpeg; charset=utf-8")).toBe(
		"cv.jpg",
	)
	expect(formatCvFilename(undefined, "IMAGE/PNG;charset=binary")).toBe("cv.png")
})

test("uses the image subtype for unknown image types", () => {
	expect(formatCvFilename(undefined, "image/avif")).toBe("cv.avif")
	expect(formatCvFilename(undefined, "image/avif; q=0.9")).toBe("cv.avif")
})

test("falls back to pdf for unknown non-image types", () => {
	expect(formatCvFilename(undefined, "application/octet-stream")).toBe("cv.pdf")
	expect(formatCvFilename("resume", "application/octet-stream")).toBe(
		"resume.pdf",
	)
	expect(formatCvFilename(undefined, "image/")).toBe("cv.pdf")
})

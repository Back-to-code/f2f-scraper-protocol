export function isRecentCv(
	dateModifiedOrCv: string | Cv | null | undefined
): boolean {
	let dateModified: string | undefined
	if (typeof dateModifiedOrCv === "string") {
		dateModified = dateModifiedOrCv
	} else if (!dateModifiedOrCv) {
		dateModified = undefined
	} else {
		dateModified = dateModifiedOrCv.lastChanged
	}
	if (!dateModified) return true

	const now = new Date()
	const date = new Date(dateModified)

	// Calculate the difference in milliseconds
	const dateDiff = now.getTime() - date.getTime()
	if (dateDiff < 0) return true

	const ONE_DAY = 24 * 60 * 60 * 1000
	return dateDiff < ONE_DAY
}

export interface Cv {
	title?: string
	presentation?: string
	referenceNumber?: string
	link?: string
	createdAt?: string // assuming JSONRFC3339Nano is a custom date format
	lastChanged?: string // assuming JSONRFC3339Nano is a custom date format
	timeless?: boolean // Timeless is a field that tells if the cv is allways realtime
	educations?: Array<Education>
	workExperiences?: Array<WorkExperience>
	preferredJobs?: Array<string>
	preferences?: Preferences
	languages?: Array<Language>
	hobbies?: Array<Hobby>
	personalDetails?: PersonalDetails
	driversLicenses?: Array<string>
	type?: CVTypes
	unsupportedCVFields?: UnsupportedCVFields
	vacancyInfo?: VacancyInfo
}

export interface UnsupportedCVFields {
	driversLicense?: boolean
}

export interface VacancyInfo {
	name: string
}

export type CVTypes = "lead" | "potential_candidate"

export enum EducationKind {
	Unknown = 0,
	Education = 1,
	Course = 2,
}

export interface Education {
	is: EducationKind
	name: string
	description?: string
	institute?: string
	isCompleted?: boolean
	hasDiploma?: boolean
	startDate?: string // assuming JSONRFC3339Nano is a custom date format
	endDate?: string // assuming JSONRFC3339Nano is a custom date format
}

export interface WorkExperience {
	description?: string
	profession: string
	employer?: string
	startDate?: string // assuming JSONRFC3339Nano is a custom date format
	endDate?: string // assuming JSONRFC3339Nano is a custom date format
	stillEmployed?: boolean
	weeklyHoursWorked?: number
}

export enum WorkingHoursKind {
	Unknown = 0,
	Fixed = 1,
	Course = 2,
}

export interface Preferences {
	maxDistanceInKm?: number
	maximalHours?: number
	minimalHours?: number
	postcode?: string
	workingHours?: WorkingHoursKind
}

export interface PersonalDetails {
	name?: string
	initials?: string
	firstName?: string
	surNamePrefix?: string
	surName?: string
	dob?: string // assuming JSONRFC3339Nano is a custom date format
	gender?: string
	streetName?: string
	houseNumber?: string
	houseNumberSuffix?: string
	zip?: string
	city?: string
	country?: string
	phoneNumber?: string
	email?: string
}

export interface Hobby {
	name: string
	description: string
}

export interface Language {
	name: string
	levelSpoken: LanguageLevel
	levelWritten: LanguageLevel
}

export enum LanguageLevel {
	Unknown = 0,
	Reasonable = 1,
	Good = 2,
	Excellent = 3,
}

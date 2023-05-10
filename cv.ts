export interface Cv {
	title?: string
	presentation?: string
	referenceNumber?: string
	link?: string
	createdAt?: string // assuming JSONRFC3339Nano is a custom date format
	lastChanged?: string // assuming JSONRFC3339Nano is a custom date format
	educations?: Array<Education>
	workExperiences?: Array<WorkExperience>
	preferredJobs?: Array<string>
	preferences?: Preferences
	languages?: Array<Language>
	hobbies?: Array<Hobby>
	personalDetails?: PersonalDetails
	driversLicenses?: Array<string>
}

export enum EducationKind {
	Unknown = 0,
	Education = 1,
	Course = 2,
}

export interface Education {
	is: EducationKind
	name: string
	description: string
	institute: string
	isCompleted?: boolean
	hasDiploma?: boolean
	startDate?: string // assuming JSONRFC3339Nano is a custom date format
	endDate?: string // assuming JSONRFC3339Nano is a custom date format
}

export interface WorkExperience {
	description: string
	profession: string
	startDate?: string // assuming JSONRFC3339Nano is a custom date format
	endDate?: string // assuming JSONRFC3339Nano is a custom date format
	stillEmployed: boolean
	employer: string
	weeklyHoursWorked: number
}

export interface Preferences {
	maxDistanceInKm?: number
	maximalHours?: number
	minimalHours?: number
	postcode?: string
	workingHours?: number
}

export interface PersonalDetails {
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

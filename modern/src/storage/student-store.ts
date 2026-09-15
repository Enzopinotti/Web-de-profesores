import {
  createStudent,
  isDuplicateStudent,
  validateStudentDraft,
  type Student,
  type StudentDraft,
} from "../domain/student";

export const STUDENT_STORAGE_KEY = "modderhouse.students.v1";
export const LEGACY_STUDENTS_KEY = "Alumnos";
export const LEGACY_USERS_KEY = "Usuarios";

const STORAGE_VERSION = 1;

type StudentEnvelope = Readonly<{
  version: typeof STORAGE_VERSION;
  students: Student[];
}>;

export type StudentStoreIssue =
  "corrupt-json" | "unsupported-version" | "invalid-schema";

export type StudentStoreInspection =
  | Readonly<{ status: "empty"; students: [] }>
  | Readonly<{ status: "ready"; students: Student[] }>
  | Readonly<{
      status: "recovery-needed";
      students: [];
      issue: StudentStoreIssue;
      raw: string;
    }>;

export type StoreInitialization = Readonly<{
  students: Student[];
  migratedStudents: number;
  purgedLegacyCredentials: boolean;
  storageIssue: StudentStoreIssue | null;
}>;

function isStudent(value: unknown): value is Student {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Student>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.name === "string" &&
    typeof candidate.surname === "string" &&
    typeof candidate.grade === "number" &&
    Number.isFinite(candidate.grade) &&
    candidate.grade >= 0 &&
    candidate.grade <= 10
  );
}

export function inspectStudentStore(storage: Storage): StudentStoreInspection {
  const raw = storage.getItem(STUDENT_STORAGE_KEY);
  if (raw === null) {
    return { status: "empty", students: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      status: "recovery-needed",
      students: [],
      issue: "corrupt-json",
      raw,
    };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return {
      status: "recovery-needed",
      students: [],
      issue: "invalid-schema",
      raw,
    };
  }

  const candidate = parsed as Partial<StudentEnvelope> & { version?: unknown };
  if (candidate.version !== STORAGE_VERSION) {
    return {
      status: "recovery-needed",
      students: [],
      issue: "unsupported-version",
      raw,
    };
  }

  if (
    !Array.isArray(candidate.students) ||
    !candidate.students.every(isStudent)
  ) {
    return {
      status: "recovery-needed",
      students: [],
      issue: "invalid-schema",
      raw,
    };
  }

  return { status: "ready", students: candidate.students };
}

export function readStudents(storage: Storage): Student[] {
  const inspection = inspectStudentStore(storage);
  return inspection.status === "ready" ? inspection.students : [];
}

export function writeStudents(
  storage: Storage,
  students: readonly Student[],
): void {
  const payload: StudentEnvelope = {
    version: STORAGE_VERSION,
    students: [...students],
  };

  storage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(payload));
}

export function clearStudents(storage: Storage): void {
  storage.removeItem(STUDENT_STORAGE_KEY);
  storage.removeItem(LEGACY_STUDENTS_KEY);
}

function migrateLegacyStudents(
  storage: Storage,
  idFactory: () => string,
): Student[] {
  const raw = storage.getItem(LEGACY_STUDENTS_KEY);
  if (raw === null) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const migrated: Student[] = [];

  for (const value of parsed) {
    if (typeof value !== "object" || value === null) {
      continue;
    }

    const legacy = value as {
      nombre?: unknown;
      apellido?: unknown;
      nota?: unknown;
    };

    if (
      typeof legacy.nombre !== "string" ||
      typeof legacy.apellido !== "string"
    ) {
      continue;
    }

    const draft: StudentDraft = {
      name: legacy.nombre,
      surname: legacy.apellido,
      grade: String(legacy.nota ?? ""),
    };
    const validation = validateStudentDraft(draft);

    if (!validation.valid || isDuplicateStudent(migrated, validation.value)) {
      continue;
    }

    migrated.push(createStudent(validation.value, idFactory));
  }

  return migrated;
}

export function initializeStudentStore(
  storage: Storage,
  idFactory: () => string = () => crypto.randomUUID(),
): StoreInitialization {
  const purgedLegacyCredentials = storage.getItem(LEGACY_USERS_KEY) !== null;
  if (purgedLegacyCredentials) {
    storage.removeItem(LEGACY_USERS_KEY);
  }

  const inspection = inspectStudentStore(storage);
  if (inspection.status === "ready") {
    return {
      students: inspection.students,
      migratedStudents: 0,
      purgedLegacyCredentials,
      storageIssue: null,
    };
  }

  if (inspection.status === "recovery-needed") {
    return {
      students: [],
      migratedStudents: 0,
      purgedLegacyCredentials,
      storageIssue: inspection.issue,
    };
  }

  const migrated = migrateLegacyStudents(storage, idFactory);
  if (migrated.length > 0) {
    writeStudents(storage, migrated);
    storage.removeItem(LEGACY_STUDENTS_KEY);
  }

  return {
    students: migrated,
    migratedStudents: migrated.length,
    purgedLegacyCredentials,
    storageIssue: null,
  };
}

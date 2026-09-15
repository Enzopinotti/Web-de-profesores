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

export type StoreInitialization = Readonly<{
  students: Student[];
  migratedStudents: number;
  purgedLegacyCredentials: boolean;
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

export function readStudents(storage: Storage): Student[] {
  const raw = storage.getItem(STUDENT_STORAGE_KEY);
  if (raw === null) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Partial<StudentEnvelope>;
    if (
      parsed.version !== STORAGE_VERSION ||
      !Array.isArray(parsed.students) ||
      !parsed.students.every(isStudent)
    ) {
      return [];
    }

    return parsed.students;
  } catch {
    return [];
  }
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

  const currentStudents = readStudents(storage);
  if (
    currentStudents.length > 0 ||
    storage.getItem(STUDENT_STORAGE_KEY) !== null
  ) {
    return {
      students: currentStudents,
      migratedStudents: 0,
      purgedLegacyCredentials,
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
  };
}

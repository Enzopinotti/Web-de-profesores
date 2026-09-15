import {
  isDuplicateStudent,
  studentIdentityKey,
  validateStudentDraft,
  type Student,
} from "../domain/student";

export const STUDENT_BACKUP_FORMAT = "modderhouse.student-backup";
export const STUDENT_BACKUP_VERSION = 1;

export type BackupImportMode = "replace" | "merge";

export type BackupImportErrorCode =
  | "invalid-json"
  | "invalid-format"
  | "unsupported-version"
  | "invalid-schema"
  | "duplicate-backup-student"
  | "id-conflict";

export type BackupImportResult =
  | Readonly<{
      ok: true;
      students: Student[];
      imported: number;
      skippedDuplicates: number;
    }>
  | Readonly<{
      ok: false;
      code: BackupImportErrorCode;
      message: string;
    }>;

type StudentBackupEnvelope = Readonly<{
  format: typeof STUDENT_BACKUP_FORMAT;
  version: typeof STUDENT_BACKUP_VERSION;
  exportedAt: string;
  students: Student[];
}>;

function parseBackupStudent(value: unknown, index: number): Student | string {
  if (typeof value !== "object" || value === null) {
    return `El registro ${index + 1} no tiene un formato de alumno válido.`;
  }

  const candidate = value as Partial<Student>;
  if (typeof candidate.id !== "string" || candidate.id.trim() === "") {
    return `El registro ${index + 1} no tiene un identificador válido.`;
  }

  if (
    typeof candidate.name !== "string" ||
    typeof candidate.surname !== "string" ||
    typeof candidate.grade !== "number"
  ) {
    return `El registro ${index + 1} tiene campos faltantes o inválidos.`;
  }

  const validation = validateStudentDraft({
    name: candidate.name,
    surname: candidate.surname,
    grade: String(candidate.grade),
  });

  if (!validation.valid) {
    return `El registro ${index + 1} no cumple las reglas actuales de alumnos.`;
  }

  return {
    id: candidate.id,
    ...validation.value,
  };
}

export function serializeStudentBackup(
  students: readonly Student[],
  exportedAt: Date = new Date(),
): string {
  const payload: StudentBackupEnvelope = {
    format: STUDENT_BACKUP_FORMAT,
    version: STUDENT_BACKUP_VERSION,
    exportedAt: exportedAt.toISOString(),
    students: [...students],
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function importStudentBackup(
  raw: string,
  currentStudents: readonly Student[],
  mode: BackupImportMode,
): BackupImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      code: "invalid-json",
      message: "El archivo no contiene JSON válido.",
    };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return {
      ok: false,
      code: "invalid-format",
      message: "El archivo no tiene el formato de backup de Modderhouse.",
    };
  }

  const candidate = parsed as Partial<StudentBackupEnvelope> & {
    version?: unknown;
  };

  if (candidate.format !== STUDENT_BACKUP_FORMAT) {
    return {
      ok: false,
      code: "invalid-format",
      message: "El archivo no es un backup reconocido de Modderhouse.",
    };
  }

  if (candidate.version !== STUDENT_BACKUP_VERSION) {
    return {
      ok: false,
      code: "unsupported-version",
      message: "La versión del backup no es compatible con esta aplicación.",
    };
  }

  if (
    typeof candidate.exportedAt !== "string" ||
    Number.isNaN(Date.parse(candidate.exportedAt)) ||
    !Array.isArray(candidate.students)
  ) {
    return {
      ok: false,
      code: "invalid-schema",
      message: "El backup está incompleto o tiene una estructura inválida.",
    };
  }

  const importedStudents: Student[] = [];
  const importedIds = new Set<string>();

  for (const [index, value] of candidate.students.entries()) {
    const parsedStudent = parseBackupStudent(value, index);
    if (typeof parsedStudent === "string") {
      return {
        ok: false,
        code: "invalid-schema",
        message: parsedStudent,
      };
    }

    if (
      importedIds.has(parsedStudent.id) ||
      isDuplicateStudent(importedStudents, parsedStudent)
    ) {
      return {
        ok: false,
        code: "duplicate-backup-student",
        message: `El backup contiene alumnos duplicados alrededor del registro ${index + 1}.`,
      };
    }

    importedIds.add(parsedStudent.id);
    importedStudents.push(parsedStudent);
  }

  if (mode === "replace") {
    return {
      ok: true,
      students: importedStudents,
      imported: importedStudents.length,
      skippedDuplicates: 0,
    };
  }

  const merged = [...currentStudents];
  const currentById = new Map(
    currentStudents.map((student) => [student.id, student]),
  );
  const currentIdentities = new Set(currentStudents.map(studentIdentityKey));
  let imported = 0;
  let skippedDuplicates = 0;

  for (const student of importedStudents) {
    const existingById = currentById.get(student.id);
    if (existingById !== undefined) {
      if (studentIdentityKey(existingById) === studentIdentityKey(student)) {
        skippedDuplicates += 1;
        continue;
      }

      return {
        ok: false,
        code: "id-conflict",
        message:
          "El backup contiene un identificador que ya pertenece a otro alumno. No se aplicaron cambios.",
      };
    }

    const identity = studentIdentityKey(student);
    if (currentIdentities.has(identity)) {
      skippedDuplicates += 1;
      continue;
    }

    merged.push(student);
    currentById.set(student.id, student);
    currentIdentities.add(identity);
    imported += 1;
  }

  return {
    ok: true,
    students: merged,
    imported,
    skippedDuplicates,
  };
}

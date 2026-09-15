export type Student = Readonly<{
  id: string;
  name: string;
  surname: string;
  grade: number;
}>;

export type StudentDraft = Readonly<{
  name: string;
  surname: string;
  grade: string;
}>;

export type ValidStudentInput = Readonly<{
  name: string;
  surname: string;
  grade: number;
}>;

export type StudentField = "name" | "surname" | "grade";
export type StudentErrors = Partial<Record<StudentField, string>>;

export type StudentValidation =
  | { valid: true; value: ValidStudentInput; errors: Record<string, never> }
  | { valid: false; errors: StudentErrors };

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 60;

export function cleanHumanName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeForComparison(value: string): string {
  return cleanHumanName(value)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es");
}

export function validateStudentDraft(draft: StudentDraft): StudentValidation {
  const name = cleanHumanName(draft.name);
  const surname = cleanHumanName(draft.surname);
  const errors: StudentErrors = {};

  if (name.length < NAME_MIN_LENGTH) {
    errors.name = "Ingresá un nombre de al menos 2 caracteres.";
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = "El nombre no puede superar 60 caracteres.";
  }

  if (surname.length < NAME_MIN_LENGTH) {
    errors.surname = "Ingresá un apellido de al menos 2 caracteres.";
  } else if (surname.length > NAME_MAX_LENGTH) {
    errors.surname = "El apellido no puede superar 60 caracteres.";
  }

  const gradeRaw = draft.grade.trim();
  const grade = Number(gradeRaw);

  if (gradeRaw === "" || !Number.isFinite(grade)) {
    errors.grade = "Ingresá una nota numérica.";
  } else if (grade < 0 || grade > 10) {
    errors.grade = "La nota debe estar entre 0 y 10.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      name,
      surname,
      grade,
    },
    errors: {},
  };
}

export function createStudent(
  input: ValidStudentInput,
  idFactory: () => string = () => crypto.randomUUID(),
): Student {
  return {
    id: idFactory(),
    ...input,
  };
}

export function studentIdentityKey(
  student: Pick<Student, "name" | "surname">,
): string {
  return `${normalizeForComparison(student.name)}::${normalizeForComparison(student.surname)}`;
}

export function isDuplicateStudent(
  students: readonly Student[],
  candidate: Pick<Student, "name" | "surname">,
): boolean {
  const candidateKey = studentIdentityKey(candidate);
  return students.some(
    (student) => studentIdentityKey(student) === candidateKey,
  );
}

export function matchesStudent(student: Student, query: string): boolean {
  const normalizedQuery = normalizeForComparison(query);
  if (normalizedQuery === "") {
    return true;
  }

  const fullName = normalizeForComparison(`${student.name} ${student.surname}`);
  const inverseName = normalizeForComparison(
    `${student.surname} ${student.name}`,
  );
  return (
    fullName.includes(normalizedQuery) || inverseName.includes(normalizedQuery)
  );
}

export function sortStudents(students: readonly Student[]): Student[] {
  return [...students].sort((left, right) => {
    const surnameComparison = left.surname.localeCompare(right.surname, "es", {
      sensitivity: "base",
    });

    if (surnameComparison !== 0) {
      return surnameComparison;
    }

    return left.name.localeCompare(right.name, "es", { sensitivity: "base" });
  });
}

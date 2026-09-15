import { beforeEach, describe, expect, it } from "vitest";
import {
  LEGACY_STUDENTS_KEY,
  LEGACY_USERS_KEY,
  STUDENT_STORAGE_KEY,
  initializeStudentStore,
  inspectStudentStore,
  readStudents,
} from "../storage/student-store";

describe("student storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("purges the historical credential-like Usuarios key", () => {
    window.localStorage.setItem(
      LEGACY_USERS_KEY,
      JSON.stringify([
        { DNI: "historical", email: "historical", contraseña: "historical" },
      ]),
    );

    const result = initializeStudentStore(window.localStorage, () => "id-1");
    expect(result.purgedLegacyCredentials).toBe(true);
    expect(result.storageIssue).toBeNull();
    expect(window.localStorage.getItem(LEGACY_USERS_KEY)).toBeNull();
  });

  it("migrates valid historical students into the versioned schema", () => {
    window.localStorage.setItem(
      LEGACY_STUDENTS_KEY,
      JSON.stringify([
        { nombre: "Ada", apellido: "Lovelace", nota: "10" },
        { nombre: "Grace", apellido: "Hopper", nota: 9 },
      ]),
    );

    let id = 0;
    const result = initializeStudentStore(
      window.localStorage,
      () => `id-${++id}`,
    );

    expect(result.migratedStudents).toBe(2);
    expect(result.students).toHaveLength(2);
    expect(result.storageIssue).toBeNull();
    expect(window.localStorage.getItem(LEGACY_STUDENTS_KEY)).toBeNull();
    expect(window.localStorage.getItem(STUDENT_STORAGE_KEY)).not.toBeNull();
  });

  it("skips invalid legacy records without crashing", () => {
    window.localStorage.setItem(
      LEGACY_STUDENTS_KEY,
      JSON.stringify([
        { nombre: "A", apellido: "", nota: "20" },
        { nope: true },
      ]),
    );

    const result = initializeStudentStore(window.localStorage, () => "id-1");
    expect(result.students).toEqual([]);
    expect(result.storageIssue).toBeNull();
  });

  it("reports corrupted current storage instead of silently treating it as new", () => {
    window.localStorage.setItem(STUDENT_STORAGE_KEY, "not-json");

    expect(inspectStudentStore(window.localStorage)).toMatchObject({
      status: "recovery-needed",
      issue: "corrupt-json",
      raw: "not-json",
    });
    expect(initializeStudentStore(window.localStorage)).toMatchObject({
      students: [],
      storageIssue: "corrupt-json",
    });
    expect(readStudents(window.localStorage)).toEqual([]);
    expect(window.localStorage.getItem(STUDENT_STORAGE_KEY)).toBe("not-json");
  });

  it("distinguishes an unsupported storage version from malformed JSON", () => {
    window.localStorage.setItem(
      STUDENT_STORAGE_KEY,
      JSON.stringify({ version: 99, students: [] }),
    );

    expect(inspectStudentStore(window.localStorage)).toMatchObject({
      status: "recovery-needed",
      issue: "unsupported-version",
    });
  });

  it("reports invalid current student schema without overwriting it", () => {
    const raw = JSON.stringify({
      version: 1,
      students: [{ id: "broken", name: "A", surname: "", grade: 99 }],
    });
    window.localStorage.setItem(STUDENT_STORAGE_KEY, raw);

    expect(inspectStudentStore(window.localStorage)).toMatchObject({
      status: "recovery-needed",
      issue: "invalid-schema",
    });
    expect(window.localStorage.getItem(STUDENT_STORAGE_KEY)).toBe(raw);
  });
});

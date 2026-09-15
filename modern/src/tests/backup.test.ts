import { describe, expect, it } from "vitest";
import {
  STUDENT_BACKUP_FORMAT,
  STUDENT_BACKUP_VERSION,
  importStudentBackup,
  serializeStudentBackup,
} from "../storage/student-backup";
import type { Student } from "../domain/student";

const ada: Student = {
  id: "ada-1",
  name: "Ada",
  surname: "Lovelace",
  grade: 10,
};

const grace: Student = {
  id: "grace-1",
  name: "Grace",
  surname: "Hopper",
  grade: 9,
};

describe("student backup", () => {
  it("round-trips a versioned backup without changing student identity", () => {
    const raw = serializeStudentBackup(
      [ada, grace],
      new Date("2026-09-15T12:00:00.000Z"),
    );

    const result = importStudentBackup(raw, [], "replace");
    expect(result).toEqual({
      ok: true,
      students: [ada, grace],
      imported: 2,
      skippedDuplicates: 0,
    });

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    expect(parsed.format).toBe(STUDENT_BACKUP_FORMAT);
    expect(parsed.version).toBe(STUDENT_BACKUP_VERSION);
    expect(parsed.exportedAt).toBe("2026-09-15T12:00:00.000Z");
  });

  it("rejects malformed JSON atomically", () => {
    const result = importStudentBackup("not-json", [ada], "replace");
    expect(result).toMatchObject({ ok: false, code: "invalid-json" });
  });

  it("rejects files from another or older format", () => {
    const result = importStudentBackup(
      JSON.stringify({ format: "something-else", version: 1, students: [] }),
      [],
      "replace",
    );
    expect(result).toMatchObject({ ok: false, code: "invalid-format" });
  });

  it("rejects unsupported backup versions", () => {
    const result = importStudentBackup(
      JSON.stringify({
        format: STUDENT_BACKUP_FORMAT,
        version: 99,
        exportedAt: "2026-09-15T12:00:00.000Z",
        students: [],
      }),
      [],
      "replace",
    );
    expect(result).toMatchObject({ ok: false, code: "unsupported-version" });
  });

  it("rejects an invalid student instead of partially restoring the file", () => {
    const result = importStudentBackup(
      JSON.stringify({
        format: STUDENT_BACKUP_FORMAT,
        version: STUDENT_BACKUP_VERSION,
        exportedAt: "2026-09-15T12:00:00.000Z",
        students: [ada, { id: "bad", name: "A", surname: "", grade: 40 }],
      }),
      [grace],
      "replace",
    );
    expect(result).toMatchObject({ ok: false, code: "invalid-schema" });
  });

  it("merges new students while skipping identity duplicates", () => {
    const raw = serializeStudentBackup([{ ...ada, id: "other-ada-id" }, grace]);
    const result = importStudentBackup(raw, [ada], "merge");

    expect(result).toEqual({
      ok: true,
      students: [ada, grace],
      imported: 1,
      skippedDuplicates: 1,
    });
  });

  it("rejects an id collision with a different student", () => {
    const raw = serializeStudentBackup([
      { id: ada.id, name: "Alan", surname: "Turing", grade: 8 },
    ]);
    const result = importStudentBackup(raw, [ada], "merge");
    expect(result).toMatchObject({ ok: false, code: "id-conflict" });
  });
});

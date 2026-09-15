import { describe, expect, it } from "vitest";
import {
  createStudent,
  isDuplicateStudent,
  matchesStudent,
  normalizeForComparison,
  sortStudents,
  validateStudentDraft,
} from "../domain/student";

describe("student domain", () => {
  it("normalizes spaces, case and accents for comparison", () => {
    expect(normalizeForComparison("  María   José ")).toBe("maria jose");
  });

  it("validates the historical grade boundary", () => {
    expect(
      validateStudentDraft({ name: "Ada", surname: "Lovelace", grade: "10" })
        .valid,
    ).toBe(true);
    expect(
      validateStudentDraft({ name: "Ada", surname: "Lovelace", grade: "10.1" })
        .valid,
    ).toBe(false);
    expect(
      validateStudentDraft({ name: "Ada", surname: "Lovelace", grade: "-1" })
        .valid,
    ).toBe(false);
  });

  it("rejects incomplete names", () => {
    const result = validateStudentDraft({ name: "A", surname: "", grade: "7" });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.name).toBeDefined();
      expect(result.errors.surname).toBeDefined();
    }
  });

  it("detects duplicates across casing and accents", () => {
    const existing = createStudent(
      { name: "María", surname: "Gómez", grade: 8 },
      () => "student-1",
    );
    expect(
      isDuplicateStudent([existing], { name: "maria", surname: "gomez" }),
    ).toBe(true);
  });

  it("searches by name or surname without accent sensitivity", () => {
    const student = createStudent(
      { name: "José", surname: "Álvarez", grade: 9 },
      () => "student-1",
    );
    expect(matchesStudent(student, "alvarez jose")).toBe(true);
    expect(matchesStudent(student, "pepe")).toBe(false);
  });

  it("sorts by surname and then name", () => {
    const students = [
      createStudent({ name: "Grace", surname: "Hopper", grade: 10 }, () => "2"),
      createStudent({ name: "Ada", surname: "Byron", grade: 10 }, () => "1"),
    ];
    expect(sortStudents(students).map((student) => student.id)).toEqual([
      "1",
      "2",
    ]);
  });
});

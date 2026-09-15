import { describe, expect, it } from "vitest";
import {
  createStudent,
  isDuplicateStudent,
  isDuplicateStudentExcluding,
  matchesStudent,
  normalizeForComparison,
  sortStudents,
  sortStudentsBy,
  summarizeStudents,
  updateStudent,
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

  it("allows editing the same identity while still blocking another student", () => {
    const ada = createStudent(
      { name: "Ada", surname: "Lovelace", grade: 9 },
      () => "ada",
    );
    const grace = createStudent(
      { name: "Grace", surname: "Hopper", grade: 8 },
      () => "grace",
    );

    expect(isDuplicateStudentExcluding([ada, grace], ada, ada.id)).toBe(false);
    expect(
      isDuplicateStudentExcluding(
        [ada, grace],
        { name: "Grace", surname: "Hopper" },
        ada.id,
      ),
    ).toBe(true);
  });

  it("updates a student without changing the stable id", () => {
    const original = createStudent(
      { name: "Ada", surname: "Lovelace", grade: 9 },
      () => "stable-id",
    );
    expect(
      updateStudent(original, { name: "Ada", surname: "Byron", grade: 10 }),
    ).toEqual({
      id: "stable-id",
      name: "Ada",
      surname: "Byron",
      grade: 10,
    });
  });

  it("searches by name or surname without accent sensitivity", () => {
    const student = createStudent(
      { name: "José", surname: "Álvarez", grade: 9 },
      () => "student-1",
    );
    expect(matchesStudent(student, "alvarez jose")).toBe(true);
    expect(matchesStudent(student, "pepe")).toBe(false);
  });

  it("sorts by surname and then name by default", () => {
    const students = [
      createStudent({ name: "Grace", surname: "Hopper", grade: 8 }, () => "2"),
      createStudent({ name: "Ada", surname: "Byron", grade: 10 }, () => "1"),
    ];
    expect(sortStudents(students).map((student) => student.id)).toEqual([
      "1",
      "2",
    ]);
  });

  it("sorts by grade in either direction with stable name fallback", () => {
    const students = [
      createStudent({ name: "Grace", surname: "Hopper", grade: 8 }, () => "2"),
      createStudent({ name: "Ada", surname: "Byron", grade: 10 }, () => "1"),
      createStudent({ name: "Alan", surname: "Turing", grade: 8 }, () => "3"),
    ];

    expect(
      sortStudentsBy(students, "grade-desc").map((student) => student.id),
    ).toEqual(["1", "2", "3"]);
    expect(
      sortStudentsBy(students, "grade-asc").map((student) => student.id),
    ).toEqual(["2", "3", "1"]);
  });

  it("summarizes count average minimum and maximum without inventing pass rules", () => {
    const students = [
      createStudent({ name: "Ada", surname: "Byron", grade: 10 }, () => "1"),
      createStudent({ name: "Grace", surname: "Hopper", grade: 8 }, () => "2"),
      createStudent({ name: "Alan", surname: "Turing", grade: 6 }, () => "3"),
    ];

    expect(summarizeStudents(students)).toEqual({
      count: 3,
      average: 8,
      minimum: 6,
      maximum: 10,
    });
    expect(summarizeStudents([])).toEqual({
      count: 0,
      average: null,
      minimum: null,
      maximum: null,
    });
  });
});

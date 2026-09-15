import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "../app";
import { serializeStudentBackup } from "../storage/student-backup";
import { STUDENT_STORAGE_KEY } from "../storage/student-store";

describe("Modderhouse app", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.localStorage.clear();
  });

  function mount(
    downloadTextFile: (
      filename: string,
      content: string,
      mimeType: string,
    ) => void = () => undefined,
  ): void {
    const root = document.querySelector<HTMLElement>("#app");
    if (root === null) {
      throw new Error("test root missing");
    }
    let id = 0;
    mountApp(
      root,
      window.localStorage,
      () => `student-${++id}`,
      downloadTextFile,
    );
  }

  function addStudent(name: string, surname: string, grade: string): void {
    fireEvent.input(screen.getByLabelText("Nombre"), {
      target: { value: name },
    });
    fireEvent.input(screen.getByLabelText("Apellido"), {
      target: { value: surname },
    });
    fireEvent.input(screen.getByLabelText("Nota"), {
      target: { value: grade },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar alumno" }));
  }

  function addAda(): void {
    addStudent("Ada", "Lovelace", "10");
  }

  it("does not render a password or login field", () => {
    mount();
    expect(screen.queryByLabelText(/contraseña/i)).toBeNull();
    expect(screen.queryByText(/iniciar sesión/i)).toBeNull();
    expect(screen.getByText(/100% local/i)).not.toBeNull();
  });

  it("keeps the exact 2023 baseline discoverable from the 2026 product", () => {
    mount();
    const link = screen.getByRole("link", {
      name: "Ver baseline histórico exacto de 2023",
    });
    expect(link.getAttribute("href")).toContain(
      "d6a38f5795569131ff4cd0db63640aff8dc09007",
    );
  });

  it("adds a valid student and exposes edit and removal actions", () => {
    mount();
    addAda();

    expect(
      screen.getByRole("heading", { name: "Ada Lovelace" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Editar a Ada Lovelace" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Eliminar a Ada Lovelace" }),
    ).not.toBeNull();
    expect(screen.getByText("1 alumno")).not.toBeNull();
  });

  it("edits a student without changing the stable id", () => {
    mount();
    addAda();

    fireEvent.click(
      screen.getByRole("button", { name: "Editar a Ada Lovelace" }),
    );
    expect(screen.getByText("Editando a Ada Lovelace.")).not.toBeNull();
    fireEvent.input(screen.getByLabelText("Apellido"), {
      target: { value: "Byron" },
    });
    fireEvent.input(screen.getByLabelText("Nota"), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(screen.getByRole("heading", { name: "Ada Byron" })).not.toBeNull();
    const stored = JSON.parse(
      window.localStorage.getItem(STUDENT_STORAGE_KEY) ?? "{}",
    ) as {
      students?: Array<{ id?: string; surname?: string; grade?: number }>;
    };
    expect(stored.students?.[0]).toMatchObject({
      id: "student-1",
      surname: "Byron",
      grade: 9,
    });
  });

  it("blocks editing one student into another existing identity", () => {
    mount();
    addAda();
    addStudent("Grace", "Hopper", "9");

    fireEvent.click(
      screen.getByRole("button", { name: "Editar a Ada Lovelace" }),
    );
    fireEvent.input(screen.getByLabelText("Nombre"), {
      target: { value: "Grace" },
    });
    fireEvent.input(screen.getByLabelText("Apellido"), {
      target: { value: "Hopper" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      screen.getByText("Ya existe otro alumno con ese nombre y apellido."),
    ).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: "Ada Lovelace" }),
    ).not.toBeNull();
  });

  it("cancels editing without mutating persistence", () => {
    mount();
    addAda();
    const before = window.localStorage.getItem(STUDENT_STORAGE_KEY);

    fireEvent.click(
      screen.getByRole("button", { name: "Editar a Ada Lovelace" }),
    );
    fireEvent.input(screen.getByLabelText("Apellido"), {
      target: { value: "Changed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancelar edición" }));

    expect(window.localStorage.getItem(STUDENT_STORAGE_KEY)).toBe(before);
    expect(
      screen.getByRole("heading", { name: "Ada Lovelace" }),
    ).not.toBeNull();
  });

  it("blocks duplicate students after normalization", () => {
    mount();
    addStudent("María", "Gómez", "8");
    addStudent("maria", "gomez", "7");

    expect(screen.getByText("Ese alumno ya está cargado.")).not.toBeNull();
    expect(screen.getByText("1 alumno")).not.toBeNull();
  });

  it("searches students and exposes a distinct empty search state", () => {
    mount();
    addAda();

    fireEvent.input(screen.getByLabelText("Buscar por nombre o apellido"), {
      target: { value: "Hopper" },
    });
    expect(screen.getByText("No hay coincidencias.")).not.toBeNull();
  });

  it("shows neutral average minimum and maximum summaries", () => {
    mount();
    addStudent("Grace", "Hopper", "6");
    addStudent("Ada", "Lovelace", "10");

    expect(
      screen.getByText("8", { selector: "#summary-average" }),
    ).not.toBeNull();
    expect(
      screen.getByText("6", { selector: "#summary-minimum" }),
    ).not.toBeNull();
    expect(
      screen.getByText("10", { selector: "#summary-maximum" }),
    ).not.toBeNull();
    expect(screen.queryByText(/aprobado|desaprobado/i)).toBeNull();
  });

  it("orders visible students by grade without changing persistence", () => {
    mount();
    addStudent("Grace", "Hopper", "6");
    addStudent("Ada", "Lovelace", "10");
    const before = window.localStorage.getItem(STUDENT_STORAGE_KEY);

    fireEvent.change(screen.getByLabelText("Ordenar"), {
      target: { value: "grade-desc" },
    });

    const headings = Array.from(
      document.querySelectorAll<HTMLHeadingElement>(".student-card h3"),
    ).map((heading) => heading.textContent);
    expect(headings).toEqual(["Ada Lovelace", "Grace Hopper"]);
    expect(window.localStorage.getItem(STUDENT_STORAGE_KEY)).toBe(before);
  });

  it("undoes an individual deletion during the current session", () => {
    mount();
    addAda();
    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar a Ada Lovelace" }),
    );
    expect(screen.queryByRole("heading", { name: "Ada Lovelace" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(
      screen.getByRole("heading", { name: "Ada Lovelace" }),
    ).not.toBeNull();
  });

  it("requires confirmation before clearing and allows the clear to be undone", () => {
    mount();
    addAda();

    fireEvent.click(screen.getByRole("button", { name: "Vaciar lista" }));
    expect(screen.getByText("¿Vaciar todos los alumnos?")).not.toBeNull();
    expect(screen.getByText("1 alumno")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Sí, vaciar" }));
    expect(screen.getByText("0 alumnos")).not.toBeNull();
    expect(screen.getByText("Todavía no hay alumnos.")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Deshacer" }));
    expect(
      screen.getByRole("heading", { name: "Ada Lovelace" }),
    ).not.toBeNull();
  });

  it("exports a versioned backup through an injectable download boundary", () => {
    const download = vi.fn();
    mount(download);
    addAda();

    fireEvent.click(screen.getByRole("button", { name: "Exportar backup" }));

    expect(download).toHaveBeenCalledOnce();
    const [filename, content, mimeType] = download.mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(filename).toMatch(/^modderhouse-alumnos-\d{4}-\d{2}-\d{2}\.json$/);
    expect(mimeType).toBe("application/json;charset=utf-8");
    expect(JSON.parse(content)).toMatchObject({
      format: "modderhouse.student-backup",
      version: 1,
      students: [{ name: "Ada", surname: "Lovelace", grade: 10 }],
    });
  });

  it("blocks normal writes when current storage needs recovery", () => {
    window.localStorage.setItem(STUDENT_STORAGE_KEY, "broken-json");
    mount();

    expect(
      screen.getByText("Hay datos locales que necesitan recuperación."),
    ).not.toBeNull();
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).disabled).toBe(
      true,
    );
    expect(
      (screen.getByLabelText("Ordenar") as HTMLSelectElement).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Exportar backup",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(window.localStorage.getItem(STUDENT_STORAGE_KEY)).toBe(
      "broken-json",
    );
  });

  it("lets the user preserve the unreadable payload before explicitly discarding it", () => {
    window.localStorage.setItem(STUDENT_STORAGE_KEY, "broken-json");
    const download = vi.fn();
    mount(download);

    fireEvent.click(
      screen.getByRole("button", { name: "Descargar dato original" }),
    );
    expect(download).toHaveBeenCalledWith(
      expect.stringMatching(/^modderhouse-dato-no-legible-/),
      "broken-json",
      "text/plain;charset=utf-8",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Descartar y empezar de cero" }),
    );
    expect(screen.getByText("¿Descartar el dato no legible?")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Sí, descartar" }));

    expect(window.localStorage.getItem(STUDENT_STORAGE_KEY)).toBeNull();
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).disabled).toBe(
      false,
    );
  });

  it("restores a valid backup and exits recovery mode atomically", async () => {
    window.localStorage.setItem(STUDENT_STORAGE_KEY, "broken-json");
    mount();

    const raw = serializeStudentBackup([
      { id: "backup-1", name: "Grace", surname: "Hopper", grade: 9 },
    ]);
    const fakeFile = { text: async () => raw } as File;
    const input = screen.getByLabelText(
      "Archivo de backup",
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [fakeFile],
    });

    fireEvent.click(screen.getByRole("button", { name: "Restaurar backup" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Grace Hopper" }),
      ).not.toBeNull();
    });
    expect((screen.getByLabelText("Nombre") as HTMLInputElement).disabled).toBe(
      false,
    );
    const recoveryText = screen.getByText(
      "Hay datos locales que necesitan recuperación.",
    );
    const recoveryPanel = recoveryText.closest(".recovery-panel");
    expect(recoveryPanel).not.toBeNull();
    expect((recoveryPanel as HTMLElement).hidden).toBe(true);
  });
});

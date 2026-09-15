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

  function addAda(): void {
    fireEvent.input(screen.getByLabelText("Nombre"), {
      target: { value: "Ada" },
    });
    fireEvent.input(screen.getByLabelText("Apellido"), {
      target: { value: "Lovelace" },
    });
    fireEvent.input(screen.getByLabelText("Nota"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar alumno" }));
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

  it("adds a valid student and exposes an accessible removal action", () => {
    mount();
    addAda();

    expect(
      screen.getByRole("heading", { name: "Ada Lovelace" }),
    ).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Eliminar a Ada Lovelace" }),
    ).not.toBeNull();
    expect(screen.getByText("1 alumno")).not.toBeNull();
  });

  it("blocks duplicate students after normalization", () => {
    mount();
    const name = screen.getByLabelText("Nombre");
    const surname = screen.getByLabelText("Apellido");
    const grade = screen.getByLabelText("Nota");
    const add = screen.getByRole("button", { name: "Agregar alumno" });

    fireEvent.input(name, { target: { value: "María" } });
    fireEvent.input(surname, { target: { value: "Gómez" } });
    fireEvent.input(grade, { target: { value: "8" } });
    fireEvent.click(add);

    fireEvent.input(name, { target: { value: "maria" } });
    fireEvent.input(surname, { target: { value: "gomez" } });
    fireEvent.input(grade, { target: { value: "7" } });
    fireEvent.click(add);

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

  it("requires explicit confirmation before clearing students", () => {
    mount();
    addAda();

    fireEvent.click(screen.getByRole("button", { name: "Vaciar lista" }));
    expect(screen.getByText("¿Vaciar todos los alumnos?")).not.toBeNull();
    expect(screen.getByText("1 alumno")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Sí, vaciar" }));
    expect(screen.getByText("0 alumnos")).not.toBeNull();
    expect(screen.getByText("Todavía no hay alumnos.")).not.toBeNull();
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
    expect(screen.getByLabelText("Nombre")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Exportar backup" })).toBeDisabled();
    expect(window.localStorage.getItem(STUDENT_STORAGE_KEY)).toBe("broken-json");
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
    expect(screen.getByLabelText("Nombre")).not.toBeDisabled();
  });

  it("restores a valid backup and exits recovery mode atomically", async () => {
    window.localStorage.setItem(STUDENT_STORAGE_KEY, "broken-json");
    mount();

    const raw = serializeStudentBackup([
      { id: "backup-1", name: "Grace", surname: "Hopper", grade: 9 },
    ]);
    const fakeFile = { text: async () => raw } as File;
    const input = screen.getByLabelText("Archivo de backup") as HTMLInputElement;
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
    expect(screen.getByLabelText("Nombre")).not.toBeDisabled();
    expect(screen.queryByText("Hay datos locales que necesitan recuperación.")).toBeNull();
  });
});

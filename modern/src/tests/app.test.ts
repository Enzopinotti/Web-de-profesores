import { fireEvent, screen } from "@testing-library/dom";
import { beforeEach, describe, expect, it } from "vitest";
import { mountApp } from "../app";

describe("Modderhouse app", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.localStorage.clear();
  });

  function mount(): void {
    const root = document.querySelector<HTMLElement>("#app");
    if (root === null) {
      throw new Error("test root missing");
    }
    let id = 0;
    mountApp(root, window.localStorage, () => `student-${++id}`);
  }

  it("does not render a password or login field", () => {
    mount();
    expect(screen.queryByLabelText(/contraseña/i)).toBeNull();
    expect(screen.queryByText(/iniciar sesión/i)).toBeNull();
    expect(screen.getByText(/100% local/i)).not.toBeNull();
  });

  it("adds a valid student and exposes an accessible removal action", () => {
    mount();
    fireEvent.input(screen.getByLabelText("Nombre"), { target: { value: "Ada" } });
    fireEvent.input(screen.getByLabelText("Apellido"), { target: { value: "Lovelace" } });
    fireEvent.input(screen.getByLabelText("Nota"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar alumno" }));

    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).not.toBeNull();
    expect(screen.getByRole("button", { name: "Eliminar a Ada Lovelace" })).not.toBeNull();
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
    fireEvent.input(screen.getByLabelText("Nombre"), { target: { value: "Ada" } });
    fireEvent.input(screen.getByLabelText("Apellido"), { target: { value: "Lovelace" } });
    fireEvent.input(screen.getByLabelText("Nota"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar alumno" }));

    fireEvent.input(screen.getByLabelText("Buscar por nombre o apellido"), {
      target: { value: "Hopper" },
    });
    expect(screen.getByText("No hay coincidencias.")).not.toBeNull();
  });

  it("requires explicit confirmation before clearing students", () => {
    mount();
    fireEvent.input(screen.getByLabelText("Nombre"), { target: { value: "Ada" } });
    fireEvent.input(screen.getByLabelText("Apellido"), { target: { value: "Lovelace" } });
    fireEvent.input(screen.getByLabelText("Nota"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar alumno" }));

    fireEvent.click(screen.getByRole("button", { name: "Vaciar lista" }));
    expect(screen.getByText("¿Vaciar todos los alumnos?")).not.toBeNull();
    expect(screen.getByText("1 alumno")).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Sí, vaciar" }));
    expect(screen.getByText("0 alumnos")).not.toBeNull();
    expect(screen.getByText("Todavía no hay alumnos.")).not.toBeNull();
  });
});

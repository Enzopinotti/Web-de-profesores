import {
  createStudent,
  isDuplicateStudent,
  matchesStudent,
  sortStudents,
  validateStudentDraft,
  type Student,
  type StudentErrors,
  type StudentField,
} from "./domain/student";
import { HISTORICAL_TUTORS, tutorInitials } from "./domain/tutors";
import {
  clearStudents,
  initializeStudentStore,
  writeStudents,
} from "./storage/student-store";

const fieldSelectors: Record<StudentField, string> = {
  name: "#student-name",
  surname: "#student-surname",
  grade: "#student-grade",
};

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector);
  if (element === null) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element as T;
}

function createTutorCard(name: string, surname: string, initials: string): HTMLElement {
  const item = document.createElement("li");
  item.className = "tutor-card";

  const avatar = document.createElement("span");
  avatar.className = "tutor-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = initials;

  const copy = document.createElement("span");
  copy.className = "tutor-name";
  copy.textContent = `${name} ${surname}`;

  item.append(avatar, copy);
  return item;
}

export function mountApp(
  root: HTMLElement,
  storage: Storage = window.localStorage,
  idFactory: () => string = () => crypto.randomUUID(),
): void {
  const initialization = initializeStudentStore(storage, idFactory);
  let students: Student[] = initialization.students;
  let searchQuery = "";

  root.innerHTML = `
    <div class="site-shell">
      <header class="site-header">
        <a class="brand" href="#main-content" aria-label="Modderhouse, ir al workspace">
          <span class="brand-mark" aria-hidden="true">M</span>
          <span>
            <strong>Modderhouse</strong>
            <small>Archivo educativo · 2023 → 2026</small>
          </span>
        </a>
        <span class="local-badge">100% local · sin cuentas</span>
      </header>

      <main id="main-content" class="main-layout" tabindex="-1">
        <section class="intro-panel" aria-labelledby="intro-title">
          <p class="eyebrow">RECONSTRUCCIÓN 2026</p>
          <h1 id="intro-title">Un workspace docente local, sin fingir autenticación.</h1>
          <p class="intro-copy">
            Esta versión preserva la idea del simulador original de JavaScript, pero ya no solicita DNI ni contraseña. Los alumnos se guardan únicamente en este navegador.
          </p>
          <div class="archive-note">
            <strong>Qué cambió</strong>
            <p>El proyecto 2023 sigue disponible en Git como evidencia histórica. La versión actual convierte sus reglas implícitas en contratos testeables y accesibles.</p>
          </div>
        </section>

        <section class="workspace" aria-labelledby="workspace-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">WORKSPACE</p>
              <h2 id="workspace-title">Alumnos</h2>
            </div>
            <span id="student-count" class="count-pill">0 alumnos</span>
          </div>

          <form id="student-form" class="student-form" novalidate>
            <div class="field-group">
              <label for="student-name">Nombre</label>
              <input id="student-name" name="name" autocomplete="off" maxlength="60" aria-describedby="student-name-error" />
              <span id="student-name-error" class="field-error"></span>
            </div>
            <div class="field-group">
              <label for="student-surname">Apellido</label>
              <input id="student-surname" name="surname" autocomplete="off" maxlength="60" aria-describedby="student-surname-error" />
              <span id="student-surname-error" class="field-error"></span>
            </div>
            <div class="field-group field-group--grade">
              <label for="student-grade">Nota</label>
              <input id="student-grade" name="grade" type="number" min="0" max="10" step="0.1" inputmode="decimal" aria-describedby="student-grade-error" />
              <span id="student-grade-error" class="field-error"></span>
            </div>
            <button class="button button--primary" type="submit">Agregar alumno</button>
          </form>

          <div class="student-toolbar">
            <div class="search-field">
              <label for="student-search">Buscar por nombre o apellido</label>
              <input id="student-search" type="search" autocomplete="off" placeholder="Ej. Ada Lovelace" />
            </div>
            <button id="reset-students" class="button button--quiet" type="button">Vaciar lista</button>
          </div>

          <div id="reset-confirmation" class="reset-confirmation" hidden>
            <p><strong>¿Vaciar todos los alumnos?</strong> Esta acción también borra la copia local.</p>
            <div>
              <button id="confirm-reset" class="button button--danger" type="button">Sí, vaciar</button>
              <button id="cancel-reset" class="button button--quiet" type="button">Cancelar</button>
            </div>
          </div>

          <p id="app-status" class="status-message" role="status" aria-live="polite"></p>
          <div id="student-empty" class="empty-state">
            <strong>Todavía no hay alumnos.</strong>
            <span>Agregá el primero con el formulario.</span>
          </div>
          <ul id="student-list" class="student-list" aria-label="Alumnos guardados"></ul>
        </section>

        <section class="tutors-panel" aria-labelledby="tutors-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">ARCHIVO 2023</p>
              <h2 id="tutors-title">Tutores de la entrega original</h2>
            </div>
          </div>
          <p class="section-copy">Estos nombres provienen del JSON histórico. Se muestran como fixtures de archivo, no como cuentas ni roles actuales.</p>
          <ul id="tutor-list" class="tutor-list"></ul>
        </section>
      </main>

      <footer class="site-footer">
        <span>Proyecto educativo preservado y reconstruido por Enzo Pinotti.</span>
        <a href="https://github.com/Enzopinotti/Web-de-profesores">Ver código e historia en GitHub</a>
      </footer>
    </div>
  `;

  const form = requiredElement<HTMLFormElement>(root, "#student-form");
  const list = requiredElement<HTMLUListElement>(root, "#student-list");
  const emptyState = requiredElement<HTMLElement>(root, "#student-empty");
  const count = requiredElement<HTMLElement>(root, "#student-count");
  const search = requiredElement<HTMLInputElement>(root, "#student-search");
  const status = requiredElement<HTMLElement>(root, "#app-status");
  const resetButton = requiredElement<HTMLButtonElement>(root, "#reset-students");
  const resetConfirmation = requiredElement<HTMLElement>(root, "#reset-confirmation");
  const confirmReset = requiredElement<HTMLButtonElement>(root, "#confirm-reset");
  const cancelReset = requiredElement<HTMLButtonElement>(root, "#cancel-reset");
  const tutorList = requiredElement<HTMLUListElement>(root, "#tutor-list");

  function setStatus(message: string, tone: "neutral" | "success" | "error" = "neutral"): void {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function clearFieldErrors(): void {
    for (const field of Object.keys(fieldSelectors) as StudentField[]) {
      const input = requiredElement<HTMLInputElement>(form, fieldSelectors[field]);
      const error = requiredElement<HTMLElement>(form, `#student-${field}-error`);
      input.removeAttribute("aria-invalid");
      error.textContent = "";
    }
  }

  function renderFieldErrors(errors: StudentErrors): void {
    clearFieldErrors();
    for (const [field, message] of Object.entries(errors) as [StudentField, string][]) {
      const input = requiredElement<HTMLInputElement>(form, fieldSelectors[field]);
      const error = requiredElement<HTMLElement>(form, `#student-${field}-error`);
      input.setAttribute("aria-invalid", "true");
      error.textContent = message;
    }
  }

  function renderStudents(): void {
    list.replaceChildren();
    const visibleStudents = sortStudents(students).filter((student) =>
      matchesStudent(student, searchQuery),
    );

    count.textContent = `${students.length} ${students.length === 1 ? "alumno" : "alumnos"}`;

    if (students.length === 0) {
      emptyState.innerHTML = "<strong>Todavía no hay alumnos.</strong><span>Agregá el primero con el formulario.</span>";
      emptyState.hidden = false;
      return;
    }

    if (visibleStudents.length === 0) {
      emptyState.innerHTML = "<strong>No hay coincidencias.</strong><span>Probá con otro nombre o apellido.</span>";
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    for (const student of visibleStudents) {
      const item = document.createElement("li");
      item.className = "student-card";

      const copy = document.createElement("div");
      const heading = document.createElement("h3");
      heading.textContent = `${student.name} ${student.surname}`;
      const grade = document.createElement("p");
      grade.textContent = `Nota: ${student.grade.toLocaleString("es-AR")}`;
      copy.append(heading, grade);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button button--quiet button--compact";
      remove.textContent = "Eliminar";
      remove.setAttribute("aria-label", `Eliminar a ${student.name} ${student.surname}`);
      remove.addEventListener("click", () => {
        students = students.filter((candidate) => candidate.id !== student.id);
        writeStudents(storage, students);
        renderStudents();
        setStatus(`${student.name} ${student.surname} fue eliminado.`, "success");
      });

      item.append(copy, remove);
      list.append(item);
    }
  }

  for (const tutor of HISTORICAL_TUTORS) {
    tutorList.append(createTutorCard(tutor.name, tutor.surname, tutorInitials(tutor)));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const validation = validateStudentDraft({
      name: String(formData.get("name") ?? ""),
      surname: String(formData.get("surname") ?? ""),
      grade: String(formData.get("grade") ?? ""),
    });

    if (!validation.valid) {
      renderFieldErrors(validation.errors);
      setStatus("Revisá los campos marcados antes de guardar.", "error");
      const firstError = Object.keys(validation.errors)[0] as StudentField | undefined;
      if (firstError !== undefined) {
        requiredElement<HTMLInputElement>(form, fieldSelectors[firstError]).focus();
      }
      return;
    }

    clearFieldErrors();
    if (isDuplicateStudent(students, validation.value)) {
      setStatus("Ese alumno ya está cargado.", "error");
      requiredElement<HTMLInputElement>(form, "#student-name").focus();
      return;
    }

    const student = createStudent(validation.value, idFactory);
    students = [...students, student];
    writeStudents(storage, students);
    form.reset();
    renderStudents();
    setStatus(`${student.name} ${student.surname} fue agregado.`, "success");
    requiredElement<HTMLInputElement>(form, "#student-name").focus();
  });

  search.addEventListener("input", () => {
    searchQuery = search.value;
    renderStudents();
  });

  resetButton.addEventListener("click", () => {
    if (students.length === 0) {
      setStatus("La lista ya está vacía.");
      return;
    }
    resetConfirmation.hidden = false;
    confirmReset.focus();
  });

  cancelReset.addEventListener("click", () => {
    resetConfirmation.hidden = true;
    resetButton.focus();
  });

  confirmReset.addEventListener("click", () => {
    students = [];
    searchQuery = "";
    search.value = "";
    clearStudents(storage);
    resetConfirmation.hidden = true;
    renderStudents();
    setStatus("Se vació la lista local de alumnos.", "success");
    resetButton.focus();
  });

  renderStudents();

  const initializationMessages: string[] = [];
  if (initialization.purgedLegacyCredentials) {
    initializationMessages.push("Se eliminó el registro local de credenciales del simulador 2023.");
  }
  if (initialization.migratedStudents > 0) {
    initializationMessages.push(
      `Se migraron ${initialization.migratedStudents} alumnos válidos desde la versión histórica.`,
    );
  }
  if (initializationMessages.length > 0) {
    setStatus(initializationMessages.join(" "), "success");
  }
}

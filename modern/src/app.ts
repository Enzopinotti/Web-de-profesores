import {
  createStudent,
  isDuplicateStudent,
  isDuplicateStudentExcluding,
  matchesStudent,
  sortStudentsBy,
  summarizeStudents,
  updateStudent,
  validateStudentDraft,
  type Student,
  type StudentErrors,
  type StudentField,
  type StudentSortMode,
} from "./domain/student";
import { HISTORICAL_TUTORS, tutorInitials } from "./domain/tutors";
import {
  importStudentBackup,
  serializeStudentBackup,
  type BackupImportMode,
} from "./storage/student-backup";
import {
  STUDENT_STORAGE_KEY,
  clearStudents,
  initializeStudentStore,
  writeStudents,
  type StudentStoreIssue,
} from "./storage/student-store";

const HISTORICAL_BASELINE =
  "https://github.com/Enzopinotti/Web-de-profesores/tree/d6a38f5795569131ff4cd0db63640aff8dc09007";

const fieldSelectors: Record<StudentField, string> = {
  name: "#student-name",
  surname: "#student-surname",
  grade: "#student-grade",
};

type DownloadTextFile = (
  filename: string,
  content: string,
  mimeType: string,
) => void;

type UndoSnapshot = Readonly<{
  students: Student[];
  message: string;
}>;

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector(selector);
  if (element === null) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element as T;
}

function defaultDownloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function storageIssueMessage(issue: StudentStoreIssue): string {
  switch (issue) {
    case "corrupt-json":
      return "La copia local no contiene JSON válido.";
    case "unsupported-version":
      return "La copia local pertenece a una versión que esta aplicación no puede interpretar.";
    case "invalid-schema":
      return "La copia local tiene una estructura que no cumple el contrato actual de alumnos.";
  }
}

function formatGrade(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return value.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

function createTutorCard(
  name: string,
  surname: string,
  initials: string,
): HTMLElement {
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
  downloadTextFile: DownloadTextFile = defaultDownloadTextFile,
): void {
  const initialization = initializeStudentStore(storage, idFactory);
  let students: Student[] = initialization.students;
  let searchQuery = "";
  let sortMode: StudentSortMode = "surname-asc";
  let editingStudentId: string | null = null;
  let undoSnapshot: UndoSnapshot | null = null;
  let recoveryPending = initialization.storageIssue !== null;
  const recoveryRaw = recoveryPending
    ? (storage.getItem(STUDENT_STORAGE_KEY) ?? "")
    : "";

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
            <strong>Dos etapas del mismo proyecto</strong>
            <p>La entrega 2023 permanece intacta como evidencia histórica. La versión 2026 agrega contratos de datos, recuperación, accesibilidad y operación sin reescribir retrospectivamente lo aprendido.</p>
            <a href="${HISTORICAL_BASELINE}">Ver baseline histórico exacto de 2023</a>
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

          <div id="storage-recovery" class="recovery-panel" role="alert" hidden>
            <strong>Hay datos locales que necesitan recuperación.</strong>
            <p id="storage-recovery-message"></p>
            <p>No los sobrescribimos. Podés restaurar un backup válido o guardar una copia del dato original antes de descartarlo.</p>
            <div class="recovery-actions">
              <button id="download-recovery" class="button button--quiet" type="button">Descargar dato original</button>
              <button id="discard-recovery" class="button button--danger" type="button">Descartar y empezar de cero</button>
            </div>
            <div id="discard-recovery-confirmation" class="reset-confirmation" hidden>
              <p><strong>¿Descartar el dato no legible?</strong> Esta acción elimina esa copia local. Descargala antes si querés conservarla.</p>
              <div>
                <button id="confirm-discard-recovery" class="button button--danger" type="button">Sí, descartar</button>
                <button id="cancel-discard-recovery" class="button button--quiet" type="button">Cancelar</button>
              </div>
            </div>
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
            <div class="form-actions">
              <button id="student-submit" class="button button--primary" type="submit">Agregar alumno</button>
              <button id="cancel-edit" class="button button--quiet" type="button" hidden>Cancelar edición</button>
            </div>
          </form>
          <p id="form-mode" class="form-mode" role="status" aria-live="polite"></p>

          <div class="student-toolbar">
            <div class="search-field">
              <label for="student-search">Buscar por nombre o apellido</label>
              <input id="student-search" type="search" autocomplete="off" placeholder="Ej. Ada Lovelace" />
            </div>
            <div class="sort-field">
              <label for="student-sort">Ordenar</label>
              <select id="student-sort">
                <option value="surname-asc">Apellido y nombre</option>
                <option value="grade-desc">Nota: mayor a menor</option>
                <option value="grade-asc">Nota: menor a mayor</option>
              </select>
            </div>
            <button id="reset-students" class="button button--quiet" type="button">Vaciar lista</button>
          </div>

          <div class="student-summary" aria-label="Resumen neutral de notas">
            <div><span>Promedio</span><strong id="summary-average">—</strong></div>
            <div><span>Mínima</span><strong id="summary-minimum">—</strong></div>
            <div><span>Máxima</span><strong id="summary-maximum">—</strong></div>
          </div>

          <div id="reset-confirmation" class="reset-confirmation" hidden>
            <p><strong>¿Vaciar todos los alumnos?</strong> Esta acción también borra la copia local, pero se puede deshacer durante esta sesión.</p>
            <div>
              <button id="confirm-reset" class="button button--danger" type="button">Sí, vaciar</button>
              <button id="cancel-reset" class="button button--quiet" type="button">Cancelar</button>
            </div>
          </div>

          <section class="data-tools" aria-labelledby="data-tools-title">
            <div>
              <p class="eyebrow">CONTINUIDAD DE DATOS</p>
              <h3 id="data-tools-title">Backup y restauración</h3>
              <p>Los datos siguen siendo locales. El backup permite moverlos o recuperarlos sin crear una cuenta ni enviarlos a un servidor.</p>
            </div>
            <div class="data-actions">
              <button id="export-backup" class="button button--quiet" type="button">Exportar backup</button>
              <div class="backup-file-field">
                <label for="backup-file">Archivo de backup</label>
                <input id="backup-file" type="file" accept="application/json,.json" />
              </div>
              <fieldset class="backup-mode">
                <legend>Al restaurar</legend>
                <label><input type="radio" name="backup-mode" value="replace" checked /> Reemplazar lista actual</label>
                <label><input id="backup-mode-merge" type="radio" name="backup-mode" value="merge" /> Combinar sin duplicar</label>
              </fieldset>
              <button id="restore-backup" class="button button--primary data-restore-button" type="button">Restaurar backup</button>
            </div>
          </section>

          <div id="undo-panel" class="undo-panel" role="status" aria-live="polite" hidden>
            <span id="undo-message"></span>
            <button id="undo-action" class="button button--quiet button--compact" type="button">Deshacer</button>
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
  const sort = requiredElement<HTMLSelectElement>(root, "#student-sort");
  const status = requiredElement<HTMLElement>(root, "#app-status");
  const formMode = requiredElement<HTMLElement>(root, "#form-mode");
  const submitButton = requiredElement<HTMLButtonElement>(
    root,
    "#student-submit",
  );
  const cancelEditButton = requiredElement<HTMLButtonElement>(
    root,
    "#cancel-edit",
  );
  const resetButton = requiredElement<HTMLButtonElement>(
    root,
    "#reset-students",
  );
  const resetConfirmation = requiredElement<HTMLElement>(
    root,
    "#reset-confirmation",
  );
  const confirmReset = requiredElement<HTMLButtonElement>(
    root,
    "#confirm-reset",
  );
  const cancelReset = requiredElement<HTMLButtonElement>(root, "#cancel-reset");
  const summaryAverage = requiredElement<HTMLElement>(root, "#summary-average");
  const summaryMinimum = requiredElement<HTMLElement>(root, "#summary-minimum");
  const summaryMaximum = requiredElement<HTMLElement>(root, "#summary-maximum");
  const undoPanel = requiredElement<HTMLElement>(root, "#undo-panel");
  const undoMessage = requiredElement<HTMLElement>(root, "#undo-message");
  const undoAction = requiredElement<HTMLButtonElement>(root, "#undo-action");
  const tutorList = requiredElement<HTMLUListElement>(root, "#tutor-list");
  const exportBackup = requiredElement<HTMLButtonElement>(
    root,
    "#export-backup",
  );
  const backupFile = requiredElement<HTMLInputElement>(root, "#backup-file");
  const restoreBackup = requiredElement<HTMLButtonElement>(
    root,
    "#restore-backup",
  );
  const mergeMode = requiredElement<HTMLInputElement>(
    root,
    "#backup-mode-merge",
  );
  const recoveryPanel = requiredElement<HTMLElement>(root, "#storage-recovery");
  const recoveryMessage = requiredElement<HTMLElement>(
    root,
    "#storage-recovery-message",
  );
  const downloadRecovery = requiredElement<HTMLButtonElement>(
    root,
    "#download-recovery",
  );
  const discardRecovery = requiredElement<HTMLButtonElement>(
    root,
    "#discard-recovery",
  );
  const discardRecoveryConfirmation = requiredElement<HTMLElement>(
    root,
    "#discard-recovery-confirmation",
  );
  const confirmDiscardRecovery = requiredElement<HTMLButtonElement>(
    root,
    "#confirm-discard-recovery",
  );
  const cancelDiscardRecovery = requiredElement<HTMLButtonElement>(
    root,
    "#cancel-discard-recovery",
  );

  function setStatus(
    message: string,
    tone: "neutral" | "success" | "error" = "neutral",
  ): void {
    status.textContent = message;
    status.dataset.tone = tone;
  }

  function clearUndo(): void {
    undoSnapshot = null;
    undoPanel.hidden = true;
    undoMessage.textContent = "";
  }

  function rememberUndo(
    previousStudents: readonly Student[],
    message: string,
  ): void {
    undoSnapshot = {
      students: [...previousStudents],
      message,
    };
    undoMessage.textContent = `${message} Podés deshacer esta acción.`;
    undoPanel.hidden = false;
  }

  function clearFieldErrors(): void {
    for (const field of Object.keys(fieldSelectors) as StudentField[]) {
      const input = requiredElement<HTMLInputElement>(
        form,
        fieldSelectors[field],
      );
      const error = requiredElement<HTMLElement>(
        form,
        `#student-${field}-error`,
      );
      input.removeAttribute("aria-invalid");
      error.textContent = "";
    }
  }

  function cancelEditing(focusName = false): void {
    editingStudentId = null;
    form.reset();
    clearFieldErrors();
    submitButton.textContent = "Agregar alumno";
    cancelEditButton.hidden = true;
    formMode.textContent = "";
    if (focusName) {
      requiredElement<HTMLInputElement>(form, "#student-name").focus();
    }
  }

  function startEditing(student: Student): void {
    editingStudentId = student.id;
    requiredElement<HTMLInputElement>(form, "#student-name").value =
      student.name;
    requiredElement<HTMLInputElement>(form, "#student-surname").value =
      student.surname;
    requiredElement<HTMLInputElement>(form, "#student-grade").value = String(
      student.grade,
    );
    clearFieldErrors();
    submitButton.textContent = "Guardar cambios";
    cancelEditButton.hidden = false;
    formMode.textContent = `Editando a ${student.name} ${student.surname}.`;
    requiredElement<HTMLInputElement>(form, "#student-name").focus();
  }

  function setWorkspaceRecoveryState(): void {
    for (const control of Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLButtonElement>(
        "input, button",
      ),
    )) {
      control.disabled = recoveryPending;
    }
    search.disabled = recoveryPending;
    sort.disabled = recoveryPending;
    resetButton.disabled = recoveryPending;
    exportBackup.disabled = recoveryPending;
    mergeMode.disabled = recoveryPending;
    if (recoveryPending) {
      requiredElement<HTMLInputElement>(
        root,
        'input[name="backup-mode"][value="replace"]',
      ).checked = true;
      cancelEditing();
      clearUndo();
    }
  }

  function renderFieldErrors(errors: StudentErrors): void {
    clearFieldErrors();
    for (const [field, message] of Object.entries(errors) as [
      StudentField,
      string,
    ][]) {
      const input = requiredElement<HTMLInputElement>(
        form,
        fieldSelectors[field],
      );
      const error = requiredElement<HTMLElement>(
        form,
        `#student-${field}-error`,
      );
      input.setAttribute("aria-invalid", "true");
      error.textContent = message;
    }
  }

  function renderSummary(): void {
    const summary = summarizeStudents(students);
    summaryAverage.textContent = formatGrade(summary.average);
    summaryMinimum.textContent = formatGrade(summary.minimum);
    summaryMaximum.textContent = formatGrade(summary.maximum);
  }

  function renderStudents(): void {
    list.replaceChildren();
    const visibleStudents = sortStudentsBy(students, sortMode).filter(
      (student) => matchesStudent(student, searchQuery),
    );

    count.textContent = `${students.length} ${students.length === 1 ? "alumno" : "alumnos"}`;
    renderSummary();

    if (students.length === 0) {
      emptyState.innerHTML = recoveryPending
        ? "<strong>Los datos locales están en modo recuperación.</strong><span>Restaurá un backup o descartá explícitamente el dato no legible antes de continuar.</span>"
        : "<strong>Todavía no hay alumnos.</strong><span>Agregá el primero con el formulario.</span>";
      emptyState.hidden = false;
      return;
    }

    if (visibleStudents.length === 0) {
      emptyState.innerHTML =
        "<strong>No hay coincidencias.</strong><span>Probá con otro nombre o apellido.</span>";
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

      const actions = document.createElement("div");
      actions.className = "student-card-actions";

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "button button--quiet button--compact";
      edit.textContent = "Editar";
      edit.setAttribute(
        "aria-label",
        `Editar a ${student.name} ${student.surname}`,
      );
      edit.addEventListener("click", () => startEditing(student));

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "button button--quiet button--compact";
      remove.textContent = "Eliminar";
      remove.setAttribute(
        "aria-label",
        `Eliminar a ${student.name} ${student.surname}`,
      );
      remove.addEventListener("click", () => {
        const previousStudents = students;
        students = students.filter((candidate) => candidate.id !== student.id);
        if (editingStudentId === student.id) {
          cancelEditing();
        }
        writeStudents(storage, students);
        rememberUndo(
          previousStudents,
          `${student.name} ${student.surname} fue eliminado.`,
        );
        renderStudents();
        setStatus(
          `${student.name} ${student.surname} fue eliminado.`,
          "success",
        );
      });

      actions.append(edit, remove);
      item.append(copy, actions);
      list.append(item);
    }
  }

  function finishRecovery(message: string): void {
    recoveryPending = false;
    recoveryPanel.hidden = true;
    discardRecoveryConfirmation.hidden = true;
    setWorkspaceRecoveryState();
    renderStudents();
    setStatus(message, "success");
  }

  for (const tutor of HISTORICAL_TUTORS) {
    tutorList.append(
      createTutorCard(tutor.name, tutor.surname, tutorInitials(tutor)),
    );
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (recoveryPending) {
      setStatus("Resolvé primero el estado de recuperación de datos.", "error");
      return;
    }

    const formData = new FormData(form);
    const validation = validateStudentDraft({
      name: String(formData.get("name") ?? ""),
      surname: String(formData.get("surname") ?? ""),
      grade: String(formData.get("grade") ?? ""),
    });

    if (!validation.valid) {
      renderFieldErrors(validation.errors);
      setStatus("Revisá los campos marcados antes de guardar.", "error");
      const firstError = Object.keys(validation.errors)[0] as
        StudentField | undefined;
      if (firstError !== undefined) {
        requiredElement<HTMLInputElement>(
          form,
          fieldSelectors[firstError],
        ).focus();
      }
      return;
    }

    clearFieldErrors();

    if (editingStudentId !== null) {
      const original = students.find(
        (student) => student.id === editingStudentId,
      );
      if (original === undefined) {
        cancelEditing(true);
        setStatus("El alumno que estabas editando ya no existe.", "error");
        return;
      }

      if (
        isDuplicateStudentExcluding(
          students,
          validation.value,
          editingStudentId,
        )
      ) {
        setStatus("Ya existe otro alumno con ese nombre y apellido.", "error");
        requiredElement<HTMLInputElement>(form, "#student-name").focus();
        return;
      }

      const previousStudents = students;
      const updated = updateStudent(original, validation.value);
      students = students.map((student) =>
        student.id === updated.id ? updated : student,
      );
      writeStudents(storage, students);
      rememberUndo(
        previousStudents,
        `Se actualizaron los datos de ${updated.name} ${updated.surname}.`,
      );
      cancelEditing();
      renderStudents();
      setStatus(
        `${updated.name} ${updated.surname} fue actualizado sin cambiar su identificador.`,
        "success",
      );
      requiredElement<HTMLInputElement>(form, "#student-name").focus();
      return;
    }

    if (isDuplicateStudent(students, validation.value)) {
      setStatus("Ese alumno ya está cargado.", "error");
      requiredElement<HTMLInputElement>(form, "#student-name").focus();
      return;
    }

    clearUndo();
    const student = createStudent(validation.value, idFactory);
    students = [...students, student];
    writeStudents(storage, students);
    form.reset();
    renderStudents();
    setStatus(`${student.name} ${student.surname} fue agregado.`, "success");
    requiredElement<HTMLInputElement>(form, "#student-name").focus();
  });

  cancelEditButton.addEventListener("click", () => {
    cancelEditing(true);
    setStatus("La edición fue cancelada.");
  });

  search.addEventListener("input", () => {
    searchQuery = search.value;
    renderStudents();
  });

  sort.addEventListener("change", () => {
    sortMode = sort.value as StudentSortMode;
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
    const previousStudents = students;
    students = [];
    searchQuery = "";
    search.value = "";
    clearStudents(storage);
    cancelEditing();
    resetConfirmation.hidden = true;
    rememberUndo(previousStudents, "Se vació la lista local de alumnos.");
    renderStudents();
    setStatus("Se vació la lista local de alumnos.", "success");
    resetButton.focus();
  });

  undoAction.addEventListener("click", () => {
    if (undoSnapshot === null) {
      return;
    }

    students = undoSnapshot.students;
    writeStudents(storage, students);
    cancelEditing();
    const message = undoSnapshot.message;
    clearUndo();
    renderStudents();
    setStatus(`Acción deshecha: ${message}`, "success");
  });

  exportBackup.addEventListener("click", () => {
    const date = new Date().toISOString().slice(0, 10);
    downloadTextFile(
      `modderhouse-alumnos-${date}.json`,
      serializeStudentBackup(students),
      "application/json;charset=utf-8",
    );
    setStatus(
      `Backup exportado con ${students.length} ${students.length === 1 ? "alumno" : "alumnos"}.`,
      "success",
    );
  });

  restoreBackup.addEventListener("click", async () => {
    const file = backupFile.files?.[0];
    if (file === undefined) {
      setStatus("Elegí primero un archivo de backup.", "error");
      backupFile.focus();
      return;
    }

    const selectedMode = requiredElement<HTMLInputElement>(
      root,
      'input[name="backup-mode"]:checked',
    ).value as BackupImportMode;

    if (recoveryPending && selectedMode === "merge") {
      setStatus(
        "En modo recuperación sólo se puede reemplazar la copia no legible por un backup válido.",
        "error",
      );
      return;
    }

    let raw: string;
    try {
      raw = await file.text();
    } catch {
      setStatus("No pudimos leer el archivo seleccionado.", "error");
      return;
    }

    const result = importStudentBackup(raw, students, selectedMode);
    if (!result.ok) {
      setStatus(result.message, "error");
      return;
    }

    const previousStudents = students;
    students = result.students;
    searchQuery = "";
    search.value = "";
    writeStudents(storage, students);
    backupFile.value = "";
    cancelEditing();

    const duplicateCopy =
      result.skippedDuplicates > 0
        ? ` Se omitieron ${result.skippedDuplicates} duplicados.`
        : "";
    const successMessage = `Backup restaurado: ${result.imported} ${result.imported === 1 ? "alumno incorporado" : "alumnos incorporados"}.${duplicateCopy}`;

    if (recoveryPending) {
      clearUndo();
      finishRecovery(successMessage);
      return;
    }

    rememberUndo(previousStudents, "Se restauró un backup de alumnos.");
    renderStudents();
    setStatus(successMessage, "success");
  });

  downloadRecovery.addEventListener("click", () => {
    downloadTextFile(
      `modderhouse-dato-no-legible-${new Date().toISOString().slice(0, 10)}.txt`,
      recoveryRaw,
      "text/plain;charset=utf-8",
    );
    setStatus("Se descargó una copia del dato local no legible.", "success");
  });

  discardRecovery.addEventListener("click", () => {
    discardRecoveryConfirmation.hidden = false;
    confirmDiscardRecovery.focus();
  });

  cancelDiscardRecovery.addEventListener("click", () => {
    discardRecoveryConfirmation.hidden = true;
    discardRecovery.focus();
  });

  confirmDiscardRecovery.addEventListener("click", () => {
    clearStudents(storage);
    students = [];
    finishRecovery(
      "Se descartó explícitamente el dato no legible. El workspace vuelve a estar disponible.",
    );
    requiredElement<HTMLInputElement>(form, "#student-name").focus();
  });

  if (initialization.storageIssue !== null) {
    recoveryPanel.hidden = false;
    recoveryMessage.textContent = storageIssueMessage(
      initialization.storageIssue,
    );
  }

  setWorkspaceRecoveryState();
  renderStudents();

  const initializationMessages: string[] = [];
  if (initialization.purgedLegacyCredentials) {
    initializationMessages.push(
      "Se eliminó el registro local de credenciales del simulador 2023.",
    );
  }
  if (initialization.migratedStudents > 0) {
    initializationMessages.push(
      `Se migraron ${initialization.migratedStudents} alumnos válidos desde la versión histórica.`,
    );
  }
  if (initializationMessages.length > 0 && !recoveryPending) {
    setStatus(initializationMessages.join(" "), "success");
  }
}

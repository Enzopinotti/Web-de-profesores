(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=2,t=60;function n(e){return e.trim().replace(/\s+/g,` `)}function r(e){return n(e).normalize(`NFD`).replace(/\p{Diacritic}/gu,``).toLocaleLowerCase(`es`)}function i(r){let i=n(r.name),a=n(r.surname),o={};i.length<e?o.name=`Ingresá un nombre de al menos 2 caracteres.`:i.length>t&&(o.name=`El nombre no puede superar 60 caracteres.`),a.length<e?o.surname=`Ingresá un apellido de al menos 2 caracteres.`:a.length>t&&(o.surname=`El apellido no puede superar 60 caracteres.`);let s=r.grade.trim(),c=Number(s);return s===``||!Number.isFinite(c)?o.grade=`Ingresá una nota numérica.`:(c<0||c>10)&&(o.grade=`La nota debe estar entre 0 y 10.`),Object.keys(o).length>0?{valid:!1,errors:o}:{valid:!0,value:{name:i,surname:a,grade:c},errors:{}}}function a(e,t=()=>crypto.randomUUID()){return{id:t(),...e}}function o(e,t){return{id:e.id,...t}}function s(e){return`${r(e.name)}::${r(e.surname)}`}function c(e,t){let n=s(t);return e.some(e=>s(e)===n)}function l(e,t,n){let r=s(t);return e.some(e=>e.id!==n&&s(e)===r)}function u(e,t){let n=r(t);if(n===``)return!0;let i=r(`${e.name} ${e.surname}`),a=r(`${e.surname} ${e.name}`);return i.includes(n)||a.includes(n)}function d(e,t){return[...e].sort((e,n)=>{if(t===`grade-desc`&&e.grade!==n.grade)return n.grade-e.grade;if(t===`grade-asc`&&e.grade!==n.grade)return e.grade-n.grade;let r=e.surname.localeCompare(n.surname,`es`,{sensitivity:`base`});return r===0?e.name.localeCompare(n.name,`es`,{sensitivity:`base`}):r})}function f(e){if(e.length===0)return{count:0,average:null,minimum:null,maximum:null};let t=e.map(e=>e.grade),n=t.reduce((e,t)=>e+t,0);return{count:e.length,average:n/e.length,minimum:Math.min(...t),maximum:Math.max(...t)}}var p=[{name:`María Elena`,surname:`Martinez`,historicalAsset:`assets/imagenesTutores/tutorMaria.jpeg`},{name:`Enzo Daniel`,surname:`Pinotti`,historicalAsset:`assets/imagenesTutores/tutorEnzo.jpg`},{name:`Martin`,surname:`Moreno`,historicalAsset:`assets/imagenesTutores/tutorMartin.jpeg`},{name:`Fernanda Lorena`,surname:`Ortiz`,historicalAsset:`assets/imagenesTutores/tutorFernanda.jpeg`}];function ee(e){return`${e.name.trim().charAt(0)}${e.surname.trim().charAt(0)}`.toLocaleUpperCase(`es`)}var m=`modderhouse.student-backup`;function h(e,t){if(typeof e!=`object`||!e)return`El registro ${t+1} no tiene un formato de alumno válido.`;let n=e;if(typeof n.id!=`string`||n.id.trim()===``)return`El registro ${t+1} no tiene un identificador válido.`;if(typeof n.name!=`string`||typeof n.surname!=`string`||typeof n.grade!=`number`)return`El registro ${t+1} tiene campos faltantes o inválidos.`;let r=i({name:n.name,surname:n.surname,grade:String(n.grade)});return r.valid?{id:n.id,...r.value}:`El registro ${t+1} no cumple las reglas actuales de alumnos.`}function te(e,t=new Date){let n={format:m,version:1,exportedAt:t.toISOString(),students:[...e]};return`${JSON.stringify(n,null,2)}\n`}function ne(e,t,n){let r;try{r=JSON.parse(e)}catch{return{ok:!1,code:`invalid-json`,message:`El archivo no contiene JSON válido.`}}if(typeof r!=`object`||!r)return{ok:!1,code:`invalid-format`,message:`El archivo no tiene el formato de backup de Modderhouse.`};let i=r;if(i.format!==`modderhouse.student-backup`)return{ok:!1,code:`invalid-format`,message:`El archivo no es un backup reconocido de Modderhouse.`};if(i.version!==1)return{ok:!1,code:`unsupported-version`,message:`La versión del backup no es compatible con esta aplicación.`};if(typeof i.exportedAt!=`string`||Number.isNaN(Date.parse(i.exportedAt))||!Array.isArray(i.students))return{ok:!1,code:`invalid-schema`,message:`El backup está incompleto o tiene una estructura inválida.`};let a=[],o=new Set;for(let[e,t]of i.students.entries()){let n=h(t,e);if(typeof n==`string`)return{ok:!1,code:`invalid-schema`,message:n};if(o.has(n.id)||c(a,n))return{ok:!1,code:`duplicate-backup-student`,message:`El backup contiene alumnos duplicados alrededor del registro ${e+1}.`};o.add(n.id),a.push(n)}if(n===`replace`)return{ok:!0,students:a,imported:a.length,skippedDuplicates:0};let l=[...t],u=new Map(t.map(e=>[e.id,e])),d=new Set(t.map(s)),f=0,p=0;for(let e of a){let t=u.get(e.id);if(t!==void 0){if(s(t)===s(e)){p+=1;continue}return{ok:!1,code:`id-conflict`,message:`El backup contiene un identificador que ya pertenece a otro alumno. No se aplicaron cambios.`}}let n=s(e);if(d.has(n)){p+=1;continue}l.push(e),u.set(e.id,e),d.add(n),f+=1}return{ok:!0,students:l,imported:f,skippedDuplicates:p}}var g=`modderhouse.students.v1`,_=`Alumnos`,v=`Usuarios`,y=1;function b(e){if(typeof e!=`object`||!e)return!1;let t=e;return typeof t.id==`string`&&t.id.length>0&&typeof t.name==`string`&&typeof t.surname==`string`&&typeof t.grade==`number`&&Number.isFinite(t.grade)&&t.grade>=0&&t.grade<=10}function x(e){let t=e.getItem(g);if(t===null)return{status:`empty`,students:[]};let n;try{n=JSON.parse(t)}catch{return{status:`recovery-needed`,students:[],issue:`corrupt-json`,raw:t}}if(typeof n!=`object`||!n)return{status:`recovery-needed`,students:[],issue:`invalid-schema`,raw:t};let r=n;return r.version===y?!Array.isArray(r.students)||!r.students.every(b)?{status:`recovery-needed`,students:[],issue:`invalid-schema`,raw:t}:{status:`ready`,students:r.students}:{status:`recovery-needed`,students:[],issue:`unsupported-version`,raw:t}}function S(e,t){let n={version:y,students:[...t]};e.setItem(g,JSON.stringify(n))}function C(e){e.removeItem(g),e.removeItem(_)}function w(e,t){let n=e.getItem(_);if(n===null)return[];let r;try{r=JSON.parse(n)}catch{return[]}if(!Array.isArray(r))return[];let o=[];for(let e of r){if(typeof e!=`object`||!e)continue;let n=e;if(typeof n.nombre!=`string`||typeof n.apellido!=`string`)continue;let r=i({name:n.nombre,surname:n.apellido,grade:String(n.nota??``)});r.valid&&!c(o,r.value)&&o.push(a(r.value,t))}return o}function re(e,t=()=>crypto.randomUUID()){let n=e.getItem(v)!==null;n&&e.removeItem(v);let r=x(e);if(r.status===`ready`)return{students:r.students,migratedStudents:0,purgedLegacyCredentials:n,storageIssue:null};if(r.status===`recovery-needed`)return{students:[],migratedStudents:0,purgedLegacyCredentials:n,storageIssue:r.issue};let i=w(e,t);return i.length>0&&(S(e,i),e.removeItem(_)),{students:i,migratedStudents:i.length,purgedLegacyCredentials:n,storageIssue:null}}var ie=`https://github.com/Enzopinotti/Web-de-profesores/tree/d6a38f5795569131ff4cd0db63640aff8dc09007`,T={name:`#student-name`,surname:`#student-surname`,grade:`#student-grade`};function E(e,t){let n=e.querySelector(t);if(n===null)throw Error(`Required element not found: ${t}`);return n}function ae(e,t,n){let r=new Blob([t],{type:n}),i=URL.createObjectURL(r),a=document.createElement(`a`);a.href=i,a.download=e,a.hidden=!0,document.body.append(a),a.click(),a.remove(),URL.revokeObjectURL(i)}function oe(e){switch(e){case`corrupt-json`:return`La copia local no contiene JSON válido.`;case`unsupported-version`:return`La copia local pertenece a una versión que esta aplicación no puede interpretar.`;case`invalid-schema`:return`La copia local tiene una estructura que no cumple el contrato actual de alumnos.`}}function D(e){return e===null?`—`:e.toLocaleString(`es-AR`,{maximumFractionDigits:1})}function se(e,t,n){let r=document.createElement(`li`);r.className=`tutor-card`;let i=document.createElement(`span`);i.className=`tutor-avatar`,i.setAttribute(`aria-hidden`,`true`),i.textContent=n;let a=document.createElement(`span`);return a.className=`tutor-name`,a.textContent=`${e} ${t}`,r.append(i,a),r}function O(e,t=window.localStorage,n=()=>crypto.randomUUID(),r=ae){let s=re(t,n),m=s.students,h=``,g=`surname-asc`,_=null,v=null,y=s.storageIssue!==null,b=y?t.getItem(`modderhouse.students.v1`)??``:``;e.innerHTML=`
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
            <a href="${ie}">Ver baseline histórico exacto de 2023</a>
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
  `;let x=E(e,`#student-form`),w=E(e,`#student-list`),O=E(e,`#student-empty`),k=E(e,`#student-count`),A=E(e,`#student-search`),j=E(e,`#student-sort`),M=E(e,`#app-status`),N=E(e,`#form-mode`),P=E(e,`#student-submit`),F=E(e,`#cancel-edit`),I=E(e,`#reset-students`),L=E(e,`#reset-confirmation`),R=E(e,`#confirm-reset`),ce=E(e,`#cancel-reset`),le=E(e,`#summary-average`),ue=E(e,`#summary-minimum`),de=E(e,`#summary-maximum`),z=E(e,`#undo-panel`),B=E(e,`#undo-message`),fe=E(e,`#undo-action`),pe=E(e,`#tutor-list`),V=E(e,`#export-backup`),H=E(e,`#backup-file`),me=E(e,`#restore-backup`),he=E(e,`#backup-mode-merge`),U=E(e,`#storage-recovery`),ge=E(e,`#storage-recovery-message`),_e=E(e,`#download-recovery`),W=E(e,`#discard-recovery`),G=E(e,`#discard-recovery-confirmation`),K=E(e,`#confirm-discard-recovery`),ve=E(e,`#cancel-discard-recovery`);function q(e,t=`neutral`){M.textContent=e,M.dataset.tone=t}function J(){v=null,z.hidden=!0,B.textContent=``}function Y(e,t){v={students:[...e],message:t},B.textContent=`${t} Podés deshacer esta acción.`,z.hidden=!1}function X(){for(let e of Object.keys(T)){let t=E(x,T[e]),n=E(x,`#student-${e}-error`);t.removeAttribute(`aria-invalid`),n.textContent=``}}function Z(e=!1){_=null,x.reset(),X(),P.textContent=`Agregar alumno`,F.hidden=!0,N.textContent=``,e&&E(x,`#student-name`).focus()}function ye(e){_=e.id,E(x,`#student-name`).value=e.name,E(x,`#student-surname`).value=e.surname,E(x,`#student-grade`).value=String(e.grade),X(),P.textContent=`Guardar cambios`,F.hidden=!1,N.textContent=`Editando a ${e.name} ${e.surname}.`,E(x,`#student-name`).focus()}function be(){for(let e of Array.from(x.querySelectorAll(`input, button`)))e.disabled=y;A.disabled=y,j.disabled=y,I.disabled=y,V.disabled=y,he.disabled=y,y&&(E(e,`input[name="backup-mode"][value="replace"]`).checked=!0,Z(),J())}function xe(e){X();for(let[t,n]of Object.entries(e)){let e=E(x,T[t]),r=E(x,`#student-${t}-error`);e.setAttribute(`aria-invalid`,`true`),r.textContent=n}}function Se(){let e=f(m);le.textContent=D(e.average),ue.textContent=D(e.minimum),de.textContent=D(e.maximum)}function Q(){w.replaceChildren();let e=d(m,g).filter(e=>u(e,h));if(k.textContent=`${m.length} ${m.length===1?`alumno`:`alumnos`}`,Se(),m.length===0){O.innerHTML=y?`<strong>Los datos locales están en modo recuperación.</strong><span>Restaurá un backup o descartá explícitamente el dato no legible antes de continuar.</span>`:`<strong>Todavía no hay alumnos.</strong><span>Agregá el primero con el formulario.</span>`,O.hidden=!1;return}if(e.length===0){O.innerHTML=`<strong>No hay coincidencias.</strong><span>Probá con otro nombre o apellido.</span>`,O.hidden=!1;return}O.hidden=!0;for(let n of e){let e=document.createElement(`li`);e.className=`student-card`;let r=document.createElement(`div`),i=document.createElement(`h3`);i.textContent=`${n.name} ${n.surname}`;let a=document.createElement(`p`);a.textContent=`Nota: ${n.grade.toLocaleString(`es-AR`)}`,r.append(i,a);let o=document.createElement(`div`);o.className=`student-card-actions`;let s=document.createElement(`button`);s.type=`button`,s.className=`button button--quiet button--compact`,s.textContent=`Editar`,s.setAttribute(`aria-label`,`Editar a ${n.name} ${n.surname}`),s.addEventListener(`click`,()=>ye(n));let c=document.createElement(`button`);c.type=`button`,c.className=`button button--quiet button--compact`,c.textContent=`Eliminar`,c.setAttribute(`aria-label`,`Eliminar a ${n.name} ${n.surname}`),c.addEventListener(`click`,()=>{let e=m;m=m.filter(e=>e.id!==n.id),_===n.id&&Z(),S(t,m),Y(e,`${n.name} ${n.surname} fue eliminado.`),Q(),q(`${n.name} ${n.surname} fue eliminado.`,`success`)}),o.append(s,c),e.append(r,o),w.append(e)}}function Ce(e){y=!1,U.hidden=!0,G.hidden=!0,be(),Q(),q(e,`success`)}for(let e of p)pe.append(se(e.name,e.surname,ee(e)));x.addEventListener(`submit`,e=>{if(e.preventDefault(),y){q(`Resolvé primero el estado de recuperación de datos.`,`error`);return}let r=new FormData(x),s=i({name:String(r.get(`name`)??``),surname:String(r.get(`surname`)??``),grade:String(r.get(`grade`)??``)});if(!s.valid){xe(s.errors),q(`Revisá los campos marcados antes de guardar.`,`error`);let e=Object.keys(s.errors)[0];e!==void 0&&E(x,T[e]).focus();return}if(X(),_!==null){let e=m.find(e=>e.id===_);if(e===void 0){Z(!0),q(`El alumno que estabas editando ya no existe.`,`error`);return}if(l(m,s.value,_)){q(`Ya existe otro alumno con ese nombre y apellido.`,`error`),E(x,`#student-name`).focus();return}let n=m,r=o(e,s.value);m=m.map(e=>e.id===r.id?r:e),S(t,m),Y(n,`Se actualizaron los datos de ${r.name} ${r.surname}.`),Z(),Q(),q(`${r.name} ${r.surname} fue actualizado sin cambiar su identificador.`,`success`),E(x,`#student-name`).focus();return}if(c(m,s.value)){q(`Ese alumno ya está cargado.`,`error`),E(x,`#student-name`).focus();return}J();let u=a(s.value,n);m=[...m,u],S(t,m),x.reset(),Q(),q(`${u.name} ${u.surname} fue agregado.`,`success`),E(x,`#student-name`).focus()}),F.addEventListener(`click`,()=>{Z(!0),q(`La edición fue cancelada.`)}),A.addEventListener(`input`,()=>{h=A.value,Q()}),j.addEventListener(`change`,()=>{g=j.value,Q()}),I.addEventListener(`click`,()=>{if(m.length===0){q(`La lista ya está vacía.`);return}L.hidden=!1,R.focus()}),ce.addEventListener(`click`,()=>{L.hidden=!0,I.focus()}),R.addEventListener(`click`,()=>{let e=m;m=[],h=``,A.value=``,C(t),Z(),L.hidden=!0,Y(e,`Se vació la lista local de alumnos.`),Q(),q(`Se vació la lista local de alumnos.`,`success`),I.focus()}),fe.addEventListener(`click`,()=>{if(v===null)return;m=v.students,S(t,m),Z();let e=v.message;J(),Q(),q(`Acción deshecha: ${e}`,`success`)}),V.addEventListener(`click`,()=>{r(`modderhouse-alumnos-${new Date().toISOString().slice(0,10)}.json`,te(m),`application/json;charset=utf-8`),q(`Backup exportado con ${m.length} ${m.length===1?`alumno`:`alumnos`}.`,`success`)}),me.addEventListener(`click`,async()=>{let n=H.files?.[0];if(n===void 0){q(`Elegí primero un archivo de backup.`,`error`),H.focus();return}let r=E(e,`input[name="backup-mode"]:checked`).value;if(y&&r===`merge`){q(`En modo recuperación sólo se puede reemplazar la copia no legible por un backup válido.`,`error`);return}let i;try{i=await n.text()}catch{q(`No pudimos leer el archivo seleccionado.`,`error`);return}let a=ne(i,m,r);if(!a.ok){q(a.message,`error`);return}let o=m;m=a.students,h=``,A.value=``,S(t,m),H.value=``,Z();let s=a.skippedDuplicates>0?` Se omitieron ${a.skippedDuplicates} duplicados.`:``,c=`Backup restaurado: ${a.imported} ${a.imported===1?`alumno incorporado`:`alumnos incorporados`}.${s}`;if(y){J(),Ce(c);return}Y(o,`Se restauró un backup de alumnos.`),Q(),q(c,`success`)}),_e.addEventListener(`click`,()=>{r(`modderhouse-dato-no-legible-${new Date().toISOString().slice(0,10)}.txt`,b,`text/plain;charset=utf-8`),q(`Se descargó una copia del dato local no legible.`,`success`)}),W.addEventListener(`click`,()=>{G.hidden=!1,K.focus()}),ve.addEventListener(`click`,()=>{G.hidden=!0,W.focus()}),K.addEventListener(`click`,()=>{C(t),m=[],Ce(`Se descartó explícitamente el dato no legible. El workspace vuelve a estar disponible.`),E(x,`#student-name`).focus()}),s.storageIssue!==null&&(U.hidden=!1,ge.textContent=oe(s.storageIssue)),be(),Q();let $=[];s.purgedLegacyCredentials&&$.push(`Se eliminó el registro local de credenciales del simulador 2023.`),s.migratedStudents>0&&$.push(`Se migraron ${s.migratedStudents} alumnos válidos desde la versión histórica.`),$.length>0&&!y&&q($.join(` `),`success`)}var k=document.querySelector(`#app`);if(k===null)throw Error(`Modderhouse root element is missing.`);O(k);
// Simulador Interactivo Entrega Final

//Clases

class Alumno{
    constructor(nombre, apellido, nota){
        this.nombre=nombre;
        this.apellido=apellido;
        this.nota=nota;

    }

}

//Funciones


function LeerLS(){

    let arrayAlumnos = [];

    let AlumnosLS = localStorage.getItem("Alumnos");

    if(AlumnosLS !== null){

        arrayAlumnos=JSON.parse(AlumnosLS);
        Renderizar(arrayAlumnos);

    }
    return arrayAlumnos;
}

function Renderizar(AlumnosRenderizados){

    ContenedorAlu.innerHTML= "";

    for(const alumno of AlumnosRenderizados){
 
        const ul = document.createElement("ul");

        const liNombre = document.createElement("li");

        liNombre.innerHTML = `${alumno.nombre}`;

        console.log(liNombre.value);
       
        const liApellido = 
        document.createElement("li");

        liApellido.innerHTML = `${alumno.apellido}`;

        const liNota = document.createElement("li");

        liNota.innerHTML = `Nota: ${alumno.nota}`;

        ul.append(liNombre, liApellido,liNota);
        
        ul.classList.add("AlumnoAgregado");

        ContenedorAlu.append(ul);
  
    }
}


function GuardarAlumnoEnLS(alumnoNuevo, alumnosDelStorage){

    if(alumnosDelStorage!==null){

        alumnosDelStorage.push(alumnoNuevo);

        localStorage.setItem("Alumnos", JSON.stringify(alumnosDelStorage));
        console.log(alumnosDelStorage);

    }else{

        localStorage.setItem("Alumnos", JSON.stringify(arrayAlumnos));
        console.log(arrayAlumnos);
    }

}

function renderizarTutores(tutores){
    //Limpio el contenedor
    listaTutores.innerHTML = "";

    for(const tutor of tutores){
        //Creo el div principal 
        const div = document.createElement("div");

        div.classList.add("tutor")

        listaTutores.append(div);

        //Creo la imagen

        const img = document.createElement("img");

        img.src = tutor.img;

        img.alt= "Imagenes de los Tutores";

        img.classList.add("imgTutores");

        div.append(img);

        //Creo el Texto

        const h5 = document.createElement("h5");
        h5.innerHTML= `${tutor.nombre} ${tutor.apellido}`

        div.append(h5);
        

    }

}

function VerificarIgualdad(igualdad, alumnosDelStorage, alumnoNuevo){
    

    for(const alumnoST of alumnosDelStorage){

        if ((alumnoST.apellido.toLowerCase() === alumnoNuevo.apellido.toLowerCase()) &&(alumnoST.nombre.toLowerCase()===alumnoNuevo.nombre.toLowerCase())){
            igualdad = igualdad + 1;
            
        }

    }
    console.log(igualdad);

    return igualdad
}


//Variables


let formularioAlu = document.getElementById("formularioAlumnos");

let ContenedorAlu = document.getElementById("contenedorAlumnos");

const BuscarAlumno = document.getElementById("buscarAlumno");

const listaTutores = document.getElementById("listaTutores");

const quitarAlumno = document.getElementById("QuitarAlu");

let arrayAlumnos = LeerLS();


//Inicio del programa


//submit para agregar alumnos

formularioAlu.addEventListener("submit", (event)=>{

    
    event.preventDefault();

    let nombreAlu = document.getElementById("nombreAlumno");

    let apellidoAlu = document.getElementById("apellidoAlumno");

    let notaAlu = document.getElementById("notaAlumno");

    
    let alumnoNuevo = new Alumno(nombreAlu.value, apellidoAlu.value, notaAlu.value);


    arrayAlumnos.push(alumnoNuevo);
    
    let alumnosDelStorage = JSON.parse(localStorage.getItem("Alumnos"));

    let igualdad = 0;

    if(alumnosDelStorage !== null){

        igualdad = VerificarIgualdad(igualdad, alumnosDelStorage, alumnoNuevo);
    }

    if(igualdad===0){

        GuardarAlumnoEnLS(alumnoNuevo, alumnosDelStorage);

        Renderizar(arrayAlumnos);
        console.log(alumnosDelStorage);

    }else{

        arrayAlumnos.pop();
    }
    
    
})


//submit para quitar alumnos


quitarAlumno.addEventListener("click", ()=>{

    let alumnosDelStorage = JSON.parse(localStorage.getItem("Alumnos"));

    arrayAlumnos.pop();

    alumnosDelStorage.pop();

    localStorage.setItem("Alumnos", JSON.stringify(alumnosDelStorage));
    
    Renderizar(alumnosDelStorage);
    
})


// Filtro para buscar alumnos

BuscarAlumno.addEventListener("input",(event)=>{

    const alumnoABuscar = BuscarAlumno.value;

    console.log(alumnoABuscar);

    //Alumnos que contienen el valor del input
    const arrayFiltrado = 
    arrayAlumnos.filter((element)=>{
    
        return element.nombre.toLowerCase().includes(alumnoABuscar.toLowerCase());

    });

    Renderizar(arrayFiltrado);
})




//Obtengo los tutores del archivo JSON

fetch("/json/tutores.json")
.then((response)=>{
    console.log(response);
    return response.json();
})
.then((responseTutores)=>{
    console.log(responseTutores);
    renderizarTutores(responseTutores);
})

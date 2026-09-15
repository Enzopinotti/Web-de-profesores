// Simulador Interactivo Tercera Pre entrega//



//Clases

class Usuario{

    constructor(DNI, email, contraseña){

        this.DNI=DNI;
        this.email=email;
        this.contraseña=contraseña;
        
    }
}


//Funciones

function VerificarExistencia(usuariosDelStorage, usuarioNuevo, event){

    let igualdad = false;

    if(usuariosDelStorage != null){
        
        usuariosDelStorage.forEach(element => {

            if((element.DNI)===(usuarioNuevo.DNI)){

                arrayUsuarios.pop();
                event.preventDefault();
                igualdad = true;
                

            }else if((element.email)=== 
            (usuarioNuevo.email)){

                event.preventDefault();
                igualdad = true;
            }
    
        });

    }else{

        usuariosDelStorage = [];

        usuariosDelStorage.push(usuarioNuevo);

        localStorage.setItem("Usuarios", JSON.stringify(usuariosDelStorage));

        console.log(localStorage.getItem("Usuarios"));
        igualdad=true;
    }
   
    console.log(igualdad);
    


    if(igualdad===false){
        GuardarUsuarioenLS(usuariosDelStorage, usuarioNuevo);
    };

}

function GuardarUsuarioenLS(usuariosDelStorage, usuarioNuevo){

    usuariosDelStorage.push(usuarioNuevo);

    localStorage.setItem("Usuarios", JSON.stringify(usuariosDelStorage));

    console.log(localStorage.getItem("Usuarios"));

}


function ComprobarCoincidencia(contraseñaLogin, dniLogin,event){

    let usuariosDelStorage = JSON.parse(localStorage.getItem("Usuarios"));

    console.log(usuariosDelStorage);
    console.log(dniLogin);
    console.log(contraseñaLogin);

    let igualdad = false;
    
    usuariosDelStorage.forEach(element=>{


        if(element.DNI==dniLogin){
         
            if(element.contraseña==contraseñaLogin){

                igualdad = true;
            }
        }

    })

    console.log(igualdad);

    if(igualdad===false){

        event.preventDefault();
    }
}


//Variables 


let arrayUsuarios = [];

const formularioRegistro = document.getElementById("formularioRegistro");

const formularioInicioSesion = document.getElementById("formularioLogin");

//Programa



formularioRegistro.addEventListener("submit",(event)=>{
    
    
    
    let contraseñaRegistro = document.getElementById("contraseñaRegistro");

    let emailRegistro = document.getElementById("emailRegistro");

    let  dniRegistro = document.getElementById("dniRegistro");

    const usuarioNuevo = new Usuario(dniRegistro.value, emailRegistro.value, 
    contraseñaRegistro.value);

    console.log(usuarioNuevo);

    arrayUsuarios.push(usuarioNuevo);

    console.log(arrayUsuarios);

    let usuariosDelStorage = JSON.parse(localStorage.getItem("Usuarios"));

    console.log(usuariosDelStorage);

    
    VerificarExistencia(usuariosDelStorage, usuarioNuevo, event);
    
})


formularioInicioSesion.addEventListener("submit",(event)=>{
    
    let contraseñaLogin = document.getElementById("contraseñaLogin");

    let dniLogin = document.getElementById("dniLogin");

    ComprobarCoincidencia(contraseñaLogin.value, dniLogin.value, event);
});
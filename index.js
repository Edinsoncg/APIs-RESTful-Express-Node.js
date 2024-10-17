const express = require('express'); //variable import el Framework de Express
const app = express() // crear la aplicacion con Express

const PORT = 1234

// Middleware para procesar JSON en las solicitudes
app.use(express.json()) // Permite a la app procesar solicitudes y datos en formato JSON

/*app.use('/', (request, response, next) => {
});*/ 

// Middleware puede ser global para registrar cada solicitud o hacerse para cualquier metodo HTTP si lo necesita.
// sirve para Trackear la request a la base de datos
// sirve para Revisar si el usuario tiene cookies

// Middleware para validar datos antes de crear o actualizar usuarios
function validarDatosUsuario(request, response, next) {
    const { nombre, email } = request.body; //Desestructuracion de objetos, para extraer propiedades específicas del objeto
    //const nombre = req.body.nombre;  en lugar de hacer esto
    //const email = req.body.email;
    if (!nombre || !email) {
      return response.status(400).send('El nombre y el email son obligatorios');
    }
    next();
};

// Simulación de base de datos (almacenamiento en memoria) por medio de una Array
let usuarios= [ 
    { id: 1, nombre:'Ana', email:'ana@gmail.com' }, 
    { id: 2, nombre:'Juan', email:'juan@gmail.com' }, 
    { id: 3, nombre:'Maria', email:'Maria@gmail.com' }
];

// Variable global para llevar el control del próximo ID disponible
let proximoId = usuarios.length + 1;

// Función para agregar hipermedia (HATEOAS) en las respuestas de usuarios
function agregarLinksUsuario(usuario) {
    return {
        ...usuario,
        _links: {
            self: { href: `/usuarios/${usuario.id}` },
            delete: { href: `/usuarios/${usuario.id}`, method: 'DELETE' },
            update: { href: `/usuarios/${usuario.id}`, method: 'PUT' },
            patch: { href: `/usuarios/${usuario.id}`, method: 'PATCH' }
        }
    };
}

//  Ruta raíz
app.get('/', (request, response) => {
    response.setHeader('Content-Type', 'text/plain');
    response.status(200).send('Pagina Principal')
});  //recuperar informacion

// GET: Obtener todos los usuarios en la ruta /usuarios
app.get('/usuarios', (request, response) => {
    const usuariosConLinks = usuarios.map(usuario => agregarLinksUsuario(usuario));

    // Cacheable: Hacer la respuesta cacheable por 5 minutos
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.status(200).send(usuariosConLinks);
});

// GET: Obtener un usuario por ID, :id es un segmento dinamico, son los parametros de la url
app.get('/usuarios/:id', (request, response) => {
    const usuario = usuarios.find(usuario => usuario.id === parseInt(request.params.id)); // en la request y en los parametros recuperar id
    if (!usuario) return response.status(404).send('Usuario no encontrado');
    
    const usuarioConLinks = agregarLinksUsuario(usuario);
    
    // Cacheable: Hacer la respuesta cacheable por 5 minutos
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Cache-Control', 'public, max-age=300');
    response.status(200).json(usuarioConLinks);
});

// POST: Crear un nuevo usuario (usando middleware de validación)
app.post('/usuarios', validarDatosUsuario, (request, response) => {
    const nuevoUsuario = {
      id: proximoId++,
      nombre: request.body.nombre,
      email: request.body.email
    };
    usuarios.push(nuevoUsuario);
    const usuarioConLinks = agregarLinksUsuario(nuevoUsuario);
    
    response.setHeader('Content-Type', 'application/json');
    response.status(201).json(usuarioConLinks);
});

// PUT: Actualizar un usuario existente
app.put('/usuarios/:id',  (request, response) => {
    const usuario = usuarios.find(usuario => usuario.id === parseInt(request.params.id));
    if (!usuario) return response.status(404).send('Usuario no encontrado');
  
    usuario.nombre = request.body.nombre;
    usuario.email = request.body.email;
    
    response.setHeader('Content-Type', 'text/plain');
    response.status(200).send('Datos actualizados correctamente')
});

// PATCH: Actualizar parcialmente un usuario
app.patch('/usuarios/:id', (request, response) => {
    const usuario = usuarios.find(usuario => usuario.id === parseInt(request.params.id));
    if (!usuario) return response.status(404).send('Usuario no encontrado');
    
    Object.assign(usuario, request.body); // Actualizar solo los campos enviados en req.body (sin reemplazar todo el objeto)
    response.setHeader('Content-Type', 'text/plain');
    response.status(200).send('Datos actualizados correctamente');
});

app.delete('/usuarios/:id', (request, response) => {
    const usuario = usuarios.find(usuario => usuario.id === parseInt(request.params.id));
    if (!usuario) return response.status(404).send('Usuario no encontrado');
  
    const index = usuarios.indexOf(usuario);
    usuarios.splice(index, 1);
    response.status(204).send(/*'Datos elimidados correctamente'*/); //204 No Content, ya que no devolvemos un cuerpo en la respuesta
});

// Middleware para manejar solicitudes no encontradas (404) y forma global de tratar con todas las request 
app.use((request, response) => {
    response.setHeader('Content-Type', 'text/html');
    response.status(404).send('<h1>404 Not Found</h1>')
});

// Iniciar el servidor
app.listen(PORT, ()=> {
    console.log(`server listening on port http://localhost:${PORT}`)
});
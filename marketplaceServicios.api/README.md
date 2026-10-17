# marketplace-servicios-api

## Tecnologias
- Node.Js
- Express
- TypeScript
- Moongose

## Requisitos
- Node.js 24.22.0
- Cuenta MongoDB ATLAS

## Instalacion
1. Git clone https://github.com/EstebanGomezVal/marketplace-servicios-api
2. cd marketplaceServicios
3. npm install

## Configuracion
1. cp .env.example .env

## Como ejecutarlo
1. npm start

## Estructura

```
marketplaceServicios.api/
├── public/              # Archivos estaticos
├── src/
│   ├── controllers/     # Logica de cada endpoint
│   ├── middleware/      # Autenticacion, autorización y validaciones
│   ├── models/          # Esquemas de Mongoose
│   ├── routes/          # Definicion de rutas por modulo
│   ├── services/        # Logica
│   ├── app.ts           # Configuracion de Express y montaje de rutas
│   └── index.ts         # Conexión a la base y arranque del servidor
├── .env.example         # Plantilla de variables de entorno
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── tsconfig.json        # Configuración de typeScript
```

## Uso

### Endpoints

#### Obtener registros

* **URL:** `/offering`
* **Método:** `GET`
* **Descripción:** Retorna una lista con todos los servicios registrados.

* **URL:** `/suppliers`
* **Método:** `GET`
* **Descripción:** Retorna una lista con todos los provedores registrados.

* **URL:** `/users`
* **Método:** `GET`
* **Descripción:** Retorna una lista con todos los usuarios registrados.

#### Crear registros

* **URL:** `/offering`
* **Método:** `POST`
* **Descripción:** Registra un servicio nuevo.

* **URL:** `/suppliers`
* **Método:** `POST`
* **Descripción:** Registra un nuevo proveedor.


#### Borrar regustros

* **URL:** `/offering`
* **Método:** `DELETE`
* **Descripción:** Elimina un servicio.

* **URL:** `/suppliers`
* **Método:** `DELETE`
* **Descripción:** Elimina un proveedoir.

* **URL:** `/users`
* **Método:** `DELETE`
* **Descripción:** Elimina un usuario.

#### Actualizar registros

* **URL:** `/offering`
* **Método:** `PUT`
* **Descripción:** Actualiza un registro.

* **URL:** `/usuario`
* **Método:** `PUT`
* **Descripción:** Actualiza un usuario.

* **URL:** `/suppliers`
* **Método:** `PUT`
* **Descripción:** Actualiza un proveedor.

## Autores
#### Esteban Gomez Valerio
#### Victor Hugo Magallan Salas
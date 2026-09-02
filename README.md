# Portal de Administración del Edificio

Proyecto local en React + Vite para registrar depósitos, gastos, multas, estados de cuenta y comprobantes.

## Requisitos

- Node.js 18 o superior
- npm

## Ejecutar en Windows, macOS o Linux

1. Abre una terminal en esta carpeta.
2. Instala las dependencias:

   npm install

3. Inicia el portal:

   npm run dev

4. Abre en Chrome la dirección que muestre Vite, normalmente:

   http://localhost:5173

## Crear una versión de producción

   npm run build

Los datos se guardan en localStorage del navegador. Los comprobantes se guardan como imágenes codificadas dentro del almacenamiento local del navegador, por lo que conviene usar imágenes pequeñas.

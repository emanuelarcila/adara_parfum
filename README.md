# ADARA PARFUM

Sitio de comercio editorial estático, sin dependencias de compilación. La interfaz está en español, usa COP, funciona en móvil y escritorio, y conserva la bolsa de compra en el navegador.

## Vista previa del concepto

Abre `preview.html` directamente o ejecuta el servidor local de abajo y visita `http://localhost:8000/preview.html`. El preview implementa el concepto “Monolito de obsidiana” de forma aislada, incluye datos de producto ficticios y una bolsa interactiva en memoria mientras la página está abierta, sin checkout. La fotografía se enlaza desde Unsplash y está acreditada en la página; es una imagen de referencia, no un envase ADARA.

## Abrir el sitio

Puedes abrir `index.html` directamente o servir esta carpeta desde un servidor estático. Por ejemplo:

```sh
python3 -m http.server 8000
```

Después abre `http://localhost:8000`.

## Publicar productos

Edita `products.js` y reemplaza la lista vacía por productos confirmados. Cada producto necesita:

```js
{
  id: 'identificador-unico',
  name: 'Nombre aprobado',
  brand: 'ADARA PARFUM',
  volume: 'Presentación confirmada',
  priceCOP: 0,
  availability: 'available',
  description: 'Descripción aprobada',
  notes: ['Notas confirmadas'],
  family: 'Familia olfativa aprobada',
  image: 'assets/fragancia.webp',
  imageAlt: 'Descripción precisa de la fotografía',
  featured: true
}
```

`priceCOP` debe ser un entero en pesos colombianos. `availability` acepta `available` o `sold-out`. Usa imágenes autorizadas del producto real, en formato WebP o AVIF, con encuadre que no altere la botella ni la etiqueta. No publiques descripciones, ingredientes, tamaños o disponibilidad sin confirmarlos.

## Contacto y pedidos

En `store-config.js` configura `contactEmail` cuando exista un correo oficial. La bolsa funciona en el navegador: agrega productos, permite cambiar cantidades y calcula el subtotal. Para recibir pagos hay que conectar un checkout real en `checkoutUrl`; el sitio le envía `items`, `currency` y `total` como parámetros de consulta. El destino de checkout debe validar precios, disponibilidad y cantidades del lado del servidor antes de cobrar. No uses los parámetros del navegador como autoridad de precio.

El sitio no cobra, calcula envíos, crea órdenes en un servidor ni guarda datos de clientes mientras no se conecte un proveedor de pagos y una plataforma de pedidos. Configura esa integración antes de aceptar compras.

## Marca y fotografía

Los fondos editoriales visibles son composiciones CSS que identifican espacios de campaña pendientes; no representan envases ni productos. Sustitúyelos por material de ADARA autorizado cuando esté disponible. La paleta, tipografías, estados de foco, menú móvil, bolsa, catálogo y preferencias de movimiento están en `styles.css`.

# Demo ATM Agent · Aceros Temuco

Repositorio aislado para mostrar la interfaz del CRM ATM Agent con escenarios de servicios de acero. Los contactos, conversaciones, cotizaciones, proveedores y cifras que aparecen en modo demo son ficticios.

## Ejecutar localmente

1. Instala Node.js 20 o superior.
2. Copia `apps/dashboard/.env.example` a `apps/dashboard/.env.local` y define credenciales de demo propias.
3. Desde la raíz, ejecuta `npm install` y luego `npm run dashboard:dev`.
4. Abre `http://localhost:3000/login` e inicia sesión con `ADMIN_USER` y `ADMIN_PASSWORD`.

## Variables necesarias para la demo

- `ADMIN_USER` y `ADMIN_PASSWORD` definen el acceso privado a la demo.
- `NEXTAUTH_SECRET` debe ser un valor aleatorio y distinto por despliegue.
- `NEXTAUTH_URL` apunta a la URL de la demo.

Configura estas variables en el entorno de despliegue, nunca en GitHub. El servidor de esta copia solo utiliza datos de muestra y bloquea las integraciones externas. No agregues credenciales de producción, claves de Meta, Google, Supabase, Vapi ni del bot VPS. No conectes este repo a proyectos o servicios de producción.

## Qué cubre el escenario

- Atención por WhatsApp simulada para oxicorte, cilindrado, guillotinado, corte plasma CNC, plegado y fabricación de estructuras.
- Calificación de prospectos y seguimiento visual en el pipeline.
- Cotizaciones de ejemplo con especificaciones como material, espesor, medidas y cantidad.
- Conversaciones, agenda, campañas, proveedores y finanzas con registros inventados.
- Las acciones de edición y envío se responden como simulaciones; no se mandan mensajes, no se crean eventos externos y no se modifica información real.

El modo demo preserva la interfaz del dashboard. Las operaciones simuladas se reinician al recargar o cuando el servidor de demo se reinicia.

## Alcance

Este repositorio no reemplaza ni despliega los sistemas operativos de ATM Chile o Aceros Temuco. Es una demostración aislada; cualquier implementación real requiere definir por separado acceso, permisos, datos, integraciones y presupuesto.

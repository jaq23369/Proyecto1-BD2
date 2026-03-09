// =============================================================
// PROYECTO 1 - BD2 | Guardrails de consultas sin índice
// Script diagnóstico para mongosh
// =============================================================

use("restaurantes_db");

function safeAdminCommand(cmd) {
  try {
    return db.adminCommand(cmd);
  } catch (error) {
    return { ok: 0, error: error.message };
  }
}

print("=== Revisión de soporte para rechazo de consultas no indexadas ===");
print("MongoDB version: " + db.version());

const commandsResult = safeAdminCommand({ listCommands: 1 });
const commands = commandsResult.ok === 1 ? commandsResult.commands : {};
const hasSetQuerySettings = !!(commands && commands.setQuerySettings);
const hasRemoveQuerySettings = !!(commands && commands.removeQuerySettings);

print("Comando setQuerySettings disponible: " + (hasSetQuerySettings ? "SI" : "NO"));
print("Comando removeQuerySettings disponible: " + (hasRemoveQuerySettings ? "SI" : "NO"));

if (hasSetQuerySettings && hasRemoveQuerySettings) {
  print("\n[INFO] El clúster soporta Query Settings por query shape.");
  print("[INFO] Este repositorio NO aplica un rechazo automático global por seguridad.");
  print("[INFO] Configurar reject por shape requiere definir el query shape exacto por caso de uso.");
  print("[INFO] Recomendación: aplicar reject de forma gradual en entorno staging primero.");
} else {
  print("\n[LIMITACIÓN] No hay soporte general para rechazo global de consultas no indexadas en este entorno/proyecto.");
  print("Alternativa realista aplicada: validación con explain('executionStats') + auditoría de COLLSCAN.");
}

print("\nChecklist mínimo operativo:");
print("1) Ejecutar backend/03_indexes.mongodb.js");
print("2) Ejecutar backend/04_indexes_explain.mongodb.js");
print("3) Confirmar en cada caso: IXSCAN o GEO_NEAR_2DSPHERE y evitar COLLSCAN");
print("4) Revisar totalDocsExamined vs nReturned (selectividad)");

print("\nScript de guardrails finalizado.");

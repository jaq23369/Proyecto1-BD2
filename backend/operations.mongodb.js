// =============================================================
// PROYECTO 1 - BD2 | Casos de uso transaccionales y analíticos
// Stack real del repo: mongosh scripts
// =============================================================

use("restaurantes_db");

const DB_NAME = "restaurantes_db";
const ORDER_STATES = {
  CREADA: "creada",
  CONFIRMADA: "confirmada",
  EN_PREPARACION: "en_preparacion",
  EN_CAMINO: "en_camino",
  ENTREGADA: "entregada",
  CANCELADA: "cancelada",
};

function asObjectId(value, fieldName) {
  if (!value) {
    throw new Error("El campo '" + fieldName + "' es obligatorio.");
  }

  if (value instanceof ObjectId) {
    return value;
  }

  try {
    return ObjectId(value);
  } catch (error) {
    throw new Error("El campo '" + fieldName + "' debe ser un ObjectId valido.");
  }
}

function asDate(value, fieldName) {
  if (!value) return null;
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) {
    throw new Error("El campo '" + fieldName + "' debe ser una fecha valida.");
  }
  return parsed;
}

function requiredString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error("El campo '" + fieldName + "' es obligatorio y debe ser texto.");
  }
  return value.trim();
}

function requiredNumber(value, fieldName, min) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error("El campo '" + fieldName + "' debe ser numerico.");
  }
  if (typeof min === "number" && value < min) {
    throw new Error("El campo '" + fieldName + "' debe ser >= " + min + ".");
  }
  return value;
}

function rounded2(value) {
  return parseFloat(Number(value).toFixed(2));
}

function nowUtc() {
  return new Date();
}

function buildDateMatch(fieldName, params) {
  const match = {};
  const startDate = asDate(params.startDate, "startDate");
  const endDate = asDate(params.endDate, "endDate");

  if (startDate || endDate) {
    match[fieldName] = {};
    if (startDate) match[fieldName].$gte = startDate;
    if (endDate) match[fieldName].$lte = endDate;
  }

  return match;
}

function buildBaseOrderMatch(params) {
  const match = {};
  if (params.restaurante_id) {
    match.restaurante_id = asObjectId(params.restaurante_id, "restaurante_id");
  }

  const dateFilter = buildDateMatch("fecha_creacion", params);
  if (dateFilter.fecha_creacion) {
    match.fecha_creacion = dateFilter.fecha_creacion;
  }

  return match;
}

function createOrderTransactional(payload) {
  const usuarioId = asObjectId(payload.usuario_id, "usuario_id");
  const restauranteId = asObjectId(payload.restaurante_id, "restaurante_id");
  const metodoPago = requiredString(payload.metodo_pago || "efectivo", "metodo_pago");
  const estadoPago = requiredString(payload.estado_pago || "pendiente", "estado_pago");
  const itemsInput = Array.isArray(payload.items) ? payload.items : [];

  if (itemsInput.length === 0) {
    throw new Error("Debe enviar al menos un item para crear la orden.");
  }

  const costoEnvio = rounded2(requiredNumber(payload.costo_envio || 0, "costo_envio", 0));
  const descuento = rounded2(requiredNumber(payload.descuento || 0, "descuento", 0));
  const impuestos = rounded2(requiredNumber(payload.impuestos || 0, "impuestos", 0));

  const session = db.getMongo().startSession();

  try {
    const result = session.withTransaction(function () {
      const sdb = session.getDatabase(DB_NAME);
      const restaurantesCol = sdb.getCollection("restaurantes");
      const menuItemsCol = sdb.getCollection("menu_items");
      const ordenesCol = sdb.getCollection("ordenes");

      const restaurante = restaurantesCol.findOne({ _id: restauranteId, estado: "activo" });
      if (!restaurante) {
        throw new Error("Restaurante no encontrado o inactivo.");
      }

      const requestedIds = itemsInput.map(function (item, index) {
        if (!item || !item.menu_item_id) {
          throw new Error("Cada item debe incluir menu_item_id. Error en posicion " + index + ".");
        }
        return asObjectId(item.menu_item_id, "items.menu_item_id");
      });

      const menuDocs = menuItemsCol
        .find({ _id: { $in: requestedIds }, restaurante_id: restauranteId })
        .toArray();

      if (menuDocs.length !== requestedIds.length) {
        throw new Error("Al menos un menu_item no existe o no pertenece al restaurante indicado.");
      }

      const menuById = {};
      menuDocs.forEach(function (doc) {
        menuById[doc._id.valueOf()] = doc;
      });

      const snapItems = [];
      const itemCounter = {};
      let subtotal = 0;

      itemsInput.forEach(function (item) {
        const menuItemId = asObjectId(item.menu_item_id, "items.menu_item_id");
        const menuDoc = menuById[menuItemId.valueOf()];
        if (!menuDoc) {
          throw new Error("menu_item no encontrado: " + menuItemId.valueOf());
        }
        if (!menuDoc.disponible) {
          throw new Error("menu_item no disponible: " + menuDoc.nombre);
        }

        const cantidad = requiredNumber(item.cantidad, "items.cantidad", 1);
        const precioUnitario = rounded2(menuDoc.precio);
        const subtotalItem = rounded2(precioUnitario * cantidad);
        subtotal += subtotalItem;

        itemCounter[menuItemId.valueOf()] = (itemCounter[menuItemId.valueOf()] || 0) + cantidad;

        snapItems.push({
          menu_item_id: menuItemId,
          nombre_snapshot: menuDoc.nombre,
          precio_unitario_snapshot: precioUnitario,
          cantidad: cantidad,
          subtotal: subtotalItem,
          opciones_seleccionadas: Array.isArray(item.opciones_seleccionadas)
            ? item.opciones_seleccionadas
            : [],
        });
      });

      subtotal = rounded2(subtotal);
      const total = rounded2(subtotal + costoEnvio + impuestos - descuento);
      const fechaEvento = nowUtc();

      const orderDoc = {
        codigo_orden: payload.codigo_orden || null,
        usuario_id: usuarioId,
        restaurante_id: restauranteId,
        estado_orden: ORDER_STATES.CREADA,
        notas_cliente: payload.notas_cliente || "",
        direccion_entrega: payload.direccion_entrega || null,
        items: snapItems,
        resumen_pago: {
          subtotal: subtotal,
          costo_envio: costoEnvio,
          descuento: descuento,
          impuestos: impuestos,
          total: total,
          metodo_pago: metodoPago,
          estado_pago: estadoPago,
        },
        historial_estados: [
          {
            estado: ORDER_STATES.CREADA,
            fecha: fechaEvento,
            usuario_evento: "sistema",
          },
        ],
        fecha_creacion: fechaEvento,
        fecha_actualizacion: fechaEvento,
      };

      const insertOrderResult = ordenesCol.insertOne(orderDoc);

      restaurantesCol.updateOne(
        { _id: restauranteId },
        {
          $inc: { "estadisticas.total_ordenes": 1 },
          $set: { fecha_actualizacion: fechaEvento },
        }
      );

      const bulkOps = Object.keys(itemCounter).map(function (id) {
        return {
          updateOne: {
            filter: { _id: ObjectId(id) },
            update: {
              $inc: { "metricas.veces_pedido": itemCounter[id] },
              $set: { fecha_actualizacion: fechaEvento },
            },
          },
        };
      });

      if (bulkOps.length > 0) {
        menuItemsCol.bulkWrite(bulkOps, { ordered: false });
      }

      return {
        orden_id: insertOrderResult.insertedId,
        restaurante_id: restauranteId,
        subtotal: subtotal,
        total: total,
        items: snapItems.length,
      };
    });

    return {
      ok: 1,
      transaction: "TX-01 Crear orden + actualizar métricas",
      data: result,
    };
  } catch (error) {
    return {
      ok: 0,
      transaction: "TX-01 Crear orden + actualizar métricas",
      error: error.message,
    };
  } finally {
    session.endSession();
  }
}

function publishReviewTransactional(payload) {
  const ordenId = asObjectId(payload.orden_id, "orden_id");
  const usuarioId = asObjectId(payload.usuario_id, "usuario_id");
  const calificacion = requiredNumber(payload.calificacion, "calificacion", 1);
  if (calificacion > 5) {
    throw new Error("El campo 'calificacion' debe estar entre 1 y 5.");
  }

  const session = db.getMongo().startSession();

  try {
    const result = session.withTransaction(function () {
      const sdb = session.getDatabase(DB_NAME);
      const ordenesCol = sdb.getCollection("ordenes");
      const resenasCol = sdb.getCollection("resenas");
      const restaurantesCol = sdb.getCollection("restaurantes");

      const orden = ordenesCol.findOne({ _id: ordenId });
      if (!orden) {
        throw new Error("La orden indicada no existe.");
      }

      if (orden.usuario_id.valueOf() !== usuarioId.valueOf()) {
        throw new Error("La orden no pertenece al usuario indicado.");
      }

      if (orden.estado_orden !== ORDER_STATES.ENTREGADA) {
        throw new Error("Solo se permite reseñar ordenes entregadas.");
      }

      const existingReview = resenasCol.findOne({ orden_id: ordenId });
      if (existingReview) {
        throw new Error("La orden ya tiene una reseña registrada.");
      }

      const visible = payload.visible !== false;
      const fechaResena = nowUtc();

      const insertResenaResult = resenasCol.insertOne({
        orden_id: ordenId,
        usuario_id: usuarioId,
        restaurante_id: orden.restaurante_id,
        calificacion: calificacion,
        comentario: payload.comentario || "",
        aspectos: {
          sabor: requiredNumber(payload.aspectos && payload.aspectos.sabor, "aspectos.sabor", 1),
          tiempo_entrega: requiredNumber(
            payload.aspectos && payload.aspectos.tiempo_entrega,
            "aspectos.tiempo_entrega",
            1
          ),
          presentacion: requiredNumber(
            payload.aspectos && payload.aspectos.presentacion,
            "aspectos.presentacion",
            1
          ),
        },
        visible: visible,
        fecha_creacion: fechaResena,
      });

      const ratingAggregation = resenasCol
        .aggregate([
          {
            $match: {
              restaurante_id: orden.restaurante_id,
              visible: true,
            },
          },
          {
            $group: {
              _id: "$restaurante_id",
              rating_promedio: { $avg: "$calificacion" },
              total_resenas: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const ratingDoc = ratingAggregation.length > 0
        ? ratingAggregation[0]
        : { rating_promedio: 0, total_resenas: 0 };

      restaurantesCol.updateOne(
        { _id: orden.restaurante_id },
        {
          $set: {
            "estadisticas.rating_promedio": rounded2(ratingDoc.rating_promedio || 0),
            "estadisticas.total_resenas": ratingDoc.total_resenas || 0,
            fecha_actualizacion: fechaResena,
          },
        }
      );

      return {
        resena_id: insertResenaResult.insertedId,
        restaurante_id: orden.restaurante_id,
        rating_promedio: rounded2(ratingDoc.rating_promedio || 0),
        total_resenas: ratingDoc.total_resenas || 0,
      };
    });

    return {
      ok: 1,
      transaction: "TX-02 Publicar reseña + actualizar rating",
      data: result,
    };
  } catch (error) {
    return {
      ok: 0,
      transaction: "TX-02 Publicar reseña + actualizar rating",
      error: error.message,
    };
  } finally {
    session.endSession();
  }
}

function salesByRestaurantMonth(params) {
  params = params || {};
  const match = buildBaseOrderMatch(params);
  match.estado_orden = ORDER_STATES.ENTREGADA;

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        anio_mes: { $dateToString: { format: "%Y-%m", date: "$fecha_creacion" } },
      },
    },
    {
      $group: {
        _id: {
          restaurante_id: "$restaurante_id",
          anio_mes: "$anio_mes",
        },
        total_ventas: { $sum: "$resumen_pago.total" },
        total_ordenes: { $sum: 1 },
        ticket_promedio: { $avg: "$resumen_pago.total" },
      },
    },
    {
      $lookup: {
        from: "restaurantes",
        localField: "_id.restaurante_id",
        foreignField: "_id",
        as: "restaurante",
      },
    },
    {
      $project: {
        _id: 0,
        restaurante_id: "$_id.restaurante_id",
        anio_mes: "$_id.anio_mes",
        restaurante_nombre: { $ifNull: [{ $first: "$restaurante.nombre" }, "N/A"] },
        total_ventas: { $round: ["$total_ventas", 2] },
        total_ordenes: 1,
        ticket_promedio: { $round: ["$ticket_promedio", 2] },
      },
    },
    { $sort: { anio_mes: 1, total_ventas: -1 } },
  ];

  return db.ordenes.aggregate(pipeline).toArray();
}

function topProductsByRestaurant(params) {
  params = params || {};
  const match = buildBaseOrderMatch(params);
  match.estado_orden = ORDER_STATES.ENTREGADA;

  const limit = params.limit ? requiredNumber(params.limit, "limit", 1) : 20;

  const pipeline = [
    { $match: match },
    { $unwind: "$items" },
    {
      $group: {
        _id: {
          restaurante_id: "$restaurante_id",
          menu_item_id: "$items.menu_item_id",
        },
        nombre_producto: { $first: "$items.nombre_snapshot" },
        unidades_vendidas: { $sum: "$items.cantidad" },
        ingresos_generados: { $sum: "$items.subtotal" },
      },
    },
    {
      $lookup: {
        from: "restaurantes",
        localField: "_id.restaurante_id",
        foreignField: "_id",
        as: "restaurante",
      },
    },
    {
      $project: {
        _id: 0,
        restaurante_id: "$_id.restaurante_id",
        restaurante_nombre: { $ifNull: [{ $first: "$restaurante.nombre" }, "N/A"] },
        menu_item_id: "$_id.menu_item_id",
        nombre_producto: 1,
        unidades_vendidas: 1,
        ingresos_generados: { $round: ["$ingresos_generados", 2] },
      },
    },
    { $sort: { unidades_vendidas: -1, ingresos_generados: -1 } },
    { $limit: limit },
  ];

  return db.ordenes.aggregate(pipeline).toArray();
}

function restaurantRatings(params) {
  params = params || {};
  const match = { visible: true };

  if (params.restaurante_id) {
    match.restaurante_id = asObjectId(params.restaurante_id, "restaurante_id");
  }

  const dateFilter = buildDateMatch("fecha_creacion", params);
  if (dateFilter.fecha_creacion) {
    match.fecha_creacion = dateFilter.fecha_creacion;
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: "$restaurante_id",
        rating_promedio: { $avg: "$calificacion" },
        total_resenas: { $sum: 1 },
        promedio_sabor: { $avg: "$aspectos.sabor" },
        promedio_tiempo_entrega: { $avg: "$aspectos.tiempo_entrega" },
        promedio_presentacion: { $avg: "$aspectos.presentacion" },
      },
    },
    {
      $lookup: {
        from: "restaurantes",
        localField: "_id",
        foreignField: "_id",
        as: "restaurante",
      },
    },
    {
      $project: {
        _id: 0,
        restaurante_id: "$_id",
        restaurante_nombre: { $ifNull: [{ $first: "$restaurante.nombre" }, "N/A"] },
        rating_promedio: { $round: ["$rating_promedio", 2] },
        total_resenas: 1,
        promedio_sabor: { $round: ["$promedio_sabor", 2] },
        promedio_tiempo_entrega: { $round: ["$promedio_tiempo_entrega", 2] },
        promedio_presentacion: { $round: ["$promedio_presentacion", 2] },
      },
    },
    { $sort: { rating_promedio: -1, total_resenas: -1 } },
  ];

  return db.resenas.aggregate(pipeline).toArray();
}

function orderFunnel(params) {
  params = params || {};
  const match = buildBaseOrderMatch(params);

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: "$estado_orden",
        total: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        total_ordenes: { $sum: "$total" },
        estados: {
          $push: {
            estado_orden: "$_id",
            total: "$total",
          },
        },
      },
    },
    { $unwind: "$estados" },
    {
      $project: {
        _id: 0,
        estado_orden: "$estados.estado_orden",
        total: "$estados.total",
        total_ordenes: 1,
        porcentaje: {
          $round: [
            {
              $multiply: [
                { $divide: ["$estados.total", "$total_ordenes"] },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $addFields: {
        orden_estado: {
          $switch: {
            branches: [
              { case: { $eq: ["$estado_orden", ORDER_STATES.CREADA] }, then: 1 },
              { case: { $eq: ["$estado_orden", ORDER_STATES.CONFIRMADA] }, then: 2 },
              { case: { $eq: ["$estado_orden", ORDER_STATES.EN_PREPARACION] }, then: 3 },
              { case: { $eq: ["$estado_orden", ORDER_STATES.EN_CAMINO] }, then: 4 },
              { case: { $eq: ["$estado_orden", ORDER_STATES.ENTREGADA] }, then: 5 },
              { case: { $eq: ["$estado_orden", ORDER_STATES.CANCELADA] }, then: 6 },
            ],
            default: 99,
          },
        },
      },
    },
    { $sort: { orden_estado: 1 } },
    { $project: { orden_estado: 0 } },
  ];

  return db.ordenes.aggregate(pipeline).toArray();
}

function orderStateTimes(params) {
  params = params || {};
  const match = buildBaseOrderMatch(params);
  match.estado_orden = ORDER_STATES.ENTREGADA;

  const stateDateExpr = function (stateName) {
    return {
      $arrayElemAt: [
        {
          $map: {
            input: {
              $filter: {
                input: "$historial_estados",
                as: "hist",
                cond: { $eq: ["$$hist.estado", stateName] },
              },
            },
            as: "item",
            in: "$$item.fecha",
          },
        },
        0,
      ],
    };
  };

  const pipeline = [
    { $match: match },
    {
      $project: {
        restaurante_id: 1,
        creada_at: stateDateExpr(ORDER_STATES.CREADA),
        confirmada_at: stateDateExpr(ORDER_STATES.CONFIRMADA),
        en_preparacion_at: stateDateExpr(ORDER_STATES.EN_PREPARACION),
        en_camino_at: stateDateExpr(ORDER_STATES.EN_CAMINO),
        entregada_at: stateDateExpr(ORDER_STATES.ENTREGADA),
      },
    },
    {
      $project: {
        restaurante_id: 1,
        min_creada_confirmada: {
          $cond: [
            { $and: ["$creada_at", "$confirmada_at"] },
            { $dateDiff: { startDate: "$creada_at", endDate: "$confirmada_at", unit: "minute" } },
            null,
          ],
        },
        min_confirmada_preparacion: {
          $cond: [
            { $and: ["$confirmada_at", "$en_preparacion_at"] },
            { $dateDiff: { startDate: "$confirmada_at", endDate: "$en_preparacion_at", unit: "minute" } },
            null,
          ],
        },
        min_preparacion_camino: {
          $cond: [
            { $and: ["$en_preparacion_at", "$en_camino_at"] },
            { $dateDiff: { startDate: "$en_preparacion_at", endDate: "$en_camino_at", unit: "minute" } },
            null,
          ],
        },
        min_camino_entregada: {
          $cond: [
            { $and: ["$en_camino_at", "$entregada_at"] },
            { $dateDiff: { startDate: "$en_camino_at", endDate: "$entregada_at", unit: "minute" } },
            null,
          ],
        },
      },
    },
    {
      $group: {
        _id: "$restaurante_id",
        ordenes_analizadas: { $sum: 1 },
        prom_creada_confirmada: { $avg: "$min_creada_confirmada" },
        prom_confirmada_preparacion: { $avg: "$min_confirmada_preparacion" },
        prom_preparacion_camino: { $avg: "$min_preparacion_camino" },
        prom_camino_entregada: { $avg: "$min_camino_entregada" },
      },
    },
    {
      $lookup: {
        from: "restaurantes",
        localField: "_id",
        foreignField: "_id",
        as: "restaurante",
      },
    },
    {
      $project: {
        _id: 0,
        restaurante_id: "$_id",
        restaurante_nombre: { $ifNull: [{ $first: "$restaurante.nombre" }, "N/A"] },
        ordenes_analizadas: 1,
        prom_creada_confirmada: { $round: [{ $ifNull: ["$prom_creada_confirmada", 0] }, 2] },
        prom_confirmada_preparacion: { $round: [{ $ifNull: ["$prom_confirmada_preparacion", 0] }, 2] },
        prom_preparacion_camino: { $round: [{ $ifNull: ["$prom_preparacion_camino", 0] }, 2] },
        prom_camino_entregada: { $round: [{ $ifNull: ["$prom_camino_entregada", 0] }, 2] },
      },
    },
    { $sort: { prom_camino_entregada: 1 } },
  ];

  return db.ordenes.aggregate(pipeline).toArray();
}

const backendOperations = {
  transactions: {
    createOrderTransactional: createOrderTransactional,
    publishReviewTransactional: publishReviewTransactional,
  },
  analytics: {
    salesByRestaurantMonth: salesByRestaurantMonth,
    topProductsByRestaurant: topProductsByRestaurant,
    restaurantRatings: restaurantRatings,
    orderFunnel: orderFunnel,
    orderStateTimes: orderStateTimes,
  },
};

print("Operaciones backend disponibles en variable global 'backendOperations'.");
print("Ejemplo TX orden: backendOperations.transactions.createOrderTransactional({...})");
print("Ejemplo pipeline: backendOperations.analytics.salesByRestaurantMonth({...})");

import { getSql, withRetry } from "@/lib/db";

// Orders and waiter calls read and write the database WITHOUT Prisma.
//
// These are guest-facing: every person placing an order or calling a waiter used
// to boot the Prisma WASM engine inside the Worker isolate that served them. See
// src/lib/db.ts for what that cost in production.
//
// Shapes here match what Prisma returned, field for field, because the admin
// dashboard and the guest client both consume these responses as JSON. The neon
// driver parses TIMESTAMP columns into Date objects exactly as Prisma did, so
// `createdAt` and friends still serialise to the same ISO strings.

export const ACTIVE_ORDER_STATUSES = ["new", "preparing"];

/** The gate every guest write goes through: is this tenant open for business? */
export type OrderingRestaurant = {
  settings: string | null;
  status: string;
  trialEndsAt: Date | null;
};

export async function findRestaurantForOrdering(
  restaurantId: number,
): Promise<OrderingRestaurant | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "settings", "status", "trialEndsAt"
      FROM "Restaurant"
      WHERE "id" = ${restaurantId}
      LIMIT 1
    `,
  )) as Array<Record<string, unknown>>;

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    settings: row.settings === null ? null : String(row.settings),
    status: typeof row.status === "string" ? row.status : "active",
    trialEndsAt: (row.trialEndsAt as Date | null) ?? null,
  };
}

export type OrderItemRow = {
  id: number;
  orderId: number;
  /** When this line appeared — later than its order means a second round. */
  createdAt: Date;
  /** Moves when the quantity changes, the other way a guest adds to an order. */
  updatedAt: Date;
  dishId: number;
  optionId: number | null;
  quantity: number;
  price: number;
  nameEn: string;
  nameRu: string;
  nameAz: string;
  optionNameEn: string | null;
  optionNameRu: string | null;
  optionNameAz: string | null;
};

export type OrderRow = {
  id: number;
  tableNumber: string;
  status: string;
  total: number;
  restaurantId: number;
  createdAt: Date;
  updatedAt: Date;
  checkoutSessionId: string | null;
  paymentIntentId: string | null;
  /**
   * The number staff see: 1, 2, 3... per restaurant, in the order placed.
   *
   * Only the listing query computes it. `id` is a global sequence shared by
   * every restaurant on the platform, so one venue's orders read 23, 27, 31 —
   * gaps that look like lost orders and quietly disclose the platform's volume.
   */
  displayNumber?: number;
};

export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

/** A new item as the route builds it, before it has an id. */
export type NewOrderItem = Omit<OrderItemRow, "id" | "orderId" | "createdAt" | "updatedAt">;

const ORDER_COLUMNS = `
  "id", "tableNumber", "status", "total", "restaurantId",
  "createdAt", "updatedAt", "checkoutSessionId", "paymentIntentId"
`;

const ORDER_ITEM_COLUMNS = `
  "id", "orderId", "dishId", "optionId", "quantity", "price",
  "nameEn", "nameRu", "nameAz", "optionNameEn", "optionNameRu", "optionNameAz",
  "createdAt", "updatedAt"
`;

/** Attach items to orders in one extra query rather than one query per order. */
async function attachItems(orders: OrderRow[]): Promise<OrderWithItems[]> {
  if (orders.length === 0) {
    return [];
  }

  const sql = getSql();
  const orderIds = orders.map((order) => order.id);

  const items = (await withRetry(
    () => sql`
      SELECT ${sql.unsafe(ORDER_ITEM_COLUMNS)}
      FROM "OrderItem"
      WHERE "orderId" = ANY(${orderIds}::int[])
      ORDER BY "id" ASC
    `,
  )) as OrderItemRow[];

  const itemsByOrder = new Map<number, OrderItemRow[]>();
  for (const item of items) {
    const existing = itemsByOrder.get(item.orderId);
    if (existing) {
      existing.push(item);
    } else {
      itemsByOrder.set(item.orderId, [item]);
    }
  }

  return orders.map((order) => ({ ...order, items: itemsByOrder.get(order.id) ?? [] }));
}

/** Every order for a restaurant, or for all of them when the id is null. */
/**
 * How far back the paid-order history reaches.
 *
 * This query used to return every order ever placed, with every line item, on a
 * ten-second poll. A venue doing fifty orders a day would be shipping tens of
 * thousands of rows to a phone behind the bar within a year, and the staff only
 * ever look at the last day or two.
 *
 * Unpaid orders are never dropped no matter their age: an order still sitting on
 * "new" is somebody waiting, and hiding it because it is old would be the worst
 * possible behaviour. Nothing is deleted either — this only bounds what the
 * panel asks for, and the rows stay in the database for exports and accounting.
 */
export const ORDER_HISTORY_DAYS = 7;

export async function findOrdersWithItems(restaurantId: number | null): Promise<OrderWithItems[]> {
  const sql = getSql();

  // Numbering runs over ALL of the restaurant's orders and the history window is
  // applied afterwards, so a number never changes. Numbering the visible rows
  // instead would renumber every order each time an old one aged out — order 40
  // becoming order 39 overnight, in a list staff read out to the kitchen.
  const orders = (await withRetry(() =>
    restaurantId === null
      ? sql`
          SELECT * FROM (
            SELECT ${sql.unsafe(ORDER_COLUMNS)},
                   (ROW_NUMBER() OVER (PARTITION BY "restaurantId" ORDER BY "id" ASC))::int AS "displayNumber"
            FROM "Order"
          ) numbered
          WHERE "status" <> 'paid'
             OR "createdAt" >= NOW() - (${ORDER_HISTORY_DAYS} || ' days')::interval
          ORDER BY "createdAt" DESC
        `
      : sql`
          SELECT * FROM (
            SELECT ${sql.unsafe(ORDER_COLUMNS)},
                   (ROW_NUMBER() OVER (PARTITION BY "restaurantId" ORDER BY "id" ASC))::int AS "displayNumber"
            FROM "Order"
            WHERE "restaurantId" = ${restaurantId}
          ) numbered
          WHERE "status" <> 'paid'
             OR "createdAt" >= NOW() - (${ORDER_HISTORY_DAYS} || ' days')::interval
          ORDER BY "createdAt" DESC
        `,
  )) as OrderRow[];

  return attachItems(orders);
}

/** The table's open order — what a second round of items gets merged into. */
export async function findActiveOrderWithItems(
  tableNumber: string,
  restaurantId: number,
): Promise<OrderWithItems | null> {
  const sql = getSql();

  const orders = (await withRetry(
    () => sql`
      SELECT ${sql.unsafe(ORDER_COLUMNS)}
      FROM "Order"
      WHERE "tableNumber" = ${tableNumber}
        AND "restaurantId" = ${restaurantId}
        AND "status" = ANY(${ACTIVE_ORDER_STATUSES}::text[])
      ORDER BY "createdAt" DESC
      LIMIT 1
    `,
  )) as OrderRow[];

  const withItems = await attachItems(orders);
  return withItems[0] ?? null;
}

export async function findOrderWithItemsById(orderId: number): Promise<OrderWithItems | null> {
  const sql = getSql();

  const orders = (await withRetry(
    () => sql`
      SELECT ${sql.unsafe(ORDER_COLUMNS)}
      FROM "Order"
      WHERE "id" = ${orderId}
      LIMIT 1
    `,
  )) as OrderRow[];

  const withItems = await attachItems(orders);
  return withItems[0] ?? null;
}

/** Owner of an order — the tenant check before an admin may touch it. */
export async function findOrderRestaurantId(orderId: number): Promise<number | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "restaurantId"
      FROM "Order"
      WHERE "id" = ${orderId}
      LIMIT 1
    `,
  )) as Array<{ restaurantId: number }>;

  return rows[0] ? Number(rows[0].restaurantId) : null;
}

/**
 * When this table last paid.
 *
 * A QR session issued before the table settled up is spent, so the timestamp
 * decides whether the guest must scan again.
 */
export async function findLatestPaidOrderUpdatedAt(
  tableNumber: string,
  restaurantId: number,
): Promise<Date | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "updatedAt"
      FROM "Order"
      WHERE "tableNumber" = ${tableNumber}
        AND "restaurantId" = ${restaurantId}
        AND "status" = 'paid'
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `,
  )) as Array<{ updatedAt: Date }>;

  return rows[0]?.updatedAt ?? null;
}

export type OrderableDish = {
  id: number;
  price: number;
  soldOut: boolean;
  nameEn: string;
  nameRu: string;
  nameAz: string;
};

/** Scoped to the restaurant: an id from another tenant simply will not match. */
export async function findDishesForOrder(
  dishIds: number[],
  restaurantId: number,
): Promise<OrderableDish[]> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "id", "price", "soldOut", "nameEn", "nameRu", "nameAz"
      FROM "Dish"
      WHERE "id" = ANY(${dishIds}::int[])
        AND "restaurantId" = ${restaurantId}
    `,
  )) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: Number(row.id),
    price: Number(row.price),
    soldOut: row.soldOut === true,
    nameEn: String(row.nameEn),
    nameRu: String(row.nameRu),
    nameAz: String(row.nameAz),
  }));
}

export type OrderableDishOption = {
  id: number;
  dishId: number;
  price: number;
  nameEn: string;
  nameRu: string;
  nameAz: string;
};

export async function findDishOptionsForOrder(
  optionIds: number[],
  restaurantId: number,
): Promise<OrderableDishOption[]> {
  if (optionIds.length === 0) {
    return [];
  }

  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT o."id", o."dishId", o."price", o."nameEn", o."nameRu", o."nameAz"
      FROM "DishOption" o
      JOIN "Dish" d ON d."id" = o."dishId"
      WHERE o."id" = ANY(${optionIds}::int[])
        AND d."restaurantId" = ${restaurantId}
    `,
  )) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: Number(row.id),
    dishId: Number(row.dishId),
    price: Number(row.price),
    nameEn: String(row.nameEn),
    nameRu: String(row.nameRu),
    nameAz: String(row.nameAz),
  }));
}

/** The column arrays an unnest() insert needs, in one pass over the items. */
function toColumnArrays(items: NewOrderItem[]) {
  return {
    dishIds: items.map((item) => item.dishId),
    optionIds: items.map((item) => item.optionId),
    quantities: items.map((item) => item.quantity),
    prices: items.map((item) => item.price),
    nameEns: items.map((item) => item.nameEn),
    nameRus: items.map((item) => item.nameRu),
    nameAzs: items.map((item) => item.nameAz),
    optionNameEns: items.map((item) => item.optionNameEn),
    optionNameRus: items.map((item) => item.optionNameRu),
    optionNameAzs: items.map((item) => item.optionNameAz),
  };
}

/**
 * Create the order and all of its items in a single statement.
 *
 * A CTE rather than two queries because the HTTP driver has no interactive
 * transaction: an order inserted by one request and items inserted by a second
 * would leave an empty order behind if the second never arrived.
 *
 * "updatedAt" is set by hand throughout this file. Prisma's @updatedAt is a
 * client-side convention — the column has no database default, so raw SQL that
 * forgets it fails on insert and silently freezes the value on update.
 */
export async function createOrderWithItems(
  tableNumber: string,
  restaurantId: number,
  total: number,
  items: NewOrderItem[],
): Promise<OrderWithItems | null> {
  const sql = getSql();
  const columns = toColumnArrays(items);

  const rows = (await withRetry(
    () => sql`
      WITH new_order AS (
        INSERT INTO "Order" ("tableNumber", "restaurantId", "total", "updatedAt")
        VALUES (${tableNumber}, ${restaurantId}, ${total}, NOW())
        RETURNING "id"
      )
      INSERT INTO "OrderItem" (
        "orderId", "dishId", "optionId", "quantity", "price",
        "nameEn", "nameRu", "nameAz", "optionNameEn", "optionNameRu", "optionNameAz"
      )
      SELECT
        new_order."id", v."dishId", v."optionId", v."quantity", v."price",
        v."nameEn", v."nameRu", v."nameAz",
        v."optionNameEn", v."optionNameRu", v."optionNameAz"
      FROM new_order,
        unnest(
          ${columns.dishIds}::int[],
          ${columns.optionIds}::int[],
          ${columns.quantities}::int[],
          ${columns.prices}::double precision[],
          ${columns.nameEns}::text[],
          ${columns.nameRus}::text[],
          ${columns.nameAzs}::text[],
          ${columns.optionNameEns}::text[],
          ${columns.optionNameRus}::text[],
          ${columns.optionNameAzs}::text[]
        ) AS v(
          "dishId", "optionId", "quantity", "price",
          "nameEn", "nameRu", "nameAz", "optionNameEn", "optionNameRu", "optionNameAz"
        )
      RETURNING "orderId"
    `,
  )) as Array<{ orderId: number }>;

  const orderId = rows[0] ? Number(rows[0].orderId) : null;
  return orderId === null ? null : findOrderWithItemsById(orderId);
}

/**
 * Fold another round of items into an order the table already has open.
 *
 * One batched transaction, so a guest never sees a total that disagrees with the
 * items it is made of. The total is recomputed by the database from the rows
 * themselves rather than read back and summed here — that keeps the whole merge
 * to a single trip and cannot drift from what is actually stored.
 */
export async function mergeItemsIntoOrder(
  orderId: number,
  quantityIncrements: Array<{ orderItemId: number; addQuantity: number }>,
  newItems: NewOrderItem[],
): Promise<void> {
  const sql = getSql();
  const columns = toColumnArrays(newItems);

  const statements = [
    ...quantityIncrements.map(
      // updatedAt moves so the panel can mark this line as topped up. Adding
      // three more teas to an existing line is the other way a guest orders
      // again, and without this it looked identical to the original round.
      (increment) => sql`
        UPDATE "OrderItem"
        SET "quantity" = "quantity" + ${increment.addQuantity},
            "updatedAt" = NOW()
        WHERE "id" = ${increment.orderItemId}
      `,
    ),
  ];

  if (newItems.length > 0) {
    statements.push(sql`
      INSERT INTO "OrderItem" (
        "orderId", "dishId", "optionId", "quantity", "price",
        "nameEn", "nameRu", "nameAz", "optionNameEn", "optionNameRu", "optionNameAz"
      )
      SELECT
        ${orderId}, v."dishId", v."optionId", v."quantity", v."price",
        v."nameEn", v."nameRu", v."nameAz",
        v."optionNameEn", v."optionNameRu", v."optionNameAz"
      FROM unnest(
        ${columns.dishIds}::int[],
        ${columns.optionIds}::int[],
        ${columns.quantities}::int[],
        ${columns.prices}::double precision[],
        ${columns.nameEns}::text[],
        ${columns.nameRus}::text[],
        ${columns.nameAzs}::text[],
        ${columns.optionNameEns}::text[],
        ${columns.optionNameRus}::text[],
        ${columns.optionNameAzs}::text[]
      ) AS v(
        "dishId", "optionId", "quantity", "price",
        "nameEn", "nameRu", "nameAz", "optionNameEn", "optionNameRu", "optionNameAz"
      )
    `);
  }

  statements.push(sql`
    UPDATE "Order"
    SET "total" = (
          SELECT COALESCE(SUM("price" * "quantity"), 0)
          FROM "OrderItem"
          WHERE "orderId" = ${orderId}
        ),
        "updatedAt" = NOW()
    WHERE "id" = ${orderId}
  `);

  await withRetry(() => sql.transaction(statements));
}

export async function updateOrderStatus(
  orderId: number,
  status: string,
): Promise<OrderWithItems | null> {
  const sql = getSql();

  await withRetry(
    () => sql`
      UPDATE "Order"
      SET "status" = ${status}, "updatedAt" = NOW()
      WHERE "id" = ${orderId}
    `,
  );

  return findOrderWithItemsById(orderId);
}

export type WaiterCallRow = {
  id: number;
  tableNumber: string;
  status: string;
  restaurantId: number;
  createdAt: Date;
  resolvedAt: Date | null;
};

const WAITER_CALL_COLUMNS = `"id", "tableNumber", "status", "restaurantId", "createdAt", "resolvedAt"`;

export async function createWaiterCall(
  tableNumber: string,
  restaurantId: number,
): Promise<WaiterCallRow> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      INSERT INTO "WaiterCall" ("tableNumber", "restaurantId", "status")
      VALUES (${tableNumber}, ${restaurantId}, 'active')
      RETURNING ${sql.unsafe(WAITER_CALL_COLUMNS)}
    `,
  )) as WaiterCallRow[];

  return rows[0];
}

export async function findActiveWaiterCalls(restaurantId: number | null): Promise<WaiterCallRow[]> {
  const sql = getSql();

  return (await withRetry(() =>
    restaurantId === null
      ? sql`
          SELECT ${sql.unsafe(WAITER_CALL_COLUMNS)}
          FROM "WaiterCall"
          WHERE "status" = 'active'
          ORDER BY "createdAt" ASC
        `
      : sql`
          SELECT ${sql.unsafe(WAITER_CALL_COLUMNS)}
          FROM "WaiterCall"
          WHERE "status" = 'active' AND "restaurantId" = ${restaurantId}
          ORDER BY "createdAt" ASC
        `,
  )) as WaiterCallRow[];
}

export async function findWaiterCallRestaurantId(callId: number): Promise<number | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      SELECT "restaurantId"
      FROM "WaiterCall"
      WHERE "id" = ${callId}
      LIMIT 1
    `,
  )) as Array<{ restaurantId: number }>;

  return rows[0] ? Number(rows[0].restaurantId) : null;
}

export async function updateWaiterCallStatus(
  callId: number,
  status: string,
): Promise<WaiterCallRow | null> {
  const sql = getSql();

  const rows = (await withRetry(
    () => sql`
      UPDATE "WaiterCall"
      SET "status" = ${status},
          "resolvedAt" = ${status === "resolved" ? new Date() : null}
      WHERE "id" = ${callId}
      RETURNING ${sql.unsafe(WAITER_CALL_COLUMNS)}
    `,
  )) as WaiterCallRow[];

  return rows[0] ?? null;
}

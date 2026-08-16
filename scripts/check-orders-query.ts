/**
 * End-to-end check of the ordering queries after the move off Prisma.
 *
 * Creates a throwaway restaurant, runs a real guest flow through it — first
 * order, a second round that merges, status changes, waiter calls — and asserts
 * the rows that come back. Everything is removed in the `finally` block; the
 * foreign keys cascade from the restaurant, so nothing survives a crash either.
 *
 * Run: npm run check:orders
 */
import { getSql } from "@/lib/db";
import {
  createOrderWithItems,
  createWaiterCall,
  findActiveOrderWithItems,
  findActiveWaiterCalls,
  findDishOptionsForOrder,
  findDishesForOrder,
  findLatestPaidOrderUpdatedAt,
  findOrderRestaurantId,
  findOrderWithItemsById,
  ORDER_HISTORY_DAYS,
  findOrdersWithItems,
  findRestaurantForOrdering,
  findWaiterCallRestaurantId,
  mergeItemsIntoOrder,
  updateOrderStatus,
  updateWaiterCallStatus,
} from "@/lib/orders-query";

let failures = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`  ok    ${label}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${label}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

async function main() {
  const sql = getSql();
  const slug = `zz-check-${Date.now()}`;
  const table = "T1";
  let restaurantId = 0;

  try {
    const [restaurant] = (await sql`
      INSERT INTO "Restaurant" ("name", "slug", "settings", "updatedAt")
      VALUES ('Check Fixture', ${slug}, '{"serviceMode":"pro"}', NOW())
      RETURNING "id"
    `) as Array<{ id: number }>;

    restaurantId = Number(restaurant.id);
    console.log(`fixture restaurant id=${restaurantId} slug=${slug}\n`);

    const [category] = (await sql`
      INSERT INTO "Category" ("nameEn", "nameRu", "nameAz", "restaurantId")
      VALUES ('C', 'C', 'C', ${restaurantId})
      RETURNING "id"
    `) as Array<{ id: number }>;

    const dishRows = (await sql`
      INSERT INTO "Dish" (
        "nameEn","nameRu","nameAz","descriptionEn","descriptionRu","descriptionAz",
        "price","imageUrl","categoryId","restaurantId","updatedAt"
      )
      SELECT v.n, v.n, v.n, '', '', '', v.p, '', ${Number(category.id)}, ${restaurantId}, NOW()
      FROM (VALUES ('Plov', 10.5), ('Tea', 2.0), ('Sold', 4.0)) AS v(n, p)
      RETURNING "id", "nameEn", "price"
    `) as Array<{ id: number; nameEn: string; price: number }>;

    const plov = dishRows.find((d) => d.nameEn === "Plov")!;
    const tea = dishRows.find((d) => d.nameEn === "Tea")!;
    const sold = dishRows.find((d) => d.nameEn === "Sold")!;

    await sql`UPDATE "Dish" SET "soldOut" = true WHERE "id" = ${sold.id}`;

    const [option] = (await sql`
      INSERT INTO "DishOption" ("dishId","nameEn","nameRu","nameAz","price")
      VALUES (${plov.id}, 'Large', 'Large', 'Large', 3)
      RETURNING "id"
    `) as Array<{ id: number }>;

    const optionId = Number(option.id);

    console.log("restaurant + dish lookups");
    const fetched = await findRestaurantForOrdering(restaurantId);
    check("restaurant found", fetched !== null);
    check("settings round-trip", fetched?.settings === '{"serviceMode":"pro"}', fetched?.settings);
    check("trialEndsAt is null or a Date", fetched?.trialEndsAt === null || fetched?.trialEndsAt instanceof Date);
    check("missing restaurant is null", (await findRestaurantForOrdering(-1)) === null);

    const dishes = await findDishesForOrder([plov.id, tea.id, sold.id], restaurantId);
    check("all three dishes returned", dishes.length === 3, dishes.length);
    check("soldOut flag survives", dishes.find((d) => d.id === sold.id)?.soldOut === true);
    check("price is a number", typeof dishes[0]?.price === "number");
    check(
      "another tenant's id matches nothing",
      (await findDishesForOrder([plov.id], restaurantId + 100000)).length === 0,
    );

    const options = await findDishOptionsForOrder([optionId], restaurantId);
    check("option scoped through its dish", options.length === 1 && options[0].dishId === plov.id);
    check("empty option list short-circuits", (await findDishOptionsForOrder([], restaurantId)).length === 0);

    console.log("\nfirst order");
    const created = await createOrderWithItems(table, restaurantId, 24.0, [
      {
        dishId: plov.id, optionId, quantity: 1, price: 13.5,
        nameEn: "Plov", nameRu: "Plov", nameAz: "Plov",
        optionNameEn: "Large", optionNameRu: "Large", optionNameAz: "Large",
      },
      {
        dishId: tea.id, optionId: null, quantity: 2, price: 2.0,
        nameEn: "Tea", nameRu: "Tea", nameAz: "Tea",
        optionNameEn: null, optionNameRu: null, optionNameAz: null,
      },
    ]);

    check("order created", created !== null);
    check("both items inserted", created?.items.length === 2, created?.items.length);
    check("total stored", created?.total === 24.0, created?.total);
    check("createdAt is a Date", created?.createdAt instanceof Date);
    check("updatedAt is a Date", created?.updatedAt instanceof Date);
    check("status defaults to new", created?.status === "new");
    check("null option survives", created?.items.some((i) => i.optionId === null) === true);
    check("option name survives", created?.items.some((i) => i.optionNameEn === "Large") === true);
    check("items ordered by id", (created?.items ?? []).every((item, i, all) => i === 0 || all[i - 1].id < item.id));
    check(
      "JSON shape matches Prisma's",
      JSON.stringify(created?.createdAt) === `"${created?.createdAt.toISOString()}"`,
    );

    const orderId = created!.id;
    check("active order is the one just made", (await findActiveOrderWithItems(table, restaurantId))?.id === orderId);
    check("owner lookup", (await findOrderRestaurantId(orderId)) === restaurantId);
    check("no paid order yet", (await findLatestPaidOrderUpdatedAt(table, restaurantId)) === null);

    console.log("\nsecond round merges into the open order");
    const existing = await findActiveOrderWithItems(table, restaurantId);
    const teaItem = existing!.items.find((i) => i.dishId === tea.id)!;

    await mergeItemsIntoOrder(
      orderId,
      [{ orderItemId: teaItem.id, addQuantity: 3 }],
      [
        {
          dishId: plov.id, optionId: null, quantity: 1, price: 10.5,
          nameEn: "Plov", nameRu: "Plov", nameAz: "Plov",
          optionNameEn: null, optionNameRu: null, optionNameAz: null,
        },
      ],
    );

    const merged = await findOrderWithItemsById(orderId);
    check("no duplicate row for the repeat item", merged?.items.length === 3, merged?.items.length);
    check("quantity accumulated", merged?.items.find((i) => i.id === teaItem.id)?.quantity === 5);

    // 13.5*1 + 2.0*5 + 10.5*1 = 34
    check("total recomputed by the database", merged?.total === 34.0, merged?.total);
    check("updatedAt moved", (merged?.updatedAt.getTime() ?? 0) > (created?.updatedAt.getTime() ?? 0));

    console.log("\nmerge with no new items");
    const before = await findOrderWithItemsById(orderId);
    await mergeItemsIntoOrder(orderId, [{ orderItemId: teaItem.id, addQuantity: 1 }], []);
    const after = await findOrderWithItemsById(orderId);
    check("item count unchanged", after?.items.length === before?.items.length);
    check("total follows the increment", after?.total === 36.0, after?.total);

    console.log("\nstatus changes");
    const paid = await updateOrderStatus(orderId, "paid");
    check("status written", paid?.status === "paid");
    check("items still attached", paid?.items.length === 3);

    const paidAt = await findLatestPaidOrderUpdatedAt(table, restaurantId);
    check("paid timestamp found", paidAt instanceof Date);
    check("no active order once paid", (await findActiveOrderWithItems(table, restaurantId)) === null);

    const listed = await findOrdersWithItems(restaurantId);
    check("listing scoped to the tenant", listed.length === 1 && listed[0].id === orderId, listed.length);
    check("listing carries items", listed[0]?.items.length === 3);

    console.log(`\nhistory window (${ORDER_HISTORY_DAYS} days)`);
    // Backdate rows directly: the point is what the query filters, and going
    // through the normal path would only ever produce timestamps from today.
    const backdate = async (id: number, days: number) => {
      await sql`
        UPDATE "Order"
        SET "createdAt" = NOW() - (${days} || ' days')::interval
        WHERE "id" = ${id}
      `;
    };

    const makeBackdated = async (status: string, days: number) => {
      const [row] = (await sql`
        INSERT INTO "Order" ("tableNumber","status","total","restaurantId","updatedAt")
        VALUES (${table}, ${status}, 1, ${restaurantId}, NOW())
        RETURNING "id"
      `) as Array<{ id: number }>;
      await backdate(Number(row.id), days);
      return Number(row.id);
    };

    const oldPaid = await makeBackdated("paid", ORDER_HISTORY_DAYS + 1);
    const recentPaid = await makeBackdated("paid", 1);
    const oldUnpaid = await makeBackdated("new", ORDER_HISTORY_DAYS + 30);

    const windowed = await findOrdersWithItems(restaurantId);
    const ids = new Set(windowed.map((order) => order.id));

    check("a paid order inside the window is listed", ids.has(recentPaid));
    check("a paid order past the window is dropped", !ids.has(oldPaid));
    check(
      "an unpaid order is kept however old — somebody is still waiting",
      ids.has(oldUnpaid),
    );

    console.log("\nwaiter calls");
    const call = await createWaiterCall(table, restaurantId);
    check("call created active", call.status === "active");
    check("createdAt is a Date", call.createdAt instanceof Date);
    check("resolvedAt starts null", call.resolvedAt === null);
    check("owner lookup", (await findWaiterCallRestaurantId(call.id)) === restaurantId);

    const active = await findActiveWaiterCalls(restaurantId);
    check("listed while active", active.length === 1 && active[0].id === call.id);

    const resolved = await updateWaiterCallStatus(call.id, "resolved");
    check("status written", resolved?.status === "resolved");
    check("resolvedAt set", resolved?.resolvedAt instanceof Date);
    check("gone from the active list", (await findActiveWaiterCalls(restaurantId)).length === 0);

    const reopened = await updateWaiterCallStatus(call.id, "active");
    check("resolvedAt cleared on reopen", reopened?.resolvedAt === null);
    check("missing call is null", (await updateWaiterCallStatus(-1, "resolved")) === null);
  } finally {
    if (restaurantId) {
      // Order matters: OrderItem -> Dish is ON DELETE RESTRICT, so the items have
      // to go before deleting the restaurant can cascade its dishes away.
      await sql`
        DELETE FROM "OrderItem"
        WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "restaurantId" = ${restaurantId})
      `;
      await sql`DELETE FROM "Order" WHERE "restaurantId" = ${restaurantId}`;
      await sql`DELETE FROM "Restaurant" WHERE "id" = ${restaurantId}`;

      const [{ count }] = (await sql`
        SELECT COUNT(*)::int AS count FROM "Restaurant" WHERE "id" = ${restaurantId}
      `) as Array<{ count: number }>;
      console.log(`\nfixture removed (rows left behind: ${count})`);
    }
  }

  console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main();

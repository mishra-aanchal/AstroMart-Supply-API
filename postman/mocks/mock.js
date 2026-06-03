const http = require("http");
const { URL } = require("url");

const json = (res, statusCode, body) => {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body, null, 2));
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });

const statePrefix = "equipment-catalog";

const getFallbackStateStore = () => {
  if (!globalThis.__mockState) {
    globalThis.__mockState = new Map();
  }

  return {
    async get(key) {
      return globalThis.__mockState.get(key);
    },
    async set(key, value) {
      globalThis.__mockState.set(key, value);
    },
  };
};

const state = globalThis.pm && globalThis.pm.state ? globalThis.pm.state : getFallbackStateStore();

const stateKey = (name) => `${statePrefix}:${name}`;

const clone = (value) => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

const readState = async (name, fallbackValue) => {
  const value = await state.get(stateKey(name));
  return value === undefined ? clone(fallbackValue) : value;
};

const writeState = async (name, value) => {
  await state.set(stateKey(name), clone(value));
};

const defaultEquipment = [
  {
    sku: "EVA-001",
    name: "Extravehicular Mobility Unit",
    category: "suits",
    available: true,
  },
  {
    sku: "TOOL-404",
    name: "Orbital Repair Toolkit",
    category: "tools",
    available: true,
  },
  {
    sku: "COMM-210",
    name: "Deep Space Comm Beacon",
    category: "communications",
    available: false,
  },
];

const defaultStationStock = {
  alpha: {
    station_id: "alpha",
    stock: {
      "EVA-001": 8,
      "TOOL-404": 15,
      "COMM-210": 2,
    },
  },
  bravo: {
    station_id: "bravo",
    stock: {
      "EVA-001": 3,
      "TOOL-404": 7,
      "COMM-210": 4,
    },
  },
};

const seedIfMissing = async () => {
  const equipmentCatalog = await state.get(stateKey("equipmentCatalog"));
  if (equipmentCatalog === undefined) {
    await writeState("equipmentCatalog", defaultEquipment);
  }

  const stationInventory = await state.get(stateKey("stationInventory"));
  if (stationInventory === undefined) {
    await writeState("stationInventory", defaultStationStock);
  }

  const existingOrders = await state.get(stateKey("orders"));
  if (!Array.isArray(existingOrders)) {
    await writeState("orders", []);
  }

  const existingSequence = Number(await state.get(stateKey("orderSequence")));
  if (!Number.isFinite(existingSequence)) {
    await writeState("orderSequence", 1000);
  }
};

const normalizeStation = (stationId) => String(stationId || "").trim().toLowerCase();


const server = http.createServer(async (req, res) => {
  const method = req.method || "GET";
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  try {
    await seedIfMissing();

    // @endpoint GET /equipment
    if (method === "GET" && pathname === "/equipment") {
      const equipment = await readState("equipmentCatalog", defaultEquipment);
      const nameFilter = (parsedUrl.searchParams.get("name") || "").toLowerCase();
      const skuFilter = (parsedUrl.searchParams.get("sku") || "").toLowerCase();

      const items = equipment.filter((item) => {
        const matchesName = !nameFilter || item.name.toLowerCase().includes(nameFilter);
        const matchesSku = !skuFilter || item.sku.toLowerCase() === skuFilter;
        return matchesName && matchesSku;
      });

      return json(res, 200, {
        count: items.length,
        items,
      });
    }

    const stockMatch = pathname.match(/^\/stations\/([^/]+)\/stock$/);
    // @endpoint GET /stations/:station_id/stock
    if (method === "GET" && stockMatch) {
      const stationId = normalizeStation(stockMatch[1]);
      const inventory = await readState("stationInventory", defaultStationStock);
      const stationRecord = inventory[stationId] || { station_id: stationId, stock: {} };
      const skuFilter = parsedUrl.searchParams.get("sku");

      if (skuFilter) {
        return json(res, 200, {
          station_id: stationRecord.station_id,
          sku: skuFilter,
          quantity: stationRecord.stock[skuFilter] || 0,
        });
      }

      return json(res, 200, {
        station_id: stationRecord.station_id,
        stock: stationRecord.stock,
      });
    }

    // @endpoint POST /orders
    if (method === "POST" && pathname === "/orders") {
      const body = await readBody(req);
      const quantity = Number(body.quantity);

      if (!body.sku || !body.equipment_name || !body.mission_id || !body.destination_station || !Number.isFinite(quantity) || quantity <= 0) {
        return json(res, 400, {
          error: "Invalid order payload",
          required: ["equipment_name", "sku", "quantity", "mission_id", "destination_station"],
        });
      }

      const nextSequence = Number(await readState("orderSequence", 1000)) + 1;
      await writeState("orderSequence", nextSequence);

      const storedOrders = await readState("orders", []);
      const orders = Array.isArray(storedOrders) ? storedOrders : [];
      const createdOrder = {
        order_id: `ORD-${nextSequence}`,
        equipment_name: body.equipment_name,
        sku: body.sku,
        quantity,
        mission_id: body.mission_id,
        destination_station: body.destination_station,
        status: "created",
        created_at: new Date().toISOString(),
      };

      orders.push(createdOrder);
      await writeState("orders", orders);

      return json(res, 201, createdOrder);
    }

    const restockMatch = pathname.match(/^\/stations\/([^/]+)\/restock$/);
    // @endpoint PUT /stations/:station_id/restock
    if (method === "PUT" && restockMatch) {
      const stationId = normalizeStation(restockMatch[1]);
      const body = await readBody(req);
      const restockQuantity = Number(body.restock_quantity);

      if (!body.sku || !Number.isFinite(restockQuantity) || restockQuantity <= 0) {
        return json(res, 400, {
          error: "Invalid restock payload",
          required: ["sku", "restock_quantity"],
        });
      }

      const inventory = await readState("stationInventory", defaultStationStock);
      const stationRecord = inventory[stationId] || { station_id: stationId, stock: {} };
      const currentQty = Number(stationRecord.stock[body.sku] || 0);
      const updatedQty = currentQty + restockQuantity;

      stationRecord.stock[body.sku] = updatedQty;
      inventory[stationId] = stationRecord;
      await writeState("stationInventory", inventory);

      return json(res, 200, {
        station_id: stationId,
        sku: body.sku,
        previous_quantity: currentQty,
        restock_quantity: restockQuantity,
        quantity: updatedQty,
      });
    }

    return json(res, 404, {
      error: "Not Found",
      method,
      path: pathname,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return json(res, 400, {
        error: "Malformed JSON body",
      });
    }

    console.error("Mock handler error:", error);
    return json(res, 500, {
      error: "Internal mock error",
      message: error.message,
    });
  }
});

server.listen(process.env.PORT || 3000);
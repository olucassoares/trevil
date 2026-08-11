import postgres from "postgres";

export type DatabaseRow = Record<string, unknown>;

type QueryResult<T extends DatabaseRow = DatabaseRow> = {
  results: T[];
  meta: { changes: number; last_row_id: number | null };
};

type QueryExecutor = {
  unsafe(query: string, parameters?: unknown[]): Promise<unknown>;
};

const globalDatabase = globalThis as typeof globalThis & {
  trevilPostgres?: ReturnType<typeof postgres>;
};

function getClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL não foi configurada para o PostgreSQL.");

  globalDatabase.trevilPostgres ??= postgres(databaseUrl, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
  return globalDatabase.trevilPostgres;
}

function toPostgresQuery(query: string) {
  let parameter = 0;
  return query
    .replace(/\?/g, () => `$${++parameter}`)
    .replace(/\bAS\s+([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g, 'AS "$1"')
    .replace(/(?<![".])\b([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b(?!")/g, '"$1"');
}

function normalizeRow<T extends DatabaseRow>(row: T): T {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value) ? Number(value) : value,
  ])) as T;
}

function withReturnedId(query: string) {
  if (!/^\s*INSERT\s+INTO\s+/i.test(query) || /\bRETURNING\b/i.test(query)) return query;
  const table = query.match(/^\s*INSERT\s+INTO\s+([a-z_]+)/i)?.[1];
  return table && new Set(["products", "customers", "orders", "order_items", "order_events", "stock_movements"]).has(table)
    ? `${query} RETURNING id`
    : query;
}

export class PreparedStatement {
  private values: unknown[] = [];

  constructor(private readonly query: string) {}

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async execute(executor: QueryExecutor = getClient() as unknown as QueryExecutor): Promise<QueryResult> {
    const raw = await executor.unsafe(withReturnedId(toPostgresQuery(this.query)), this.values) as DatabaseRow[] & { count?: number };
    const results = Array.from(raw, normalizeRow);
    const lastId = results[0]?.id;
    return {
      results,
      meta: {
        changes: Number(raw.count ?? results.length),
        last_row_id: typeof lastId === "number" ? lastId : lastId == null ? null : Number(lastId),
      },
    };
  }

  async all<T extends DatabaseRow = DatabaseRow>() {
    return this.execute() as Promise<QueryResult<T>>;
  }

  async first<T extends DatabaseRow = DatabaseRow>() {
    const result = await this.execute();
    return (result.results[0] as T | undefined) ?? null;
  }

  run() {
    return this.execute();
  }
}

class PostgresDatabase {
  prepare(query: string) {
    return new PreparedStatement(query);
  }

  async batch(statements: PreparedStatement[]) {
    return getClient().begin(async (transaction) => {
      const results: QueryResult[] = [];
      for (const statement of statements) results.push(await statement.execute(transaction as unknown as QueryExecutor));
      return results;
    });
  }
}

const database = new PostgresDatabase();

export async function getDatabase() {
  return database;
}

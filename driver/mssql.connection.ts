import { AbstractSqlConnection } from '@mikro-orm/knex';
import dialect from 'knex/lib/dialects/mssql';

export class MsSqlConnection extends AbstractSqlConnection {
  async connect(): Promise<void> {
    this.client = this.createKnexClient(this.getPatchedDialect());
  }

  getDefaultClientUrl(): string {
    return 'mssql://sa@127.0.0.1:1433';
  }

  protected transformRawResult<T>(res: any, method: 'all' | 'get' | 'run'): T {
    if (method === 'get') {
      return res[0];
    }

    if (method === 'all') {
      return res;
    }

    const { rows } = res.toTable();
    const [row] = rows;

    return {
      insertId: (row?.length > 0) ? row[0] : null,
      affectedRows: rows.length,
      row,
      rows
    } as unknown as T;
  }

  private getPatchedDialect() {
    const INSERT_RE = /^insert into/;
    const isInsert = (obj) => obj?.method == "raw" && obj?.sql?.trim().match(INSERT_RE);
    const processResponse = dialect.prototype.processResponse;
    dialect.prototype.processResponse = function (obj, runner) {
      if (isInsert(obj)) {
        return obj.response;
      }
      return processResponse(obj, runner);
    }

    const patchInsertMany = (sql: string) => {
      const [result] = Array.from(sql.matchAll(/^insert into (.*) values (.*) returning (.*)/));
      if (!result)
        return sql;
      const [_, table, values, returns] = result;
      const columns = returns.split(',').map(x => `inserted.${x.trim()}`).join(",");
      return `insert into ${table} output ${columns} values ${values}`;
    }

    const query = dialect.prototype._query;
    dialect.prototype._query = function (connection, obj) {
      obj.sql = patchInsertMany(obj.sql);
      return query(connection, obj);
    }
    return dialect;
  }
}
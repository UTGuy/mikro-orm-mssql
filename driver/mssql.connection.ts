import { AbstractSqlConnection } from '@mikro-orm/knex';
import { isIn } from 'class-validator';
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

    if (res == null) {
      return {} as T;
    }

    const [insertId] = res.toTable().rows.map(([id]) => id);

    return {
      insertId,
      affectedRows: res.length,
      row: res[0],
      rows: res
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

    const query = dialect.prototype._query;
    dialect.prototype._query = function (connection, obj) {
      return query(connection, obj);
    }
    return dialect;
  }
}
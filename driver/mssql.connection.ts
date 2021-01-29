import { AbstractSqlConnection, MonkeyPatchable } from '@mikro-orm/knex';
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

    const [result] = res;

    return {
      insertId: result.insertId,
      affectedRows: result[""],
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
      if (isInsert(obj)) {
        obj.sql += "; SELECT SCOPE_IDENTITY() as insertId;";
      }
      return query(connection, obj);
    }
    return dialect;
  }
}
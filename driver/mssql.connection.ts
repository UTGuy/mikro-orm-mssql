import { EntityMetadata, Transaction } from '@mikro-orm/core';
import { AbstractSqlConnection } from '@mikro-orm/knex';
import dialect from '@mikro-orm/knex/node_modules/knex/lib/dialects/mssql';

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
    // const _processResponse = dialect.prototype.processResponse;
    // dialect.prototype.processResponse = function (obj, runner) {
    //   return _processResponse.call(this, obj, runner);
    // }

    // const _query = dialect.prototype._query;
    // dialect.prototype._query = (connection, obj) => {
    //   return _query.call(this, connection, obj);
    // }
    return dialect;
  }

  execute<T>(
    queryOrKnex: any,
    params?: any[],
    method?: 'all' | 'get' | 'run',
    ctx?: Transaction
  ): Promise<T> {
    if (method === 'run' && typeof queryOrKnex === 'string')
      queryOrKnex = this.patchInsert(queryOrKnex);
    return super.execute(queryOrKnex, params, method, ctx);
  }

  private patchInsert(sql: string) {
    const [results] = Array.from(sql.matchAll(/^insert into (.*) (\(.*\)) values (\(.*\))/));
    if (!results)
      return sql;

    const [, table, columns, values] = results;
    const collection = table.replace(/\[|\]/gm, '');
    const { name: entityName } = Object.values(this.metadata.getAll()).find((meta: EntityMetadata) => meta.collection === collection);
    const metadata = this.metadata.get(entityName);

    const getPk = (pk: string) => metadata.properties[pk];
    const getPkFieldName = (pk: string) => getPk(pk).fieldNames[0];
    const getPkColumnType = (pk: string) => getPk(pk).columnTypes[0];
    const output = metadata.primaryKeys.map(pk => `inserted.[${getPkFieldName(pk)}]`);
    const tableColumns = metadata.primaryKeys.map(pk => `${getPkFieldName(pk)} ${getPkColumnType(pk)}`).join(', ');
    const selectColumns = metadata.primaryKeys.map(pk => `[${getPkFieldName(pk)}] as ${getPkFieldName(pk)}, [${getPkFieldName(pk)}] as ${pk}`).join(", ");

    const declare = `declare @${entityName} table (${tableColumns})`;
    const insertInto = `insert into ${table} ${columns} output ${output} into @${entityName} values ${values}`;
    const select = `select ${selectColumns} from @${entityName}`;
    const value = `${declare}; ${insertInto}; ${select};`;
    return value;
  }
}
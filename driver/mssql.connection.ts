import { AbstractSqlConnection } from 'mikro-orm/dist/connections/AbstractSqlConnection';
import { MsSqlConnectionConfig } from 'knex';

export class MsSqlConnection extends AbstractSqlConnection {
    async connect(): Promise<void> {
        this.client = this.createKnexClient(this.getPatchedDialect());
    }

    getDefaultClientUrl(): string {
        return 'mssql://sa@127.0.0.1:1433';
    }

    getConnectionOptions(): MsSqlConnectionConfig {
        const config = super.getConnectionOptions() as MsSqlConnectionConfig;
        // TODO: getConnectionOptions
        const options = {
            enableArithAbort: true
        }
        config.options = {
            ...(options as any),
            ...(config.options || {})
        }
        return config;
    }

    protected transformRawResult<T>(res: any, method: "all" | "get" | "run"): T {
        console.log('TODO: transformRawResult', res, method);
        const [results] = res;
        // TODO: transformRawResult
        return results;
    }

    private getPatchedDialect() {
        const dialect = require('knex/lib/dialects/mssql/index.js');

        const processResponse = dialect.prototype.processResponse;
        dialect.prototype.processResponse = (obj: any, runner: any) => {
            if (obj.method === 'insert') {
                return obj.response;
            }

            return processResponse(obj, runner);
        };

        const _this = this;
        dialect.prototype._query = function(connection: any, obj: any) {
            const client = this;
            if (!obj || typeof obj === 'string') obj = { sql: obj };
            return new Promise((resolver, rejecter) => {
                let { sql } = obj;
                if (!sql) return resolver();
                const req = (connection.tx_ || connection).request();
                // req.verbose = true;
                req.multiple = true;
                if (obj.bindings) {
                    for (let i = 0; i < obj.bindings.length; i++) {
                        client._setReqInput(req, i, obj.bindings[i]);
                    }
                }
                if(obj.method == "insert")
                    sql += "; SELECT SCOPE_IDENTITY() as insertId;";
                req.query(sql, (err, recordset) => {
                    if (err) {
                        return rejecter(err);
                    }
                    obj.response = recordset.recordsets[0];
                    resolver(obj);
                });
            });
        };

        return dialect;
    }

    private getCallMethod(obj: any): string {
        if (obj.method === 'raw' && obj.sql.trim().match('^insert into|update|delete')) {
            return 'run';
        }

        switch (obj.method) {
            case 'insert':
            case 'update':
            case 'counter':
            case 'del':
                return 'run';
            default:
                return 'all';
        }
    }
}
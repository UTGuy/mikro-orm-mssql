import { AbstractSqlDriver, Configuration, AnyEntity, EntityData, Transaction, QueryResult } from 'mikro-orm';
import { MsSqlConnection } from './mssql.connection';
import { MsSqlPlatform } from './mssql.platform';
import { Transaction as KnexTransaction } from 'knex';

export class MsSqlDatabaseDriver extends AbstractSqlDriver<MsSqlConnection> {
    constructor(config: Configuration) {
        super(config, new MsSqlPlatform(), MsSqlConnection, ['knex', 'mssql']);
    }

    async nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
        const res = await super.nativeInsert(entityName, data, ctx);
        res.insertId = res.row?.insertId;
        delete res.row?.insertId;
        return res;
    }
}
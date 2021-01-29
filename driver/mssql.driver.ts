import { Configuration } from '@mikro-orm/core';
import { MsSqlConnection } from './mssql.connection';
import { MsSqlPlatform } from './mssql.platform';
import { AbstractSqlDriver } from '@mikro-orm/knex';

export class MsSqlDatabaseDriver extends AbstractSqlDriver<MsSqlConnection> {
    constructor(config: Configuration) {
        super(config, new MsSqlPlatform(), MsSqlConnection, ['knex', 'mssql']);
    }
}
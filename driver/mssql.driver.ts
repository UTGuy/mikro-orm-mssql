import { Configuration } from "@mikro-orm/core";
import { AbstractSqlDriver } from '@mikro-orm/knex';
import { MsSqlConnection } from "./mssql.connection";
import { MsSqlPlatform } from "./mssql.platform";

export class MsSqlDatabaseDriver extends AbstractSqlDriver<MsSqlConnection> {
    constructor(config: Configuration) {
        super(config, new MsSqlPlatform(), MsSqlConnection, ['knex', 'mssql']);
    }
}
import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MsSqlSchemaHelper } from './mssql.schemaHelper';

export class MsSqlPlatform extends AbstractSqlPlatform {
    protected schemaHelper = new MsSqlSchemaHelper();
}
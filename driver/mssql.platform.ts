import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MsSqlSchemaHelper } from './mssql.schemaHelper';

function isBoolean(value: any) {
    return typeof value == "boolean";
}

function booleanToBit(value: boolean) {
    return value ? 1 : 0;
}

function formatParam(value: any) {
    if (isBoolean(value))
        return booleanToBit(value);
    return value;
}

export class MsSqlPlatform extends AbstractSqlPlatform {
    protected schemaHelper = new MsSqlSchemaHelper();

    formatQuery(sql: string, params: readonly any[]): string {
        return super.formatQuery(sql, params?.map(formatParam));
    }
}
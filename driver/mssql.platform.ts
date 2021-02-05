import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MsSqlSchemaHelper } from './mssql.schemaHelper';
import SqlString from 'tsqlstring';

export class MsSqlPlatform extends AbstractSqlPlatform {
    protected schemaHelper = new MsSqlSchemaHelper();

    quoteValue(value: any): string {
        return SqlString.escape(value);
    }

    quoteIdentifier(id: string, quote?: string): string {
        return `[${id.replace('.', `].[`)}]`;
    }

    usesReturningStatement(): boolean {
        return false;
    }
}
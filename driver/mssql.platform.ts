import { AbstractSqlPlatform } from '@mikro-orm/knex';
import { MsSqlSchemaHelper } from './mssql.schemaHelper';
import SqlString from 'tsqlstring';

// function isQuoted(value: any): value is string {
//     return typeof value === "string" && value[0] === "'";
// }

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

    formatQuery(sql: string, params: readonly any[]): string {
        const value = super.formatQuery(sql, params);
        const result = this.removeSchemaFromConstraint(value);
        return result;
    }

    private removeSchemaFromConstraint(sql: string) {
        const regex = /CONSTRAINT (\[\w+\])\.(\[\w+\]) PRIMARY KEY \(([^\)]+)\)/gm;
        const match = !!sql.match(regex);
        if (!match)
            return sql;
        const subst = `CONSTRAINT $2 PRIMARY KEY ($3)`;
        const result = sql.replace(regex, subst);
        return result;
    }
}
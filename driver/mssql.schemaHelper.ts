import { EntityProperty, Dictionary } from '@mikro-orm/core';
import { SchemaHelper, IsSame, Column, Index } from '@mikro-orm/knex';
import { MsSqlConnection } from './mssql.connection';

export class MsSqlSchemaHelper extends SchemaHelper {
    static readonly TYPES = {
        number: ['int', 'integer', 'tinyint', 'smallint', 'bigint'],
        tinyint: ['int'],
        smallint: ['int'],
        float: ['float(24)'],
        double: ['float(53)'],
        bigint: ['bigint'],
        boolean: ['bit'],
        bit: ['bit'],
        string: ['varchar(255)', 'text'],
        Date: ['datetime', 'datetime2'],
        date: ['datetime', 'datetime2'],
        text: ['text'],
        object: ['text'],
        json: ['text'],
        uuid: ['uniqueidentifier'],
    };

    static readonly DEFAULT_TYPE_LENGTHS = {
        number: 11,
        string: 255,
        date: 0,
    };

    static readonly DEFAULT_VALUES = {
        '0': ['0', 'false'],
    };

    getDatabaseExistsSQL(name: string): string {
        return `select 1 from master.sys.databases where name = N'${name}'`;
    }

    getSchemaBeginning(): string {
        return '';
    }

    getSchemaEnd(): string {
        return '';
    }

    getTypeDefinition(prop: EntityProperty): string {
        return super.getTypeDefinition(prop, MsSqlSchemaHelper.TYPES, MsSqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
    }

    getTypeFromDefinition(type: string, defaultType: string): string {
        return super.getTypeFromDefinition(type, defaultType, MsSqlSchemaHelper.TYPES);
    }

    getListTablesSQL(): string {
        return `SELECT table_name, table_schema schema_name FROM information_schema.tables WHERE table_type = 'base table'`;
    }

    isSame(prop: EntityProperty, column: Column, idx?: number): IsSame {
        return super.isSame(prop, column, idx, MsSqlSchemaHelper.TYPES, MsSqlSchemaHelper.DEFAULT_VALUES);
    }

    normalizeDefaultValue(defaultValue: string, length: number) {
        return super.normalizeDefaultValue(defaultValue, length, MsSqlSchemaHelper.DEFAULT_VALUES);
    }

    async getColumns(connection: MsSqlConnection, tableName: string, schemaName?: string): Promise<any[]> {
        const columns = await connection.execute<{
            name: string,
            defaultValue: any,
            type: string
        }[]>(`
            SELECT COLUMN_NAME name, COLUMN_DEFAULT defaultValue, DATA_TYPE type, *
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '${tableName}' 
            AND TABLE_SCHEMA='${schemaName}'
        `);
        return columns;
    }

    async getIndexes(connection: MsSqlConnection, tableName: string, schemaName?: string): Promise<Index[]> {
        const helpIndexes = await connection.execute<{
            index_name: string,
            index_description: string,
            index_keys: string
        }[]>(`sp_helpindex '${schemaName}.${tableName}'`);

        if(!helpIndexes)
            return [];

        const sysIndexes = await connection.execute<{
            name: string,
            is_primary_key: boolean,
            is_unique_constraint: boolean,
            is_unique: boolean
        }[]>(`
            select * from sys.indexes
            where object_id = (
                SELECT sys.objects.object_id
                FROM sys.objects
                        INNER JOIN sys.schemas ON sys.objects.schema_id = sys.schemas.schema_id
                where sys.objects.name = '${tableName}'
                and sys.schemas.name = '${schemaName}'
            )
        `);

        const results = helpIndexes.flatMap<Index>(x => {
            const sysIndex = sysIndexes.find(s => s.name === x.index_name);
            const columns = x.index_keys.split(',').map(k => k.trim());
            const composite = columns.length > 1;
            return columns.map(columnName => {
                return {
                    columnName,
                    keyName: sysIndex.name,
                    primary: sysIndex.is_primary_key,
                    unique: sysIndex.is_unique,
                    composite
                }
            })
        });

        return results;
    }

    async getPrimaryKeys(connection: MsSqlConnection, indexes: Index[], tableName: string, schemaName?: string): Promise<string[]> {
        const results = await connection.execute<{
            COLUMN_NAME: string
        }[]>(`
            select COLUMN_NAME from INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            where TABLE_NAME = '${tableName}' and CONSTRAINT_SCHEMA = '${schemaName}';
        `);
        return results.map(x => x.COLUMN_NAME);
    }

    async getForeignKeys(connection: MsSqlConnection, tableName: string, schemaName?: string): Promise<Dictionary> {
        const { columns } = await connection.execute<{
            columns: {
                [index: string]: {
                    caseSensative: boolean,
                    identity: boolean,
                    index: boolean,
                    length: number,
                    name: string,
                    nullable: boolean,
                    precision?: number,
                    readonly: boolean,
                    scale?: any,
                    type: {
                        declaration: string,
                        length: number,
                        name: string
                    }
                }
            }
        }>(`
            sp_fkeys @pktable_name = '${tableName}', @pktable_owner = '${schemaName}'
        `);

        return columns || {};
    }

    getEnumDefinitions(connection: MsSqlConnection, tableName: string, schemaName?: string): Promise<Dictionary> {
        return Promise.resolve({});
    }
}
import { EntityProperty } from '@mikro-orm/core';
import { SchemaHelper, IsSame, Column } from '@mikro-orm/knex';

export class MsSqlSchemaHelper extends SchemaHelper {
    static readonly TYPES = {
        boolean: ['tinyint(1)', 'tinyint'],
        number: ['int(?)', 'int', 'float', 'double', 'tinyint', 'smallint'],
        float: ['float'],
        double: ['double'],
        tinyint: ['tinyint'],
        smallint: ['smallint'],
        Date: ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'],
        date: ['datetime(?)', 'timestamp(?)', 'datetime', 'timestamp'],
        string: ['varchar(?)', 'varchar', 'text', 'bigint', 'enum'],
        text: ['text'],
        object: ['json'],
        json: ['json'],
        enum: ['enum'],
    };

    static readonly DEFAULT_TYPE_LENGTHS = {
        number: 11,
        string: 255,
        date: 0,
    };

    static readonly DEFAULT_VALUES = {
        '0': ['0', 'false'],
    };

    getSchemaBeginning(): string {
        return 'pragma foreign_keys = off;\n\n';
    }

    getSchemaEnd(): string {
        return 'pragma foreign_keys = on;\n';
    }

    getTypeDefinition(prop: EntityProperty): string {
        return super.getTypeDefinition(prop, MsSqlSchemaHelper.TYPES, MsSqlSchemaHelper.DEFAULT_TYPE_LENGTHS);
    }

    getTypeFromDefinition(type: string, defaultType: string): string {
        return super.getTypeFromDefinition(type, defaultType, MsSqlSchemaHelper.TYPES);
    }

    getListTablesSQL(): string {
        return `SELECT table_name FROM information_schema.tables WHERE table_type = 'base table'`;
    }

    isSame(prop: EntityProperty, column: Column, idx?: number): IsSame {
        return super.isSame(prop, column, idx, MsSqlSchemaHelper.TYPES, MsSqlSchemaHelper.DEFAULT_VALUES);
    }

    normalizeDefaultValue(defaultValue: string, length: number) {
        return super.normalizeDefaultValue(defaultValue, length, MsSqlSchemaHelper.DEFAULT_VALUES);
    }
}
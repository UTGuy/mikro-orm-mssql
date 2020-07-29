import { SchemaHelper, EntityProperty, IsSame } from 'mikro-orm';
import { Column } from 'mikro-orm/dist/schema/DatabaseTable';

export class MsSqlSchemaHelper extends SchemaHelper {
    static readonly TYPES = {
        number: ['integer', 'int', 'tinyint', 'smallint', 'bigint'],
        tinyint: ['integer'],
        smallint: ['integer'],
        bigint: ['integer'],
        boolean: ['integer', 'int', 'bit'],
        bit: ['boolean'],
        string: ['varchar', 'text'],
        Date: ['datetime', 'text'],
        date: ['datetime', 'text'],
        object: ['text'],
        text: ['text'],
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
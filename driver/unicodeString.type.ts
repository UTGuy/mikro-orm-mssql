import { Type, Platform, EntityProperty, ValidationError } from '@mikro-orm/core';
import SqlString from 'tsqlstring';

export class UnicodeString {
    constructor(private readonly value: string) {
    }

    quoteValue() {
        return `N${SqlString.escape(this.value)}`;
    }
}

export class UnicodeStringType extends Type<string, UnicodeString> {

    convertToDatabaseValue(value: string | undefined, platform: Platform): UnicodeString {
        if (value == null) {
            return null;
        }

        if (typeof value === "string") {
            return new UnicodeString(value);
        }

        throw ValidationError.invalidType(UnicodeStringType, value, 'JS');
    }

    convertToJSValue(value: string | undefined, platform: Platform): string {
        if (value == null) {
            return null;
        }

        if (typeof value === "string") {
            return value;
        }

        throw ValidationError.invalidType(UnicodeStringType, value, 'database');
    }

    getColumnType(prop: EntityProperty, platform: Platform) {
        const length = prop.length != null ? prop.length : 256;
        return `nvarchar(${length})`;
    }

}
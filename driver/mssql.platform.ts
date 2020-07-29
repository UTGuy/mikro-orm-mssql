import { Platform } from 'mikro-orm';
import { MsSqlSchemaHelper } from './mssql.schemaHelper';

export class MsSqlPlatform extends Platform {
    protected schemaHelper = new MsSqlSchemaHelper();
}
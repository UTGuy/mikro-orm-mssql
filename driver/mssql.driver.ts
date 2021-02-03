import { Configuration, QueryResult, AnyEntity, FilterQuery } from "@mikro-orm/core";
import { AbstractSqlDriver } from "@mikro-orm/knex";
import { Transaction, Transaction as KnexTransaction } from "knex";
import { MsSqlConnection } from "./mssql.connection";
import { MsSqlPlatform } from "./mssql.platform";

export class MsSqlDatabaseDriver extends AbstractSqlDriver<MsSqlConnection> {
    constructor(config: Configuration) {
        super(config, new MsSqlPlatform(), MsSqlConnection, ['knex', 'mssql']);
    }

    nativeDelete<T extends AnyEntity<T>>(entityName: string, where: FilterQuery<T> | string | any, ctx?: Transaction<KnexTransaction>): Promise<QueryResult> {
        const delimeter = "~~~";
        const result = Object.entries(where).reduce((hash,[key, value]) => {
            if(key.indexOf(delimeter) > -1) {
                const props = key.split(delimeter);
                const records: any[] = value["$in"];
                const $or = records.map( (values) => {
                    const subHash = {};
                    props.forEach((p,i) => {
                        subHash[p] = values[i];
                    })
                    return subHash;
                } );
                hash["$or"] = $or;
            } else {
                hash[key] = value;
            }
            return hash;
        }, {});
        return super.nativeDelete(entityName, result, ctx);
    }
}
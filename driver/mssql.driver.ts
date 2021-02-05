import { Configuration, QueryResult, AnyEntity, FilterQuery, EntityData } from "@mikro-orm/core";
import { QueryBuilder } from "@mikro-orm/knex";
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
        const result = Object.entries(where).reduce((hash, [key, value]) => {
            if (key.indexOf(delimeter) > -1) {
                const props = key.split(delimeter);
                const records: any[] = value["$in"];
                const $or = records.map((values) => {
                    const subHash = {};
                    props.forEach((p, i) => {
                        subHash[p] = values[i];
                    })
                    return subHash;
                });
                hash["$or"] = $or;
            } else {
                hash[key] = value;
            }
            return hash;
        }, {});
        return super.nativeDelete(entityName, result, ctx);
    }

    nativeInsert<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>, ctx?: Transaction<KnexTransaction>, convertCustomTypes?: boolean): Promise<QueryResult> {
        return super.nativeInsert(entityName, data, ctx, convertCustomTypes);
    }

    nativeInsertMany<T extends AnyEntity<T>>(entityName: string, data: EntityData<T>[], ctx?: Transaction<KnexTransaction>, processCollections?: boolean, convertCustomTypes?: boolean): Promise<QueryResult> {
        return super.nativeInsert(entityName, data, ctx, convertCustomTypes);
    }

    createQueryBuilder<T extends AnyEntity<T>>(entityName: string, ctx?: Transaction<KnexTransaction>, write?: boolean, convertCustomTypes?: boolean): QueryBuilder<T> {
        const driver = this;
        const qb = super.createQueryBuilder<T>(entityName, ctx, write, convertCustomTypes);
        let isInsert = false;

        const _insert = qb.insert;
        qb.insert = <T>(data: EntityData<T>) => {
            isInsert = true;
            return _insert.call(qb, data);
        }

        const _getKnexQuery = qb.getKnexQuery;
        qb.getKnexQuery = () => {

            const kq = _getKnexQuery.call(qb);
            const _toSQL = kq.toSQL;
            kq.toSQL = () => {
                const obj = _toSQL.call(kq);
                obj.metadata = driver.metadata.get(entityName);
                if (isInsert) {
                    obj.sql = this.patchInsertMany(obj.sql, entityName);
                    obj.sql = this.patchInsert(obj.sql, entityName);
                }
                return obj;
            }
            return kq;
        }

        return qb;
    }

    private patchInsertMany(sql: string, entityName: string) {
        const metadata = this.metadata.get(entityName);
        return sql;
    }

    private patchInsert(sql: string, entityName: string) {
        const metadata = this.metadata.get(entityName);
        const [results] = Array.from(sql.matchAll(/^insert into (.*) (\(.*\)) values (\(.*\))/));
        if (!results)
            return sql;

        const [_, table, columns, values] = results;
        const output = metadata.primaryKeys.map(pk => `inserted.[${pk}]`);

        const value = `
        declare @${entityName} table (${metadata.primaryKeys.map(pk => `${pk} ${metadata.properties[pk].columnTypes[0]}`).join(', ')})
        insert into ${table} ${columns} output ${output} into @${entityName} values ${values}
        select id from @${entityName}
        `;
        return value;
    }

}
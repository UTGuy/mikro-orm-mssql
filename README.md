# mikro-orm-mssql

```
import { MikroOrmModuleOptions } from 'nestjs-mikro-orm';
import { MsSqlDatabaseDriver } from 'mikro-orm-mssql';

export function ormConfigFactory(config: AppConfig): MikroOrmModuleOptions {
    return {
        // configuration here
        driver: MsSqlDatabaseDriver
    };
}
```
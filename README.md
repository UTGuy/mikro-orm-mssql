# mikro-orm-mssql

This is a mssql driver for Mikro-orm v4.
This is a work in progress until there is a driver available through the orm itself... (it's in the works)

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
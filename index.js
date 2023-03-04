const { DATABASE_SCHEMA, DATABASE_URL, SHOW_PG_MONITOR } = require('./config');
const massive = require('massive');
const monitor = require('pg-monitor');
const { fetchPopulation, 
  getPopulationSum, 
  filterByPeriod, 
  sumPopulationQuery
} = require('./helpers');

// Call start
(async () => {
    console.log('main.js: before start');

    const db = await massive({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
    }, {
        // Massive Configuration
        scripts: process.cwd() + '/migration',
        allowedSchemas: [DATABASE_SCHEMA],
        whitelist: [`${DATABASE_SCHEMA}.%`],
        excludeFunctions: true,
    }, {
        // Driver Configuration
        noWarnings: true,
        error: function (err, client) {
            console.log(err);
            //process.emit('uncaughtException', err);
            //throw err;
        }
    });

    if (!monitor.isAttached() && SHOW_PG_MONITOR === 'true') {
        monitor.attach(db.driverConfig);
    }

    const execFileSql = async (schema, type) => {
        return new Promise(async resolve => {
            const objects = db['user'][type];

            if (objects) {
                for (const [key, func] of Object.entries(objects)) {
                    console.log(`executing ${schema} ${type} ${key}...`);
                    await func({
                        schema: DATABASE_SCHEMA,
                    });
                }
            }

            resolve();
        });
    };

    //public
    const migrationUp = async () => {
        return new Promise(async resolve => {
            await execFileSql(DATABASE_SCHEMA, 'schema');

            //cria as estruturas necessarias no db (schema)
            await execFileSql(DATABASE_SCHEMA, 'table');
            await execFileSql(DATABASE_SCHEMA, 'view');

            console.log(`reload schemas ...`)
            await db.reload();

            resolve();
        });
    };

    try {
        await migrationUp();
        
        const yearsToFilter = [2020, 2019, 2018]
        
        const response = await fetchPopulation();
        const { data, ...rest } = response;
        const result1 = await db[DATABASE_SCHEMA].api_data.insert({
            doc_record: { data },
        })
        console.log('result1 >>>', result1);
        
        const filteredData = await filterByPeriod(data, yearsToFilter)
        const populationSum1 = getPopulationSum(filteredData)
        console.log(`Population sum from ${yearsToFilter} (NodeJS): ${populationSum1}`)

        const populationSum2 = await db.query(sumPopulationQuery, [yearsToFilter]);
        console.log(`Population sum from ${yearsToFilter} (PG): ${populationSum2[0].total_population}`)
        
        db.dropTable(DATABASE_SCHEMA.concat('.api_data'))

    } catch (e) {
        console.log(e.message)
    } finally {
        console.log('finally');
    }
    console.log('main.js: after start');
})();
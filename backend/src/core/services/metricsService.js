// src/services/metricsService.js
const client = require('prom-client');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const metrics = {
    authenticationSuccess: new client.Counter({
        name: 'authentication_success',
        help: 'Количество успешных аутентификаций'
    }),
    authenticationFailure: new client.Counter({
        name: 'authentication_failure',
        help: 'Количество неудачных аутентификаций'
    }),
    authorizationSuccess: new client.Counter({
        name: 'authorization_success',
        help: 'Количество успешных авторизаций'
    }),
    authorizationFailure: new client.Counter({
        name: 'authorization_failure',
        help: 'Количество неудачных авторизаций'
    }),
    cacheHit: new client.Counter({
        name: 'cache_hit',
        help: 'Количество попаданий в кэш'
    }),
    cacheMiss: new client.Counter({
        name: 'cache_miss',
        help: 'Количество промахов в кэше'
    }),
    transactionSuccess: new client.Counter({
        name: 'transaction_success',
        help: 'Количество успешных транзакций'
    }),
    transactionFailure: new client.Counter({
        name: 'transaction_failure',
        help: 'Количество неудачных транзакций'
    }),
    errorsCount: new client.Counter({
        name: 'errors_count',
        help: 'Количество ошибок API'
    })
};

module.exports = {
    increment: (metricName) => {
        if (metrics[metricName]) {
            metrics[metricName].inc();
        }
    },
    getMetrics: async () => {
        return await client.register.metrics();
    }
};

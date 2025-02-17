const promClient = require('prom-client');
const express = require('express');
const logger = require('./logger');

class Metrics {
    constructor() {
        this.register = new promClient.Registry();
        promClient.collectDefaultMetrics({ register: this.register });

        this.metrics = {
            disputesCreated: new promClient.Counter({
                name: 'disputes_created_total',
                help: 'Total number of created disputes',
                registers: [this.register]
            }),
            disputesResolved: new promClient.Counter({
                name: 'disputes_resolved_total',
                help: 'Total number of resolved disputes',
                registers: [this.register]
            }),
            authenticationSuccess: new promClient.Counter({
                name: 'authentication_success_total',
                help: 'Total number of successful authentications',
                registers: [this.register]
            }),
            authenticationFailure: new promClient.Counter({
                name: 'authentication_failure_total',
                help: 'Total number of failed authentications',
                registers: [this.register]
            }),
            transactionTime: new promClient.Histogram({
                name: 'transaction_processing_time_seconds',
                help: 'Time taken for transactions to complete',
                buckets: [0.1, 0.5, 1, 2, 5, 10],
                registers: [this.register]
            })
        };
    }

    increment(metricName) {
        if (this.metrics[metricName]) {
            this.metrics[metricName].inc();
        }
    }

    observeTransactionTime(duration) {
        this.metrics.transactionTime.observe(duration);
    }

    getMetrics() {
        return this.register.metrics();
    }
}

const metricsInstance = new Metrics();
const metricsApp = express();
metricsApp.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await metricsInstance.getMetrics());
});

metricsApp.listen(9100, () => {
    logger.info('✅ Prometheus metrics сервер запущен на порту 9100');
});

module.exports = metricsInstance;

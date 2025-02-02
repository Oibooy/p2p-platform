// infrastructure/metrics.js
const promClient = require('prom-client');

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
            withdrawalsSuccess: new promClient.Counter({
                name: 'wallet_withdraw_success_total',
                help: 'Total number of successful withdrawals',
                registers: [this.register]
            }),
            withdrawalsFailure: new promClient.Counter({
                name: 'wallet_withdraw_failure_total',
                help: 'Total number of failed withdrawals',
                registers: [this.register]
            })
        };
    }

    increment(metricName) {
        if (this.metrics[metricName]) {
            this.metrics[metricName].inc();
        }
    }

    getMetrics() {
        return this.register.metrics();
    }
}

module.exports = new Metrics();
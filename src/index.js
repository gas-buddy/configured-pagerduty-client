import superagent from 'superagent';

export default class PagerDutyClient {
  constructor(context, config = {}) {
    this.routingKey = config.routingKey;
    this.url = config.url || 'https://events.pagerduty.com/v2/enqueue';
  }

  start() {
    return this;
  }

  logAndCreateIncident(context, options, ...args) {
    context.gb.logger.error(...args);
    this.createIncident(context, options, ...args);
  }

  createIncident(context, options, ...args) {
    const { payload = {}, request = superagent, ...restOpts } = options;
    const { gb = {}, headers: { correlationid = 'none' } = {} } = context;

    // If you don't configure a routing key, we'll just eat these calls,
    // which makes it easier to write your code for dev/test. Typically,
    // you would use logAndCreateIncident so at least you'll see a log in that case.
    if (this.routingKey) {
      const incident = {
        routing_key: this.routingKey,
        event_action: 'trigger',
        ...restOpts,
        payload: {
          summary: args[0],
          source: process.env.HOSTNAME || gb.name || process.argv[1],
          severity: 'error',
          timestamp: new Date().toISOString(),
          custom_details: {
            correlationid,
            message: args[0],
          },
          ...payload,
        },
      };

      request.post(this.url)
        .send(incident)
        .catch(e => gb.logger.error('Failed to send incident', gb.wrapError(e)));
    }
  }
}

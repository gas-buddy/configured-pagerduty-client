import tap from 'tap';
import PagerDutyClient from '../src/index';

tap.test('test pager duty client', async (t) => {
  const fakeMeta = { foo: true };
  const context = {
    gb: {
      logger: {
        error(message, meta) {
          t.strictEquals(message, 'This is a test', 'Should get the message');
          t.strictEquals(meta.foo, true, 'Should get our metadata');
        },
      },
    },
  };
  const config = {
    routingKey: '1234',
    url: 'https://dev.null',
  };

  const pd = new PagerDutyClient(context, config);
  pd.logAndCreateIncident(context, {
    request: {
      post(url) {
        t.strictEquals(url, 'https://dev.null');
        return {
          send(data) {
            t.strictEquals(data.routing_key, '1234', 'Routing key should match');
            return Promise.resolve({ status: 200 });
          },
        };
      },
    },
  }, 'This is a test', fakeMeta);
});

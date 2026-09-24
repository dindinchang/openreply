import { Redis } from 'ioredis';

const r = new Redis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: 1,
  retryDelayOnFailure: (retries) => retries * 100,
});

r.on('error', (err) => {
  console.log('ERROR:', err.message);
  process.exit(1);
});

(async () => {
  try {
    const ping = await r.ping();
    console.log('PONG:', ping);
    
    await r.set('health_check_redis8', 'works');
    const val = await r.get('health_check_redis8');
    console.log('SET/GET:', val);
    
    try {
      const info = await r.info('server');
      console.log('INFO parsed OK');
    } catch(e) {
      console.log('INFO failed:', e.message);
    }
    
    await r.quit();
    console.log('All tests passed!');
  } catch(e) {
    console.log('Fatal:', e.message);
    await r.quit().catch(() => {});
    process.exit(1);
  }
})();

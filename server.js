import express from 'express';
import redisInit, { redisClient } from './redis.js';

const app = express();

app.get('/', async (req, res) => {
  const client = redisClient;
  if (!client) {
    console.error('Redis client is not initialized');
  }
  const count = await client.get('count');
  if (!count) {
    await client.set('count', 0);
  }

  const cacheKey = 'todos';
  const cachedData = await client.get(cacheKey);

  if (cachedData) {
    await client.incr('count');
    console.log(`Serving from cache. Count: ${await client.get('count')}`);
    return res.send(JSON.parse(cachedData));
  }

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos');
    const data = await response.json();
    await client.set(cacheKey, JSON.stringify(data));
    await client.expire(cacheKey, 10);
    await client.set('count', 0);
    console.log(`Serving from API. Count reset to 0.`);
    res.send(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send({ error: 'Failed to fetch data' });
  }
});

app.listen(3000, () => {
  redisInit();
  console.log(`Server is running on port 3000`);
});

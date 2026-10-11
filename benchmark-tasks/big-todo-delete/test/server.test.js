import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/server.js';
import { TodoStore } from '../src/store.js';
test('DELETE /todos/:id', async () => {
  const store = new TodoStore();
  const todo = store.add('write less code');
  const server = createApp(store).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const del = await fetch(`${base}/todos/${todo.id}`, { method: 'DELETE' });
    assert.equal(del.status, 204);
    assert.equal(await del.text(), '');
    assert.equal(store.get(todo.id), undefined);
    const again = await fetch(`${base}/todos/${todo.id}`, { method: 'DELETE' });
    assert.equal(again.status, 404);
    assert.deepEqual(await again.json(), { error: 'Not found' });
    assert.equal((await fetch(`${base}/todos`)).status, 200);
  } finally {
    server.close();
  }
});

import { createServer } from 'node:http';
import { json, match, readJson } from './http.js';
import { TodoStore } from './store.js';

export function createApp(store = new TodoStore()) {
  return createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    let params;

    if (req.method === 'GET' && path === '/todos') return json(res, 200, store.list());

    if (req.method === 'POST' && path === '/todos') {
      const { title } = await readJson(req);
      if (!title) return json(res, 400, { error: 'title is required' });
      return json(res, 201, store.add(title));
    }

    if (req.method === 'GET' && (params = match('/todos/:id', path))) {
      const todo = store.get(params.id);
      return todo ? json(res, 200, todo) : json(res, 404, { error: 'Not found' });
    }

    json(res, 404, { error: 'Not found' });
  });
}

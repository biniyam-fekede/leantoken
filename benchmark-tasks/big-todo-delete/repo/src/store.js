export class TodoStore {
  #todos = new Map();
  #next = 1;

  list() {
    return [...this.#todos.values()];
  }

  add(title) {
    const todo = { id: String(this.#next++), title, done: false };
    this.#todos.set(todo.id, todo);
    return todo;
  }

  get(id) {
    return this.#todos.get(id);
  }

  remove(id) {
    return this.#todos.delete(id);
  }
}

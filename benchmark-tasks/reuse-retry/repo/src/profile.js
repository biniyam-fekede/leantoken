// request(url) -> Promise<object>
export async function fetchProfile(id, request) {
  return request(`/api/profiles/${id}`);
}

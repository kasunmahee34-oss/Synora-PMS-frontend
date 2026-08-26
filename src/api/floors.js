import client from './index';

export async function fetchFloors(propertyId = 1) {
  const { data } = await client.get('/floors', { params: { propertyId } });
  return data;
}

export async function createFloor(payload) {
  const { data } = await client.post('/floors', payload);
  return data;
}

export async function updateFloor(id, payload) {
  const { data } = await client.put(`/floors/${id}`, payload);
  return data;
}

export async function deleteFloor(id) {
  await client.delete(`/floors/${id}`);
}

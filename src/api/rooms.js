import client from './index';

export async function fetchRooms(params = {}) {
  const { data } = await client.get('/rooms', { params });
  return data;
}

export async function createRoom(payload) {
  const { data } = await client.post('/rooms', payload);
  return data;
}

export async function updateRoom(id, payload) {
  const { data } = await client.put(`/rooms/${id}`, payload);
  return data;
}

export async function fetchRoomTypes() {
  const { data } = await client.get('/room-types');
  // The room-types endpoint returns a paginated envelope.
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  throw new Error('Invalid room types response');
}

import client from './index';

export async function updateReservationStatus(reservationId, status) {
  const { data } = await client.put(`/reservations/${reservationId}/status`, { status });
  return data;
}

export async function checkInReservation(reservationId) {
  return updateReservationStatus(reservationId, 'in_house');
}

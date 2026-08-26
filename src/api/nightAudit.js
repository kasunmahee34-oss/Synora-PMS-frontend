import client from './index';

export async function fetchNightAuditStatus() {
  const { data } = await client.get('/night-audit/status');
  return data;
}

export async function runNightAudit() {
  const { data } = await client.post('/night-audit/run');
  return data;
}

export async function fetchNightAuditHistory() {
  const { data } = await client.get('/night-audit/history');
  return data;
}

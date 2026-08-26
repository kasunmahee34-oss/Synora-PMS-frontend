import api from './index';

export const getMealPlans = (params) => api.get('/meal-plans', { params });

export default { getMealPlans };

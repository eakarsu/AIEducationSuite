const paginate = (query, { page = 1, limit = 15, sort = 'created_at', order = 'desc' }) => {
  const offset = (page - 1) * limit;
  const allowedOrders = ['asc', 'desc'];
  const safeOrder = allowedOrders.includes(order.toLowerCase()) ? order : 'desc';

  return {
    query: `${query} ORDER BY ${sort} ${safeOrder} LIMIT $LIMIT OFFSET $OFFSET`,
    limit: parseInt(limit),
    offset,
    page: parseInt(page)
  };
};

const buildPaginationResponse = (data, total, page, limit) => {
  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = { paginate, buildPaginationResponse };

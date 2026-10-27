const activeFilter = { isDeleted: { $ne: true } };
const deletedFilter = { isDeleted: true };

const getDeletedBy = (req) => req.user?._id || req.body?.deletedBy || req.query?.deletedBy || null;

const buildSoftDeletePayload = (req) => ({
  isDeleted: true,
  deletedAt: new Date(),
  deletedBy: getDeletedBy(req),
  status: 'deleted',
});

const restorePayload = {
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
  status: 'active',
};

module.exports = {
  activeFilter,
  deletedFilter,
  buildSoftDeletePayload,
  restorePayload,
};

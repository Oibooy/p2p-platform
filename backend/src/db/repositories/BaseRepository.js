
class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findOne(filter) {
    return this.model.findOne(filter);
  }

  async find(filter = {}) {
    return this.model.find(filter);
  }

  async create(data) {
    return this.model.create(data);
  }

  async update(id, data) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id) {
    return this.model.findByIdAndDelete(id);
  }

  async findWithPagination(filter = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(limit),
      this.model.countDocuments(filter)
    ]);
    
    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  async updateMany(filter, update) {
    return this.model.updateMany(filter, update);
  }

  async deleteMany(filter) {
    return this.model.deleteMany(filter);
  }

  async exists(filter) {
    return this.model.exists(filter);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}

module.exports = BaseRepository;

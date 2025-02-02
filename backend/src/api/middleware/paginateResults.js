const paginateResults = (model) => {
    return async (req, res, next) => {
        const { page = 1, limit = 10 } = req.query;
        const startIndex = (page - 1) * limit;
        const totalDocs = await model.countDocuments().exec();
        const results = {
            next: startIndex + limit < totalDocs ? { page: parseInt(page) + 1, limit: parseInt(limit) } : null,
            previous: startIndex > 0 ? { page: parseInt(page) - 1, limit: parseInt(limit) } : null,
            results: await model.find().lean().limit(parseInt(limit)).skip(startIndex).exec()
        };
        res.paginatedResults = results;
        next();
    };
};

module.exports = paginateResults;
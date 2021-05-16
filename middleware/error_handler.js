module.exports = function (res,err) {
    return res.status(err.status || 500).json({
        message: err.message || "Unknown Server Error!",
        debug: err
    })
}
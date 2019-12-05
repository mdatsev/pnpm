
module.exports = function (arr, limit, iterator, callback) {
  var fn = _eachLimit(limit);
  return fn.apply(null, [arr, iterator, callback]);
}

var _eachLimit = function (limit) {
  return function (arr, iterator, callback) {
    callback = callback || function () {};
    if (!arr.length || limit <= 0) {
      return callback();
    }

    var completed = 0;
    var started = 0;
    var running = 0;

    (function replenish () {
      if (completed >= arr.length) {
        return callback();
      }

      while (running < limit && started < arr.length) {
        started += 1;
        running += 1;
        iterator(arr[started - 1], function (err) {
          if (err) {
            callback(err);
            callback = function () {};
          }
          else {
            completed += 1;
            running -= 1;
            if (completed >= arr.length) {
              callback();
            }
            else {
              replenish();
            }
          }
        });
      }
    })();
  };
};

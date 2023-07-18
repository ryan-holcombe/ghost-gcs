'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _storage = require('@google-cloud/storage');

var _ghostStorageBase = require('ghost-storage-base');

var _ghostStorageBase2 = _interopRequireDefault(_ghostStorageBase);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BASE_PATH = 'content/images/';
class GoogleCloudStorage extends _ghostStorageBase2.default {
  constructor() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    super(config);

    if (!config.bucket) {
      throw new Error('Google Cloud Storage bucket is not defined');
    }

    var storage = config.keyFile ? new _storage.Storage({ keyFile: config.keyFile }) : new _storage.Storage();
    this.bucket = storage.bucket(config.bucket);
  }

  exists(fileName, dir) {
    console.debug('exists: ', dir, fileName);
    return this.bucket.file(`${dir}/${fileName}`).exists().then(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          exists = _ref2[0];

      return exists;
    });
  }

  save(file) {
    var _this = this;

    console.debug('save: ', file);
    var targetDir = this.getTargetDir(BASE_PATH);

    return this.getUniqueFileName(file, targetDir).then(function (uniqueFileName) {
      return _this.bucket.upload(file.path, {
        destination: uniqueFileName,
        metadata: {
          cacheControl: 'public, max-age=2592000' // 30 days
        }
      }).then(function (_ref3) {
        var _ref4 = _slicedToArray(_ref3, 1),
            file = _ref4[0];

        return file.publicUrl();
      });
    });
  }

  // No need to serve because absolute URLs are returned from save()
  serve() {
    return function customServe(req, res, next) {
      next();
    };
  }

  delete(fileName) {
    return this.bucket.file(fileName).delete();
  }

  read(options) {
    var _this2 = this;

    console.debug('read: ', options);
    return new Promise(function (resolve, reject) {
      var rs = _this2.bucket.file(options.path).createReadStream();
      var data = [];

      rs.on('error', function (err) {
        return reject(err);
      });

      rs.on('data', function (chunk) {
        data.push(chunk);
      });

      rs.on('end', function () {
        resolve(Buffer.concat(data));
      });
    });
  }
}

exports.default = GoogleCloudStorage;
module.exports = exports['default'];

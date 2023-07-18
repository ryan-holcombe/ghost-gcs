import { Storage } from '@google-cloud/storage'
import BaseStorage from 'ghost-storage-base'

const BASE_PATH = '/content/images/'
class GoogleCloudStorage extends BaseStorage {
  constructor (config = {}) {
    super(config)

    if (!this.bucket) {
      throw new Error('Google Cloud Storage bucket is not defined')
    }

    const storage = config.keyFile ? new Storage({ keyFile: config.keyFile }) : new Storage()
    this.bucket = storage.bucket(config.bucket)
  }

  exists (fileName, targetDir) {
    return this.bucket.file(`${BASE_PATH}${targetDir}/${fileName}`).exists()
  }

  save (file) {
    const targetDir = this.getTargetDir(BASE_PATH)

    return this.getUniqueFileName(file, targetDir).then((uniqueFileName) => {
      return this.bucket.upload(file.path, {
        destination: uniqueFileName,
        metadata: {
          cacheControl: 'public, max-age=2592000' // 30 days
        },
        public: true
      }).then(([file]) => {
        return file.publicUrl()
      })
    })
  }

  // No need to serve because absolute URLs are returned from save()
  serve () {
    return function customServe (req, res, next) {
      next()
    }
  }

  delete (fileName) {
    return this.bucket.file(fileName).delete()
  }

  read (options) {
    return new Promise((resolve, reject) => {
      const rs = this.bucket.file(options.path).createReadStream()
      const data = []

      rs.on('error', err => {
        return reject(err)
      })

      rs.on('data', chunk => {
        data.push(chunk)
      })

      rs.on('end', () => {
        resolve(Buffer.concat(data))
      })
    })
  }
}

export default GoogleCloudStorage

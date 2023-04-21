const Mali = require('mali')
const grpc = require('@grpc/grpc-js')

function unimplemented(ctx) {
  const err = new Error(`method ${ctx.name} not implemented`)
  err.code = grpc.status.UNIMPLEMENTED
  err.metadata = new grpc.Metadata()
  throw err
}

async function SetRtCvLocation(ctx) {
  unimplemented(ctx)
}

async function CheckCredentials(ctx) {
  unimplemented(ctx)
}

function main() {
  const location = '0.0.0.0:50051'

  const app = new Mali('../../server.proto')
  app.use({ SetRtCvLocation, CheckCredentials })

  console.log('starting server on', location)
  app.start('0.0.0.0:50051')
}


main()
